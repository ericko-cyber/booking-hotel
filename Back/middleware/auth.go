package middleware

import (
	"Back/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates JWT token and sets user context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, utils.ApiResponse{
				Success: false,
				Message: "Missing authorization header",
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, utils.ApiResponse{
				Success: false,
				Message: "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Verify token
		claims, err := utils.VerifyToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, utils.ApiResponse{
				Success: false,
				Message: "Invalid or expired token: " + err.Error(),
			})
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("userID", claims.ID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Set("name", claims.Name)

		c.Next()
	}
}

// AdminMiddleware checks if user is admin
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, utils.ApiResponse{
				Success: false,
				Message: "Unauthorized",
			})
			c.Abort()
			return
		}

		if role != "admin" {
			c.JSON(http.StatusForbidden, utils.ApiResponse{
				Success: false,
				Message: "Access denied: Admin role required",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// OwnerMiddleware checks if user is owner
func OwnerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, utils.ApiResponse{
				Success: false,
				Message: "Unauthorized",
			})
			c.Abort()
			return
		}

		if role != "owner" && role != "admin" {
			c.JSON(http.StatusForbidden, utils.ApiResponse{
				Success: false,
				Message: "Access denied: Owner role required",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// CORSMiddleware handles CORS headers
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
