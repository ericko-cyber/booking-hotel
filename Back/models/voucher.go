package models

import (
	"database/sql"
	"time"
)

type Voucher struct {
	ID               int            `gorm:"primaryKey" json:"id"`
	Code             string         `gorm:"uniqueIndex;size:50" json:"code"`
	Type             string         `gorm:"type:enum('percent','fixed')" json:"type"` // 'percent' or 'fixed'
	Value            float64        `json:"value"`                                    // 10 for 10%, or 50000 for Rp50.000
	MinBookingAmount float64        `json:"min_booking_amount"`
	Scope            string         `gorm:"type:enum('global','hotel','room_type')" json:"scope"`
	MembershipTier   string         `gorm:"type:enum('none','silver','gold','platinum');default:'none'" json:"membership_tier"`
	HotelID          sql.NullInt64  `json:"hotel_id"`  // for hotel-specific vouchers
	RoomType         sql.NullString `json:"room_type"` // for room_type-specific vouchers
	StartDate        *time.Time     `json:"start_date"`
	ExpiryDate       time.Time      `json:"expiry_date"`
	UsageLimit       int            `json:"usage_limit"`
	UsedCount        int            `json:"used_count"`
	Status           string         `gorm:"type:enum('active','inactive','expired','exhausted')" json:"status"`
	Description      sql.NullString `json:"description"`
	CreatedBy        sql.NullInt64  `json:"created_by"` // user ID who created this voucher
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
}

// TableName specifies the table name
func (Voucher) TableName() string {
	return "vouchers"
}

// CreateVoucherRequest for creating a new voucher (admin only)
type CreateVoucherRequest struct {
	Code             string  `json:"code" binding:"required"`
	Type             string  `json:"type" binding:"required,oneof=percent fixed"`
	Value            float64 `json:"value" binding:"required,gt=0"`
	MinBookingAmount float64 `json:"min_booking_amount"`
	Scope            string  `json:"scope" binding:"required,oneof=global hotel room_type"`
	MembershipTier   string  `json:"membership_tier"`
	HotelID          *int    `json:"hotel_id"`
	RoomType         *string `json:"room_type"`
	StartDate        *string `json:"start_date"`
	ExpiryDate       string  `json:"expiry_date" binding:"required"`
	UsageLimit       *int    `json:"usage_limit"`
	Description      string  `json:"description"`
}

// UpdateVoucherRequest for updating a voucher (admin only)
type UpdateVoucherRequest struct {
	Code             *string  `json:"code"`
	Type             *string  `json:"type" binding:"omitempty,oneof=percent fixed"`
	Value            *float64 `json:"value" binding:"omitempty,gt=0"`
	MinBookingAmount *float64 `json:"min_booking_amount"`
	Scope            *string  `json:"scope" binding:"omitempty,oneof=global hotel room_type"`
	MembershipTier   *string  `json:"membership_tier"`
	HotelID          *int     `json:"hotel_id"`
	RoomType         *string  `json:"room_type"`
	StartDate        *string  `json:"start_date"`
	Status           *string  `json:"status" binding:"omitempty,oneof=active inactive expired exhausted"`
	UsageLimit       *int     `json:"usage_limit" binding:"omitempty,gt=0"`
	ExpiryDate       *string  `json:"expiry_date"`
	Description      *string  `json:"description"`
}

// ValidateVoucherRequest for validating/applying a voucher
type ValidateVoucherRequest struct {
	Code          string  `json:"code" binding:"required"`
	BookingAmount float64 `json:"booking_amount"`
	HotelID       *int    `json:"hotel_id"`
	RoomType      *string `json:"room_type"`
}

// VoucherResponse for API response
type VoucherResponse struct {
	ID               int        `json:"id"`
	Code             string     `json:"code"`
	Type             string     `json:"type"`
	Value            float64    `json:"value"`
	MinBookingAmount float64    `json:"min_booking_amount"`
	Scope            string     `json:"scope"`
	MembershipTier   string     `json:"membership_tier"`
	HotelID          *int       `json:"hotel_id,omitempty"`
	RoomType         *string    `json:"room_type,omitempty"`
	StartDate        *time.Time `json:"start_date,omitempty"`
	ExpiryDate       time.Time  `json:"expiry_date"`
	UsageLimit       int        `json:"usage_limit"`
	UsedCount        int        `json:"used_count"`
	Status           string     `json:"status"`
	Description      string     `json:"description"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// ValidateVoucherResponse for validation result
type ValidateVoucherResponse struct {
	Valid    bool    `json:"valid"`
	Message  string  `json:"message"`
	Code     string  `json:"code,omitempty"`
	Discount float64 `json:"discount,omitempty"` // discount amount
	Type     string  `json:"type,omitempty"`     // 'percent' or 'fixed'
	Value    float64 `json:"value,omitempty"`
}
