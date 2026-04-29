package handlers

import (
	"Back/models"
	"Back/repository"
	"Back/utils"
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// HotelHandler handles hotel operations
type HotelHandler struct {
	hotelRepo *repository.HotelRepository
	roomRepo  *repository.RoomRepository
}

// NewHotelHandler creates a new hotel handler
func NewHotelHandler() *HotelHandler {
	return &HotelHandler{
		hotelRepo: repository.NewHotelRepository(),
		roomRepo:  repository.NewRoomRepository(),
	}
}

// CreateHotel creates a new hotel
func (h *HotelHandler) CreateHotel(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDInt := userID.(int)

	var createReq models.CreateHotelRequest

	if err := c.ShouldBindJSON(&createReq); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid request format",
			Errors:  err.Error(),
		})
		return
	}

	hotel := &models.Hotel{
		OwnerID:     userIDInt,
		Name:        createReq.Name,
		Location:    nullString(createReq.Location),
		Address:     nullString(createReq.Address),
		City:        nullString(createReq.City),
		Province:    nullString(createReq.Province),
		Country:     nullString(createReq.Country),
		Description: nullString(createReq.Description),
		Phone:       nullString(createReq.Phone),
		Email:       nullString(createReq.Email),
		Website:     nullString(createReq.Website),
		Category:    nullString(createReq.Category),
		Status:      "pending",
		Rating:      0,
		ReviewCount: 0,
	}

	if err := h.hotelRepo.CreateHotel(hotel); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to create hotel",
			Errors:  err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, utils.ApiResponse{
		Success: true,
		Message: "Hotel created successfully",
		Data:    hotel,
	})
}

// GetHotel retrieves a hotel by ID
func (h *HotelHandler) GetHotel(c *gin.Context) {
	hotelID := c.Param("id")
	hotelIDInt, err := strconv.Atoi(hotelID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid hotel ID",
		})
		return
	}

	hotel, err := h.hotelRepo.GetHotelByID(hotelIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "Hotel not found",
		})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Hotel retrieved successfully",
		Data:    hotel,
	})
}

// UpdateHotel updates a hotel
func (h *HotelHandler) UpdateHotel(c *gin.Context) {
	hotelID := c.Param("id")
	hotelIDInt, err := strconv.Atoi(hotelID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid hotel ID",
		})
		return
	}

	var updateReq models.UpdateHotelRequest

	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid request format",
			Errors:  err.Error(),
		})
		return
	}

	hotel, err := h.hotelRepo.GetHotelByID(hotelIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "Hotel not found",
		})
		return
	}

	// Update fields
	if updateReq.Name != "" {
		hotel.Name = updateReq.Name
	}
	if updateReq.Location != "" {
		hotel.Location = nullString(updateReq.Location)
	}
	if updateReq.Address != "" {
		hotel.Address = nullString(updateReq.Address)
	}
	if updateReq.City != "" {
		hotel.City = nullString(updateReq.City)
	}
	if updateReq.Province != "" {
		hotel.Province = nullString(updateReq.Province)
	}
	if updateReq.Country != "" {
		hotel.Country = nullString(updateReq.Country)
	}
	if updateReq.Description != "" {
		hotel.Description = nullString(updateReq.Description)
	}
	if updateReq.Phone != "" {
		hotel.Phone = nullString(updateReq.Phone)
	}
	if updateReq.Email != "" {
		hotel.Email = nullString(updateReq.Email)
	}
	if updateReq.Website != "" {
		hotel.Website = nullString(updateReq.Website)
	}
	if updateReq.Category != "" {
		hotel.Category = nullString(updateReq.Category)
	}

	if err := h.hotelRepo.UpdateHotel(hotelIDInt, hotel); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to update hotel",
			Errors:  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Hotel updated successfully",
		Data:    hotel,
	})
}

// ListHotels lists all hotels with filters
func (h *HotelHandler) ListHotels(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	page, pageSize = utils.GetPageAndPageSize(page, pageSize)

	filters := make(map[string]interface{})
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if city := c.Query("city"); city != "" {
		filters["city"] = city
	}
	if category := c.Query("category"); category != "" {
		filters["category"] = category
	}

	hotels, total, err := h.hotelRepo.ListHotels(page, pageSize, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to retrieve hotels",
			Errors:  err.Error(),
		})
		return
	}

	totalPages := (int(total) + pageSize - 1) / pageSize

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Hotels retrieved successfully",
		Data: models.HotelListResponse{
			Hotels:     hotels,
			Total:      total,
			Page:       page,
			PageSize:   pageSize,
			TotalPages: totalPages,
		},
	})
}

// SearchHotels searches hotels
func (h *HotelHandler) SearchHotels(c *gin.Context) {
	keyword := c.Query("q")
	if keyword == "" {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Search keyword is required",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	page, pageSize = utils.GetPageAndPageSize(page, pageSize)

	hotels, total, err := h.hotelRepo.SearchHotels(keyword, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to search hotels",
			Errors:  err.Error(),
		})
		return
	}

	totalPages := (int(total) + pageSize - 1) / pageSize

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Hotels found",
		Data: models.HotelListResponse{
			Hotels:     hotels,
			Total:      total,
			Page:       page,
			PageSize:   pageSize,
			TotalPages: totalPages,
		},
	})
}

// DeleteHotel deletes a hotel
func (h *HotelHandler) DeleteHotel(c *gin.Context) {
	hotelID := c.Param("id")
	hotelIDInt, err := strconv.Atoi(hotelID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid hotel ID",
		})
		return
	}

	if err := h.hotelRepo.DeleteHotel(hotelIDInt); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to delete hotel",
			Errors:  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Hotel deleted successfully",
	})
}

// Helper function to convert string to sql.NullString
func nullString(s string) sql.NullString {
	return sql.NullString{String: s, Valid: s != ""}
}

// Helper function to convert string to sql.NullString (alias)
func nullStringHelper(s string) sql.NullString {
	return sql.NullString{String: s, Valid: s != ""}
}
