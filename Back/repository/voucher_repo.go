package repository

import (
	"fmt"
	"time"

	"Back/models"

	"gorm.io/gorm"
)

type VoucherRepository interface {
	// Get all active vouchers with optional filters
	GetVouchers(filters map[string]interface{}) ([]models.Voucher, error)

	// Get single voucher by code
	GetByCode(code string) (*models.Voucher, error)

	// Get single voucher by ID
	GetByID(id int) (*models.Voucher, error)

	// Get vouchers for specific hotel
	GetVouchersForHotel(hotelID int) ([]models.Voucher, error)

	// Get vouchers for specific room type
	GetVouchersForRoomType(roomType string) ([]models.Voucher, error)

	// Create new voucher (admin only)
	CreateVoucher(voucher *models.Voucher) error

	// Update voucher (admin only)
	UpdateVoucher(id int, updates map[string]interface{}) error

	// Delete voucher (admin only)
	DeleteVoucher(id int) error

	// Increment used count for voucher
	IncrementUsedCount(code string) error

	// Check if voucher is valid and applicable
	ValidateVoucher(code string, bookingAmount float64, hotelID *int, roomType *string) (bool, error)
}

type voucherRepository struct {
	db *gorm.DB
}

func NewVoucherRepository(db *gorm.DB) VoucherRepository {
	return &voucherRepository{db: db}
}

// GetVouchers retrieves all active vouchers with optional filters
func (r *voucherRepository) GetVouchers(filters map[string]interface{}) ([]models.Voucher, error) {
	var vouchers []models.Voucher
	query := r.db
	adminView := false
	if includeAll, ok := filters["admin_view"]; ok {
		if flag, ok := includeAll.(bool); ok {
			adminView = flag
		}
	}

	// Default: only active vouchers for public views
	if !adminView {
		if status, ok := filters["status"]; ok {
			query = query.Where("status = ?", status)
		} else {
			query = query.Where("status = ?", "active")
		}
	}

	// Filter by scope (global, hotel, room_type)
	if scope, ok := filters["scope"]; ok {
		query = query.Where("scope = ?", scope)
	}

	// Filter by membership tier when requested
	if membershipTier, ok := filters["membership_tier"]; ok {
		query = query.Where("membership_tier = ?", membershipTier)
	}

	// Filter by hotel ID
	if hotelID, ok := filters["hotel_id"]; ok {
		query = query.Where("hotel_id = ? OR scope = ?", hotelID, "global")
	}

	// NOTE: Membership filtering removed - all vouchers are returned
	// Frontend will handle button disable logic based on user's membership_tier
	// This allows showing all vouchers with UI-level access control

	// Filter by expiry date (not expired) for public views
	if !adminView {
		query = query.Where("expiry_date >= ?", time.Now())
	}

	// Order by created_at DESC
	query = query.Order("created_at DESC")

	if err := query.Find(&vouchers).Error; err != nil {
		return nil, fmt.Errorf("error fetching vouchers: %w", err)
	}

	return vouchers, nil
}

// GetByCode retrieves a voucher by its code
func (r *voucherRepository) GetByCode(code string) (*models.Voucher, error) {
	var voucher models.Voucher
	if err := r.db.Where("code = ?", code).First(&voucher).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("error fetching voucher: %w", err)
	}
	return &voucher, nil
}

// GetByID retrieves a voucher by ID
func (r *voucherRepository) GetByID(id int) (*models.Voucher, error) {
	var voucher models.Voucher
	if err := r.db.Where("id = ?", id).First(&voucher).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("error fetching voucher: %w", err)
	}
	return &voucher, nil
}

// GetVouchersForHotel retrieves vouchers applicable for a specific hotel
func (r *voucherRepository) GetVouchersForHotel(hotelID int) ([]models.Voucher, error) {
	var vouchers []models.Voucher
	query := r.db.Where("(scope = ? OR (scope = ? AND hotel_id = ?))", "global", "hotel", hotelID).
		Where("status = ?", "active").
		Where("expiry_date >= ?", time.Now()).
		Order("created_at DESC")

	if err := query.Find(&vouchers).Error; err != nil {
		return nil, fmt.Errorf("error fetching hotel vouchers: %w", err)
	}

	return vouchers, nil
}

// GetVouchersForRoomType retrieves vouchers applicable for a specific room type
func (r *voucherRepository) GetVouchersForRoomType(roomType string) ([]models.Voucher, error) {
	var vouchers []models.Voucher
	query := r.db.Where("(scope = ? OR (scope = ? AND room_type = ?))", "global", "room_type", roomType).
		Where("status = ?", "active").
		Where("expiry_date >= ?", time.Now()).
		Order("created_at DESC")

	if err := query.Find(&vouchers).Error; err != nil {
		return nil, fmt.Errorf("error fetching room type vouchers: %w", err)
	}

	return vouchers, nil
}

// CreateVoucher creates a new voucher
func (r *voucherRepository) CreateVoucher(voucher *models.Voucher) error {
	if err := r.db.Create(voucher).Error; err != nil {
		return fmt.Errorf("error creating voucher: %w", err)
	}
	return nil
}

// UpdateVoucher updates an existing voucher
func (r *voucherRepository) UpdateVoucher(id int, updates map[string]interface{}) error {
	if err := r.db.Model(&models.Voucher{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return fmt.Errorf("error updating voucher: %w", err)
	}
	return nil
}

// DeleteVoucher deletes a voucher
func (r *voucherRepository) DeleteVoucher(id int) error {
	if err := r.db.Delete(&models.Voucher{}, id).Error; err != nil {
		return fmt.Errorf("error deleting voucher: %w", err)
	}
	return nil
}

// IncrementUsedCount increments the used_count for a voucher
func (r *voucherRepository) IncrementUsedCount(code string) error {
	if err := r.db.Model(&models.Voucher{}).Where("code = ?", code).Update("used_count", gorm.Expr("used_count + ?", 1)).Error; err != nil {
		return fmt.Errorf("error incrementing used count: %w", err)
	}
	return nil
}

// ValidateVoucher checks if a voucher is valid and applicable for the given booking
func (r *voucherRepository) ValidateVoucher(code string, bookingAmount float64, hotelID *int, roomType *string) (bool, error) {
	voucher, err := r.GetByCode(code)
	if err != nil {
		return false, err
	}

	if voucher == nil {
		return false, fmt.Errorf("voucher not found")
	}

	// Check if voucher is active
	if voucher.Status != "active" {
		return false, fmt.Errorf("voucher is not active")
	}

	// Check if voucher has expired
	if time.Now().After(voucher.ExpiryDate) {
		return false, fmt.Errorf("voucher has expired")
	}

	// Check if voucher has reached usage limit
	if voucher.UsageLimit > 0 && voucher.UsedCount >= voucher.UsageLimit {
		return false, fmt.Errorf("voucher quota exhausted")
	}

	// Check minimum booking amount
	if bookingAmount < voucher.MinBookingAmount {
		return false, fmt.Errorf("booking amount below minimum required")
	}

	// Check scope
	if voucher.Scope == "hotel" && hotelID != nil {
		if voucher.HotelID.Valid && int(voucher.HotelID.Int64) != *hotelID {
			return false, fmt.Errorf("voucher not applicable for this hotel")
		}
	} else if voucher.Scope == "room_type" && roomType != nil {
		if voucher.RoomType.Valid && voucher.RoomType.String != *roomType {
			return false, fmt.Errorf("voucher not applicable for this room type")
		}
	}

	return true, nil
}
