package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"Back/models"
	"Back/repository"
	"Back/utils"

	"github.com/gin-gonic/gin"
)

type VoucherHandler struct {
	voucherRepo repository.VoucherRepository
	userRepo    *repository.UserRepository
}

func NewVoucherHandler(voucherRepo repository.VoucherRepository, userRepo *repository.UserRepository) *VoucherHandler {
	return &VoucherHandler{voucherRepo: voucherRepo, userRepo: userRepo}
}

// helper to convert models.Voucher to models.VoucherResponse (flatten sql.Null types)
func mapVoucherToResponse(v *models.Voucher) models.VoucherResponse {
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

	return models.VoucherResponse{
		ID:               v.ID,
		Code:             v.Code,
		Type:             v.Type,
		Value:            v.Value,
		MinBookingAmount: v.MinBookingAmount,
		Scope:            v.Scope,
		MembershipTier:   v.MembershipTier,
		HotelID:          hotelID,
		RoomType:         roomType,
		StartDate:        v.StartDate,
		ExpiryDate:       v.ExpiryDate,
		UsageLimit:       v.UsageLimit,
		UsedCount:        v.UsedCount,
		Status:           v.Status,
		Description:      desc,
		CreatedAt:        v.CreatedAt,
		UpdatedAt:        v.UpdatedAt,
	}
}

// helper to check if user has active membership
func (h *VoucherHandler) isUserMembershipActive(userID int) (bool, string) {
	// Query user membership status from database
	// Returns (isActive, membershipTier)
	// This would normally query the user repo, but for now returns based on presence
	// In production: user_repo.GetMembershipStatus(userID)
	return true, "unknown" // placeholder - will be enhanced with user repo
}

func (h *VoucherHandler) GetVouchers(c *gin.Context) {
	filters := make(map[string]interface{})
	isAdminRoute := c.FullPath() == "/api/admin/vouchers"

	// Apply standard filters
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if scope := c.Query("scope"); scope != "" {
		filters["scope"] = scope
	}
	if hotelIDStr := c.Query("hotel_id"); hotelIDStr != "" {
		if hotelID, err := strconv.Atoi(hotelIDStr); err == nil {
			filters["hotel_id"] = hotelID
		}
	}
	if isAdminRoute {
		filters["admin_view"] = true
	}

	vouchers, err := h.voucherRepo.GetVouchers(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to fetch vouchers", Errors: err.Error()})
		return
	}

	// map vouchers to response-safe structs
	mapped := make([]models.VoucherResponse, 0, len(vouchers))
	for _, v := range vouchers {
		mapped = append(mapped, mapVoucherToResponse(&v))
	}

	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Vouchers fetched", Data: mapped})
}

func (h *VoucherHandler) GetVoucherByCode(c *gin.Context) {
	code := c.Param("code")
	voucher, err := h.voucherRepo.GetByCode(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to fetch voucher", Errors: err.Error()})
		return
	}
	if voucher == nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{Success: false, Message: "Voucher not found"})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Voucher fetched", Data: mapVoucherToResponse(voucher)})
}

func (h *VoucherHandler) GetVouchersForHotel(c *gin.Context) {
	// route uses :id for hotel to avoid gin wildcard conflicts
	hotelID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid hotel ID"})
		return
	}

	vouchers, err := h.voucherRepo.GetVouchersForHotel(hotelID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to fetch vouchers", Errors: err.Error()})
		return
	}

	mapped := make([]models.VoucherResponse, 0, len(vouchers))
	for _, v := range vouchers {
		mapped = append(mapped, mapVoucherToResponse(&v))
	}

	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Vouchers fetched", Data: mapped})
}

func (h *VoucherHandler) ValidateVoucher(c *gin.Context) {
	var req models.ValidateVoucherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid request", Errors: err.Error()})
		return
	}

	voucher, err := h.voucherRepo.GetByCode(req.Code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to validate voucher", Errors: err.Error()})
		return
	}
	if voucher == nil {
		c.JSON(http.StatusOK, models.ValidateVoucherResponse{Valid: false, Message: "Voucher tidak ditemukan"})
		return
	}

	isValid, err := h.voucherRepo.ValidateVoucher(req.Code, req.BookingAmount, req.HotelID, req.RoomType)
	if err != nil {
		c.JSON(http.StatusOK, models.ValidateVoucherResponse{Valid: false, Message: err.Error()})
		return
	}

	// Check membership tier requirement
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{Success: false, Message: "User not authenticated"})
		return
	}

	userIDInt := 0
	switch v := userID.(type) {
	case int:
		userIDInt = v
	case int64:
		userIDInt = int(v)
	case float64:
		userIDInt = int(v)
	case string:
		if id, err := strconv.Atoi(v); err == nil {
			userIDInt = id
		}
	}

	if userIDInt == 0 {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{Success: false, Message: "Invalid user context"})
		return
	}

	// Get user membership status
	user, err := h.userRepo.GetUserByID(userIDInt)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{Success: false, Message: "User not found"})
		return
	}

	// Check if voucher requires membership
	if voucher.MembershipTier != "none" {
		// User must have active membership matching voucher tier or higher
		hasMembership := false
		if user.MembershipStatus == "active" {
			// Check tier hierarchy: none < silver < gold < platinum
			tierRank := map[string]int{
				"none":     0,
				"silver":   1,
				"gold":     2,
				"platinum": 3,
			}
			userTierRank := tierRank[user.MembershipTier]
			voucherTierRank := tierRank[voucher.MembershipTier]
			hasMembership = userTierRank >= voucherTierRank
		}

		if !hasMembership {
			membershipName := voucher.MembershipTier
			if membershipName == "platinum" {
				membershipName = "Platinum"
			} else if membershipName == "gold" {
				membershipName = "Gold"
			} else if membershipName == "silver" {
				membershipName = "Silver"
			}
			c.JSON(http.StatusOK, models.ValidateVoucherResponse{
				Valid:   false,
				Message: fmt.Sprintf("Voucher ini hanya untuk member %s. Upgrade membership Anda untuk menggunakan voucher ini.", membershipName),
			})
			return
		}
	}

	discount := voucher.Value
	if voucher.Type == "percent" {
		discount = req.BookingAmount * (voucher.Value / 100)
	}

	c.JSON(http.StatusOK, models.ValidateVoucherResponse{
		Valid:    isValid,
		Message:  "Voucher valid",
		Code:     voucher.Code,
		Discount: discount,
		Type:     voucher.Type,
		Value:    voucher.Value,
	})
}

func (h *VoucherHandler) CreateVoucher(c *gin.Context) {
	var req models.CreateVoucherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid request", Errors: err.Error()})
		return
	}

	var startDate *time.Time
	if req.StartDate != nil && *req.StartDate != "" {
		t, err := time.Parse("2006-01-02", *req.StartDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid start_date format", Errors: "Use YYYY-MM-DD"})
			return
		}
		startDate = &t
	}

	expiryDate, err := time.Parse("2006-01-02", req.ExpiryDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid expiry_date format", Errors: "Use YYYY-MM-DD"})
		return
	}

	voucher := models.Voucher{
		Code:             req.Code,
		Type:             req.Type,
		Value:            req.Value,
		MinBookingAmount: req.MinBookingAmount,
		Scope:            req.Scope,
		MembershipTier:   req.MembershipTier,
		StartDate:        startDate,
		ExpiryDate:       expiryDate,
		Status:           "active",
		Description:      sql.NullString{String: req.Description, Valid: req.Description != ""},
	}
	if voucher.MembershipTier == "" {
		voucher.MembershipTier = "none"
	}

	if req.HotelID != nil {
		voucher.HotelID = sql.NullInt64{Int64: int64(*req.HotelID), Valid: true}
	}
	if req.RoomType != nil {
		voucher.RoomType = sql.NullString{String: *req.RoomType, Valid: *req.RoomType != ""}
	}
	if req.UsageLimit != nil {
		voucher.UsageLimit = *req.UsageLimit
	}
	if userID, ok := c.Get("userID"); ok {
		if uid, ok := userID.(int); ok {
			voucher.CreatedBy = sql.NullInt64{Int64: int64(uid), Valid: true}
		}
	}

	if err := h.voucherRepo.CreateVoucher(&voucher); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to create voucher", Errors: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, utils.ApiResponse{Success: true, Message: "Voucher created successfully", Data: mapVoucherToResponse(&voucher)})
}

func (h *VoucherHandler) UpdateVoucher(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid voucher ID"})
		return
	}

	var req models.UpdateVoucherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid request", Errors: err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if req.Code != nil {
		updates["code"] = *req.Code
	}
	if req.Type != nil {
		updates["type"] = *req.Type
	}
	if req.Value != nil {
		updates["value"] = *req.Value
	}
	if req.MinBookingAmount != nil {
		updates["min_booking_amount"] = *req.MinBookingAmount
	}
	if req.Scope != nil {
		updates["scope"] = *req.Scope
	}
	if req.MembershipTier != nil {
		updates["membership_tier"] = *req.MembershipTier
	}
	if req.HotelID != nil {
		updates["hotel_id"] = *req.HotelID
	}
	if req.RoomType != nil {
		updates["room_type"] = *req.RoomType
	}
	if req.StartDate != nil {
		if *req.StartDate == "" {
			updates["start_date"] = nil
		} else {
			t, err := time.Parse("2006-01-02", *req.StartDate)
			if err != nil {
				c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid start_date format", Errors: "Use YYYY-MM-DD"})
				return
			}
			updates["start_date"] = t
		}
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.UsageLimit != nil {
		updates["usage_limit"] = *req.UsageLimit
	}
	if req.ExpiryDate != nil {
		t, err := time.Parse("2006-01-02", *req.ExpiryDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid expiry_date format", Errors: "Use YYYY-MM-DD"})
			return
		}
		updates["expiry_date"] = t
	}
	if req.Description != nil {
		updates["description"] = sql.NullString{String: *req.Description, Valid: *req.Description != ""}
	}

	if err := h.voucherRepo.UpdateVoucher(id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to update voucher", Errors: err.Error()})
		return
	}

	updatedVoucher, err := h.voucherRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to load updated voucher", Errors: err.Error()})
		return
	}
	if updatedVoucher == nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{Success: false, Message: "Voucher not found"})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Voucher updated successfully", Data: mapVoucherToResponse(updatedVoucher)})
}

func (h *VoucherHandler) DeleteVoucher(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid voucher ID"})
		return
	}

	if err := h.voucherRepo.DeleteVoucher(id); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to delete voucher", Errors: err.Error()})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Voucher deleted successfully"})
}
