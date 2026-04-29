package repository

import (
	"Back/config"
	"Back/models"
	"errors"
	"time"

	"gorm.io/gorm"
)

// BookingRepository handles database operations for bookings
type BookingRepository struct {
	db *gorm.DB
}

// NewBookingRepository creates a new booking repository
func NewBookingRepository() *BookingRepository {
	return &BookingRepository{
		db: config.GetDB(),
	}
}

// CreateBooking creates a new booking
func (r *BookingRepository) CreateBooking(booking *models.Booking) error {
	return r.db.Create(booking).Error
}

// GetBookingByID retrieves a booking by ID
func (r *BookingRepository) GetBookingByID(id int) (*models.Booking, error) {
	var booking models.Booking
	if err := r.db.First(&booking, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("booking not found")
		}
		return nil, err
	}
	return &booking, nil
}

// GetBookingByCode retrieves a booking by booking code
func (r *BookingRepository) GetBookingByCode(code string) (*models.Booking, error) {
	var booking models.Booking
	if err := r.db.Where("booking_code = ?", code).First(&booking).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("booking not found")
		}
		return nil, err
	}
	return &booking, nil
}

// UpdateBooking updates an existing booking
func (r *BookingRepository) UpdateBooking(id int, booking *models.Booking) error {
	return r.db.Model(&models.Booking{}).Where("id = ?", id).Updates(booking).Error
}

// DeleteBooking deletes a booking (soft delete or cancellation)
func (r *BookingRepository) DeleteBooking(id int) error {
	return r.db.Where("id = ?", id).Delete(&models.Booking{}).Error
}

// ListBookingsByUser retrieves bookings by user ID with pagination
func (r *BookingRepository) ListBookingsByUser(userID int, page, pageSize int) ([]models.Booking, int64, error) {
	var bookings []models.Booking
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Where("user_id = ?", userID).Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&bookings).Error; err != nil {
		return nil, 0, err
	}

	return bookings, total, nil
}

// ListBookingsByHotel retrieves bookings by hotel ID with pagination
func (r *BookingRepository) ListBookingsByHotel(hotelID int, page, pageSize int) ([]models.Booking, int64, error) {
	var bookings []models.Booking
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.Where("hotel_id = ?", hotelID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Where("hotel_id = ?", hotelID).Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&bookings).Error; err != nil {
		return nil, 0, err
	}

	return bookings, total, nil
}

// ListAllBookings retrieves all bookings with pagination
func (r *BookingRepository) ListAllBookings(page, pageSize int) ([]models.Booking, int64, error) {
	var bookings []models.Booking
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.Model(&models.Booking{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&bookings).Error; err != nil {
		return nil, 0, err
	}

	return bookings, total, nil
}

// UpdateBookingStatus updates booking status
func (r *BookingRepository) UpdateBookingStatus(id int, status string) error {
	return r.db.Model(&models.Booking{}).Where("id = ?", id).Update("status", status).Error
}

// UpdatePaymentStatus updates payment status
func (r *BookingRepository) UpdatePaymentStatus(id int, paymentStatus string) error {
	return r.db.Model(&models.Booking{}).Where("id = ?", id).Update("payment_status", paymentStatus).Error
}

// GetBookingsByStatus retrieves bookings by status
func (r *BookingRepository) GetBookingsByStatus(status string, page, pageSize int) ([]models.Booking, int64, error) {
	var bookings []models.Booking
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.Where("status = ?", status).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Where("status = ?", status).Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&bookings).Error; err != nil {
		return nil, 0, err
	}

	return bookings, total, nil
}

// GetBookingsBetweenDates retrieves bookings within a date range
func (r *BookingRepository) GetBookingsBetweenDates(hotelID int, startDate, endDate time.Time) ([]models.Booking, error) {
	var bookings []models.Booking
	if err := r.db.Where("hotel_id = ? AND check_in >= ? AND check_out <= ?", hotelID, startDate, endDate).Find(&bookings).Error; err != nil {
		return nil, err
	}
	return bookings, nil
}

// CheckRoomAvailability checks if a room is available for the given dates
func (r *BookingRepository) CheckRoomAvailability(roomID int, checkIn, checkOut time.Time) (bool, error) {
	var count int64
	if err := r.db.Where("room_id = ? AND check_in < ? AND check_out > ? AND status != ?", roomID, checkOut, checkIn, "cancelled").Count(&count).Error; err != nil {
		return false, err
	}
	return count == 0, nil
}
