package main

import (
	"Back/config"
	"Back/handlers"
	"Back/middleware"
	"Back/repository"
	"log"
	"os"
	"path/filepath"
	"runtime"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() {
	// Load .env file from the first path that actually exists so go run works from any working directory.
	_, currentFile, _, ok := runtime.Caller(0)
	candidates := []string{".env", filepath.Join("Back", ".env"), filepath.Join("..", "Back", ".env")}
	if ok {
		backDir := filepath.Dir(currentFile)
		candidates = append([]string{
			filepath.Join(backDir, ".env"),
			filepath.Join(backDir, "..", ".env"),
		}, candidates...)
	}

	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			if loadErr := godotenv.Load(candidate); loadErr != nil {
				log.Printf("warning: failed to load %s: %v", candidate, loadErr)
			}
			return
		}
	}

	log.Println("No .env file found, using environment variables")
}

func main() {
	// Initialize database
	config.InitDatabase()
	config.InitMidtrans()
	log.Println("✓ Server starting...")

	// Create Gin router
	router := gin.Default()
	router.Static("/uploads", "./uploads")

	// Apply middleware
	router.Use(middleware.CORSMiddleware())
	router.Use(middleware.RequestLogger())
	router.Use(middleware.ErrorHandler())

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(config.DB)
	hotelHandler := handlers.NewHotelHandler()
	roomHandler := handlers.NewRoomHandler()
	bookingHandler := handlers.NewBookingHandler()
	voucherHandler := handlers.NewVoucherHandler(repository.NewVoucherRepository(config.DB), repository.NewUserRepository())
	voucherClaimHandler := handlers.NewVoucherClaimHandler(repository.NewVoucherClaimRepository())
	benefitHandler := handlers.NewBenefitMembershipHandler(repository.NewBenefitMembershipRepository(config.DB))
	paymentHandler := handlers.NewPaymentHandler()

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
			hotels.GET("/:id/vouchers", voucherHandler.GetVouchersForHotel)
		}

		// Voucher endpoints (public)
		vouchers := public.Group("/vouchers")
		{
			vouchers.GET("", voucherHandler.GetVouchers)
			vouchers.GET("/:code", voucherHandler.GetVoucherByCode)
		}

		payments := public.Group("/payments")
		{
			payments.POST("/midtrans/notification", paymentHandler.MidtransNotification)
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
			auth.PUT("/password", authHandler.ChangePassword)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/activate-membership", authHandler.ActivateMembership)
		}

		// Hotel endpoints (protected)
		hotels := protected.Group("/hotels")
		{
			hotels.GET("/owner/my-hotels", hotelHandler.GetMyHotels)
			hotels.POST("", hotelHandler.CreateHotel)
			hotels.POST("/upload-image", hotelHandler.UploadHotelImage)
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
			bookings.GET("/owner/my-bookings", bookingHandler.GetOwnerBookings)
			bookings.GET("/:id", bookingHandler.GetBooking)
			bookings.POST("/:id/qris", paymentHandler.CreateBookingQris)
			bookings.PUT("/:id/status", bookingHandler.UpdateBookingStatus)
			bookings.DELETE("/:id/cancel", bookingHandler.CancelBooking)
		}

		// Voucher endpoints (protected)
		voucherProtected := protected.Group("/vouchers")
		{
			voucherProtected.POST("/validate", voucherHandler.ValidateVoucher)
			voucherProtected.GET("/my-claims", voucherClaimHandler.ListMyClaims)
			voucherProtected.POST("/:id/claim", voucherClaimHandler.ClaimVoucher)
		}

		// Payment endpoints
		payments := protected.Group("/payments")
		{
			payments.POST("/create-membership", paymentHandler.CreateMembershipPayment)
			payments.GET("/:id", paymentHandler.GetPayment)
			payments.POST("/:id/midtrans", paymentHandler.CreateMidtransCheckout)
			payments.POST("/:id/sync", paymentHandler.SyncPaymentStatus)
			payments.POST("/:id/confirm", paymentHandler.ConfirmPayment)
		}

		// (claim-ticket endpoints removed — voucher-only flow retained)
	}

	// ===== ADMIN ROUTES =====
	admin := router.Group("/api/admin")
	admin.Use(middleware.AuthMiddleware())
	admin.Use(middleware.AdminMiddleware())
	{
		// Admin users
		users := admin.Group("/users")
		{
			users.GET("", authHandler.ListUsers)
			users.PATCH("/:id/status", authHandler.UpdateUserStatus)
		}

		// Admin hotels
		hotels := admin.Group("/hotels")
		{
			hotels.GET("", hotelHandler.ListAdminHotels)
			hotels.PATCH("/:id/status", hotelHandler.UpdateHotelStatus)
		}

		// Admin bookings
		bookings := admin.Group("/bookings")
		{
			bookings.GET("", bookingHandler.ListBookings)
		}

		// Admin voucher management
		vouchers := admin.Group("/vouchers")
		{
			vouchers.GET("", voucherHandler.GetVouchers)
			vouchers.POST("", voucherHandler.CreateVoucher)
			vouchers.PUT("/:id", voucherHandler.UpdateVoucher)
			vouchers.DELETE("/:id", voucherHandler.DeleteVoucher)
		}

		// Admin membership benefits management
		benefits := admin.Group("/benefits")
		{
			benefits.GET("", benefitHandler.GetBenefits)
			benefits.GET("/:id", benefitHandler.GetBenefitByID)
			benefits.GET("/tier/:tier", benefitHandler.GetBenefitsByTier)
			benefits.POST("", benefitHandler.CreateBenefit)
			benefits.PUT("/:id", benefitHandler.UpdateBenefit)
			benefits.DELETE("/:id", benefitHandler.DeleteBenefit)
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
