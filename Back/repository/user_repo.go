package repository

import (
	"Back/config"
	"Back/models"
	"errors"

	"gorm.io/gorm"
)

// UserRepository handles database operations for users
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository() *UserRepository {
	return &UserRepository{
		db: config.GetDB(),
	}
}

// CreateUser creates a new user
func (r *UserRepository) CreateUser(user *models.User) error {
	return r.db.Create(user).Error
}

// GetUserByID retrieves a user by ID
func (r *UserRepository) GetUserByID(id int) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

// GetUserByEmail retrieves a user by email
func (r *UserRepository) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

// UpdateUser updates an existing user
func (r *UserRepository) UpdateUser(id int, user *models.User) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Updates(user).Error
}

// DeleteUser deletes a user
func (r *UserRepository) DeleteUser(id int) error {
	return r.db.Where("id = ?", id).Delete(&models.User{}).Error
}

// ListUsers retrieves a list of users with pagination
func (r *UserRepository) ListUsers(page, pageSize int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.Model(&models.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

// GetUsersByRole retrieves users by role
func (r *UserRepository) GetUsersByRole(role string, page, pageSize int) ([]models.User, int64, error) {
	var users []models.User
	var total int64

	offset := (page - 1) * pageSize

	if err := r.db.Where("role = ?", role).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Where("role = ?", role).Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

// UpdateUserStatus updates user status
func (r *UserRepository) UpdateUserStatus(id int, status string) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update("status", status).Error
}

// GetUserWithoutPassword retrieves user without password field
func (r *UserRepository) GetUserWithoutPassword(id int) (*models.User, error) {
	var user models.User
	if err := r.db.Select("id", "name", "email", "phone", "role", "is_admin", "profile_image", "bio", "address", "city", "province", "postal_code", "country", "status", "last_login", "created_at", "updated_at").First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

// UserExists checks if user exists by ID
func (r *UserRepository) UserExists(id int) bool {
	var exists bool
	r.db.Model(&models.User{}).Select("count(*) > 0").Where("id = ?", id).Find(&exists)
	return exists
}

// EmailExists checks if email already exists
func (r *UserRepository) EmailExists(email string) bool {
	var exists bool
	r.db.Model(&models.User{}).Select("count(*) > 0").Where("email = ?", email).Find(&exists)
	return exists
}
