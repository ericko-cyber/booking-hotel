package handlers

import (
	"Back/models"
	"Back/repository"
	"Back/services"
	"Back/utils"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	midtrans "github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/coreapi"
	"gorm.io/gorm"
)

// PaymentHandler handles payment related endpoints
type PaymentHandler struct {
	repo        *repository.PaymentRepository
	bookingRepo *repository.BookingRepository
	roomRepo    *repository.RoomRepository
	hotelRepo   *repository.HotelRepository
	userRepo    *repository.UserRepository
	midtransSvc *services.MidtransService
}

// NewPaymentHandler creates a new PaymentHandler
func NewPaymentHandler() *PaymentHandler {
	return &PaymentHandler{
		repo:        repository.NewPaymentRepository(),
		bookingRepo: repository.NewBookingRepository(),
		roomRepo:    repository.NewRoomRepository(),
		hotelRepo:   repository.NewHotelRepository(),
		userRepo:    repository.NewUserRepository(),
		midtransSvc: services.NewMidtransService(),
	}
}

type CreateMembershipPaymentRequest struct {
	MembershipTier string `json:"membership_tier" binding:"required,oneof=silver gold platinum"`
}

type midtransNotificationRequest struct {
	OrderID           string `json:"order_id"`
	TransactionStatus string `json:"transaction_status"`
	FraudStatus       string `json:"fraud_status"`
	TransactionID     string `json:"transaction_id"`
	PaymentType       string `json:"payment_type"`
	GrossAmount       string `json:"gross_amount"`
}

func parsePaymentNotes(notes string) map[string]string {
	parsed := make(map[string]string)
	if notes == "" {
		return parsed
	}

	for _, part := range strings.Split(notes, ";") {
		kv := strings.SplitN(part, ":", 2)
		if len(kv) != 2 {
			continue
		}
		key := strings.TrimSpace(kv[0])
		value := strings.TrimSpace(kv[1])
		if key != "" && value != "" {
			parsed[key] = value
		}
	}

	return parsed
}

func (h *PaymentHandler) paymentOrderLabel(payment *models.Payment) string {
	if payment == nil {
		return ""
	}

	if payment.BookingID.Valid {
		return fmt.Sprintf("BOOKING-%d-PAY-%d", payment.BookingID.Int64, payment.ID)
	}

	meta := parsePaymentNotes(payment.Notes.String)
	tier := strings.TrimSpace(meta["membership"])
	userID := strings.TrimSpace(meta["user"])
	if tier != "" && userID != "" {
		return fmt.Sprintf("MEM-%d", payment.ID)
	}

	return fmt.Sprintf("PAYMENT-%d", payment.ID)
}

func (h *PaymentHandler) checkoutOrderID(payment *models.Payment) string {
	if payment == nil {
		return ""
	}

	baseOrderID := strings.TrimSpace(payment.ReferenceNumber.String)
	if baseOrderID == "" {
		baseOrderID = h.paymentOrderLabel(payment)
	}

	if strings.EqualFold(payment.Status, "pending") {
		return fmt.Sprintf("%s-R%d-%d", baseOrderID, payment.ID, time.Now().UnixNano())
	}

	return baseOrderID
}

func (h *PaymentHandler) buildCheckoutDetails(payment *models.Payment) (string, string, error) {
	if payment == nil {
		return "", "", fmt.Errorf("payment not found")
	}
	itemName := fmt.Sprintf("Payment #%d", payment.ID)
	var customer *midtrans.CustomerDetails
	if payment.BookingID.Valid {
		bookingID := int(payment.BookingID.Int64)
		booking, err := h.bookingRepo.GetBookingByID(bookingID)
		if err != nil {
			return "", "", err
		}
		if booking == nil {
			return "", "", fmt.Errorf("booking not found")
		}

		room, _ := h.roomRepo.GetRoomByID(booking.RoomID)
		hotel, _ := h.hotelRepo.GetHotelByID(booking.HotelID)
		hotelName := fmt.Sprintf("Hotel #%d", booking.HotelID)
		roomName := fmt.Sprintf("Room #%d", booking.RoomID)
		if hotel != nil && hotel.Name != "" {
			hotelName = hotel.Name
		}
		if room != nil && room.Name != "" {
			roomName = room.Name
		}
		itemName = fmt.Sprintf("Booking %s - %s", hotelName, roomName)
		user, _ := h.userRepo.GetUserByID(booking.UserID)
		customer = services.CustomerFromUser(user)
	} else {
		meta := parsePaymentNotes(payment.Notes.String)
		if userIDStr, ok := meta["user"]; ok {
			if userID, err := strconv.Atoi(userIDStr); err == nil {
				user, _ := h.userRepo.GetUserByID(userID)
				customer = services.CustomerFromUser(user)
			}
		}
		if tier := strings.TrimSpace(meta["membership"]); tier != "" {
			itemName = fmt.Sprintf("Membership %s", strings.Title(strings.ToLower(tier)))
		}
	}

	// Determine candidate order IDs to try. Prefer existing reference_number if present,
	// then attempt a generated retry-safe order id if necessary.
	baseOrderID := strings.TrimSpace(payment.ReferenceNumber.String)
	if baseOrderID == "" {
		baseOrderID = h.paymentOrderLabel(payment)
	}

	var candidates []string
	// Try existing reference number first (if any)
	if baseOrderID != "" && strings.TrimSpace(payment.ReferenceNumber.String) != "" {
		candidates = append(candidates, baseOrderID)
	}

	// If payment is still pending, allow a retry-specific order id to avoid duplicate conflicts
	if strings.EqualFold(payment.Status, "pending") {
		retryOrder := fmt.Sprintf("%s-R%d-%d", baseOrderID, payment.ID, time.Now().UnixNano())
		candidates = append(candidates, retryOrder)
	}

	// Ensure we always try at least the base order id
	if len(candidates) == 0 {
		candidates = append(candidates, baseOrderID)
	}

	finishURL := fmt.Sprintf("%s/payment/%d", services.FrontendBaseURL(), payment.ID)

	var lastErr error
	for _, orderID := range candidates {
		checkoutURL, err := h.midtransSvc.CreateCheckoutURL(orderID, payment.Amount, itemName, customer, finishURL)
		if err != nil {
			lastErr = err
			log.Printf("Midtrans checkout attempt failed for order %s: %v", orderID, err)
			// try next candidate
			continue
		}

		// Persist the successfully used order id and gateway
		if err := h.repo.UpdatePaymentFields(payment.ID, map[string]interface{}{
			"reference_number": orderID,
			"payment_gateway":  "midtrans-sandbox",
		}); err != nil {
			// If DB update fails, return error to caller
			return orderID, "", err
		}

		return orderID, checkoutURL, nil
	}

	return "", "", fmt.Errorf("midtrans checkout creation failed: %v", lastErr)
}

func (h *PaymentHandler) buildQrisDetails(payment *models.Payment) (string, string, error) {
	if payment == nil {
		return "", "", fmt.Errorf("payment not found")
	}

	orderID := h.checkoutOrderID(payment)

	itemName := fmt.Sprintf("Payment #%d", payment.ID)
	var customer *midtrans.CustomerDetails
	if payment.BookingID.Valid {
		bookingID := int(payment.BookingID.Int64)
		booking, err := h.bookingRepo.GetBookingByID(bookingID)
		if err != nil {
			return "", "", err
		}
		if booking == nil {
			return "", "", fmt.Errorf("booking not found")
		}

		room, _ := h.roomRepo.GetRoomByID(booking.RoomID)
		hotel, _ := h.hotelRepo.GetHotelByID(booking.HotelID)
		hotelName := fmt.Sprintf("Hotel #%d", booking.HotelID)
		roomName := fmt.Sprintf("Room #%d", booking.RoomID)
		if hotel != nil && hotel.Name != "" {
			hotelName = hotel.Name
		}
		if room != nil && room.Name != "" {
			roomName = room.Name
		}
		itemName = fmt.Sprintf("Booking %s - %s", hotelName, roomName)
		user, _ := h.userRepo.GetUserByID(booking.UserID)
		customer = services.CustomerFromUser(user)
	} else {
		meta := parsePaymentNotes(payment.Notes.String)
		if userIDStr, ok := meta["user"]; ok {
			if userID, err := strconv.Atoi(userIDStr); err == nil {
				user, _ := h.userRepo.GetUserByID(userID)
				customer = services.CustomerFromUser(user)
			}
		}
		if tier := strings.TrimSpace(meta["membership"]); tier != "" {
			itemName = fmt.Sprintf("Membership %s", strings.Title(strings.ToLower(tier)))
		}
	}

	serverKey := strings.TrimSpace(midtrans.ServerKey)
	if serverKey == "" {
		return "", "", fmt.Errorf("midtrans server key is not configured")
	}

	coreClient := coreapi.Client{}
	coreClient.New(serverKey, midtrans.Environment)

	chargeReq := &coreapi.ChargeReq{
		PaymentType: coreapi.PaymentTypeQris,
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  orderID,
			GrossAmt: int64(payment.Amount),
		},
		CustomerDetails: customer,
		Qris: &coreapi.QrisDetails{
			Acquirer: "gopay",
		},
		Items: &[]midtrans.ItemDetails{{
			ID:    orderID,
			Name:  itemName,
			Price: int64(payment.Amount),
			Qty:   1,
		}},
	}

	resp, err := coreClient.ChargeTransaction(chargeReq)
	if err != nil {
		return orderID, "", err
	}

	updates := map[string]interface{}{
		"reference_number": orderID,
		"payment_gateway":  "midtrans-coreapi",
		"payment_method":   "qris",
		"status":           strings.ToLower(strings.TrimSpace(resp.TransactionStatus)),
	}
	if resp.TransactionID != "" {
		updates["transaction_id"] = resp.TransactionID
	}
	if err := h.repo.UpdatePaymentFields(payment.ID, updates); err != nil {
		return orderID, "", err
	}

	return orderID, resp.QRString, nil
}

func (h *PaymentHandler) syncPaymentStatus(payment *models.Payment) error {
	if payment == nil {
		return fmt.Errorf("payment not found")
	}

	orderID := strings.TrimSpace(payment.ReferenceNumber.String)
	if orderID == "" {
		return fmt.Errorf("payment reference number is missing")
	}

	serverKey := strings.TrimSpace(midtrans.ServerKey)
	if serverKey == "" {
		return fmt.Errorf("midtrans server key is not configured")
	}

	coreClient := coreapi.Client{}
	coreClient.New(serverKey, midtrans.Environment)
	statusResp, err := coreClient.CheckTransaction(orderID)
	if err != nil {
		return err
	}

	if statusResp == nil {
		return fmt.Errorf("empty transaction status response")
	}

	return h.applyNotificationStatus(payment, midtransNotificationRequest{
		OrderID:           statusResp.OrderID,
		TransactionStatus: statusResp.TransactionStatus,
		FraudStatus:       statusResp.FraudStatus,
		TransactionID:     statusResp.TransactionID,
		PaymentType:       statusResp.PaymentType,
		GrossAmount:       statusResp.GrossAmount,
	})
}

func (h *PaymentHandler) applyNotificationStatus(payment *models.Payment, req midtransNotificationRequest) error {
	if payment == nil {
		return fmt.Errorf("payment not found")
	}

	status := strings.ToLower(strings.TrimSpace(req.TransactionStatus))
	fraud := strings.ToLower(strings.TrimSpace(req.FraudStatus))
	transactionID := strings.TrimSpace(req.TransactionID)
	paymentType := strings.TrimSpace(req.PaymentType)

	resolvedStatus := "pending"
	switch status {
	case "settlement":
		resolvedStatus = "success"
	case "capture":
		if fraud == "challenge" {
			resolvedStatus = "pending"
		} else {
			resolvedStatus = "success"
		}
	case "pending":
		resolvedStatus = "pending"
	case "deny", "cancel", "expire":
		resolvedStatus = "failed"
	}

	updates := map[string]interface{}{
		"status":           resolvedStatus,
		"payment_gateway":  "midtrans-sandbox",
		"payment_method":   paymentType,
		"reference_number": strings.TrimSpace(req.OrderID),
	}
	if transactionID != "" {
		updates["transaction_id"] = transactionID
	}
	if err := h.repo.UpdatePaymentFields(payment.ID, updates); err != nil {
		return err
	}

	if payment.BookingID.Valid {
		bookingID := int(payment.BookingID.Int64)
		bookingStatus := "pending"
		paymentStatus := "unpaid"
		if resolvedStatus == "success" {
			bookingStatus = "confirmed"
			paymentStatus = "paid"
		}
		if err := h.bookingRepo.UpdateBookingStatus(bookingID, bookingStatus); err != nil {
			return err
		}
		return h.bookingRepo.UpdatePaymentStatus(bookingID, paymentStatus)
	}

	if resolvedStatus == "success" {
		meta := parsePaymentNotes(payment.Notes.String)
		tier := strings.TrimSpace(meta["membership"])
		userIDStr := strings.TrimSpace(meta["user"])
		userID, err := strconv.Atoi(userIDStr)
		if err != nil || tier == "" {
			return nil
		}

		now := time.Now()
		expiry := now.AddDate(1, 0, 0)
		if err := h.repo.Transaction(func(tx *gorm.DB) error {
			levelID := 1
			levelName := strings.Title(strings.ToLower(tier))
			annualSpending := 0.0
			if tierMeta, ok := getMembershipPurchaseMeta(tier); ok {
				levelID = tierMeta.levelID
				levelName = tierMeta.levelName
				annualSpending = tierMeta.annualSpending
			}

			if err := tx.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
				"membership_tier":        tier,
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
				"level_id":        levelID,
				"level_name":      levelName,
				"annual_spending": annualSpending,
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
				LevelID:        levelID,
				LevelName:      levelName,
				AnnualSpending: annualSpending,
				Status:         "active",
				JoinedDate:     &now,
				RenewalDate:    &expiry,
			}
			return tx.Create(&membership).Error
		}); err != nil {
			return err
		}
	}

	return nil
}

// CreateMembershipPayment creates a pending payment for a membership purchase
func (h *PaymentHandler) CreateMembershipPayment(c *gin.Context) {
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

	var req CreateMembershipPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid request", Errors: err.Error()})
		return
	}

	meta, ok := getMembershipPurchaseMeta(req.MembershipTier)
	if !ok {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid membership tier"})
		return
	}

	// amount in IDR (meta.annualSpending is expressed as thousands)
	amount := meta.annualSpending * 1000.0

	now := time.Now()

	payment := &models.Payment{
		Amount:         amount,
		PaymentGateway: sql.NullString{String: "midtrans-sandbox", Valid: true},
		Status:         "pending",
		Notes:          sql.NullString{String: "membership:" + req.MembershipTier + ";user:" + strconv.Itoa(userID), Valid: true},
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := h.repo.CreatePayment(payment); err != nil {
		log.Printf("CreatePayment error: %v", err)
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to create payment", Errors: err.Error()})
		return
	}

	orderID, checkoutURL, err := h.buildCheckoutDetails(payment)
	if err != nil {
		log.Printf("Midtrans checkout error: %v", err)
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to create Midtrans checkout", Errors: err.Error()})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Payment created", Data: map[string]interface{}{
		"payment_id":   payment.ID,
		"order_id":     orderID,
		"payment_path": "/payment/" + strconv.Itoa(payment.ID),
		"amount":       payment.Amount,
		"checkout_url": checkoutURL,
	}})
}

// CreateMidtransCheckout regenerates a Midtrans checkout URL for an existing payment.
func (h *PaymentHandler) CreateMidtransCheckout(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Missing id"})
		return
	}
	paymentID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid id"})
		return
	}

	payment, err := h.repo.GetPaymentByID(paymentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to fetch payment", Errors: err.Error()})
		return
	}
	if payment == nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{Success: false, Message: "Payment not found"})
		return
	}

	orderID, checkoutURL, err := h.buildCheckoutDetails(payment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to create Midtrans checkout", Errors: err.Error()})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Checkout created", Data: map[string]interface{}{
		"payment_id":   payment.ID,
		"order_id":     orderID,
		"checkout_url": checkoutURL,
	}})
}

// CreateBookingQris generates or reuses a QRIS payment for a booking.
func (h *PaymentHandler) CreateBookingQris(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Missing id"})
		return
	}
	bookingID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid id"})
		return
	}

	booking, err := h.bookingRepo.GetBookingByID(bookingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to fetch booking", Errors: err.Error()})
		return
	}
	if booking == nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{Success: false, Message: "Booking not found"})
		return
	}

	payment, err := h.repo.GetLatestPaymentByBookingID(booking.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to fetch payment", Errors: err.Error()})
		return
	}
	if payment == nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{Success: false, Message: "Payment not found"})
		return
	}
	if strings.EqualFold(payment.Status, "paid") {
		c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Payment already completed", Data: map[string]interface{}{
			"payment": payment,
			"booking": booking,
		}})
		return
	}

	room, _ := h.roomRepo.GetRoomByID(booking.RoomID)
	hotel, _ := h.hotelRepo.GetHotelByID(booking.HotelID)
	user, _ := h.userRepo.GetUserByID(booking.UserID)
	orderID, qrString, buildErr := h.buildQrisDetails(payment)
	if buildErr != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to create QRIS payment", Errors: buildErr.Error()})
		return
	}

	updatedPayment, _ := h.repo.GetPaymentByID(payment.ID)
	_ = room
	_ = hotel
	_ = user

	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "QRIS created", Data: map[string]interface{}{
		"payment":    updatedPayment,
		"booking":    booking,
		"qr_string":  qrString,
		"order_id":   orderID,
		"payment_id": payment.ID,
		"booking_id": booking.ID,
	}})
}

// SyncPaymentStatus checks Midtrans status and updates local payment/booking state.
func (h *PaymentHandler) SyncPaymentStatus(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Missing id"})
		return
	}
	paymentID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid id"})
		return
	}

	payment, err := h.repo.GetPaymentByID(paymentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to fetch payment", Errors: err.Error()})
		return
	}
	if payment == nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{Success: false, Message: "Payment not found"})
		return
	}

	if err := h.syncPaymentStatus(payment); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to sync payment status", Errors: err.Error()})
		return
	}

	updated, _ := h.repo.GetPaymentByID(paymentID)
	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Payment status synced", Data: updated})
}

// MidtransNotification receives callbacks from Midtrans sandbox/production.
func (h *PaymentHandler) MidtransNotification(c *gin.Context) {
	var req midtransNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid notification", Errors: err.Error()})
		return
	}

	payment, err := h.repo.GetPaymentByReferenceNumber(strings.TrimSpace(req.OrderID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to fetch payment", Errors: err.Error()})
		return
	}
	if payment == nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{Success: false, Message: "Payment not found"})
		return
	}

	if err := h.applyNotificationStatus(payment, req); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to process notification", Errors: err.Error()})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Notification processed"})
}

// GetPayment returns payment details
func (h *PaymentHandler) GetPayment(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Missing id"})
		return
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid id"})
		return
	}

	p, err := h.repo.GetPaymentByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to fetch payment", Errors: err.Error()})
		return
	}
	if p == nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{Success: false, Message: "Payment not found"})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "OK", Data: p})
}

// ConfirmPayment marks a payment as successful and activates membership
func (h *PaymentHandler) ConfirmPayment(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Missing id"})
		return
	}
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid id"})
		return
	}

	p, err := h.repo.GetPaymentByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to fetch payment", Errors: err.Error()})
		return
	}
	if p == nil {
		c.JSON(http.StatusNotFound, utils.ApiResponse{Success: false, Message: "Payment not found"})
		return
	}

	if p.BookingID.Valid {
		now := time.Now()
		transactionID := fmt.Sprintf("TXN%d", now.Unix())
		if err := h.repo.Transaction(func(tx *gorm.DB) error {
			if err := tx.Model(&models.Payment{}).Where("id = ?", id).Updates(map[string]interface{}{
				"status":          "success",
				"transaction_id":  transactionID,
				"payment_gateway": "midtrans-sandbox",
			}).Error; err != nil {
				return err
			}

			if err := tx.Model(&models.Booking{}).Where("id = ?", p.BookingID.Int64).Updates(map[string]interface{}{
				"status":         "confirmed",
				"payment_status": "paid",
				"updated_at":     now,
			}).Error; err != nil {
				return err
			}

			return nil
		}); err != nil {
			log.Printf("ConfirmPayment transaction error: %v", err)
			c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to confirm payment", Errors: err.Error()})
			return
		}

		updatedPayment, err := h.repo.GetPaymentByID(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Payment confirmed but failed to fetch updated payment", Errors: err.Error()})
			return
		}

		c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Payment confirmed and booking updated", Data: map[string]interface{}{
			"payment":        updatedPayment,
			"payment_id":     id,
			"booking_id":     p.BookingID.Int64,
			"payment_status": "paid",
			"booking_status": "confirmed",
		}})
		return
	}

	// parse notes to get membership tier and user id
	notes := p.Notes.String
	// expected format: membership:<tier>;user:<id>
	var tier string
	var userID int
	parts := strings.Split(notes, ";")
	for _, part := range parts {
		kv := strings.SplitN(part, ":", 2)
		if len(kv) != 2 {
			continue
		}
		k := strings.TrimSpace(kv[0])
		v := strings.TrimSpace(kv[1])
		switch k {
		case "membership":
			tier = v
		case "user":
			if ui, err := strconv.Atoi(v); err == nil {
				userID = ui
			}
		}
	}

	if tier == "" || userID == 0 {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid payment notes, cannot determine membership"})
		return
	}

	meta, ok := getMembershipPurchaseMeta(tier)
	if !ok {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid membership tier in payment notes"})
		return
	}

	now := time.Now()
	expiry := now.AddDate(1, 0, 0)

	// perform transaction: update payment status, then update user & memberships
	if err := h.repo.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Payment{}).Where("id = ?", id).Updates(map[string]interface{}{"status": "success", "transaction_id": fmt.Sprintf("TXN%d", time.Now().Unix())}).Error; err != nil {
			return err
		}

		// Update user membership
		if err := tx.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
			"membership_tier":        tier,
			"membership_status":      "active",
			"membership_start_date":  now,
			"membership_expiry_date": expiry,
		}).Error; err != nil {
			return err
		}

		var membership models.Membership
		if err := tx.Where("user_id = ?", userID).First(&membership).Error; err == nil {
			return tx.Model(&membership).Updates(map[string]interface{}{
				"level_id":        meta.levelID,
				"level_name":      meta.levelName,
				"annual_spending": meta.annualSpending,
				"status":          "active",
				"joined_date":     now,
				"renewal_date":    expiry,
			}).Error
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		membership = models.Membership{
			UserID:         userID,
			LevelID:        meta.levelID,
			LevelName:      meta.levelName,
			AnnualSpending: meta.annualSpending,
			Status:         "active",
			JoinedDate:     &now,
			RenewalDate:    &expiry,
		}
		return tx.Create(&membership).Error
	}); err != nil {
		log.Printf("ConfirmPayment transaction error: %v", err)
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to confirm payment", Errors: err.Error()})
		return
	}

	updatedUser, err := repository.NewUserRepository().GetUserWithoutPassword(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Payment confirmed but failed to fetch updated user", Errors: err.Error()})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Payment confirmed and membership activated", Data: mapAuthUser(updatedUser)})
}
