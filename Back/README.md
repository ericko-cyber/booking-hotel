# Go Backend Setup - Booking Hotel Platform

## Project Structure
```
Back/
├── config/          # Database configuration
├── models/          # Data models/structs
├── repository/      # Data access layer (GORM)
├── handlers/        # API handlers
├── middleware/      # Auth & CORS middleware
├── utils/           # JWT, password hashing, helpers
├── go.mod           # Go module
├── main.go          # Entry point
└── .env             # Environment variables
```

## Prerequisites
- Go 1.25.0+
- MySQL database
- Git (for version control)

## Installation & Setup

### 1. Install Dependencies
```bash
cd Back
go mod download
go mod tidy
```

### 2. Configure Database
Create a MySQL database:
```sql
CREATE DATABASE booking_hotel;
```

Update `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=booking_hotel
JWT_SECRET=your-secret-key-change-this
SERVER_PORT=8080
MIDTRANS_NOTIFICATION_URL=https://your-backend-ngrok-domain.ngrok-free.app/api/payments/midtrans/notification
```

If you use ngrok for Midtrans sandbox testing, point it to the backend port (`8080`), not the frontend port (`3000`). The webhook endpoint is `POST /api/payments/midtrans/notification`.

### 3. Import Database Schema
```bash
mysql -u root -p booking_hotel < ../booking_hotel_complete.sql
```

### 4. Run the Server
```bash
go run main.go
```

Server will start on `http://localhost:8080`

## API Endpoints

### Authentication (Public)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Authentication (Protected)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Hotels (Public)
- `GET /api/hotels` - List all approved hotels
- `GET /api/hotels/:id` - Get hotel details
- `GET /api/hotels/search?q=keyword` - Search hotels

### Hotels (Protected - Owner)
- `POST /api/hotels` - Create new hotel
- `PUT /api/hotels/:id` - Update hotel
- `DELETE /api/hotels/:id` - Delete hotel

### Rooms (Protected - Owner)
- `POST /api/hotels/:hotel_id/rooms` - Create room
- `GET /api/hotels/:hotel_id/rooms` - List rooms
- `GET /api/rooms/:id` - Get room details
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Bookings (Protected - Guest)
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get my bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/status` - Update booking status
- `DELETE /api/bookings/:id/cancel` - Cancel booking

### Admin Routes (Protected - Admin)
- `GET /api/admin/bookings` - List all bookings
- `GET /api/admin/users` - List all users (TODO)
- `PUT /api/admin/hotels/:id/approve` - Approve hotel (TODO)

## Request Examples

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123","role":"user"}'
```

### Create Hotel (Protected)
```bash
curl -X POST http://localhost:8080/api/hotels \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hotel Name","city":"Jakarta","description":"...'
```

## Key Features

✅ **Database**: MySQL with GORM ORM
✅ **Authentication**: JWT tokens with bcrypt password hashing
✅ **Authorization**: Role-based access control (user, owner, admin)
✅ **API Structure**: RESTful with Gin framework
✅ **Error Handling**: Global error middleware
✅ **CORS**: Cross-origin requests enabled
✅ **Pagination**: All list endpoints support pagination
✅ **Logging**: Request logging middleware

## TODO Items
- [ ] Implement User Management Handler
- [ ] Implement Payment Handler
- [ ] Implement Review Handler
- [ ] Implement Voucher Handler
- [ ] Implement Membership Handler
- [ ] Add input validation (struct tags)
- [ ] Add rate limiting
- [ ] Add caching (Redis)
- [ ] Add logging to file
- [ ] Add database migrations
- [ ] Implement hotel approval workflow
- [ ] Add email notifications
- [ ] Add file upload for images
- [ ] Write unit tests
- [ ] Write integration tests

## Environment Variables Reference
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=booking_hotel

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRY=24h

# Server
SERVER_PORT=8080
GIN_MODE=debug

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Troubleshooting

### Database Connection Error
- Check MySQL is running: `mysql -u root -p`
- Verify `.env` file has correct credentials
- Ensure database exists: `CREATE DATABASE booking_hotel;`

### JWT Token Issues
- Token must be in header: `Authorization: Bearer <token>`
- Check JWT_SECRET in `.env` is set
- Token expires after 24 hours, use `/api/auth/refresh` to get new token

### CORS Issues
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
- Frontend must send requests with proper headers

## Development Tips
1. Set `GIN_MODE=debug` in `.env` for development
2. Check logs for detailed error messages
3. Use Postman/Insomnia for API testing
4. Database schema is auto-synced via migration (if implemented)

## Production Deployment
1. Change `GIN_MODE=release`
2. Use strong `JWT_SECRET`
3. Configure proper database backups
4. Use environment-specific `.env` files
5. Enable HTTPS/TLS
6. Set rate limiting
7. Use reverse proxy (nginx)
