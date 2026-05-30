package repository

import (
	"Back/config"
	"Back/models"
	"database/sql"
	"errors"

	"gorm.io/gorm"
)

// PaymentRepository handles payment DB operations
type PaymentRepository struct {
	db *gorm.DB
}

// NewPaymentRepository creates a new payment repository
func NewPaymentRepository() *PaymentRepository {
	return &PaymentRepository{db: config.GetDB()}
}

// CreatePayment inserts a new payment record
func (r *PaymentRepository) CreatePayment(payment *models.Payment) error {
	if err := r.db.Create(payment).Error; err != nil {
		return err
	}
	return nil
}

// GetPaymentByID returns a payment by its ID
func (r *PaymentRepository) GetPaymentByID(id int) (*models.Payment, error) {
	var p models.Payment
	if err := r.db.First(&p, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

// UpdatePaymentStatus updates status and optional transaction id for a payment
func (r *PaymentRepository) UpdatePaymentStatus(id int, status string, transactionID *string) error {
	updates := map[string]interface{}{"status": status}
	if transactionID != nil {
		updates["transaction_id"] = *transactionID
	}
	return r.db.Model(&models.Payment{}).Where("id = ?", id).Updates(updates).Error
}

// UpdatePaymentFields updates arbitrary fields for a payment.
func (r *PaymentRepository) UpdatePaymentFields(id int, updates map[string]interface{}) error {
	return r.db.Model(&models.Payment{}).Where("id = ?", id).Updates(updates).Error
}

// GetPaymentByReferenceNumber retrieves a payment by its Midtrans order/reference number.
func (r *PaymentRepository) GetPaymentByReferenceNumber(referenceNumber string) (*models.Payment, error) {
	var p models.Payment
	if err := r.db.Where("reference_number = ?", referenceNumber).First(&p).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

// Transaction runs the provided function inside a DB transaction
func (r *PaymentRepository) Transaction(fn func(tx *gorm.DB) error) error {
	return r.db.Transaction(fn)
}

// NextPaymentID returns next available id (max(id)+1) for payments table
func (r *PaymentRepository) NextPaymentID() (int, error) {
	var maxID sql.NullInt64
	row := r.db.Raw("SELECT MAX(id) as max_id FROM payments").Row()
	if err := row.Scan(&maxID); err != nil {
		return 0, err
	}
	next := 1
	if maxID.Valid {
		next = int(maxID.Int64) + 1
	}
	return next, nil
}

// GetPaymentsByBookingID returns all payments for a booking
func (r *PaymentRepository) GetPaymentsByBookingID(bookingID int) ([]models.Payment, error) {
	var payments []models.Payment
	if err := r.db.Where("booking_id = ?", bookingID).Order("created_at DESC").Find(&payments).Error; err != nil {
		return nil, err
	}
	return payments, nil
}

// GetLatestPaymentByBookingID returns the most recent payment for a booking
func (r *PaymentRepository) GetLatestPaymentByBookingID(bookingID int) (*models.Payment, error) {
	var payment models.Payment
	if err := r.db.Where("booking_id = ?", bookingID).Order("created_at DESC").First(&payment).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &payment, nil
}
