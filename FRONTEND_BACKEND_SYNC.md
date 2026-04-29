# Frontend-Backend Synchronization Guide

## ✅ Synchronization Status

Frontend dan Backend telah disinkronkan dengan konfigurasi API yang lengkap.

---

## 📁 File Structure yang Dibuat

### Frontend Services (`Front/booking-hotel/services/`)
- **`authService.js`** - Menangani authentication (login, register, logout)
- **`hotelService.js`** - Menangani hotel operations
- **`roomService.js`** - Menangani room operations
- **`bookingService.js`** - Menangani booking operations
- **`userService.js`** - Menangani user profile operations
- **`adminService.js`** - Menangani admin operations

### Frontend Libraries (`Front/booking-hotel/lib/`)
- **`api.js`** - Axios instance dengan interceptor untuk authentication

### Environment Setup
- **`.env.example`** - Template environment variables
- **`.env.local`** - Local environment configuration (sudah set)

---

## 🔄 API Endpoints yang Tersedia

### Authentication (Public)
```
POST /api/auth/login          - Login user
POST /api/auth/register       - Register new user
```

### Authentication (Protected)
```
GET  /api/auth/profile        - Get user profile
PUT  /api/auth/profile        - Update user profile
POST /api/auth/refresh        - Refresh JWT token
```

### Hotels (Public)
```
GET  /api/hotels              - List all hotels with pagination
GET  /api/hotels/:id          - Get hotel details
GET  /api/hotels/search       - Search hotels
GET  /api/hotels/:id/rooms    - Get rooms of a hotel
```

### Hotels (Protected)
```
POST   /api/hotels            - Create hotel (owner)
PUT    /api/hotels/:id        - Update hotel (owner)
DELETE /api/hotels/:id        - Delete hotel (owner)
POST   /api/hotels/:id/rooms  - Create room (owner)
```

### Rooms (Protected)
```
GET    /api/rooms/:id         - Get room details
PUT    /api/rooms/:id         - Update room
DELETE /api/rooms/:id         - Delete room
```

### Bookings (Protected)
```
POST   /api/bookings          - Create booking
GET    /api/bookings          - Get user's bookings
GET    /api/bookings/:id      - Get booking details
PUT    /api/bookings/:id/status - Update booking status
DELETE /api/bookings/:id/cancel - Cancel booking
```

### Admin (Protected + Admin Role Required)
```
GET /api/admin/bookings       - Get all bookings (admin)
GET /api/admin/users          - Get all users (admin)
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd Front/booking-hotel
npm install
```

Ini akan menginstall axios dan semua dependencies lainnya.

### 2. Konfigurasi Environment
File `.env.local` sudah disetting dengan default:
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

Ubah jika backend berjalan di port lain.

### 3. Jalankan Frontend
```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

### 4. Pastikan Backend Berjalan
```bash
cd Back
go run main.go
```

Backend harus berjalan di `http://localhost:8080`

---

## 📝 Penggunaan di Components

### Contoh Login Component:
```javascript
import { authService } from '../../services/authService'

const handleLogin = async () => {
  try {
    const result = await authService.login(email, password)
    // Token auto-saved di localStorage
    router.push('/dashboard')
  } catch (error) {
    console.error('Login failed:', error)
  }
}
```

### Contoh Hotel Listing:
```javascript
import { hotelService } from '../../services/hotelService'

useEffect(() => {
  const fetchHotels = async () => {
    try {
      const hotels = await hotelService.getAllHotels({ page: 1, page_size: 10 })
      setHotels(hotels)
    } catch (error) {
      console.error('Failed to fetch hotels:', error)
    }
  }
  fetchHotels()
}, [])
```

---

## 🔒 Token Management

- Token disimpan otomatis di `localStorage` setelah login
- Setiap request otomatis menambahkan token di header: `Authorization: Bearer {token}`
- Jika token expired (401), user auto-redirect ke `/login`

---

## 🐛 Troubleshooting

### API Connection Error
1. Pastikan backend running di port 8080
2. Cek file `.env.local` sudah benar
3. Cek CORS middleware di backend sudah enable

### CORS Error
Backend sudah dikonfigurasi dengan CORS yang benar:
- Allow all origins (`*`)
- Allow credentials
- Allow semua methods (POST, GET, PUT, DELETE, PATCH)

### 401 Unauthorized
1. Pastikan token tersimpan di localStorage
2. Refresh token expired, coba login ulang
3. Cek backend JWT configuration

---

## 📦 Components yang Sudah Updated

- ✅ `components/auth/Login.js` - Real API calls
- ✅ `components/auth/Register.js` - Real API calls
- ⏳ Hotel listing components - Ready untuk implementasi
- ⏳ Booking components - Ready untuk implementasi
- ⏳ Admin components - Ready untuk implementasi

---

## 📋 Next Steps

1. **Update Hotel Listing Components** - Use `hotelService.getAllHotels()`
2. **Update Booking Components** - Use `bookingService.createBooking()`
3. **Update Admin Components** - Use `adminService` functions
4. **Add Error Handling** - Display errors ke user
5. **Add Loading States** - Show loading indicators
6. **Test Integration** - Test semua endpoints

---

## 🔐 Response Format dari Backend

Semua response dari backend mengikuti format:
```json
{
  "success": true/false,
  "message": "string",
  "data": {...}
}
```

Service sudah handle format ini, jadi components bisa langsung pakai `data`.

---

**Generated:** April 2025
**Status:** Frontend-Backend Synchronized ✅
