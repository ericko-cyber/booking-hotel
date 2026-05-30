package repository

import (
	"fmt"
	"time"

	"Back/models"

	"gorm.io/gorm"
)

type BenefitMembershipRepository interface {
	// Get all benefit memberships with optional filters
	GetBenefits(filters map[string]interface{}) ([]models.BenefitMembership, error)

	// Get single benefit by ID
	GetByID(id int) (*models.BenefitMembership, error)

	// Get benefits for specific membership tier
	GetByTier(tier string) ([]models.BenefitMembership, error)

	// Get benefits for specific type (discount/voucher)
	GetByType(benefitType string) ([]models.BenefitMembership, error)

	// Get benefits for specific hotel
	GetByHotel(hotelID int) ([]models.BenefitMembership, error)

	// Get benefits for specific room type
	GetByRoomType(roomType string) ([]models.BenefitMembership, error)

	// Create new benefit membership (admin only)
	Create(benefit *models.BenefitMembership) error

	// Update benefit membership (admin only)
	Update(id int, updates map[string]interface{}) error

	// Delete benefit membership (admin only)
	Delete(id int) error
}

type benefitMembershipRepository struct {
	db *gorm.DB
}

func NewBenefitMembershipRepository(db *gorm.DB) BenefitMembershipRepository {
	return &benefitMembershipRepository{db: db}
}

func (r *benefitMembershipRepository) GetBenefits(filters map[string]interface{}) ([]models.BenefitMembership, error) {
	var benefits []models.BenefitMembership
	query := r.db

	// Apply filters
	if membershipTier, ok := filters["membership_tier"]; ok {
		query = query.Where("membership_tier = ?", membershipTier)
	}
	if benefitType, ok := filters["type"]; ok {
		query = query.Where("type = ?", benefitType)
	}
	if status, ok := filters["status"]; ok {
		query = query.Where("status = ?", status)
	}
	if hotelID, ok := filters["hotel_id"]; ok {
		query = query.Where("hotel_id = ?", hotelID)
	}
	if roomType, ok := filters["room_type"]; ok {
		query = query.Where("room_type = ?", roomType)
	}
	if scope, ok := filters["scope"]; ok {
		query = query.Where("scope = ?", scope)
	}

	// Order by created_at desc
	query = query.Order("created_at DESC")

	if err := query.Find(&benefits).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch benefits: %w", err)
	}

	return benefits, nil
}

func (r *benefitMembershipRepository) GetByID(id int) (*models.BenefitMembership, error) {
	var benefit models.BenefitMembership

	if err := r.db.Where("id = ?", id).First(&benefit).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("benefit not found")
		}
		return nil, fmt.Errorf("failed to fetch benefit: %w", err)
	}

	return &benefit, nil
}

func (r *benefitMembershipRepository) GetByTier(tier string) ([]models.BenefitMembership, error) {
	var benefits []models.BenefitMembership

	if err := r.db.Where("membership_tier = ? AND status = ?", tier, "active").Order("created_at DESC").Find(&benefits).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch benefits for tier %s: %w", tier, err)
	}

	return benefits, nil
}

func (r *benefitMembershipRepository) GetByType(benefitType string) ([]models.BenefitMembership, error) {
	var benefits []models.BenefitMembership

	if err := r.db.Where("type = ? AND status = ?", benefitType, "active").Order("created_at DESC").Find(&benefits).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch benefits of type %s: %w", benefitType, err)
	}

	return benefits, nil
}

func (r *benefitMembershipRepository) GetByHotel(hotelID int) ([]models.BenefitMembership, error) {
	var benefits []models.BenefitMembership

	if err := r.db.Where("hotel_id = ? AND status = ?", hotelID, "active").Order("created_at DESC").Find(&benefits).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch benefits for hotel %d: %w", hotelID, err)
	}

	return benefits, nil
}

func (r *benefitMembershipRepository) GetByRoomType(roomType string) ([]models.BenefitMembership, error) {
	var benefits []models.BenefitMembership

	if err := r.db.Where("room_type = ? AND status = ?", roomType, "active").Order("created_at DESC").Find(&benefits).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch benefits for room type %s: %w", roomType, err)
	}

	return benefits, nil
}

func (r *benefitMembershipRepository) Create(benefit *models.BenefitMembership) error {
	benefit.CreatedAt = time.Now()
	benefit.UpdatedAt = time.Now()

	if err := r.db.Create(benefit).Error; err != nil {
		return fmt.Errorf("failed to create benefit: %w", err)
	}

	return nil
}

func (r *benefitMembershipRepository) Update(id int, updates map[string]interface{}) error {
	updates["updated_at"] = time.Now()

	if err := r.db.Model(&models.BenefitMembership{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update benefit: %w", err)
	}

	return nil
}

func (r *benefitMembershipRepository) Delete(id int) error {
	if err := r.db.Delete(&models.BenefitMembership{}, id).Error; err != nil {
		return fmt.Errorf("failed to delete benefit: %w", err)
	}

	return nil
}
