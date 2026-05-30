package handlers

import (
	"Back/config"
	"Back/models"
	"Back/repository"
	"Back/services"
	"Back/utils"
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// BookingHandler handles booking operations
type BookingHandler struct {
	bookingRepo *repository.BookingRepository
	roomRepo    *repository.RoomRepository
	hotelRepo   *repository.HotelRepository
	paymentRepo *repository.PaymentRepository
	benefitRepo repository.BenefitMembershipRepository
	voucherRepo repository.VoucherRepository
	userRepo    *repository.UserRepository
	claimRepo   *repository.VoucherClaimRepository
	midtransSvc *services.MidtransService
}

// NewBookingHandler creates a new booking handler
func NewBookingHandler() *BookingHandler {
	return &BookingHandler{
		bookingRepo: repository.NewBookingRepository(),
		roomRepo:    repository.NewRoomRepository(),
		hotelRepo:   repository.NewHotelRepository(),
		paymentRepo: repository.NewPaymentRepository(),
		benefitRepo: repository.NewBenefitMembershipRepository(config.GetDB()),
		voucherRepo: repository.NewVoucherRepository(config.GetDB()),
		userRepo:    repository.NewUserRepository(),
		claimRepo:   repository.NewVoucherClaimRepository(),
		midtransSvc: services.NewMidtransService(),
	}
}

func contextUserID(c *gin.Context) (int, error) {
	userID, exists := c.Get("userID")
	if !exists {
		return 0, fmt.Errorf("userID not found in context")
	}

	switch v := userID.(type) {
	case int:
		return v, nil
	case int64:
		return int(v), nil
	case float64:
		return int(v), nil
	case string:
		id, err := strconv.Atoi(v)
		if err != nil {
			return 0, fmt.Errorf("invalid userID string: %w", err)
		}
		return id, nil
	default:
		return 0, fmt.Errorf("unsupported userID type %T", userID)
	}
}

func bookingPaymentOrderID(bookingCode string, paymentID int) string {
	return fmt.Sprintf("BOOKING-%s-PAY-%d", bookingCode, paymentID)
}

func membershipTierRank(tier string) int {
	switch strings.ToLower(strings.TrimSpace(tier)) {
	case "silver":
		return 1
	case "gold":
		return 2
	case "platinum":
		return 3
	default:
		return 0
	}
}

func benefitDiscountValue(benefit *models.BenefitMembership, subtotal float64) float64 {
	if benefit == nil || subtotal <= 0 {
		return 0
	}

	if benefit.DiscountAmount.Valid && benefit.DiscountAmount.Float64 > 0 {
		if benefit.DiscountAmount.Float64 > subtotal {
			return subtotal
		}
		return benefit.DiscountAmount.Float64
	}

	if benefit.DiscountPercent.Valid && benefit.DiscountPercent.Float64 > 0 {
		discount := subtotal * (benefit.DiscountPercent.Float64 / 100)
		if discount > subtotal {
			return subtotal
		}
		return discount
	}

	return 0
}

func benefitScopePriority(benefit *models.BenefitMembership) int {
	if benefit == nil {
		return 0
	}

	switch strings.ToLower(strings.TrimSpace(benefit.Scope)) {
	case "room_type":
		return 3
	case "hotel":
		return 2
	case "global":
		return 1
	default:
		return 0
	}
}

func benefitMatchesBooking(benefit *models.BenefitMembership, hotel *models.Hotel, room *models.Room) bool {
	if benefit == nil {
		return false
	}

	switch strings.ToLower(strings.TrimSpace(benefit.Scope)) {
	case "global":
		return true
	case "hotel":
		return benefit.HotelID.Valid && hotel != nil && benefit.HotelID.Int64 == int64(hotel.ID)
	case "room_type":
		return benefit.RoomType.Valid && room != nil && strings.EqualFold(strings.TrimSpace(benefit.RoomType.String), strings.TrimSpace(room.RoomType))
	default:
		return false
	}
}

func (h *BookingHandler) calculateMembershipDiscount(user *models.User, hotel *models.Hotel, room *models.Room, subtotal float64) (float64, *models.BenefitMembership, error) {
	if user == nil || strings.TrimSpace(user.MembershipStatus) != "active" {
		return 0, nil, nil
	}

	tier := strings.ToLower(strings.TrimSpace(user.MembershipTier))
	if tier == "" || tier == "none" || membershipTierRank(tier) == 0 {
		return 0, nil, nil
	}

	if user.MembershipExpiryDate != nil && time.Now().After(*user.MembershipExpiryDate) {
		return 0, nil, nil
	}

	benefits, err := h.benefitRepo.GetByTier(tier)
	if err != nil {
		return 0, nil, err
	}

	var selected *models.BenefitMembership
	selectedDiscount := 0.0
	selectedScopePriority := 0
	for i := range benefits {
		benefit := &benefits[i]
		if strings.ToLower(strings.TrimSpace(benefit.Type)) != "discount" || strings.ToLower(strings.TrimSpace(benefit.Status)) != "active" {
			continue
		}
		if benefit.StartDate != nil && time.Now().Before(*benefit.StartDate) {
			continue
		}
		if benefit.ExpiryDate != nil && time.Now().After(*benefit.ExpiryDate) {
			continue
		}
		if !benefitMatchesBooking(benefit, hotel, room) {
			continue
		}

		discountValue := benefitDiscountValue(benefit, subtotal)
		scopePriority := benefitScopePriority(benefit)
		if selected == nil || scopePriority > selectedScopePriority || (scopePriority == selectedScopePriority && discountValue > selectedDiscount) {
			selected = benefit
			selectedDiscount = discountValue
			selectedScopePriority = scopePriority
		}
	}

	return selectedDiscount, selected, nil
}

func (h *BookingHandler) createBookingPaymentSession(booking *models.Booking, room *models.Room, hotel *models.Hotel, user *models.User) (*models.Payment, string, string, error) {
	if booking == nil {
		return nil, "", "", fmt.Errorf("booking is required")
	}

	now := time.Now()
	payment := &models.Payment{
		BookingID:      sql.NullInt64{Int64: int64(booking.ID), Valid: true},
		Amount:         booking.TotalPrice,
		PaymentGateway: sql.NullString{String: "midtrans-sandbox", Valid: true},
		Status:         "pending",
		Notes:          sql.NullString{String: fmt.Sprintf("booking:%s;user:%d;room:%d;hotel:%d", booking.BookingCode, booking.UserID, booking.RoomID, booking.HotelID), Valid: true},
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := h.paymentRepo.CreatePayment(payment); err != nil {
		return nil, "", "", err
	}

	orderID := bookingPaymentOrderID(booking.BookingCode, payment.ID)
	if err := h.paymentRepo.UpdatePaymentFields(payment.ID, map[string]interface{}{
		"reference_number": orderID,
		"payment_gateway":  "midtrans-sandbox",
	}); err != nil {
		return payment, orderID, "", err
	}

	itemName := fmt.Sprintf("Booking %s - %s", hotel.Name, room.Name)
	finishURL := fmt.Sprintf("%s/bookings?bookingId=%d&paymentId=%d", services.FrontendBaseURL(), booking.ID, payment.ID)
	checkoutURL, err := h.midtransSvc.CreateCheckoutURL(orderID, booking.TotalPrice, itemName, services.CustomerFromUser(user), finishURL)
	if err != nil {
		return payment, orderID, "", err
	}

	return payment, orderID, checkoutURL, nil
}

// CreateBooking creates a new booking
func (h *BookingHandler) CreateBooking(c *gin.Context) {
	userIDInt, err := contextUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{Success: false, Message: err.Error()})
		return
	}

	var createReq models.CreateBookingRequest

	if err := c.ShouldBindJSON(&createReq); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid request format",
			Errors:  err.Error(),
		})
		return
	}

	// Parse dates
	checkInDate, err := time.Parse("2006-01-02", createReq.CheckIn)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid check-in date format (use YYYY-MM-DD)",
		})
		return
	}

	checkOutDate, err := time.Parse("2006-01-02", createReq.CheckOut)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid check-out date format (use YYYY-MM-DD)",
		})
		return
	}

	// Get room details
	room, err := h.roomRepo.GetRoomByID(createReq.RoomID)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "Room not found",
		})
		return
	}

	hotel, err := h.hotelRepo.GetHotelByID(createReq.HotelID)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "Hotel not found",
		})
		return
	}

	// Check room availability against the room stock for overlapping dates
	available, err := h.bookingRepo.CheckRoomAvailability(createReq.RoomID, checkInDate, checkOutDate, room.Stock)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to check room availability",
			Errors:  err.Error(),
		})
		return
	}
	if !available {
		c.JSON(http.StatusConflict, utils.ApiResponse{
			Success: false,
			Message: "Room is fully booked for the selected dates",
		})
		return
	}

	// Calculate nights
	nights := int(checkOutDate.Sub(checkInDate).Hours() / 24)
	if nights <= 0 {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Check-out date must be after check-in date",
		})
		return
	}

	// Calculate prices
	subtotal := room.Price * float64(nights)
	taxRate := float32(10.0) // Default 10%
	taxAmount := subtotal * float64(taxRate) / 100
	membershipDiscount := 0.0
	var selectedMembershipBenefit *models.BenefitMembership
	if user, err := h.userRepo.GetUserByID(userIDInt); err == nil {
		if discount, benefit, discountErr := h.calculateMembershipDiscount(user, hotel, room, subtotal); discountErr != nil {
			fmt.Printf("Warning: Failed to calculate membership discount: %v\n", discountErr)
		} else {
			membershipDiscount = discount
			selectedMembershipBenefit = benefit
		}
	}
	voucherDiscount := 0.0
	var usedVoucherID int = 0
	totalPrice := subtotal + taxAmount - membershipDiscount

	// Apply voucher discount if provided
	if createReq.VoucherCode != "" {
		voucher, err := h.voucherRepo.GetByCode(strings.ToUpper(createReq.VoucherCode))
		if err == nil && voucher != nil {
			// Check membership tier requirement
			user, userErr := h.userRepo.GetUserByID(userIDInt)
			voucherValid := true
			if userErr == nil && user != nil && voucher.MembershipTier != "none" {
				// Check if user has active membership matching voucher tier
				if user.MembershipStatus != "active" {
					voucherValid = false
				} else {
					// Check tier hierarchy: none < silver < gold < platinum
					tierRank := map[string]int{
						"none":     0,
						"silver":   1,
						"gold":     2,
						"platinum": 3,
					}
					userTierRank := tierRank[user.MembershipTier]
					voucherTierRank := tierRank[voucher.MembershipTier]
					if userTierRank < voucherTierRank {
						voucherValid = false
					}
				}
			}

			// Check if voucher meets minimum booking amount and is valid for user
			if voucherValid && subtotal >= voucher.MinBookingAmount {
				if voucher.Type == "percent" {
					voucherDiscount = subtotal * (voucher.Value / 100)
				} else if voucher.Type == "fixed" {
					voucherDiscount = voucher.Value
				}
				// Apply discount
				totalPrice = subtotal + taxAmount - membershipDiscount - voucherDiscount
				usedVoucherID = voucher.ID
			}
		}
	}

	// Ensure total price is not negative
	if totalPrice < 0 {
		totalPrice = 0
	}

	// Generate booking code
	bookingCode := generateBookingCode()

	// Create booking
	booking := &models.Booking{
		BookingCode:        bookingCode,
		UserID:             userIDInt,
		RoomID:             createReq.RoomID,
		HotelID:            createReq.HotelID,
		CheckIn:            checkInDate,
		CheckOut:           checkOutDate,
		Nights:             nights,
		GuestsCount:        createReq.GuestsCount,
		RoomRate:           room.Price,
		Subtotal:           subtotal,
		TaxRate:            taxRate,
		TaxAmount:          taxAmount,
		VoucherDiscount:    voucherDiscount,
		MembershipDiscount: membershipDiscount,
		TotalPrice:         totalPrice,
		Status:             "pending",
		PaymentStatus:      "unpaid",
		GuestName:          nullStringHelper(createReq.GuestName),
		GuestEmail:         nullStringHelper(createReq.GuestEmail),
		GuestPhone:         nullStringHelper(createReq.GuestPhone),
		SpecialNotes:       nullStringHelper(createReq.SpecialNotes),
	}

	if createReq.VoucherCode != "" {
		booking.VoucherCode = nullStringHelper(createReq.VoucherCode)
	}

	if err := h.bookingRepo.CreateBooking(booking); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to create booking",
			Errors:  err.Error(),
		})
		return
	}

	if selectedMembershipBenefit != nil {
		fmt.Printf("Applied membership discount benefit ID %d for user %d: %.2f\n", selectedMembershipBenefit.ID, userIDInt, membershipDiscount)
	}

	// Mark voucher claim as used if voucher was applied
	if usedVoucherID > 0 && voucherDiscount > 0 {
		if claimErr := h.claimRepo.MarkClaimAsUsed(usedVoucherID, userIDInt); claimErr != nil {
			// Log error but don't fail the booking creation
			fmt.Printf("Warning: Failed to mark voucher claim as used: %v\n", claimErr)
		}
	}

	user, userErr := h.userRepo.GetUserByID(userIDInt)
	if userErr != nil {
		fmt.Printf("Warning: Failed to load user for booking payment session: %v\n", userErr)
	}

	checkoutPayment, orderID, checkoutURL, paymentErr := h.createBookingPaymentSession(booking, room, hotel, user)
	if paymentErr != nil || checkoutPayment == nil || strings.TrimSpace(checkoutURL) == "" {
		if paymentErr != nil {
			fmt.Printf("Warning: Failed to create Midtrans booking session: %v\n", paymentErr)
		}
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to create Midtrans sandbox checkout",
			Errors:  paymentErr,
		})
		return
	}
	paymentPath := fmt.Sprintf("/payment/%d", checkoutPayment.ID)

	c.JSON(http.StatusCreated, utils.ApiResponse{
		Success: true,
		Message: "Booking created successfully",
		Data: map[string]interface{}{
			"booking":         booking,
			"payment":         checkoutPayment,
			"order_id":        orderID,
			"checkout_url":    checkoutURL,
			"payment_path":    paymentPath,
			"payment_created": checkoutPayment != nil,
		},
	})
}

// GetBooking retrieves a booking by ID
func (h *BookingHandler) GetBooking(c *gin.Context) {
	bookingID := c.Param("id")
	bookingIDInt, err := strconv.Atoi(bookingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid booking ID",
		})
		return
	}

	booking, err := h.bookingRepo.GetBookingByID(bookingIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "Booking not found",
		})
		return
	}

	// Get related data
	room, _ := h.roomRepo.GetRoomByID(booking.RoomID)
	hotel, _ := h.hotelRepo.GetHotelByID(booking.HotelID)

	// Get latest payment (if any)
	payment, _ := h.paymentRepo.GetLatestPaymentByBookingID(booking.ID)

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Booking retrieved successfully",
		Data: models.BookingDetailResponse{
			Booking: *booking,
			Room:    room,
			Hotel:   hotel,
			Payment: payment,
		},
	})
}

// GetMyBookings retrieves authenticated user's bookings
func (h *BookingHandler) GetMyBookings(c *gin.Context) {
	userIDInt, err := contextUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{Success: false, Message: err.Error()})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	page, pageSize = utils.GetPageAndPageSize(page, pageSize)

	bookings, total, err := h.bookingRepo.ListBookingsByUser(userIDInt, page, pageSize)
	if err != nil {
		fmt.Printf("GetMyBookings error for user %d: %v\n", userIDInt, err)
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to retrieve bookings",
			Errors:  err.Error(),
		})
		return
	}

	totalPages := (int(total) + pageSize - 1) / pageSize

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Bookings retrieved successfully",
		Data: models.BookingListResponse{
			Bookings:   bookings,
			Total:      total,
			Page:       page,
			PageSize:   pageSize,
			TotalPages: totalPages,
		},
	})
}

// GetOwnerBookings retrieves bookings for all hotels owned by authenticated owner
func (h *BookingHandler) GetOwnerBookings(c *gin.Context) {
	ownerID, err := contextUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{Success: false, Message: err.Error()})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))

	page, pageSize = utils.GetPageAndPageSize(page, pageSize)

	bookings, total, err := h.bookingRepo.ListBookingsByOwner(ownerID, page, pageSize)
	if err != nil {
		fmt.Printf("GetOwnerBookings error for owner %d: %v\n", ownerID, err)
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to retrieve owner bookings",
			Errors:  err.Error(),
		})
		return
	}

	totalPages := (int(total) + pageSize - 1) / pageSize

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Owner bookings retrieved successfully",
		Data: models.BookingListResponse{
			Bookings:   bookings,
			Total:      total,
			Page:       page,
			PageSize:   pageSize,
			TotalPages: totalPages,
		},
	})
}

// ListBookings lists all bookings (admin only)
func (h *BookingHandler) ListBookings(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	page, pageSize = utils.GetPageAndPageSize(page, pageSize)

	bookings, total, err := h.bookingRepo.ListAllBookings(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to retrieve bookings",
			Errors:  err.Error(),
		})
		return
	}

	totalPages := (int(total) + pageSize - 1) / pageSize

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Bookings retrieved successfully",
		Data: models.BookingListResponse{
			Bookings:   bookings,
			Total:      total,
			Page:       page,
			PageSize:   pageSize,
			TotalPages: totalPages,
		},
	})
}

// UpdateBookingStatus updates booking status
func (h *BookingHandler) UpdateBookingStatus(c *gin.Context) {
	bookingID := c.Param("id")
	bookingIDInt, err := strconv.Atoi(bookingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid booking ID",
		})
		return
	}

	var updateReq models.UpdateBookingStatusRequest

	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid request format",
			Errors:  err.Error(),
		})
		return
	}

	booking, err := h.bookingRepo.GetBookingByID(bookingIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "Booking not found",
			Errors:  err.Error(),
		})
		return
	}

	if err := h.paymentRepo.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Booking{}).Where("id = ?", bookingIDInt).Updates(map[string]interface{}{
			"status":         updateReq.Status,
			"payment_status": updateReq.PaymentStatus,
		}).Error; err != nil {
			return err
		}

		if strings.EqualFold(updateReq.PaymentStatus, "paid") && booking.PaymentStatus != "paid" {
			nextID, err := h.paymentRepo.NextPaymentID()
			if err != nil {
				return err
			}

			paymentMethod := strings.TrimSpace(updateReq.PaymentMethod)
			if paymentMethod == "" {
				paymentMethod = "simulation"
			}

			paymentGateway := strings.TrimSpace(updateReq.PaymentGateway)
			if paymentGateway == "" {
				paymentGateway = "sandbox"
			}

			now := time.Now()
			transactionID := fmt.Sprintf("TXN%d", now.Unix())
			referenceNumber := fmt.Sprintf("BOOKING-%s", booking.BookingCode)

			payment := &models.Payment{
				ID:              nextID,
				BookingID:       sql.NullInt64{Int64: int64(bookingIDInt), Valid: true},
				Amount:          booking.TotalPrice,
				PaymentMethod:   sql.NullString{String: paymentMethod, Valid: true},
				PaymentGateway:  sql.NullString{String: paymentGateway, Valid: true},
				TransactionID:   sql.NullString{String: transactionID, Valid: true},
				ReferenceNumber: sql.NullString{String: referenceNumber, Valid: true},
				Status:          "success",
				ProofImage:      sql.NullString{Valid: false},
				Notes:           sql.NullString{String: fmt.Sprintf("booking:%s;status:%s;source:simulation", booking.BookingCode, updateReq.Status), Valid: true},
				CreatedAt:       now,
				UpdatedAt:       now,
			}

			if err := tx.Create(payment).Error; err != nil {
				return err
			}
		}

		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to update booking status",
			Errors:  err.Error(),
		})
		return
	}

	updatedBooking, err := h.bookingRepo.GetBookingByID(bookingIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Booking updated but failed to fetch latest data",
			Errors:  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Booking status updated successfully",
		Data:    updatedBooking,
	})
}

// CancelBooking cancels a booking
func (h *BookingHandler) CancelBooking(c *gin.Context) {
	bookingID := c.Param("id")
	bookingIDInt, err := strconv.Atoi(bookingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid booking ID",
		})
		return
	}

	if err := h.bookingRepo.UpdateBookingStatus(bookingIDInt, "cancelled"); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to cancel booking",
			Errors:  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Booking cancelled successfully",
	})
}

// Helper function to generate booking code
func generateBookingCode() string {
	return "BK" + time.Now().Format("20060102150405")
}
