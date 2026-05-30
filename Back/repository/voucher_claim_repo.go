package repository

import (
	"Back/config"
	"Back/models"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

type VoucherClaimRepository struct {
	db *gorm.DB
}

func NewVoucherClaimRepository() *VoucherClaimRepository {
	return &VoucherClaimRepository{db: config.GetDB()}
}

func (r *VoucherClaimRepository) GetClaimedVoucherIDsByUser(userID int) ([]int, error) {
	var claims []models.VoucherClaim
	if err := r.db.Select("voucher_id").Where("user_id = ? AND status = ?", userID, "claimed").Find(&claims).Error; err != nil {
		return nil, fmt.Errorf("error fetching voucher claims: %w", err)
	}

	voucherIDs := make([]int, 0, len(claims))
	for _, claim := range claims {
		voucherIDs = append(voucherIDs, claim.VoucherID)
	}
	return voucherIDs, nil
}

// GetClaimsByUser returns list of claim records with voucher summary for the user (only active/claimed vouchers)
func (r *VoucherClaimRepository) GetClaimsByUser(userID int) ([]map[string]interface{}, error) {
	var claims []models.VoucherClaim
	if err := r.db.Where("user_id = ? AND status = ?", userID, "claimed").Order("claimed_at DESC").Find(&claims).Error; err != nil {
		return nil, fmt.Errorf("error fetching voucher claims: %w", err)
	}

	results := make([]map[string]interface{}, 0, len(claims))
	for _, c := range claims {
		// load voucher summary
		var v models.Voucher
		voucherData := map[string]interface{}{"id": c.VoucherID}
		if err := r.db.First(&v, c.VoucherID).Error; err == nil {
			// map voucher fields needed by frontend
			var hotelID *int
			if v.HotelID.Valid {
				hid := int(v.HotelID.Int64)
				hotelID = &hid
			}
			var roomType *string
			if v.RoomType.Valid {
				rt := v.RoomType.String
				roomType = &rt
			}

			desc := ""
			if v.Description.Valid {
				desc = v.Description.String
			}

			voucherData = map[string]interface{}{
				"id":                 v.ID,
				"code":               v.Code,
				"type":               v.Type,
				"value":              v.Value,
				"min_booking_amount": v.MinBookingAmount,
				"scope":              v.Scope,
				"membership_tier":    v.MembershipTier,
				"hotel_id":           hotelID,
				"room_type":          roomType,
				"start_date":         v.StartDate,
				"expiry_date":        v.ExpiryDate,
				"usage_limit":        v.UsageLimit,
				"used_count":         v.UsedCount,
				"status":             v.Status,
				"description":        desc,
			}
		}

		results = append(results, map[string]interface{}{
			"id":         c.ID,
			"claim_code": c.ClaimCode,
			"status":     c.Status,
			"claimed_at": c.ClaimedAt,
			"voucher":    voucherData,
		})
	}

	return results, nil
}

func (r *VoucherClaimRepository) ClaimVoucher(voucherID, userID int) (*models.VoucherClaim, error) {
	var created models.VoucherClaim

	err := r.db.Transaction(func(tx *gorm.DB) error {
		var voucher models.Voucher
		if err := tx.First(&voucher, voucherID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return fmt.Errorf("voucher not found")
			}
			return fmt.Errorf("error fetching voucher: %w", err)
		}

		var user models.User
		if err := tx.First(&user, userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return fmt.Errorf("user not found")
			}
			return fmt.Errorf("error fetching user: %w", err)
		}

		now := time.Now()
		userMembershipStatus := strings.TrimSpace(strings.ToLower(user.MembershipStatus))
		userMembershipTier := strings.TrimSpace(strings.ToLower(user.MembershipTier))
		voucherMembershipTier := strings.TrimSpace(strings.ToLower(voucher.MembershipTier))
		if voucher.Status != "active" {
			return fmt.Errorf("voucher is not active")
		}
		if voucher.StartDate != nil && now.Before(*voucher.StartDate) {
			return fmt.Errorf("voucher is not yet available")
		}
		if now.After(voucher.ExpiryDate) {
			return fmt.Errorf("voucher has expired")
		}
		if voucher.UsageLimit > 0 && voucher.UsedCount >= voucher.UsageLimit {
			return fmt.Errorf("voucher quota exhausted")
		}
		if voucherMembershipTier != "none" {
			if userMembershipStatus != "active" || userMembershipTier != voucherMembershipTier {
				return fmt.Errorf("voucher requires active %s membership (your membership: status=%s tier=%s)", voucherMembershipTier, userMembershipStatus, userMembershipTier)
			}
		}

		var existingCount int64
		if err := tx.Model(&models.VoucherClaim{}).Where("voucher_id = ? AND user_id = ? AND status = ?", voucherID, userID, "claimed").Count(&existingCount).Error; err != nil {
			return fmt.Errorf("error checking existing voucher claim: %w", err)
		}
		if existingCount > 0 {
			return fmt.Errorf("voucher already claimed")
		}

		claim := models.VoucherClaim{
			VoucherID: voucherID,
			UserID:    userID,
			ClaimCode: fmt.Sprintf("VC-%d-%d-%d", voucherID, userID, now.UnixNano()),
			Status:    "claimed",
			ClaimedAt: now,
		}

		if err := tx.Create(&claim).Error; err != nil {
			return fmt.Errorf("error creating voucher claim: %w", err)
		}

		updates := map[string]interface{}{
			"used_count": gorm.Expr("used_count + ?", 1),
		}
		if voucher.UsageLimit > 0 && voucher.UsedCount+1 >= voucher.UsageLimit {
			updates["status"] = "exhausted"
		}

		if err := tx.Model(&models.Voucher{}).Where("id = ?", voucherID).Updates(updates).Error; err != nil {
			return fmt.Errorf("error updating voucher usage: %w", err)
		}

		created = claim
		return nil
	})

	if err != nil {
		return nil, err
	}

	return &created, nil
}

// MarkClaimAsUsed marks a voucher claim as used when it's applied to a booking
func (r *VoucherClaimRepository) MarkClaimAsUsed(voucherID, userID int) error {
	now := time.Now()
	result := r.db.Model(&models.VoucherClaim{}).
		Where("voucher_id = ? AND user_id = ? AND status = ?", voucherID, userID, "claimed").
		Updates(map[string]interface{}{
			"status":  "used",
			"used_at": &now,
		})

	if result.Error != nil {
		return fmt.Errorf("error marking voucher claim as used: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("no claimed voucher found for this user")
	}

	return nil
}
