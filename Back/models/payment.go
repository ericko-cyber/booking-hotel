package models

import (
	"database/sql"
	"time"
)

type Payment struct {
	ID              int            `gorm:"primaryKey" json:"id"`
	BookingID       sql.NullInt64  `json:"booking_id"`
	Amount          float64        `json:"amount"`
	PaymentMethod   sql.NullString `json:"payment_method"`
	PaymentGateway  sql.NullString `json:"payment_gateway"`
	TransactionID   sql.NullString `json:"transaction_id"`
	ReferenceNumber sql.NullString `json:"reference_number"`
	Status          string         `json:"status"`
	ProofImage      sql.NullString `json:"proof_image"`
	Notes           sql.NullString `json:"notes"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
}

// TableName specifies the table name
func (Payment) TableName() string {
	return "payments"
}
