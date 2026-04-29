package handlers

import (
	"Back/models"
	"Back/repository"
	"Back/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication operations
type AuthHandler struct {
	userRepo *repository.UserRepository
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		userRepo: repository.NewUserRepository(),
	}
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var loginReq models.LoginRequest

	if err := c.ShouldBindJSON(&loginReq); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid request format",
			Errors:  err.Error(),
		})
		return
	}

	// Find user by email
	user, err := h.userRepo.GetUserByEmail(loginReq.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{
			Success: false,
			Message: "Invalid email or password",
		})
		return
	}

	// Verify password
	if err := utils.VerifyPassword(user.Password, loginReq.Password); err != nil {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{
			Success: false,
			Message: "Invalid email or password",
		})
		return
	}

	// Generate token
	token, err := utils.GenerateToken(user.ID, user.Email, user.Name, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to generate token",
		})
		return
	}

	// Prepare response without password
	userResponse := models.User{
		ID:           user.ID,
		Name:         user.Name,
		Email:        user.Email,
		Phone:        user.Phone,
		Role:         user.Role,
		IsAdmin:      user.IsAdmin,
		ProfileImage: user.ProfileImage,
		Bio:          user.Bio,
		Address:      user.Address,
		City:         user.City,
		Province:     user.Province,
		PostalCode:   user.PostalCode,
		Country:      user.Country,
		Status:       user.Status,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Login successful",
		Data: models.AuthResponse{
			Success: true,
			Token:   token,
			User:    userResponse,
		},
	})
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var registerReq models.RegisterRequest

	if err := c.ShouldBindJSON(&registerReq); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid request format",
			Errors:  err.Error(),
		})
		return
	}

	// Check if email already exists
	if h.userRepo.EmailExists(registerReq.Email) {
		c.JSON(http.StatusConflict, utils.ApiResponse{
			Success: false,
			Message: "Email already registered",
		})
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(registerReq.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to process password",
		})
		return
	}

	// Set default role if not provided
	role := registerReq.Role
	if role == "" {
		role = "user"
	}

	// Create user
	user := &models.User{
		Name:     registerReq.Name,
		Email:    registerReq.Email,
		Password: hashedPassword,
		Role:     role,
		Status:   "active",
	}

	if registerReq.Phone != "" {
		phone := registerReq.Phone
		user.Phone.String = phone
		user.Phone.Valid = true
	}

	if err := h.userRepo.CreateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to create user",
			Errors:  err.Error(),
		})
		return
	}

	// Generate token
	token, err := utils.GenerateToken(user.ID, user.Email, user.Name, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to generate token",
		})
		return
	}

	// Prepare response without password
	userResponse := models.User{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		Phone:     user.Phone,
		Role:      user.Role,
		IsAdmin:   user.IsAdmin,
		Status:    user.Status,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}

	c.JSON(http.StatusCreated, utils.ApiResponse{
		Success: true,
		Message: "Registration successful",
		Data: models.AuthResponse{
			Success: true,
			Token:   token,
			User:    userResponse,
		},
	})
}

// GetProfile returns the authenticated user's profile
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDInt := userID.(int)

	user, err := h.userRepo.GetUserWithoutPassword(userIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Profile retrieved successfully",
		Data:    user,
	})
}

// UpdateProfile updates the authenticated user's profile
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDInt := userID.(int)

	var updateReq models.ProfileUpdateRequest

	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid request format",
			Errors:  err.Error(),
		})
		return
	}

	// Get existing user
	user, err := h.userRepo.GetUserByID(userIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "User not found",
		})
		return
	}

	// Update fields
	if updateReq.Name != "" {
		user.Name = updateReq.Name
	}
	if updateReq.Phone != "" {
		user.Phone.String = updateReq.Phone
		user.Phone.Valid = true
	}
	if updateReq.Address != "" {
		user.Address.String = updateReq.Address
		user.Address.Valid = true
	}
	if updateReq.City != "" {
		user.City.String = updateReq.City
		user.City.Valid = true
	}
	if updateReq.Province != "" {
		user.Province.String = updateReq.Province
		user.Province.Valid = true
	}
	if updateReq.PostalCode != "" {
		user.PostalCode.String = updateReq.PostalCode
		user.PostalCode.Valid = true
	}
	if updateReq.Bio != "" {
		user.Bio.String = updateReq.Bio
		user.Bio.Valid = true
	}
	if updateReq.ProfileImage != "" {
		user.ProfileImage.String = updateReq.ProfileImage
		user.ProfileImage.Valid = true
	}

	if err := h.userRepo.UpdateUser(userIDInt, user); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to update profile",
			Errors:  err.Error(),
		})
		return
	}

	updatedUser, _ := h.userRepo.GetUserWithoutPassword(userIDInt)

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Profile updated successfully",
		Data:    updatedUser,
	})
}

// RefreshToken generates a new JWT token
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	userID, _ := c.Get("userID")
	email, _ := c.Get("email")
	name, _ := c.Get("name")
	role, _ := c.Get("role")

	token, err := utils.GenerateToken(userID.(int), email.(string), name.(string), role.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Token refreshed successfully",
		Data: map[string]string{
			"token": token,
		},
	})
}

// GetUserByID retrieves a user by ID (admin/owner only)
func (h *AuthHandler) GetUserByID(c *gin.Context) {
	userID := c.Param("id")
	userIDInt, err := strconv.Atoi(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid user ID",
		})
		return
	}

	user, err := h.userRepo.GetUserWithoutPassword(userIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "User retrieved successfully",
		Data:    user,
	})
}
