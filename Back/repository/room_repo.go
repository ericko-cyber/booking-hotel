package repository

import (
	"Back/config"
	"Back/models"
	"errors"

	"gorm.io/gorm"
)

// RoomRepository handles database operations for rooms
type RoomRepository struct {
	db *gorm.DB
}

// NewRoomRepository creates a new room repository
func NewRoomRepository() *RoomRepository {
	return &RoomRepository{
		db: config.GetDB(),
	}
}

// CreateRoom creates a new room
func (r *RoomRepository) CreateRoom(room *models.Room) error {
	return r.db.Create(room).Error
}

// GetRoomByID retrieves a room by ID
func (r *RoomRepository) GetRoomByID(id int) (*models.Room, error) {
	var room models.Room
	if err := r.db.First(&room, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("room not found")
		}
		return nil, err
	}
	return &room, nil
}

// UpdateRoom updates an existing room
func (r *RoomRepository) UpdateRoom(id int, room *models.Room) error {
	return r.db.Model(&models.Room{}).Where("id = ?", id).Updates(room).Error
}

// DeleteRoom deletes a room
func (r *RoomRepository) DeleteRoom(id int) error {
	return r.db.Where("id = ?", id).Delete(&models.Room{}).Error
}

// ListRoomsByHotel retrieves rooms by hotel ID with pagination
func (r *RoomRepository) ListRoomsByHotel(hotelID int, page, pageSize int) ([]models.Room, int64, error) {
	var rooms []models.Room
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.Where("hotel_id = ?", hotelID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Where("hotel_id = ?", hotelID).Offset(offset).Limit(pageSize).Find(&rooms).Error; err != nil {
		return nil, 0, err
	}

	return rooms, total, nil
}

// GetAvailableRoomsByHotel retrieves available rooms in a hotel
func (r *RoomRepository) GetAvailableRoomsByHotel(hotelID int) ([]models.Room, error) {
	var rooms []models.Room
	if err := r.db.Where("hotel_id = ? AND status = ? AND stock > booked_count", hotelID, "available").Find(&rooms).Error; err != nil {
		return nil, err
	}
	return rooms, nil
}

// UpdateRoomStatus updates room status
func (r *RoomRepository) UpdateRoomStatus(id int, status string) error {
	return r.db.Model(&models.Room{}).Where("id = ?", id).Update("status", status).Error
}

// UpdateRoomStock updates room stock/availability
func (r *RoomRepository) UpdateRoomStock(id int, bookedCount int) error {
	return r.db.Model(&models.Room{}).Where("id = ?", id).Update("booked_count", bookedCount).Error
}

// GetRoomsByType retrieves rooms by type
func (r *RoomRepository) GetRoomsByType(hotelID int, roomType string) ([]models.Room, error) {
	var rooms []models.Room
	if err := r.db.Where("hotel_id = ? AND room_type = ?", hotelID, roomType).Find(&rooms).Error; err != nil {
		return nil, err
	}
	return rooms, nil
}

// GetRoomsPriceRange retrieves rooms within price range
func (r *RoomRepository) GetRoomsPriceRange(hotelID int, minPrice, maxPrice float64) ([]models.Room, error) {
	var rooms []models.Room
	if err := r.db.Where("hotel_id = ? AND price BETWEEN ? AND ? AND status = 'available'", hotelID, minPrice, maxPrice).Find(&rooms).Error; err != nil {
		return nil, err
	}
	return rooms, nil
}
