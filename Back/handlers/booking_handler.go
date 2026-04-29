package handlers

import (
	"Back/models"
	"Back/repository"
	"Back/utils"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// BookingHandler handles booking operations
type BookingHandler struct {
	bookingRepo *repository.BookingRepository
	roomRepo    *repository.RoomRepository
	hotelRepo   *repository.HotelRepository
}

// NewBookingHandler creates a new booking handler
func NewBookingHandler() *BookingHandler {
	return &BookingHandler{
		bookingRepo: repository.NewBookingRepository(),
		roomRepo:    repository.NewRoomRepository(),
		hotelRepo:   repository.NewHotelRepository(),
	}
}

// CreateBooking creates a new booking
func (h *BookingHandler) CreateBooking(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDInt := userID.(int)

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

	// Check room availability
	available, err := h.bookingRepo.CheckRoomAvailability(createReq.RoomID, checkInDate, checkOutDate)
	if err != nil || !available {
		c.JSON(http.StatusConflict, utils.ApiResponse{
			Success: false,
			Message: "Room is not available for the selected dates",
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
	totalPrice := subtotal + taxAmount

	// Generate booking code
	bookingCode := generateBookingCode()

	// Create booking
	booking := &models.Booking{
		BookingCode:   bookingCode,
		UserID:        userIDInt,
		RoomID:        createReq.RoomID,
		HotelID:       createReq.HotelID,
		CheckIn:       checkInDate,
		CheckOut:      checkOutDate,
		Nights:        nights,
		GuestsCount:   createReq.GuestsCount,
		RoomRate:      room.Price,
		Subtotal:      subtotal,
		TaxRate:       taxRate,
		TaxAmount:     taxAmount,
		TotalPrice:    totalPrice,
		Status:        "pending",
		PaymentStatus: "unpaid",
		GuestName:     nullStringHelper(createReq.GuestName),
		GuestEmail:    nullStringHelper(createReq.GuestEmail),
		GuestPhone:    nullStringHelper(createReq.GuestPhone),
		SpecialNotes:  nullStringHelper(createReq.SpecialNotes),
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

	c.JSON(http.StatusCreated, utils.ApiResponse{
		Success: true,
		Message: "Booking created successfully",
		Data:    booking,
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

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Booking retrieved successfully",
		Data: models.BookingDetailResponse{
			Booking: *booking,
			Room:    room,
			Hotel:   hotel,
		},
	})
}

// GetMyBookings retrieves authenticated user's bookings
func (h *BookingHandler) GetMyBookings(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDInt := userID.(int)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	page, pageSize = utils.GetPageAndPageSize(page, pageSize)

	bookings, total, err := h.bookingRepo.ListBookingsByUser(userIDInt, page, pageSize)
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

	if err := h.bookingRepo.UpdateBookingStatus(bookingIDInt, updateReq.Status); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to update booking status",
			Errors:  err.Error(),
		})
		return
	}

	if updateReq.PaymentStatus != "" {
		h.bookingRepo.UpdatePaymentStatus(bookingIDInt, updateReq.PaymentStatus)
	}

	booking, _ := h.bookingRepo.GetBookingByID(bookingIDInt)

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Booking status updated successfully",
		Data:    booking,
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
