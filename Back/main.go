package main

import (
	"Back/config"
	"Back/handlers"
	"Back/middleware"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}
}

func main() {
	// Initialize database
	config.InitDatabase()
	log.Println("✓ Server starting...")

	// Create Gin router
	router := gin.Default()

	// Apply middleware
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.RequestLogger())
	router.Use(middleware.ErrorHandler())

	// Initialize handlers
	authHandler := handlers.NewAuthHandler()
	hotelHandler := handlers.NewHotelHandler()
	roomHandler := handlers.NewRoomHandler()
	bookingHandler := handlers.NewBookingHandler()

	// ===== PUBLIC ROUTES =====
	public := router.Group("/api")
	{
		// Auth endpoints
		auth := public.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
		}

		// Hotel endpoints (public)
		hotels := public.Group("/hotels")
		{
			hotels.GET("", hotelHandler.ListHotels)
			hotels.GET("/search", hotelHandler.SearchHotels)
			hotels.GET("/:id/rooms", roomHandler.ListRoomsByHotel)
			hotels.GET("/:id", hotelHandler.GetHotel)
		}
	}

	// ===== PROTECTED ROUTES (require authentication) =====
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware())
	{
		// Auth endpoints (protected)
		auth := protected.Group("/auth")
		{
			auth.GET("/profile", authHandler.GetProfile)
			auth.PUT("/profile", authHandler.UpdateProfile)
			auth.POST("/refresh", authHandler.RefreshToken)
		}

		// Hotel endpoints (protected)
		hotels := protected.Group("/hotels")
		{
			hotels.POST("", hotelHandler.CreateHotel)
			hotels.POST("/:id/rooms", roomHandler.CreateRoom)
			hotels.PUT("/:id", hotelHandler.UpdateHotel)
			hotels.DELETE("/:id", hotelHandler.DeleteHotel)
		}

		// Room endpoints
		rooms := protected.Group("/rooms")
		{
			rooms.GET("/:id", roomHandler.GetRoom)
			rooms.PUT("/:id", roomHandler.UpdateRoom)
			rooms.DELETE("/:id", roomHandler.DeleteRoom)
		}

		// Booking endpoints
		bookings := protected.Group("/bookings")
		{
			bookings.POST("", bookingHandler.CreateBooking)
			bookings.GET("", bookingHandler.GetMyBookings)
			bookings.GET("/:id", bookingHandler.GetBooking)
			bookings.PUT("/:id/status", bookingHandler.UpdateBookingStatus)
			bookings.DELETE("/:id/cancel", bookingHandler.CancelBooking)
		}
	}

	// ===== ADMIN ROUTES =====
	admin := router.Group("/api/admin")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.AdminMiddleware())
	{
		// Admin bookings
		bookings := admin.Group("/bookings")
		{
			bookings.GET("", bookingHandler.ListBookings)
		}
	}

	// Start server
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("✓ Server running on http://localhost:%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
