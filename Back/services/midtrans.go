package services

import (
	"Back/models"
	"fmt"
	"math"
	"os"
	"strings"

	midtrans "github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap"
)

// MidtransService creates Snap checkout URLs for payments.
type MidtransService struct{}

// NewMidtransService creates a new Midtrans service helper.
func NewMidtransService() *MidtransService {
	return &MidtransService{}
}

func defaultEnabledPayments() []snap.SnapPaymentType {
	payments := append([]snap.SnapPaymentType{}, snap.AllSnapPaymentType...)
	return append(payments, snap.SnapPaymentType("qris"))
}

// FrontendBaseURL returns the app base URL used for Snap finish redirects.
func FrontendBaseURL() string {
	for _, key := range []string{"FRONTEND_URL", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_FRONTEND_URL"} {
		if value := strings.TrimSpace(os.Getenv(key)); value != "" {
			return strings.TrimRight(value, "/")
		}
	}

	return "http://localhost:3000"
}

// CreateCheckoutURL creates a Midtrans Snap redirect URL.
func (s *MidtransService) CreateCheckoutURL(orderID string, amount float64, itemName string, customer *midtrans.CustomerDetails, finishURL string) (string, error) {
	grossAmount := int64(math.Round(amount))
	if grossAmount <= 0 {
		return "", fmt.Errorf("invalid payment amount")
	}

	req := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  orderID,
			GrossAmt: grossAmount,
		},
		EnabledPayments: defaultEnabledPayments(),
		Items: &[]midtrans.ItemDetails{{
			ID:    orderID,
			Name:  itemName,
			Price: grossAmount,
			Qty:   1,
		}},
		CustomerDetail: customer,
	}
	if trimmedFinishURL := strings.TrimSpace(finishURL); trimmedFinishURL != "" {
		req.Callbacks = &snap.Callbacks{Finish: trimmedFinishURL}
	}

	url, err := snap.CreateTransactionUrl(req)
	if err != nil {
		return "", fmt.Errorf("midtrans checkout creation failed: %w", err)
	}

	return url, nil
}

// CustomerFromUser converts an app user into Midtrans customer details.
func CustomerFromUser(user *models.User) *midtrans.CustomerDetails {
	if user == nil {
		return nil
	}

	name := strings.TrimSpace(user.Name)
	parts := strings.Fields(name)
	firstName := name
	lastName := ""
	if len(parts) > 1 {
		firstName = parts[0]
		lastName = strings.Join(parts[1:], " ")
	}

	phone := ""
	if user.Phone.Valid {
		phone = strings.TrimSpace(user.Phone.String)
	}

	return &midtrans.CustomerDetails{
		FName: firstName,
		LName: lastName,
		Email: user.Email,
		Phone: phone,
	}
}
