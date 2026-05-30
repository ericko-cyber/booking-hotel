package models

import (
	"database/sql"
	"time"
)

type BenefitMembership struct {
	ID              int             `gorm:"primaryKey" json:"id"`
	Type            string          `gorm:"type:enum('discount','voucher')" json:"type"` // 'discount' or 'voucher'
	Title           string          `gorm:"size:150" json:"title"`
	Description     sql.NullString  `json:"description"`
	DiscountPercent sql.NullFloat64 `json:"discount_percent"`
	DiscountAmount  sql.NullFloat64 `json:"discount_amount"`
	VoucherID       sql.NullInt64   `json:"voucher_id"` // reference to vouchers table
	MembershipTier  string          `gorm:"type:enum('none','silver','gold','platinum');default:'none'" json:"membership_tier"`
	Scope           string          `gorm:"type:enum('global','hotel','room_type');default:'global'" json:"scope"`
	HotelID         sql.NullInt64   `json:"hotel_id"`  // for hotel-specific benefits
	RoomType        sql.NullString  `json:"room_type"` // for room_type-specific benefits
	StartDate       *time.Time      `json:"start_date"`
	ExpiryDate      *time.Time      `json:"expiry_date"`
	UsageLimit      sql.NullInt64   `json:"usage_limit"`
	CreatedBy       sql.NullInt64   `json:"created_by"` // user ID who created this benefit
	Status          string          `gorm:"type:enum('active','inactive','expired');default:'active'" json:"status"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

// TableName specifies the table name
func (BenefitMembership) TableName() string {
	return "benefit_membership"
}

// CreateBenefitRequest for creating a new benefit membership
type CreateBenefitRequest struct {
	Type            string   `json:"type" binding:"required,oneof=discount voucher"`
	Title           string   `json:"title" binding:"required"`
	Description     string   `json:"description"`
	DiscountPercent *float64 `json:"discount_percent"`
	DiscountAmount  *float64 `json:"discount_amount"`
	VoucherID       *int     `json:"voucher_id"`
	MembershipTier  string   `json:"membership_tier" binding:"required,oneof=none silver gold platinum"`
	Scope           string   `json:"scope" binding:"required,oneof=global hotel room_type"`
	HotelID         *int     `json:"hotel_id"`
	RoomType        *string  `json:"room_type"`
	StartDate       *string  `json:"start_date"`
	ExpiryDate      *string  `json:"expiry_date"`
	UsageLimit      *int     `json:"usage_limit"`
}

// UpdateBenefitRequest for updating a benefit membership
type UpdateBenefitRequest struct {
	Type            *string  `json:"type"`
	Title           *string  `json:"title"`
	Description     *string  `json:"description"`
	DiscountPercent *float64 `json:"discount_percent"`
	DiscountAmount  *float64 `json:"discount_amount"`
	VoucherID       *int     `json:"voucher_id"`
	MembershipTier  *string  `json:"membership_tier"`
	Scope           *string  `json:"scope"`
	HotelID         *int     `json:"hotel_id"`
	RoomType        *string  `json:"room_type"`
	StartDate       *string  `json:"start_date"`
	ExpiryDate      *string  `json:"expiry_date"`
	UsageLimit      *int     `json:"usage_limit"`
	Status          *string  `json:"status"`
}

// BenefitResponse for API responses
type BenefitResponse struct {
	ID              int        `json:"id"`
	Type            string     `json:"type"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	DiscountPercent *float64   `json:"discount_percent"`
	DiscountAmount  *float64   `json:"discount_amount"`
	VoucherID       *int       `json:"voucher_id"`
	MembershipTier  string     `json:"membership_tier"`
	Scope           string     `json:"scope"`
	HotelID         *int       `json:"hotel_id"`
	RoomType        *string    `json:"room_type"`
	StartDate       *time.Time `json:"start_date"`
	ExpiryDate      *time.Time `json:"expiry_date"`
	UsageLimit      *int       `json:"usage_limit"`
	Status          string     `json:"status"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}
