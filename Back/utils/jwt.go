package utils

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt"
)

type Claims struct {
	ID    int    `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
	jwt.StandardClaims
}

// GenerateToken creates a JWT token for a user
func GenerateToken(id int, email, name, role string) (string, error) {
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		secretKey = "default-secret-key"
	}

	expiryTime := time.Now().Add(24 * time.Hour) // Default 24 hours

	claims := Claims{
		ID:    id,
		Email: email,
		Name:  name,
		Role:  role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expiryTime.Unix(),
			IssuedAt:  time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// VerifyToken validates and parses a JWT token
func VerifyToken(tokenString string) (*Claims, error) {
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		secretKey = "default-secret-key"
	}

	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

// RefreshToken generates a new token based on existing claims
func RefreshToken(claims *Claims) (string, error) {
	claims.StandardClaims.ExpiresAt = time.Now().Add(24 * time.Hour).Unix()
	claims.StandardClaims.IssuedAt = time.Now().Unix()

	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		secretKey = "default-secret-key"
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
