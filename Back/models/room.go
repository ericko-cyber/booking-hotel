package models

import (
	"database/sql"
	"time"
)

type Room struct {
	ID          int            `gorm:"primaryKey" json:"id"`
	HotelID     int            `json:"hotel_id"`
	Name        string         `json:"name"`
	Description sql.NullString `json:"description"`
	Capacity    int            `json:"capacity"`
	Price       float64        `json:"price"`
	Currency    string         `json:"currency"`
	Stock       int            `json:"stock"`
	BookedCount int            `json:"booked_count"`
	Facilities  string         `gorm:"type:json" json:"facilities"`
	RoomType    string         `gorm:"type:enum('single','double','suite','deluxe','presidential')" json:"room_type"`
	Status      string         `gorm:"type:enum('available','maintenance','discontinued')" json:"status"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

// TableName specifies the table name
func (Room) TableName() string {
	return "rooms"
}

// CreateRoomRequest for creating a new room
type CreateRoomRequest struct {
	Name        string   `json:"name" binding:"required"`
	Description string   `json:"description"`
	Capacity    int      `json:"capacity"`
	Price       float64  `json:"price" binding:"required"`
	Currency    string   `json:"currency"`
	Stock       int      `json:"stock"`
	Facilities  []string `json:"facilities"`
	RoomType    string   `json:"room_type"`
	Status      string   `json:"status"`
}

// UpdateRoomRequest for updating room
type UpdateRoomRequest struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Capacity    int      `json:"capacity"`
	Price       float64  `json:"price"`
	Currency    string   `json:"currency"`
	Stock       int      `json:"stock"`
	Facilities  []string `json:"facilities"`
	RoomType    string   `json:"room_type"`
	Status      string   `json:"status"`
}

// RoomListResponse for listing rooms
type RoomListResponse struct {
	Rooms      []RoomResponse `json:"rooms"`
	Total      int64          `json:"total"`
	Page       int            `json:"page"`
	PageSize   int            `json:"page_size"`
	TotalPages int            `json:"total_pages"`
}

// RoomResponse for API responses (no sql.NullString)
type RoomResponse struct {
	ID          int       `json:"id"`
	HotelID     int       `json:"hotel_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Capacity    int       `json:"capacity"`
	Price       float64   `json:"price"`
	Currency    string    `json:"currency"`
	Stock       int       `json:"stock"`
	BookedCount int       `json:"booked_count"`
	Facilities  string    `json:"facilities"`
	RoomType    string    `json:"room_type"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ToRoomResponse converts Room model to API response
func (r *Room) ToRoomResponse() RoomResponse {
	return RoomResponse{
		ID:          r.ID,
		HotelID:     r.HotelID,
		Name:        r.Name,
		Description: nullStringToStringRoom(r.Description),
		Capacity:    r.Capacity,
		Price:       r.Price,
		Currency:    r.Currency,
		Stock:       r.Stock,
		BookedCount: r.BookedCount,
		Facilities:  r.Facilities,
		RoomType:    r.RoomType,
		Status:      r.Status,
		CreatedAt:   r.CreatedAt,
		UpdatedAt:   r.UpdatedAt,
	}
}

// Helper function for null string in rooms
func nullStringToStringRoom(ns sql.NullString) string {
	if ns.Valid {
		return ns.String
	}
	return ""
}
