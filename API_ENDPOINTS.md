# Booking Hotel - API Endpoints Reference

Dokumentasi lengkap API endpoints yang diperlukan untuk menghubungkan frontend dengan backend.

---

## 📋 Table of Contents

1. [Authentication](#-authentication)
2. [Users](#-users)
3. [Hotels](#-hotels)
4. [Rooms](#-rooms)
5. [Bookings](#-bookings)
6. [Payments](#-payments)
7. [Vouchers](#-vouchers)
8. [Memberships](#-memberships)
9. [Reviews](#-reviews)
10. [Admin Analytics](#-admin-analytics)

---

## 🔐 Authentication

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response 200:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Sophie Laurent",
    "email": "sophie@example.com",
    "role": "user"
  }
}
```

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "Sophie Laurent",
  "email": "sophie@example.com",
  "password": "password123",
  "phone": "62812345678",
  "role": "user"
}

Response 201:
{
  "success": true,
  "message": "Registration successful",
  "user": { ... }
}
```

### Logout
```
POST /api/auth/logout
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Get Current User
```
GET /api/auth/me
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "user": { ... }
}
```

---

## 👥 Users

### Get User Profile
```
GET /api/users/:id
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Sophie Laurent",
    "email": "sophie@example.com",
    "phone": "62812345678",
    "address": "...",
    "city": "Jakarta",
    "status": "active",
    "role": "user",
    "profile_image": "https://...",
    "created_at": "2023-09-12T00:00:00Z"
  }
}
```

### Update User Profile
```
PUT /api/users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Sophie Laurent",
  "phone": "62812345678",
  "address": "Jl. Sudirman No. 123",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postal_code": "12190"
}

Response 200:
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { ... }
}
```

### Upload Profile Picture
```
POST /api/users/:id/upload-profile
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: <image_file>

Response 200:
{
  "success": true,
  "message": "Profile picture uploaded",
  "profile_image": "https://..."
}
```

### Change Password
```
POST /api/users/:id/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_password": "oldpass123",
  "new_password": "newpass123"
}

Response 200:
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 🏨 Hotels

### Get All Hotels (Public Listing)
```
GET /api/hotels?status=approved&page=1&limit=12&sort=rating
Query Params:
  - status: approved, pending, rejected, all (default: approved)
  - page: page number (default: 1)
  - limit: items per page (default: 12)
  - sort: rating, price, newest (default: rating)
  - location: filter by location
  - min_price, max_price: price range
  - search: keyword search

Response 200:
{
  "success": true,
  "data": {
    "hotels": [
      {
        "id": 1,
        "name": "The Lumina Heights",
        "location": "Paris, France",
        "address": "Rue de Rivoli 42",
        "rating": 4.9,
        "review_count": 312,
        "price": 850,
        "image": "https://...",
        "amenities": ["pool", "spa", "gym"],
        "status": "approved"
      },
      ...
    ],
    "total": 45,
    "pages": 4,
    "current_page": 1
  }
}
```

### Get Hotel Details
```
GET /api/hotels/:id

Response 200:
{
  "success": true,
  "hotel": {
    "id": 1,
    "name": "The Lumina Heights",
    "owner_id": 3,
    "location": "Paris, France",
    "address": "Rue de Rivoli 42, Paris, France",
    "description": "Perched above the Seine with panoramic views...",
    "phone": "+33 1 23456789",
    "email": "contact@lumina.fr",
    "website": "https://luminaheights.com",
    "rating": 4.9,
    "review_count": 312,
    "status": "approved",
    "amenities": ["pool", "spa", "gym", "concierge"],
    "rooms": [
      {
        "id": 1001,
        "name": "Classic Room",
        "price": 650,
        "capacity": 2,
        "available": 3
      },
      ...
    ],
    "reviews": [
      {
        "id": 1,
        "user_name": "Sophie Laurent",
        "rating": 5,
        "comment": "Excellent stay!",
        "date": "2024-05-06"
      },
      ...
    ]
  }
}
```

### Create Hotel (Owner)
```
POST /api/hotels
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Luxury Hotel",
  "location": "Ubud, Bali",
  "address": "Jl. Monkey Forest, Ubud",
  "description": "...",
  "phone": "+62 361 123456",
  "email": "contact@newhotel.com",
  "amenities": ["pool", "spa", "wifi"]
}

Response 201:
{
  "success": true,
  "message": "Hotel created successfully (pending approval)",
  "hotel": { ... }
}
```

### Update Hotel (Owner)
```
PUT /api/hotels/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "...",
  "phone": "+62 361 999999"
}

Response 200:
{
  "success": true,
  "message": "Hotel updated successfully",
  "hotel": { ... }
}
```

### Get Hotels by Owner
```
GET /api/owner/hotels
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "hotels": [
    {
      "id": 101,
      "name": "The Lumina Heights",
      "status": "approved",
      "rooms": 12,
      "total_bookings": 48,
      "revenue": 38400
    },
    ...
  ]
}
```

### Approve/Reject Hotel (Admin)
```
PATCH /api/admin/hotels/:id/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "approved",
  "notes": "Hotel meets all requirements"
}

Response 200:
{
  "success": true,
  "message": "Hotel status updated",
  "hotel": { ... }
}
```

---

## 🛏️ Rooms

### Get Rooms by Hotel
```
GET /api/hotels/:hotel_id/rooms

Response 200:
{
  "success": true,
  "rooms": [
    {
      "id": 1001,
      "hotel_id": 101,
      "name": "Classic Room",
      "description": "...",
      "capacity": 2,
      "price": 650,
      "stock": 3,
      "available": 2,
      "facilities": ["WiFi", "AC", "Minibar"],
      "room_type": "double",
      "images": ["https://...", "https://..."],
      "status": "available"
    },
    ...
  ]
}
```

### Get Available Rooms
```
GET /api/hotels/:hotel_id/rooms/available?check_in=2024-05-02&check_out=2024-05-06

Response 200:
{
  "success": true,
  "rooms": [
    {
      "id": 1001,
      "name": "Classic Room",
      "price": 650,
      "capacity": 2,
      "available_count": 2,
      "images": [...],
      "facilities": [...]
    },
    ...
  ]
}
```

### Create Room (Owner)
```
POST /api/hotels/:hotel_id/rooms
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Deluxe Suite",
  "description": "...",
  "capacity": 4,
  "price": 1200,
  "stock": 2,
  "facilities": ["WiFi", "AC", "Jacuzzi", "Balcony"],
  "room_type": "deluxe"
}

Response 201:
{
  "success": true,
  "message": "Room created successfully",
  "room": { ... }
}
```

### Update Room (Owner)
```
PUT /api/rooms/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Deluxe Suite",
  "price": 1300,
  "stock": 3,
  "status": "available"
}

Response 200:
{
  "success": true,
  "message": "Room updated successfully",
  "room": { ... }
}
```

### Upload Room Images
```
POST /api/rooms/:id/images
Authorization: Bearer {token}
Content-Type: multipart/form-data

files: [<image1>, <image2>, <image3>]
captions: ["Main view", "Bathroom", "Balcony"]

Response 200:
{
  "success": true,
  "message": "Images uploaded successfully",
  "images": [
    {
      "id": 1,
      "image_url": "https://...",
      "caption": "Main view"
    },
    ...
  ]
}
```

---

## 📅 Bookings

### Create Booking
```
POST /api/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "room_id": 1001,
  "hotel_id": 101,
  "check_in": "2024-05-02",
  "check_out": "2024-05-06",
  "guests_count": 2,
  "guest_name": "Sophie Laurent",
  "guest_email": "sophie@example.com",
  "guest_phone": "62812345678",
  "special_notes": "Early check-in needed",
  "voucher_code": "WELCOME2024"
}

Response 201:
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "id": 1,
    "booking_code": "BK-001",
    "hotel": "The Lumina Heights",
    "room": "Classic Room",
    "check_in": "2024-05-02",
    "check_out": "2024-05-06",
    "nights": 4,
    "room_rate": 650,
    "subtotal": 2600,
    "tax": 260,
    "discount": 0,
    "total": 2860,
    "status": "pending",
    "created_at": "2024-04-28T10:30:00Z"
  }
}
```

### Get User Bookings
```
GET /api/bookings
Authorization: Bearer {token}
Query Params:
  - status: pending, confirmed, checked-in, checked-out, cancelled
  - limit: default 10
  - offset: pagination offset

Response 200:
{
  "success": true,
  "bookings": [
    {
      "id": 1,
      "booking_code": "BK-001",
      "hotel": "The Lumina Heights",
      "room": "Classic Room",
      "check_in": "2024-05-02",
      "check_out": "2024-05-06",
      "nights": 4,
      "total": 2860,
      "status": "confirmed",
      "payment_status": "paid",
      "created_at": "2024-04-28T10:30:00Z"
    },
    ...
  ],
  "total": 8
}
```

### Get Booking Detail
```
GET /api/bookings/:id
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "booking": {
    "id": 1,
    "booking_code": "BK-001",
    "hotel": { ... },
    "room": { ... },
    "check_in": "2024-05-02",
    "check_out": "2024-05-06",
    "guest_name": "Sophie Laurent",
    "guest_email": "sophie@example.com",
    "guest_phone": "62812345678",
    "subtotal": 2600,
    "tax": 260,
    "voucher_discount": 0,
    "membership_discount": 0,
    "total": 2860,
    "status": "confirmed",
    "payment_status": "paid",
    "special_notes": "Early check-in needed",
    "created_at": "2024-04-28T10:30:00Z"
  }
}
```

### Cancel Booking
```
PATCH /api/bookings/:id/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Change of plans"
}

Response 200:
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": { ... }
}
```

### Get Hotel Bookings (Owner)
```
GET /api/owner/hotels/:hotel_id/bookings
Authorization: Bearer {token}
Query Params:
  - status: all, confirmed, checked-in, checked-out
  - date_from, date_to: date range filter

Response 200:
{
  "success": true,
  "bookings": [
    {
      "id": 1,
      "booking_code": "BK-001",
      "guest": "Sophie Laurent",
      "room": "Classic Room",
      "check_in": "2024-05-02",
      "check_out": "2024-05-06",
      "total": 2860,
      "status": "confirmed"
    },
    ...
  ]
}
```

### Get All Bookings (Admin)
```
GET /api/admin/bookings
Authorization: Bearer {admin_token}
Query Params:
  - status, date_from, date_to, hotel_id, user_id

Response 200:
{
  "success": true,
  "bookings": [...]
}
```

---

## 💳 Payments

### Create Payment
```
POST /api/bookings/:booking_id/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 2860,
  "payment_method": "credit_card",
  "payment_gateway": "stripe",
  "reference_number": "INV-2024-001"
}

Response 201:
{
  "success": true,
  "message": "Payment initiated",
  "payment": {
    "id": 1,
    "booking_id": 1,
    "amount": 2860,
    "status": "pending",
    "payment_method": "credit_card",
    "created_at": "2024-04-28T10:35:00Z"
  }
}
```

### Verify Payment
```
POST /api/payments/:id/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "transaction_id": "txn_1234567890",
  "proof_image": "https://..."
}

Response 200:
{
  "success": true,
  "message": "Payment verified",
  "payment": {
    "id": 1,
    "status": "success"
  }
}
```

### Get Payment Details
```
GET /api/payments/:id
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "payment": {
    "id": 1,
    "booking_id": 1,
    "amount": 2860,
    "payment_method": "credit_card",
    "status": "success",
    "transaction_id": "txn_1234567890",
    "created_at": "2024-04-28T10:35:00Z"
  }
}
```

### Request Refund
```
POST /api/payments/:id/refund
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Cancellation request"
}

Response 200:
{
  "success": true,
  "message": "Refund initiated",
  "payment": {
    "status": "refunded"
  }
}
```

---

## 🎟️ Vouchers

### Get Available Vouchers
```
GET /api/vouchers?scope=global&status=active

Response 200:
{
  "success": true,
  "vouchers": [
    {
      "id": 1,
      "code": "WELCOME2024",
      "type": "percent",
      "value": 10,
      "min_booking": 0,
      "expiry_date": "2024-12-31",
      "description": "10% off for new members"
    },
    ...
  ]
}
```

### Validate Voucher
```
POST /api/vouchers/validate
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "WELCOME2024",
  "booking_amount": 2600,
  "hotel_id": 101
}

Response 200:
{
  "success": true,
  "voucher": {
    "code": "WELCOME2024",
    "type": "percent",
    "value": 10,
    "discount_amount": 260,
    "valid": true
  }
}

Response 400:
{
  "success": false,
  "message": "Voucher expired or invalid"
}
```

### Apply Voucher to Booking
```
POST /api/bookings/:booking_id/apply-voucher
Authorization: Bearer {token}
Content-Type: application/json

{
  "voucher_code": "WELCOME2024"
}

Response 200:
{
  "success": true,
  "message": "Voucher applied",
  "booking": {
    "subtotal": 2600,
    "voucher_discount": 260,
    "total": 2340
  }
}
```

### Create Voucher (Admin/Owner)
```
POST /api/vouchers
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "SUMMER2024",
  "type": "percent",
  "value": 15,
  "scope": "global",
  "start_date": "2024-06-01",
  "expiry_date": "2024-08-31",
  "usage_limit": 100,
  "description": "Summer promotion - 15% off"
}

Response 201:
{
  "success": true,
  "message": "Voucher created successfully",
  "voucher": { ... }
}
```

---

## 🎖️ Memberships

### Get User Membership
```
GET /api/memberships
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "membership": {
    "id": 1,
    "user_id": 1,
    "level": "Silver",
    "discount": 5,
    "annual_spending": 5500000,
    "min_spending_for_next": 8000000,
    "status": "active",
    "joined_date": "2023-10-01",
    "benefits": [
      "5% booking discount",
      "Priority customer support",
      "Early access to new properties"
    ]
  }
}
```

### Get Membership Levels
```
GET /api/membership-levels

Response 200:
{
  "success": true,
  "levels": [
    {
      "id": 1,
      "name": "Basic",
      "discount": 0,
      "min_spending": 0,
      "benefits": ["Access to all listings", "Standard booking support"]
    },
    {
      "id": 2,
      "name": "Silver",
      "discount": 5,
      "min_spending": 3000000,
      "benefits": ["5% booking discount", "Priority support", "Early access"]
    },
    ...
  ]
}
```

---

## ⭐ Reviews

### Create Review
```
POST /api/bookings/:booking_id/review
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 5,
  "cleanliness_rating": 5,
  "service_rating": 4,
  "comfort_rating": 5,
  "value_rating": 4,
  "title": "Excellent Stay!",
  "comment": "Amazing experience at this hotel. Staff was very helpful..."
}

Response 201:
{
  "success": true,
  "message": "Review submitted successfully",
  "review": { ... }
}
```

### Get Hotel Reviews
```
GET /api/hotels/:hotel_id/reviews?status=approved&page=1&limit=10&sort=recent

Response 200:
{
  "success": true,
  "reviews": [
    {
      "id": 1,
      "user_name": "Sophie Laurent",
      "rating": 5,
      "cleanliness": 5,
      "service": 4,
      "comfort": 5,
      "value": 4,
      "title": "Excellent Stay!",
      "comment": "...",
      "helpful_count": 24,
      "date": "2024-05-10"
    },
    ...
  ],
  "total": 312,
  "avg_rating": 4.9
}
```

### Update Review
```
PUT /api/reviews/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated review..."
}

Response 200:
{
  "success": true,
  "message": "Review updated successfully",
  "review": { ... }
}
```

### Mark Review as Helpful
```
POST /api/reviews/:id/helpful
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "helpful_count": 25
}
```

---

## 📊 Admin Analytics

### Get Platform Analytics
```
GET /api/admin/analytics?period=12m

Response 200:
{
  "success": true,
  "analytics": {
    "overview": {
      "total_revenue": 1234567890,
      "total_bookings": 1245,
      "total_users": 8420,
      "active_hotels": 45,
      "conversion_rate": 68
    },
    "revenue_trend": [
      { "month": "Jan", "revenue": 48400, "bookings": 38, "users": 210 },
      { "month": "Feb", "revenue": 62100, "bookings": 51, "users": 285 },
      ...
    ],
    "hotel_performance": [
      {
        "id": 101,
        "name": "The Lumina Heights",
        "revenue": 38400,
        "bookings": 12,
        "rating": 4.9
      },
      ...
    ],
    "top_users": [
      {
        "id": 5,
        "name": "Marco Rossi",
        "bookings": 12,
        "total_spent": 45000000
      },
      ...
    ]
  }
}
```

### Get Admin Dashboard Data
```
GET /api/admin/dashboard

Response 200:
{
  "success": true,
  "dashboard": {
    "stats": {
      "total_users": 8420,
      "total_hotels": 45,
      "pending_approvals": 3,
      "total_revenue": 1234567890
    },
    "recent_bookings": [
      {
        "booking_code": "BK-001",
        "guest": "Sophie Laurent",
        "hotel": "The Lumina Heights",
        "total": 2860,
        "status": "confirmed"
      },
      ...
    ],
    "pending_hotels": [
      {
        "id": 103,
        "name": "Monte Rosa Chalet",
        "owner": "James Richardson",
        "submitted": "2024-03-20"
      },
      ...
    ]
  }
}
```

### Get Admin Users List
```
GET /api/admin/users?role=all&status=active&page=1&limit=20

Response 200:
{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "Sophie Laurent",
      "email": "sophie@example.com",
      "role": "user",
      "status": "active",
      "bookings": 8,
      "joined": "2023-09-12"
    },
    ...
  ],
  "total": 8420
}
```

### Suspend User (Admin)
```
PATCH /api/admin/users/:id/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "suspended",
  "reason": "Fraudulent activity detected"
}

Response 200:
{
  "success": true,
  "message": "User suspended",
  "user": { ... }
}
```

---

## 🔄 Error Responses

Semua API errors mengikuti format konsisten:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Email already exists",
      "phone": "Invalid phone number"
    }
  }
}
```

### Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | Token invalid/expired |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Duplicate/conflicting resource |
| RATE_LIMIT | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

---

## 🔑 Authentication Header

Semua endpoint yang memerlukan autentikasi harus menyertakan header:

```
Authorization: Bearer {jwt_token}
```

Token diperoleh dari endpoint login dan berlaku selama 7 hari.

---

## 📝 Pagination

Untuk endpoint dengan response list, gunakan query parameters:

```
?page=1&limit=20&sort=newest
```

Response akan include:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 245,
    "pages": 13
  }
}
```

---

## 🧪 Testing dengan Postman

Import collection dari endpoint base:
```
GET /api/docs
```

Atau buat workspace baru dengan collection dari dokumentasi ini.

**Base URL (Development):**
```
http://localhost:3000/api
```

**Base URL (Production):**
```
https://api.stayease.com/api
```

