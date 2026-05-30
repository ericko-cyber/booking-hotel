package config

import (
	"log"
	"os"
	"strings"

	midtrans "github.com/midtrans/midtrans-go"
)

// InitMidtrans configures Midtrans for the current environment.
func InitMidtrans() {
	serverKey := strings.TrimSpace(os.Getenv("MIDTRANS_SERVER_KEY"))
	clientKey := strings.TrimSpace(os.Getenv("MIDTRANS_CLIENT_KEY"))
	if serverKey == "" {
		log.Println("warning: MIDTRANS_SERVER_KEY is not set; checkout creation will be unavailable")
		return
	}

	midtrans.ServerKey = serverKey
	midtrans.ClientKey = clientKey

	mode := strings.ToLower(strings.TrimSpace(os.Getenv("MIDTRANS_ENV")))
	switch mode {
	case "production", "prod":
		midtrans.Environment = midtrans.Production
	default:
		midtrans.Environment = midtrans.Sandbox
		mode = "sandbox"
	}

	notificationURL := strings.TrimSpace(os.Getenv("MIDTRANS_NOTIFICATION_URL"))
	if notificationURL != "" {
		midtrans.SetPaymentOverrideNotification(notificationURL)
		log.Printf("✓ Midtrans notification URL overridden: %s", notificationURL)
	} else {
		log.Println("info: MIDTRANS_NOTIFICATION_URL is not set; Midtrans webhook will rely on dashboard configuration")
	}

	log.Printf("✓ Midtrans configured in %s mode", mode)
}
