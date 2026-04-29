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
	Rating      float32         `json:"rating"`
	ReviewCount int             `json:"review_count"`
	Status      string          `gorm:"type:enum('pending','approved','rejected','suspended')" json:"status"`
	TotalRooms  int             `json:"total_rooms"`
	Amenities   string          `gorm:"type:json" json:"amenities"`
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
	Amenities   []string `json:"amenities"`
	Category    string   `json:"category"`
}

// HotelListResponse for listing hotels with filters
type HotelListResponse struct {
	Hotels     []Hotel `json:"hotels"`
	Total      int64   `json:"total"`
	Page       int     `json:"page"`
	PageSize   int     `json:"page_size"`
	TotalPages int     `json:"total_pages"`
}
