package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"Back/models"
	"Back/repository"
	"Back/utils"

	"github.com/gin-gonic/gin"
)

type BenefitMembershipHandler struct {
	benefitRepo repository.BenefitMembershipRepository
}

func NewBenefitMembershipHandler(benefitRepo repository.BenefitMembershipRepository) *BenefitMembershipHandler {
	return &BenefitMembershipHandler{benefitRepo: benefitRepo}
}

// mapBenefitToResponse converts BenefitMembership to BenefitResponse (flattens sql.Null types)
func mapBenefitToResponse(b *models.BenefitMembership) models.BenefitResponse {
	var discountPercent *float64
	if b.DiscountPercent.Valid {
		discountPercent = &b.DiscountPercent.Float64
	}

	var discountAmount *float64
	if b.DiscountAmount.Valid {
		discountAmount = &b.DiscountAmount.Float64
	}

	var voucherID *int
	if b.VoucherID.Valid {
		vid := int(b.VoucherID.Int64)
		voucherID = &vid
	}

	var hotelID *int
	if b.HotelID.Valid {
		hid := int(b.HotelID.Int64)
		hotelID = &hid
	}

	var roomType *string
	if b.RoomType.Valid {
		roomType = &b.RoomType.String
	}

	var usageLimit *int
	if b.UsageLimit.Valid {
		ul := int(b.UsageLimit.Int64)
		usageLimit = &ul
	}

	desc := ""
	if b.Description.Valid {
		desc = b.Description.String
	}

	return models.BenefitResponse{
		ID:              b.ID,
		Type:            b.Type,
		Title:           b.Title,
		Description:     desc,
		DiscountPercent: discountPercent,
		DiscountAmount:  discountAmount,
		VoucherID:       voucherID,
		MembershipTier:  b.MembershipTier,
		Scope:           b.Scope,
		HotelID:         hotelID,
		RoomType:        roomType,
		StartDate:       b.StartDate,
		ExpiryDate:      b.ExpiryDate,
		UsageLimit:      usageLimit,
		Status:          b.Status,
		CreatedAt:       b.CreatedAt,
		UpdatedAt:       b.UpdatedAt,
	}
}

// GetBenefits - Get all membership benefits with filters
func (h *BenefitMembershipHandler) GetBenefits(c *gin.Context) {
	filters := make(map[string]interface{})

	// Apply filters from query params
	if tier := c.Query("membership_tier"); tier != "" {
		filters["membership_tier"] = tier
	}
	if benefitType := c.Query("type"); benefitType != "" {
		filters["type"] = benefitType
	}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if hotelIDStr := c.Query("hotel_id"); hotelIDStr != "" {
		if hotelID, err := strconv.Atoi(hotelIDStr); err == nil {
			filters["hotel_id"] = hotelID
		}
	}
	if roomType := c.Query("room_type"); roomType != "" {
		filters["room_type"] = roomType
	}
	if scope := c.Query("scope"); scope != "" {
		filters["scope"] = scope
	}

	benefits, err := h.benefitRepo.GetBenefits(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to fetch benefits",
			Errors:  err.Error(),
		})
		return
	}

	// Map to response structs
	responses := make([]models.BenefitResponse, len(benefits))
	for i, benefit := range benefits {
		responses[i] = mapBenefitToResponse(&benefit)
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Benefits retrieved successfully",
		Data:    responses,
	})
}

// GetBenefitByID - Get single benefit by ID
func (h *BenefitMembershipHandler) GetBenefitByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid benefit ID",
		})
		return
	}

	benefit, err := h.benefitRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "Benefit not found",
			Errors:  err.Error(),
		})
		return
	}

	response := mapBenefitToResponse(benefit)
	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Benefit retrieved successfully",
		Data:    response,
	})
}

// GetBenefitsByTier - Get benefits for specific tier
func (h *BenefitMembershipHandler) GetBenefitsByTier(c *gin.Context) {
	tier := c.Param("tier")

	benefits, err := h.benefitRepo.GetByTier(tier)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to fetch benefits for tier",
			Errors:  err.Error(),
		})
		return
	}

	responses := make([]models.BenefitResponse, len(benefits))
	for i, benefit := range benefits {
		responses[i] = mapBenefitToResponse(&benefit)
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Tier benefits retrieved successfully",
		Data:    responses,
	})
}

// CreateBenefit - Create new membership benefit (admin only)
func (h *BenefitMembershipHandler) CreateBenefit(c *gin.Context) {
	var req models.CreateBenefitRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid request data",
			Errors:  err.Error(),
		})
		return
	}

	// Validate based on type
	if req.Type == "discount" {
		if (req.DiscountPercent == nil || *req.DiscountPercent <= 0) && (req.DiscountAmount == nil || *req.DiscountAmount <= 0) {
			c.JSON(http.StatusBadRequest, utils.ApiResponse{
				Success: false,
				Message: "Discount type requires either discount_percent or discount_amount",
			})
			return
		}
	} else if req.Type == "voucher" {
		if req.VoucherID == nil {
			c.JSON(http.StatusBadRequest, utils.ApiResponse{
				Success: false,
				Message: "Voucher type requires voucher_id",
			})
			return
		}
	}

	// Parse dates
	var startDate *time.Time
	if req.StartDate != nil {
		if t, err := time.Parse("2006-01-02", *req.StartDate); err == nil {
			startDate = &t
		}
	}

	var expiryDate *time.Time
	if req.ExpiryDate != nil {
		if t, err := time.Parse("2006-01-02", *req.ExpiryDate); err == nil {
			expiryDate = &t
		}
	}

	// Build benefit struct
	benefit := models.BenefitMembership{
		Type:           req.Type,
		Title:          req.Title,
		Description:    sql.NullString{String: req.Description, Valid: req.Description != ""},
		MembershipTier: req.MembershipTier,
		Scope:          req.Scope,
		StartDate:      startDate,
		ExpiryDate:     expiryDate,
		Status:         "active",
	}

	// Set discount fields
	if req.DiscountPercent != nil && *req.DiscountPercent > 0 {
		benefit.DiscountPercent = sql.NullFloat64{Float64: *req.DiscountPercent, Valid: true}
	}
	if req.DiscountAmount != nil && *req.DiscountAmount > 0 {
		benefit.DiscountAmount = sql.NullFloat64{Float64: *req.DiscountAmount, Valid: true}
	}

	// Set voucher reference
	if req.VoucherID != nil {
		benefit.VoucherID = sql.NullInt64{Int64: int64(*req.VoucherID), Valid: true}
	}

	// Set hotel and room type
	if req.HotelID != nil {
		benefit.HotelID = sql.NullInt64{Int64: int64(*req.HotelID), Valid: true}
	}
	if req.RoomType != nil {
		benefit.RoomType = sql.NullString{String: *req.RoomType, Valid: true}
	}

	// Set usage limit
	if req.UsageLimit != nil {
		benefit.UsageLimit = sql.NullInt64{Int64: int64(*req.UsageLimit), Valid: true}
	}

	if err := h.benefitRepo.Create(&benefit); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to create benefit",
			Errors:  err.Error(),
		})
		return
	}

	response := mapBenefitToResponse(&benefit)
	c.JSON(http.StatusCreated, utils.ApiResponse{
		Success: true,
		Message: "Benefit created successfully",
		Data:    response,
	})
}

// UpdateBenefit - Update membership benefit (admin only)
func (h *BenefitMembershipHandler) UpdateBenefit(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid benefit ID",
		})
		return
	}

	var req models.UpdateBenefitRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid request data",
			Errors:  err.Error(),
		})
		return
	}

	// Check benefit exists
	_, err = h.benefitRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "Benefit not found",
		})
		return
	}

	// Build updates map
	updates := make(map[string]interface{})

	if req.Type != nil {
		updates["type"] = *req.Type
	}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.DiscountPercent != nil {
		updates["discount_percent"] = *req.DiscountPercent
	}
	if req.DiscountAmount != nil {
		updates["discount_amount"] = *req.DiscountAmount
	}
	if req.VoucherID != nil {
		updates["voucher_id"] = *req.VoucherID
	}
	if req.MembershipTier != nil {
		updates["membership_tier"] = *req.MembershipTier
	}
	if req.Scope != nil {
		updates["scope"] = *req.Scope
	}
	if req.HotelID != nil {
		updates["hotel_id"] = *req.HotelID
	}
	if req.RoomType != nil {
		updates["room_type"] = *req.RoomType
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.UsageLimit != nil {
		updates["usage_limit"] = *req.UsageLimit
	}

	// Handle date parsing
	if req.StartDate != nil {
		if t, err := time.Parse("2006-01-02", *req.StartDate); err == nil {
			updates["start_date"] = t
		}
	}
	if req.ExpiryDate != nil {
		if t, err := time.Parse("2006-01-02", *req.ExpiryDate); err == nil {
			updates["expiry_date"] = t
		}
	}

	if err := h.benefitRepo.Update(id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to update benefit",
			Errors:  err.Error(),
		})
		return
	}

	// Fetch updated benefit
	benefit, _ := h.benefitRepo.GetByID(id)
	response := mapBenefitToResponse(benefit)

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Benefit updated successfully",
		Data:    response,
	})
}

// DeleteBenefit - Delete membership benefit (admin only)
func (h *BenefitMembershipHandler) DeleteBenefit(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid benefit ID",
		})
		return
	}

	// Check benefit exists
	_, err = h.benefitRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "Benefit not found",
		})
		return
	}

	if err := h.benefitRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to delete benefit",
			Errors:  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Benefit deleted successfully",
	})
}
