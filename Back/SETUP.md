# Quick Start Guide - Go Backend

## ⚡ 5 Minute Setup

### 1. Install Dependencies
```bash
cd Back
go mod download
go mod tidy
```

### 2. Configure Database
Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=booking_hotel
JWT_SECRET=your-super-secret-key-here
SERVER_PORT=8080
GIN_MODE=debug
MIDTRANS_NOTIFICATION_URL=https://your-backend-ngrok-domain.ngrok-free.app/api/payments/midtrans/notification
```

If you use ngrok to receive Midtrans sandbox notifications, expose the backend on port `8080`. The frontend ngrok on port `3000` will not receive the webhook.

### 3. Create Database & Import Schema
```bash
# MySQL CLI
mysql -u root -p
CREATE DATABASE booking_hotel;
exit

# Import schema
mysql -u root -p booking_hotel < ../booking_hotel_complete.sql
```

### 4. Run Server
```bash
go run main.go
```

Expected output:
```
✓ Database connected successfully
✓ Server starting...
✓ Server running on http://localhost:8080
```

## 🧪 Test API

### Register User
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Doe",
    "email":"john@example.com",
    "password":"password123",
    "phone":"08123456789",
    "role":"user"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"john@example.com",
    "password":"password123"
  }'
```

Copy the `token` from response.

### Get Profile (authenticated)
```bash
curl -X GET http://localhost:8080/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### List Hotels
```bash
curl -X GET http://localhost:8080/api/hotels
```

## 📋 API Endpoints Overview

### Public (No Auth)
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/hotels` - List hotels
- `GET /api/hotels/:id` - Hotel details
- `GET /api/hotels/search?q=keyword` - Search

### Protected (Needs Token)
- `GET /api/auth/profile` - Your profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/refresh` - Get new token
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Your bookings
- `POST /api/hotels` - Create hotel (owner)
- `POST /api/hotels/:id/rooms` - Add room (owner)

### Admin (Token + Admin Role)
- `GET /api/admin/bookings` - All bookings

## 🛠️ Development Commands

```bash
# Run tests (when implemented)
go test ./...

# Build binary
go build -o booking-hotel-api main.go

# Format code
go fmt ./...

# Lint code
go vet ./...

# Check dependencies
go mod verify
```

## ❓ Troubleshooting

### "connection refused"
- Ensure MySQL is running
- Check DB credentials in `.env`
- Verify database exists: `CREATE DATABASE booking_hotel;`

### "invalid token"
- Token expired? Get new one: `POST /api/auth/refresh`
- Wrong header format? Use: `Authorization: Bearer TOKEN`

### CORS errors
- Add frontend URL to `ALLOWED_ORIGINS` in main.go

## 📚 Next Steps

1. Test all endpoints with Postman
2. Connect frontend to this backend
3. Implement payment handler
4. Add email notifications
5. Deploy to production

## 🔒 Production Checklist

- [ ] Change `GIN_MODE=release`
- [ ] Use strong JWT_SECRET
- [ ] Configure HTTPS/TLS
- [ ] Set database backups
- [ ] Add rate limiting
- [ ] Use reverse proxy (nginx)
- [ ] Enable logging to file
- [ ] Add monitoring
- [ ] Test all error scenarios
- [ ] Security audit
