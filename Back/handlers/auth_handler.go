package handlers

import (
	"Back/config"
	"Back/models"
	"Back/repository"
	"Back/utils"
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AuthHandler handles authentication operations
type AuthHandler struct {
	userRepo *repository.UserRepository
	db       *gorm.DB
}

type membershipPurchaseMeta struct {
	levelID        int
	levelName      string
	annualSpending float64
}

type adminUserResponse struct {
	ID                   int        `json:"id"`
	Name                 string     `json:"name"`
	Email                string     `json:"email"`
	Phone                *string    `json:"phone,omitempty"`
	Role                 string     `json:"role"`
	MembershipTier       string     `json:"membership_tier"`
	MembershipStatus     string     `json:"membership_status"`
	MembershipStartDate  *time.Time `json:"membership_start_date"`
	MembershipExpiryDate *time.Time `json:"membership_expiry_date"`
	IsAdmin              bool       `json:"is_admin"`
	ProfileImage         *string    `json:"profile_image,omitempty"`
	Bio                  *string    `json:"bio,omitempty"`
	Address              *string    `json:"address,omitempty"`
	City                 *string    `json:"city,omitempty"`
	Province             *string    `json:"province,omitempty"`
	PostalCode           *string    `json:"postal_code,omitempty"`
	Country              string     `json:"country"`
	Status               string     `json:"status"`
	LastLogin            *time.Time `json:"last_login"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

type authUserResponse struct {
	ID                   int        `json:"id"`
	Name                 string     `json:"name"`
	Email                string     `json:"email"`
	Phone                string     `json:"phone"`
	Role                 string     `json:"role"`
	IsAdmin              bool       `json:"is_admin"`
	MembershipTier       string     `json:"membership_tier"`
	MembershipStatus     string     `json:"membership_status"`
	MembershipStartDate  *time.Time `json:"membership_start_date"`
	MembershipExpiryDate *time.Time `json:"membership_expiry_date"`
	ProfileImage         string     `json:"profile_image"`
	Bio                  string     `json:"bio"`
	Address              string     `json:"address"`
	City                 string     `json:"city"`
	Province             string     `json:"province"`
	PostalCode           string     `json:"postal_code"`
	Country              string     `json:"country"`
	Status               string     `json:"status"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
}

// ActivateMembershipRequest request body for activating membership
type ActivateMembershipRequest struct {
	MembershipTier string  `json:"membership_tier" binding:"required,oneof=silver gold platinum"`
	ExpiryDate     *string `json:"expiry_date"` // optional, format YYYY-MM-DD
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(db *gorm.DB) *AuthHandler {
	if db == nil {
		db = config.DB
	}
	return &AuthHandler{
		userRepo: repository.NewUserRepository(),
		db:       db,
	}
}

func getMembershipPurchaseMeta(tier string) (membershipPurchaseMeta, bool) {
	switch strings.ToLower(strings.TrimSpace(tier)) {
	case "silver":
		return membershipPurchaseMeta{levelID: 1, levelName: "Silver", annualSpending: 299}, true
	case "gold":
		return membershipPurchaseMeta{levelID: 2, levelName: "Gold", annualSpending: 699}, true
	case "platinum":
		return membershipPurchaseMeta{levelID: 3, levelName: "Platinum", annualSpending: 1499}, true
	default:
		return membershipPurchaseMeta{}, false
	}
}

func stringPtrFromNull(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	text := value.String
	return &text
}

func stringFromNull(value sql.NullString) string {
	if !value.Valid {
		return ""
	}
	return value.String
}

func filterAdminUsers(users []models.User, query string) []models.User {
	if query == "" {
		return users
	}

	needle := strings.ToLower(query)
	filtered := make([]models.User, 0, len(users))
	for _, user := range users {
		if strings.Contains(strings.ToLower(user.Name), needle) || strings.Contains(strings.ToLower(user.Email), needle) {
			filtered = append(filtered, user)
		}
	}
	return filtered
}

func mapAdminUser(user models.User) adminUserResponse {
	return adminUserResponse{
		ID:                   user.ID,
		Name:                 user.Name,
		Email:                user.Email,
		Phone:                stringPtrFromNull(user.Phone),
		Role:                 user.Role,
		MembershipTier:       user.MembershipTier,
		MembershipStatus:     user.MembershipStatus,
		MembershipStartDate:  user.MembershipStartDate,
		MembershipExpiryDate: user.MembershipExpiryDate,
		IsAdmin:              user.IsAdmin,
		ProfileImage:         stringPtrFromNull(user.ProfileImage),
		Bio:                  stringPtrFromNull(user.Bio),
		Address:              stringPtrFromNull(user.Address),
		City:                 stringPtrFromNull(user.City),
		Province:             stringPtrFromNull(user.Province),
		PostalCode:           stringPtrFromNull(user.PostalCode),
		Country:              user.Country,
		Status:               user.Status,
		LastLogin:            user.LastLogin,
		CreatedAt:            user.CreatedAt,
		UpdatedAt:            user.UpdatedAt,
	}
}

func mapAuthUser(user *models.User) authUserResponse {
	if user == nil {
		return authUserResponse{}
	}

	return authUserResponse{
		ID:                   user.ID,
		Name:                 user.Name,
		Email:                user.Email,
		Phone:                stringFromNull(user.Phone),
		Role:                 user.Role,
		IsAdmin:              user.IsAdmin,
		MembershipTier:       user.MembershipTier,
		MembershipStatus:     user.MembershipStatus,
		MembershipStartDate:  user.MembershipStartDate,
		MembershipExpiryDate: user.MembershipExpiryDate,
		ProfileImage:         stringFromNull(user.ProfileImage),
		Bio:                  stringFromNull(user.Bio),
		Address:              stringFromNull(user.Address),
		City:                 stringFromNull(user.City),
		Province:             stringFromNull(user.Province),
		PostalCode:           stringFromNull(user.PostalCode),
		Country:              user.Country,
		Status:               user.Status,
		CreatedAt:            user.CreatedAt,
		UpdatedAt:            user.UpdatedAt,
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
	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Login successful",
		Data: map[string]interface{}{
			"success": true,
			"token":   token,
			"user":    mapAuthUser(user),
		},
	})
}

// ActivateMembership allows a user to activate their membership (protected)
func (h *AuthHandler) ActivateMembership(c *gin.Context) {
	userIDVal, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{Success: false, Message: "Unauthorized"})
		return
	}
	userID, ok := userIDVal.(int)
	if !ok {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{Success: false, Message: "Invalid user"})
		return
	}

	var req ActivateMembershipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid request", Errors: err.Error()})
		return
	}

	meta, ok := getMembershipPurchaseMeta(req.MembershipTier)
	if !ok {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid membership tier"})
		return
	}

	// determine dates
	now := time.Now()
	var expiry *time.Time
	if req.ExpiryDate != nil && *req.ExpiryDate != "" {
		if t, err := time.Parse("2006-01-02", *req.ExpiryDate); err == nil {
			expiry = &t
		}
	}
	// default expiry to 30 days if not provided
	if expiry == nil {
		t := now.AddDate(1, 0, 0)
		expiry = &t
	}

	if h.db == nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Database not ready"})
		return
	}

	if err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
			"membership_tier":        req.MembershipTier,
			"membership_status":      "active",
			"membership_start_date":  now,
			"membership_expiry_date": expiry,
		}).Error; err != nil {
			return err
		}

		var membership models.Membership
		err := tx.Where("user_id = ?", userID).First(&membership).Error
		updates := map[string]interface{}{
			"user_id":         userID,
			"level_id":        meta.levelID,
			"level_name":      meta.levelName,
			"annual_spending": meta.annualSpending,
			"status":          "active",
			"joined_date":     now,
			"renewal_date":    expiry,
		}

		if err == nil {
			return tx.Model(&membership).Updates(updates).Error
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		membership = models.Membership{
			UserID:         userID,
			LevelID:        meta.levelID,
			LevelName:      meta.levelName,
			AnnualSpending: meta.annualSpending,
			Status:         "active",
			JoinedDate:     &now,
			RenewalDate:    expiry,
		}
		return tx.Create(&membership).Error
	}); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to activate membership", Errors: err.Error()})
		return
	}

	updatedUser, err := h.userRepo.GetUserWithoutPassword(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Membership activated but profile refresh failed", Errors: err.Error()})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Membership activated", Data: mapAuthUser(updatedUser)})
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
	c.JSON(http.StatusCreated, utils.ApiResponse{
		Success: true,
		Message: "Registration successful",
		Data: map[string]interface{}{
			"success": true,
			"token":   token,
			"user":    mapAuthUser(user),
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
		Data:    mapAuthUser(user),
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
		Data:    mapAuthUser(updatedUser),
	})
}

// ChangePassword allows authenticated users to change their password
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, _ := c.Get("userID")
	userIDInt := userID.(int)

	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid request format",
			Errors:  err.Error(),
		})
		return
	}

	user, err := h.userRepo.GetUserByID(userIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{Success: false, Message: "User not found"})
		return
	}

	// Verify current password
	if err := utils.VerifyPassword(user.Password, req.CurrentPassword); err != nil {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{Success: false, Message: "Current password is incorrect"})
		return
	}

	// Hash new password
	hashed, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to process new password"})
		return
	}

	user.Password = hashed
	if err := h.userRepo.UpdateUser(userIDInt, user); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to update password", Errors: err.Error()})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Password updated successfully"})
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

// ListUsers returns a membership-aware user list for admin screens
func (h *AuthHandler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	role := c.Query("role")
	search := c.Query("search")

	page, pageSize = utils.GetPageAndPageSize(page, pageSize)

	users, total, err := h.userRepo.ListUsers(page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to list users",
			Errors:  err.Error(),
		})
		return
	}

	filtered := make([]models.User, 0, len(users))
	for _, user := range users {
		if role != "" && user.Role != role {
			continue
		}
		filtered = append(filtered, user)
	}
	filtered = filterAdminUsers(filtered, search)

	response := make([]adminUserResponse, 0, len(filtered))
	for _, user := range filtered {
		response = append(response, mapAdminUser(user))
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "Users retrieved successfully",
		Data: map[string]interface{}{
			"items":     response,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

// UpdateUserStatus updates a user's status (active/inactive)
func (h *AuthHandler) UpdateUserStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid user ID",
		})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required,oneof=active inactive"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{
			Success: false,
			Message: "Invalid request",
			Errors:  err.Error(),
		})
		return
	}

	// Verify user exists
	_, err = h.userRepo.GetUserByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{
			Success: false,
			Message: "User not found",
		})
		return
	}

	// Update the status
	if err := h.userRepo.UpdateUserStatus(id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{
			Success: false,
			Message: "Failed to update user status",
			Errors:  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{
		Success: true,
		Message: "User status updated successfully",
		Data: map[string]interface{}{
			"id":     id,
			"status": req.Status,
		},
	})
}
