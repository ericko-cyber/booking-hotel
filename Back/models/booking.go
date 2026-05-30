package models

import (
	"database/sql"
	"time"
)

type Booking struct {
	ID                 int            `gorm:"primaryKey" json:"id"`
	BookingCode        string         `gorm:"uniqueIndex" json:"booking_code"`
	UserID             int            `json:"user_id"`
	RoomID             int            `json:"room_id"`
	HotelID            int            `json:"hotel_id"`
	CheckIn            time.Time      `json:"check_in"`
	CheckOut           time.Time      `json:"check_out"`
	Nights             int            `json:"nights"`
	GuestsCount        int            `json:"guests_count"`
	RoomRate           float64        `json:"room_rate"`
	Subtotal           float64        `json:"subtotal"`
	TaxRate            float32        `json:"tax_rate"`
	TaxAmount          float64        `json:"tax_amount"`
	DiscountAmount     float64        `json:"discount_amount"`
	ServiceFee         float64        `json:"service_fee"`
	TotalPrice         float64        `json:"total_price"`
	VoucherCode        sql.NullString `json:"voucher_code"`
	VoucherDiscount    float64        `json:"voucher_discount"`
	MembershipDiscount float64        `json:"membership_discount"`
	Status             string         `gorm:"type:enum('pending','confirmed','checked-in','checked-out','cancelled')" json:"status"`
	PaymentStatus      string         `gorm:"type:enum('unpaid','paid','refunded')" json:"payment_status"`
	GuestName          sql.NullString `json:"guest_name"`
	GuestEmail         sql.NullString `json:"guest_email"`
	GuestPhone         sql.NullString `json:"guest_phone"`
	SpecialNotes       sql.NullString `json:"special_notes"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	Location           sql.NullString `json:"location" gorm:"column:location;->"`
	HotelName          sql.NullString `json:"hotel_name" gorm:"column:hotel_name;->"`
	RoomName           sql.NullString `json:"room_name" gorm:"column:room_name;->"`
}

// TableName specifies the table name
func (Booking) TableName() string {
	return "bookings"
}

// CreateBookingRequest for creating a new booking
type CreateBookingRequest struct {
	RoomID       int    `json:"room_id" binding:"required"`
	HotelID      int    `json:"hotel_id" binding:"required"`
	CheckIn      string `json:"check_in" binding:"required"`
	CheckOut     string `json:"check_out" binding:"required"`
	GuestsCount  int    `json:"guests_count"`
	GuestName    string `json:"guest_name"`
	GuestEmail   string `json:"guest_email"`
	GuestPhone   string `json:"guest_phone"`
	VoucherCode  string `json:"voucher_code"`
	SpecialNotes string `json:"special_notes"`
}

// UpdateBookingStatusRequest for updating booking status
type UpdateBookingStatusRequest struct {
	Status         string `json:"status" binding:"required"`
	PaymentStatus  string `json:"payment_status"`
	PaymentMethod  string `json:"payment_method"`
	PaymentGateway string `json:"payment_gateway"`
}

// BookingListResponse for listing bookings
type BookingListResponse struct {
	Bookings   []Booking `json:"bookings"`
	Total      int64     `json:"total"`
	Page       int       `json:"page"`
	PageSize   int       `json:"page_size"`
	TotalPages int       `json:"total_pages"`
}

// BookingDetailResponse with related data
type BookingDetailResponse struct {
	Booking Booking  `json:"booking"`
	Room    *Room    `json:"room,omitempty"`
	Hotel   *Hotel   `json:"hotel,omitempty"`
	User    *User    `json:"user,omitempty"`
	Payment *Payment `json:"payment,omitempty"`
}
