package models

import (
	"database/sql"
	"time"
)

type User struct {
	ID           int            `gorm:"primaryKey" json:"id"`
	Name         string         `json:"name"`
	Email        string         `gorm:"uniqueIndex" json:"email"`
	Password     string         `json:"-"`
	Phone        sql.NullString `json:"phone"`
	Role         string         `gorm:"type:enum('user','owner','admin')" json:"role"`
	IsAdmin      bool           `json:"is_admin"`
	ProfileImage sql.NullString `json:"profile_image"`
	Bio          sql.NullString `json:"bio"`
	Address      sql.NullString `json:"address"`
	City         sql.NullString `json:"city"`
	Province     sql.NullString `json:"province"`
	PostalCode   sql.NullString `json:"postal_code"`
	Country      string         `json:"country"`
	Status       string         `gorm:"type:enum('active','inactive','suspended')" json:"status"`
	LastLogin    *time.Time     `json:"last_login"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

// TableName specifies the table name
func (User) TableName() string {
	return "users"
}

// LoginRequest for authentication
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RegisterRequest for user registration
type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Phone    string `json:"phone"`
	Role     string `json:"role"`
}

// AuthResponse for login/register response
type AuthResponse struct {
	Success bool   `json:"success"`
	Token   string `json:"token"`
	User    User   `json:"user"`
	Message string `json:"message"`
}

// ProfileUpdateRequest for updating user profile
type ProfileUpdateRequest struct {
	Name         string `json:"name"`
	Phone        string `json:"phone"`
	Address      string `json:"address"`
	City         string `json:"city"`
	Province     string `json:"province"`
	PostalCode   string `json:"postal_code"`
	Bio          string `json:"bio"`
	ProfileImage string `json:"profile_image"`
}
