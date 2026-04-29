package middleware

import (
	"Back/utils"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorHandler is a middleware to handle errors globally
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) > 0 {
			err := c.Errors.Last()
			log.Printf("Error: %v", err)

			c.JSON(http.StatusInternalServerError, utils.ApiResponse{
				Success: false,
				Message: "Internal server error",
				Errors:  err.Error(),
			})
		}
	}
}

// RequestLogger logs all incoming requests
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("[%s] %s %s", c.Request.Method, c.Request.RequestURI, c.ClientIP())
		c.Next()
	}
}
