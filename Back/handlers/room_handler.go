package handlers

import (
	"Back/models"
	"Back/repository"
	"Back/utils"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// RoomHandler handles room operations
type RoomHandler struct {
	roomRepo  *repository.RoomRepository
	hotelRepo *repository.HotelRepository
}

// NewRoomHandler creates a new room handler
func NewRoomHandler() *RoomHandler {
	return &RoomHandler{
		roomRepo:  repository.NewRoomRepository(),
		hotelRepo: repository.NewHotelRepository(),
	}
}

// CreateRoom creates a new room
func (h *RoomHandler) CreateRoom(c *gin.Context) {
	hotelID := c.Param("id")
	hotelIDInt, err := strconv.Atoi(hotelID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid hotel ID",
		})
		return
	}

	var createReq models.CreateRoomRequest

	if err := c.ShouldBindJSON(&createReq); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid request format",
			Errors:  err.Error(),
		})
		return
	}

	if createReq.Currency == "" {
		createReq.Currency = "IDR"
	}
	if createReq.RoomType == "" {
		createReq.RoomType = "deluxe"
	}
	if createReq.Status == "" {
		createReq.Status = "available"
	}

	// Verify hotel exists
	hotel, err := h.hotelRepo.GetHotelByID(hotelIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "Hotel not found",
		})
		return
	}

	// Marshal facilities to JSON
	facilitiesJSON, _ := json.Marshal(createReq.Facilities)

	room := &models.Room{
		HotelID:     hotelIDInt,
		Name:        createReq.Name,
		Description: nullStringHelper(createReq.Description),
		Capacity:    createReq.Capacity,
		Price:       createReq.Price,
		Currency:    createReq.Currency,
		Stock:       createReq.Stock,
		RoomType:    createReq.RoomType,
		Status:      createReq.Status,
		BookedCount: 0,
		Facilities:  string(facilitiesJSON),
	}

	if err := h.roomRepo.CreateRoom(room); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to create room",
			Errors:  err.Error(),
		})
		return
	}

	// Update hotel total rooms count
	hotel.TotalRooms++
	h.hotelRepo.UpdateHotel(hotelIDInt, hotel)

	c.JSON(http.StatusCreated, utils.ApiResponse{
		Success: true,
		Message: "Room created successfully",
		Data:    room.ToRoomResponse(),
	})
}

// GetRoom retrieves a room by ID
func (h *RoomHandler) GetRoom(c *gin.Context) {
	roomID := c.Param("id")
	roomIDInt, err := strconv.Atoi(roomID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid room ID",
		})
		return
	}

	room, err := h.roomRepo.GetRoomByID(roomIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "Room not found",
		})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Room retrieved successfully",
		Data:    room.ToRoomResponse(),
	})
}

// UpdateRoom updates a room
func (h *RoomHandler) UpdateRoom(c *gin.Context) {
	roomID := c.Param("id")
	roomIDInt, err := strconv.Atoi(roomID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid room ID",
		})
		return
	}

	var updateReq models.UpdateRoomRequest

	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid request format",
			Errors:  err.Error(),
		})
		return
	}

	room, err := h.roomRepo.GetRoomByID(roomIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "Room not found",
		})
		return
	}

	// Update fields
	if updateReq.Name != "" {
		room.Name = updateReq.Name
	}
	if updateReq.Description != "" {
		room.Description = nullStringHelper(updateReq.Description)
	}
	if updateReq.Capacity > 0 {
		room.Capacity = updateReq.Capacity
	}
	if updateReq.Price > 0 {
		room.Price = updateReq.Price
	}
	if updateReq.Currency != "" {
		room.Currency = updateReq.Currency
	}
	if updateReq.Stock > 0 {
		room.Stock = updateReq.Stock
	}
	if updateReq.RoomType != "" {
		room.RoomType = updateReq.RoomType
	}
	if updateReq.Status != "" {
		room.Status = updateReq.Status
	}
	if len(updateReq.Facilities) > 0 {
		facilitiesJSON, _ := json.Marshal(updateReq.Facilities)
		room.Facilities = string(facilitiesJSON)
		log.Printf("UpdateRoom payload for id=%d: facilities=%v, facilitiesJSON=%s", roomIDInt, updateReq.Facilities, room.Facilities)
	}

	if err := h.roomRepo.UpdateRoom(roomIDInt, room); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to update room",
			Errors:  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Room updated successfully",
		Data:    room.ToRoomResponse(),
	})
}

// ListRoomsByHotel lists rooms in a hotel
func (h *RoomHandler) ListRoomsByHotel(c *gin.Context) {
	hotelID := c.Param("id")
	hotelIDInt, err := strconv.Atoi(hotelID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid hotel ID",
		})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	page, pageSize = utils.GetPageAndPageSize(page, pageSize)

	rooms, total, err := h.roomRepo.ListRoomsByHotel(hotelIDInt, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to retrieve rooms",
			Errors:  err.Error(),
		})
		return
	}

	totalPages := (int(total) + pageSize - 1) / pageSize

	// Convert rooms to response format
	roomResponses := make([]models.RoomResponse, len(rooms))
	for i, room := range rooms {
		roomResponses[i] = room.ToRoomResponse()
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Rooms retrieved successfully",
		Data: models.RoomListResponse{
			Rooms:      roomResponses,
			Total:      total,
			Page:       page,
			PageSize:   pageSize,
			TotalPages: totalPages,
		},
	})
}

// DeleteRoom deletes a room
func (h *RoomHandler) DeleteRoom(c *gin.Context) {
	roomID := c.Param("id")
	roomIDInt, err := strconv.Atoi(roomID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid room ID",
		})
		return
	}

	room, err := h.roomRepo.GetRoomByID(roomIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "Room not found",
		})
		return
	}

	if err := h.roomRepo.DeleteRoom(roomIDInt); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to delete room",
			Errors:  err.Error(),
		})
		return
	}

	// Update hotel total rooms count
	hotel, _ := h.hotelRepo.GetHotelByID(room.HotelID)
	if hotel != nil && hotel.TotalRooms > 0 {
		hotel.TotalRooms--
		h.hotelRepo.UpdateHotel(room.HotelID, hotel)
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Room deleted successfully",
	})
}
