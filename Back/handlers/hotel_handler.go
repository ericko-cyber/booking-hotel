package handlers

import (
	"Back/models"
	"Back/repository"
	"Back/utils"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// HotelHandler handles hotel operations
type HotelHandler struct {
	hotelRepo *repository.HotelRepository
	roomRepo  *repository.RoomRepository
}

type adminHotelResponse struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	OwnerID     int       `json:"owner_id"`
	Location    string    `json:"location"`
	Address     string    `json:"address"`
	City        string    `json:"city"`
	Province    string    `json:"province"`
	Country     string    `json:"country"`
	Image       string    `json:"image"`
	Suasana     string    `json:"suasana"`
	Rating      float32   `json:"rating"`
	ReviewCount int       `json:"review_count"`
	Status      string    `json:"status"`
	TotalRooms  int       `json:"total_rooms"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// NewHotelHandler creates a new hotel handler
func NewHotelHandler() *HotelHandler {
	return &HotelHandler{
		hotelRepo: repository.NewHotelRepository(),
		roomRepo:  repository.NewRoomRepository(),
	}
}

func nullStringToString(value sql.NullString) string {
	if value.Valid {
		return value.String
	}
	return ""
}

func parseRoomFacilities(raw string) []string {
	if raw == "" {
		return nil
	}

	var facilities []string
	if err := json.Unmarshal([]byte(raw), &facilities); err != nil {
		return nil
	}

	return facilities
}

func mergeAmenities(hotelAmenities []string, rooms []models.Room) []string {
	seen := make(map[string]struct{})
	merged := make([]string, 0, len(hotelAmenities))

	add := func(value string) {
		value = strings.TrimSpace(value)
		if value == "" {
			return
		}
		if _, exists := seen[value]; exists {
			return
		}
		seen[value] = struct{}{}
		merged = append(merged, value)
	}

	for _, amenity := range hotelAmenities {
		add(amenity)
	}
	for _, room := range rooms {
		for _, facility := range parseRoomFacilities(room.Facilities) {
			add(facility)
		}
	}

	return merged
}

func (h *HotelHandler) enrichHotelAmenities(hotel models.Hotel) []string {
	rooms, err := h.roomRepo.GetRoomsByHotel(hotel.ID)
	if err != nil {
		return hotel.Amenities
	}

	return mergeAmenities(hotel.Amenities, rooms)
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

	// ensure amenities is a non-nil slice to avoid inserting empty string into JSON column
	amenities := createReq.Amenities
	if amenities == nil {
		amenities = []string{}
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
		Image:       nullString(createReq.Image),
		Suasana:     nullString(createReq.Suasana),
		Category:    nullString(createReq.Category),
		Amenities:   amenities,
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

// UploadHotelImage uploads a single hotel image and returns the public URL.
func (h *HotelHandler) UploadHotelImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Image file is required",
			Errors:  err.Error(),
		})
		return
	}

	if err := os.MkdirAll("uploads", 0o755); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to prepare upload folder",
			Errors:  err.Error(),
		})
		return
	}

	ext := filepath.Ext(file.Filename)
	if ext == "" {
		ext = ".jpg"
	}
	filename := fmt.Sprintf("hotel-%d%s", time.Now().UnixNano(), ext)
	path := filepath.Join("uploads", filename)

	if err := c.SaveUploadedFile(file, path); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to save image",
			Errors:  err.Error(),
		})
		return
	}

	publicURL := "/uploads/" + strings.ReplaceAll(filename, "\\", "/")
	scheme := c.Request.Header.Get("X-Forwarded-Proto")
	if scheme == "" {
		scheme = "http"
	}
	host := c.Request.Host
	if host == "" {
		host = "localhost:8080"
	}
	absoluteURL := fmt.Sprintf("%s://%s%s", scheme, host, publicURL)
	c.JSON(http.StatusCreated, utils.ApiResponse{
		Success: true,
		Message: "Image uploaded successfully",
		Data: map[string]string{
			"url": absoluteURL,
		},
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
		Data: func() models.HotelResponse {
			response := hotel.ToHotelResponse()
			response.Amenities = h.enrichHotelAmenities(*hotel)
			return response
		}(),
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
	if updateReq.Image != "" {
		hotel.Image = nullString(updateReq.Image)
	}
	if updateReq.Suasana != "" {
		hotel.Suasana = nullString(updateReq.Suasana)
	}
	if updateReq.Category != "" {
		hotel.Category = nullString(updateReq.Category)
	}
	if updateReq.Amenities != nil {
		hotel.Amenities = updateReq.Amenities
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
	filters["status"] = "approved"
	filters["min_total_rooms"] = 1
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

	// Convert hotels to response format
	hotelResponses := make([]models.HotelResponse, len(hotels))
	for i, hotel := range hotels {
		response := hotel.ToHotelResponse()
		response.Amenities = h.enrichHotelAmenities(hotel)
		hotelResponses[i] = response
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Hotels retrieved successfully",
		Data: models.HotelListResponse{
			Hotels:     hotelResponses,
			Total:      total,
			Page:       page,
			PageSize:   pageSize,
			TotalPages: totalPages,
		},
	})
}

// ListAdminHotels lists all hotels for admin review
func (h *HotelHandler) ListAdminHotels(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	page, pageSize = utils.GetPageAndPageSize(page, pageSize)

	filters := make(map[string]interface{})
	if status := c.Query("status"); status != "" && status != "all" {
		filters["status"] = status
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

	responses := make([]adminHotelResponse, 0, len(hotels))
	for _, hotel := range hotels {
		responses = append(responses, adminHotelResponse{
			ID:          hotel.ID,
			Name:        hotel.Name,
			OwnerID:     hotel.OwnerID,
			Location:    nullStringToString(hotel.Location),
			Address:     nullStringToString(hotel.Address),
			City:        nullStringToString(hotel.City),
			Province:    nullStringToString(hotel.Province),
			Country:     nullStringToString(hotel.Country),
			Image:       nullStringToString(hotel.Image),
			Suasana:     nullStringToString(hotel.Suasana),
			Rating:      hotel.Rating,
			ReviewCount: hotel.ReviewCount,
			Status:      hotel.Status,
			TotalRooms:  hotel.TotalRooms,
			CreatedAt:   hotel.CreatedAt,
			UpdatedAt:   hotel.UpdatedAt,
		})
	}

	totalPages := (int(total) + pageSize - 1) / pageSize

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Hotels retrieved successfully",
		Data: map[string]interface{}{
			"hotels":      responses,
			"total":       total,
			"page":        page,
			"page_size":   pageSize,
			"total_pages": totalPages,
		},
	})
}

// UpdateHotelStatus updates a hotel's status for admin review
func (h *HotelHandler) UpdateHotelStatus(c *gin.Context) {
	hotelID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid hotel ID",
		})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required,oneof=approved rejected pending suspended"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid request",
			Errors:  err.Error(),
		})
		return
	}

	if _, err := h.hotelRepo.GetHotelByID(hotelID); err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "Hotel not found",
		})
		return
	}

	if err := h.hotelRepo.UpdateHotelStatus(hotelID, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to update hotel status",
			Errors:  err.Error(),
		})
		return
	}

	hotel, _ := h.hotelRepo.GetHotelByID(hotelID)

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Hotel status updated successfully",
		Data:    hotel.ToHotelResponse(),
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

	// Convert hotels to response format
	hotelResponses := make([]models.HotelResponse, len(hotels))
	for i, hotel := range hotels {
		response := hotel.ToHotelResponse()
		response.Amenities = h.enrichHotelAmenities(hotel)
		hotelResponses[i] = response
	}

	filteredResponses := make([]models.HotelResponse, 0, len(hotelResponses))
	for _, hotel := range hotelResponses {
		if hotel.TotalRooms > 0 {
			filteredResponses = append(filteredResponses, hotel)
		}
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Hotels found",
		Data: models.HotelListResponse{
			Hotels:     filteredResponses,
			Total:      int64(len(filteredResponses)),
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

// GetMyHotels retrieves hotels owned by authenticated owner
func (h *HotelHandler) GetMyHotels(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{
			Success: false,
			Message: "User ID not found in context",
		})
		return
	}

	ownerID, ok := userIDVal.(int)
	if !ok {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Invalid user ID type",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))

	page, pageSize = utils.GetPageAndPageSize(page, pageSize)

	hotels, total, err := h.hotelRepo.GetHotelsByOwner(ownerID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to retrieve owner hotels",
			Errors:  err.Error(),
		})
		return
	}

	totalPages := (int(total) + pageSize - 1) / pageSize

	// Convert hotels to response format
	hotelResponses := make([]models.HotelResponse, len(hotels))
	for i, hotel := range hotels {
		hotelResponses[i] = hotel.ToHotelResponse()
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Owner hotels retrieved successfully",
		Data: models.HotelListResponse{
			Hotels:     hotelResponses,
			Total:      total,
			Page:       page,
			PageSize:   pageSize,
			TotalPages: totalPages,
		},
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
