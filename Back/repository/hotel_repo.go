package repository

import (
	"Back/config"
	"Back/models"
	"errors"

	"gorm.io/gorm"
)

// HotelRepository handles database operations for hotels
type HotelRepository struct {
	db *gorm.DB
}

// NewHotelRepository creates a new hotel repository
func NewHotelRepository() *HotelRepository {
	return &HotelRepository{
		db: config.GetDB(),
	}
}

// CreateHotel creates a new hotel
func (r *HotelRepository) CreateHotel(hotel *models.Hotel) error {
	return r.db.Create(hotel).Error
}

// GetHotelByID retrieves a hotel by ID
func (r *HotelRepository) GetHotelByID(id int) (*models.Hotel, error) {
	var hotel models.Hotel
	if err := r.db.First(&hotel, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("hotel not found")
		}
		return nil, err
	}
	return &hotel, nil
}

// UpdateHotel updates an existing hotel
func (r *HotelRepository) UpdateHotel(id int, hotel *models.Hotel) error {
	return r.db.Model(&models.Hotel{}).Where("id = ?", id).Updates(hotel).Error
}

// DeleteHotel deletes a hotel
func (r *HotelRepository) DeleteHotel(id int) error {
	return r.db.Where("id = ?", id).Delete(&models.Hotel{}).Error
}

// ListHotels retrieves a list of hotels with pagination and filters
func (r *HotelRepository) ListHotels(page, pageSize int, filters map[string]interface{}) ([]models.Hotel, int64, error) {
	var hotels []models.Hotel
	var total int64

	offset := (page - 1) * pageSize
	query := r.db

	// Apply filters
	if status, ok := filters["status"]; ok {
		query = query.Where("status = ?", status)
	}
	if minTotalRooms, ok := filters["min_total_rooms"]; ok {
		query = query.Where("total_rooms >= ?", minTotalRooms)
	}
	if city, ok := filters["city"]; ok {
		query = query.Where("city = ?", city)
	}
	if ownerID, ok := filters["owner_id"]; ok {
		query = query.Where("owner_id = ?", ownerID)
	}
	if category, ok := filters["category"]; ok {
		query = query.Where("category = ?", category)
	}

	if err := query.Model(&models.Hotel{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Offset(offset).Limit(pageSize).Find(&hotels).Error; err != nil {
		return nil, 0, err
	}

	return hotels, total, nil
}

// GetHotelsByOwner retrieves hotels by owner ID
func (r *HotelRepository) GetHotelsByOwner(ownerID int, page, pageSize int) ([]models.Hotel, int64, error) {
	var hotels []models.Hotel
	var total int64

	offset := (page - 1) * pageSize

	// Use Model() to specify the table
	baseQuery := r.db.Model(&models.Hotel{}).Where("owner_id = ?", ownerID)

	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Model(&models.Hotel{}).
		Where("owner_id = ?", ownerID).
		Offset(offset).
		Limit(pageSize).
		Order("created_at DESC").
		Find(&hotels).Error; err != nil {
		return nil, 0, err
	}

	return hotels, total, nil
}

// UpdateHotelStatus updates hotel status
func (r *HotelRepository) UpdateHotelStatus(id int, status string) error {
	return r.db.Model(&models.Hotel{}).Where("id = ?", id).Update("status", status).Error
}

// GetApprovedHotels retrieves only approved hotels
func (r *HotelRepository) GetApprovedHotels(page, pageSize int) ([]models.Hotel, int64, error) {
	var hotels []models.Hotel
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.Where("status = ?", "approved").Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Where("status = ?", "approved").Offset(offset).Limit(pageSize).Find(&hotels).Error; err != nil {
		return nil, 0, err
	}

	return hotels, total, nil
}

// GetPendingHotels retrieves only pending hotels
func (r *HotelRepository) GetPendingHotels(page, pageSize int) ([]models.Hotel, int64, error) {
	var hotels []models.Hotel
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.Where("status = ?", "pending").Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Where("status = ?", "pending").Offset(offset).Limit(pageSize).Find(&hotels).Error; err != nil {
		return nil, 0, err
	}

	return hotels, total, nil
}

// SearchHotels searches hotels by name and location
func (r *HotelRepository) SearchHotels(keyword string, page, pageSize int) ([]models.Hotel, int64, error) {
	var hotels []models.Hotel
	var total int64

	offset := (page - 1) * pageSize

	query := r.db.Where("status = ? AND total_rooms > 0 AND (name LIKE ? OR location LIKE ? OR city LIKE ?)", "approved", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Offset(offset).Limit(pageSize).Find(&hotels).Error; err != nil {
		return nil, 0, err
	}

	return hotels, total, nil
}
