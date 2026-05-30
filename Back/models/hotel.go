package models

import (
	"database/sql"
	"time"
)

type Hotel struct {
	ID          int             `gorm:"primaryKey" json:"id"`
	Name        string          `json:"name"`
	OwnerID     int             `json:"owner_id"`
	Location    sql.NullString  `json:"location"`
	Address     sql.NullString  `json:"address"`
	City        sql.NullString  `json:"city"`
	Province    sql.NullString  `json:"province"`
	Country     sql.NullString  `json:"country"`
	Latitude    sql.NullFloat64 `json:"latitude"`
	Longitude   sql.NullFloat64 `json:"longitude"`
	Description sql.NullString  `json:"description"`
	Phone       sql.NullString  `json:"phone"`
	Email       sql.NullString  `json:"email"`
	Website     sql.NullString  `json:"website"`
	Image       sql.NullString  `json:"image"`
	Suasana     sql.NullString  `json:"suasana"`
	Rating      float32         `json:"rating"`
	ReviewCount int             `json:"review_count"`
	Status      string          `gorm:"type:enum('pending','approved','rejected','suspended')" json:"status"`
	TotalRooms  int             `json:"total_rooms"`
	Amenities   []string        `gorm:"type:json;serializer:json" json:"amenities"`
	Category    sql.NullString  `json:"category"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

// TableName specifies the table name
func (Hotel) TableName() string {
	return "hotels"
}

// CreateHotelRequest for creating a new hotel
type CreateHotelRequest struct {
	Name        string   `json:"name" binding:"required"`
	Location    string   `json:"location"`
	Address     string   `json:"address"`
	City        string   `json:"city"`
	Province    string   `json:"province"`
	Country     string   `json:"country"`
	Description string   `json:"description"`
	Phone       string   `json:"phone"`
	Email       string   `json:"email"`
	Website     string   `json:"website"`
	Image       string   `json:"image"`
	Suasana     string   `json:"suasana"`
	Amenities   []string `json:"amenities"`
	Category    string   `json:"category"`
}

// UpdateHotelRequest for updating hotel
type UpdateHotelRequest struct {
	Name        string   `json:"name"`
	Location    string   `json:"location"`
	Address     string   `json:"address"`
	City        string   `json:"city"`
	Province    string   `json:"province"`
	Country     string   `json:"country"`
	Description string   `json:"description"`
	Phone       string   `json:"phone"`
	Email       string   `json:"email"`
	Website     string   `json:"website"`
	Image       string   `json:"image"`
	Suasana     string   `json:"suasana"`
	Amenities   []string `json:"amenities"`
	Category    string   `json:"category"`
}

// HotelListResponse for listing hotels with filters
type HotelListResponse struct {
	Hotels     []HotelResponse `json:"hotels"`
	Total      int64           `json:"total"`
	Page       int             `json:"page"`
	PageSize   int             `json:"page_size"`
	TotalPages int             `json:"total_pages"`
}

// HotelResponse for API responses (no sql.NullString)
type HotelResponse struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	OwnerID     int       `json:"owner_id"`
	Location    string    `json:"location"`
	Address     string    `json:"address"`
	City        string    `json:"city"`
	Province    string    `json:"province"`
	Country     string    `json:"country"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	Description string    `json:"description"`
	Phone       string    `json:"phone"`
	Email       string    `json:"email"`
	Website     string    `json:"website"`
	Image       string    `json:"image"`
	Suasana     string    `json:"suasana"`
	Rating      float32   `json:"rating"`
	ReviewCount int       `json:"review_count"`
	Status      string    `json:"status"`
	TotalRooms  int       `json:"total_rooms"`
	Amenities   []string  `json:"amenities"`
	Category    string    `json:"category"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ToHotelResponse converts Hotel model to API response
func (h *Hotel) ToHotelResponse() HotelResponse {
	return HotelResponse{
		ID:          h.ID,
		Name:        h.Name,
		OwnerID:     h.OwnerID,
		Location:    nullStringToString(h.Location),
		Address:     nullStringToString(h.Address),
		City:        nullStringToString(h.City),
		Province:    nullStringToString(h.Province),
		Country:     nullStringToString(h.Country),
		Latitude:    nullFloat64ToFloat64(h.Latitude),
		Longitude:   nullFloat64ToFloat64(h.Longitude),
		Description: nullStringToString(h.Description),
		Phone:       nullStringToString(h.Phone),
		Email:       nullStringToString(h.Email),
		Website:     nullStringToString(h.Website),
		Image:       nullStringToString(h.Image),
		Suasana:     nullStringToString(h.Suasana),
		Rating:      h.Rating,
		ReviewCount: h.ReviewCount,
		Status:      h.Status,
		TotalRooms:  h.TotalRooms,
		Amenities:   h.Amenities,
		Category:    nullStringToString(h.Category),
		CreatedAt:   h.CreatedAt,
		UpdatedAt:   h.UpdatedAt,
	}
}

// Helper functions for null types
func nullStringToString(ns sql.NullString) string {
	if ns.Valid {
		return ns.String
	}
	return ""
}

func nullFloat64ToFloat64(nf sql.NullFloat64) float64 {
	if nf.Valid {
		return nf.Float64
	}
	return 0.0
}
