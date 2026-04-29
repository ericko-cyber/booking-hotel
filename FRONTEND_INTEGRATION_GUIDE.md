# Frontend-Backend Integration Guide

Panduan menghubungkan komponen React/Next.js dengan database melalui API.

---

## 🔌 Setup API Client

### 1. Create API Service (`lib/api.js`)

```javascript
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error.message)
  }
)

export default api
```

---

## 👤 Authentication Service

### 2. Auth Service (`services/authService.js`)

```javascript
import api from '../lib/api'

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    if (response.token) {
      localStorage.setItem('token', response.token)
    }
    return response.user
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data)
    if (response.token) {
      localStorage.setItem('token', response.token)
    }
    return response.user
  },

  logout: () => {
    localStorage.removeItem('token')
  },

  getCurrentUser: async () => {
    return await api.get('/auth/me')
  },
}
```

---

## 🏨 Hotels Service

### 3. Hotels Service (`services/hotelService.js`)

```javascript
import api from '../lib/api'

export const hotelService = {
  // Get all approved hotels with filters
  getAllHotels: async (params = {}) => {
    const response = await api.get('/hotels', { params })
    return response.data
  },

  // Get specific hotel details
  getHotelById: async (id) => {
    const response = await api.get(`/hotels/${id}`)
    return response.hotel
  },

  // Get available rooms for date range
  getAvailableRooms: async (hotelId, checkIn, checkOut) => {
    const response = await api.get(
      `/hotels/${hotelId}/rooms/available`,
      { params: { check_in: checkIn, check_out: checkOut } }
    )
    return response.rooms
  },

  // Owner: Get own hotels
  getOwnerHotels: async () => {
    const response = await api.get('/owner/hotels')
    return response.hotels
  },

  // Owner: Create new hotel
  createHotel: async (data) => {
    const response = await api.post('/hotels', data)
    return response.hotel
  },

  // Owner: Update hotel
  updateHotel: async (id, data) => {
    const response = await api.put(`/hotels/${id}`, data)
    return response.hotel
  },

  // Admin: Get all hotels (including pending)
  getAllHotelsAdmin: async (params = {}) => {
    const response = await api.get('/admin/hotels', { params })
    return response.data
  },

  // Admin: Approve/reject hotel
  updateHotelStatus: async (id, status, notes) => {
    const response = await api.patch(`/admin/hotels/${id}/status`, { status, notes })
    return response.hotel
  },
}
```

---

## 🛏️ Rooms Service

### 4. Rooms Service (`services/roomService.js`)

```javascript
import api from '../lib/api'

export const roomService = {
  // Get rooms for hotel
  getRooms: async (hotelId) => {
    const response = await api.get(`/hotels/${hotelId}/rooms`)
    return response.rooms
  },

  // Owner: Create room
  createRoom: async (hotelId, data) => {
    const response = await api.post(`/hotels/${hotelId}/rooms`, data)
    return response.room
  },

  // Owner: Update room
  updateRoom: async (roomId, data) => {
    const response = await api.put(`/rooms/${roomId}`, data)
    return response.room
  },

  // Owner: Upload room images
  uploadRoomImages: async (roomId, formData) => {
    const response = await api.post(`/rooms/${roomId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.images
  },
}
```

---

## 📅 Bookings Service

### 5. Bookings Service (`services/bookingService.js`)

```javascript
import api from '../lib/api'

export const bookingService = {
  // Create new booking
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData)
    return response.booking
  },

  // Get user bookings
  getUserBookings: async (params = {}) => {
    const response = await api.get('/bookings', { params })
    return response.bookings
  },

  // Get booking details
  getBookingDetail: async (id) => {
    const response = await api.get(`/bookings/${id}`)
    return response.booking
  },

  // Cancel booking
  cancelBooking: async (id, reason) => {
    const response = await api.patch(`/bookings/${id}/cancel`, { reason })
    return response.booking
  },

  // Owner: Get bookings for their hotels
  getHotelBookings: async (hotelId, params = {}) => {
    const response = await api.get(`/owner/hotels/${hotelId}/bookings`, { params })
    return response.bookings
  },

  // Admin: Get all platform bookings
  getAllBookings: async (params = {}) => {
    const response = await api.get('/admin/bookings', { params })
    return response.bookings
  },
}
```

---

## 💳 Payments Service

### 6. Payments Service (`services/paymentService.js`)

```javascript
import api from '../lib/api'

export const paymentService = {
  // Create payment
  createPayment: async (bookingId, data) => {
    const response = await api.post(`/bookings/${bookingId}/payments`, data)
    return response.payment
  },

  // Verify payment (after gateway callback)
  verifyPayment: async (paymentId, transactionId, proofImage) => {
    const response = await api.post(`/payments/${paymentId}/verify`, {
      transaction_id: transactionId,
      proof_image: proofImage,
    })
    return response.payment
  },

  // Request refund
  requestRefund: async (paymentId, reason) => {
    const response = await api.post(`/payments/${paymentId}/refund`, { reason })
    return response.payment
  },

  // Get payment details
  getPaymentDetails: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}`)
    return response.payment
  },
}
```

---

## 🎟️ Vouchers Service

### 7. Vouchers Service (`services/voucherService.js`)

```javascript
import api from '../lib/api'

export const voucherService = {
  // Get available vouchers
  getAvailableVouchers: async () => {
    const response = await api.get('/vouchers?status=active')
    return response.vouchers
  },

  // Validate voucher code
  validateVoucher: async (code, bookingAmount, hotelId) => {
    const response = await api.post('/vouchers/validate', {
      code,
      booking_amount: bookingAmount,
      hotel_id: hotelId,
    })
    return response.voucher
  },

  // Apply voucher to booking
  applyVoucher: async (bookingId, voucherCode) => {
    const response = await api.post(`/bookings/${bookingId}/apply-voucher`, {
      voucher_code: voucherCode,
    })
    return response.booking
  },

  // Admin/Owner: Create voucher
  createVoucher: async (data) => {
    const response = await api.post('/vouchers', data)
    return response.voucher
  },
}
```

---

## 🎖️ Memberships Service

### 8. Memberships Service (`services/membershipService.js`)

```javascript
import api from '../lib/api'

export const membershipService = {
  // Get user membership
  getUserMembership: async () => {
    const response = await api.get('/memberships')
    return response.membership
  },

  // Get all membership levels
  getMembershipLevels: async () => {
    const response = await api.get('/membership-levels')
    return response.levels
  },
}
```

---

## ⭐ Reviews Service

### 9. Reviews Service (`services/reviewService.js`)

```javascript
import api from '../lib/api'

export const reviewService = {
  // Create review for booking
  createReview: async (bookingId, reviewData) => {
    const response = await api.post(`/bookings/${bookingId}/review`, reviewData)
    return response.review
  },

  // Get hotel reviews
  getHotelReviews: async (hotelId, params = {}) => {
    const response = await api.get(`/hotels/${hotelId}/reviews`, { params })
    return response
  },

  // Update review
  updateReview: async (reviewId, data) => {
    const response = await api.put(`/reviews/${reviewId}`, data)
    return response.review
  },

  // Mark review as helpful
  markHelpful: async (reviewId) => {
    const response = await api.post(`/reviews/${reviewId}/helpful`)
    return response
  },
}
```

---

## 📊 Analytics Service

### 10. Analytics Service (`services/analyticsService.js`)

```javascript
import api from '../lib/api'

export const analyticsService = {
  // Admin: Get platform analytics
  getPlatformAnalytics: async (period = '12m') => {
    const response = await api.get('/admin/analytics', { params: { period } })
    return response.analytics
  },

  // Admin: Get dashboard data
  getDashboardData: async () => {
    const response = await api.get('/admin/dashboard')
    return response.dashboard
  },

  // Owner: Get hotel revenue
  getHotelRevenue: async (hotelId, dateFrom, dateTo) => {
    const response = await api.get(`/owner/hotels/${hotelId}/revenue`, {
      params: { date_from: dateFrom, date_to: dateTo },
    })
    return response.revenue
  },
}
```

---

## 📝 Contoh Implementasi di Component

### Hotels.js (Public Listing)

```javascript
import { useState, useEffect } from 'react'
import { hotelService } from '../services/hotelService'

export default function Hotels() {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    location: '',
    min_price: 0,
    max_price: 5000,
  })

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true)
        const data = await hotelService.getAllHotels(filters)
        setHotels(data.hotels)
      } catch (error) {
        console.error('Error fetching hotels:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHotels()
  }, [filters])

  return (
    <div>
      <HotelFilters onChange={setFilters} />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid">
          {hotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      )}
    </div>
  )
}
```

### BookingPanel.js (Booking Creation)

```javascript
import { useState } from 'react'
import { bookingService } from '../services/bookingService'
import { voucherService } from '../services/voucherService'
import { paymentService } from '../services/paymentService'

export default function BookingPanel({ hotel, onSuccess }) {
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [voucher, setVoucher] = useState('')
  const [voucherApplied, setVoucherApplied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleApplyVoucher = async () => {
    try {
      const result = await voucherService.validateVoucher(
        voucher,
        calculateTotal(),
        hotel.id
      )
      if (result.valid) {
        setVoucherApplied(true)
        setError('')
      }
    } catch (err) {
      setError('Voucher tidak valid atau sudah expired')
      setVoucherApplied(false)
    }
  }

  const handleCreateBooking = async () => {
    try {
      setLoading(true)
      setError('')

      // Create booking
      const booking = await bookingService.createBooking({
        room_id: selectedRoom,
        hotel_id: hotel.id,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: 2,
        guest_name: 'User Name', // from current user
        voucher_code: voucherApplied ? voucher : null,
      })

      // Create payment
      await paymentService.createPayment(booking.id, {
        amount: booking.total,
        payment_method: 'credit_card',
        payment_gateway: 'stripe',
      })

      onSuccess(booking)
    } catch (err) {
      setError(err.message || 'Error creating booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
      <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />

      <div>
        <input
          value={voucher}
          onChange={(e) => setVoucher(e.target.value)}
          placeholder="Voucher code"
        />
        <button onClick={handleApplyVoucher}>Apply Voucher</button>
      </div>

      {error && <div className="error">{error}</div>}

      <button onClick={handleCreateBooking} disabled={loading}>
        {loading ? 'Processing...' : 'Book Now'}
      </button>
    </div>
  )
}
```

### OwnerDashboard.js (Owner Portal)

```javascript
import { useState, useEffect } from 'react'
import { hotelService } from '../services/hotelService'
import { bookingService } from '../services/bookingService'
import { analyticsService } from '../services/analyticsService'

export default function OwnerDashboard() {
  const [hotels, setHotels] = useState([])
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [bookings, setBookings] = useState([])
  const [revenue, setRevenue] = useState(null)

  useEffect(() => {
    fetchOwnerData()
  }, [])

  useEffect(() => {
    if (selectedHotel) {
      fetchHotelBookings(selectedHotel.id)
      fetchRevenue(selectedHotel.id)
    }
  }, [selectedHotel])

  const fetchOwnerData = async () => {
    const data = await hotelService.getOwnerHotels()
    setHotels(data)
    if (data.length > 0) {
      setSelectedHotel(data[0])
    }
  }

  const fetchHotelBookings = async (hotelId) => {
    const data = await bookingService.getHotelBookings(hotelId)
    setBookings(data)
  }

  const fetchRevenue = async (hotelId) => {
    const today = new Date()
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
    const data = await analyticsService.getHotelRevenue(
      hotelId,
      oneYearAgo.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    )
    setRevenue(data)
  }

  return (
    <div>
      <div>
        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            onClick={() => setSelectedHotel(hotel)}
            className={selectedHotel?.id === hotel.id ? 'active' : ''}
          >
            {hotel.name}
          </div>
        ))}
      </div>

      {selectedHotel && (
        <div>
          <h2>{selectedHotel.name}</h2>
          <p>Total Bookings: {bookings.length}</p>
          <p>Revenue: Rp {revenue?.total.toLocaleString('id-ID')}</p>

          <table>
            <thead>
              <tr>
                <th>Booking Code</th>
                <th>Guest</th>
                <th>Check-in</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.booking_code}</td>
                  <td>{booking.guest_name}</td>
                  <td>{booking.check_in}</td>
                  <td>Rp {booking.total.toLocaleString('id-ID')}</td>
                  <td>{booking.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

### AdminDashboard.js (Admin Analytics)

```javascript
import { useState, useEffect } from 'react'
import { analyticsService } from '../services/analyticsService'

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [period, setPeriod] = useState('12m')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const data = await analyticsService.getPlatformAnalytics(period)
        setAnalytics(data)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [period])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div className="period-selector">
        {['3m', '6m', '12m'].map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={period === p ? 'active' : ''}>
            {p}
          </button>
        ))}
      </div>

      <div className="stats">
        <StatCard label="Total Revenue" value={analytics?.overview.total_revenue} />
        <StatCard label="Total Bookings" value={analytics?.overview.total_bookings} />
        <StatCard label="Total Users" value={analytics?.overview.total_users} />
        <StatCard label="Active Hotels" value={analytics?.overview.active_hotels} />
      </div>

      <Chart data={analytics?.revenue_trend} title="Revenue Trend" />
      <HotelPerformanceTable hotels={analytics?.hotel_performance} />
    </div>
  )
}
```

---

## 🧠 Best Practices

1. **Error Handling**: Selalu wrap service calls dengan try-catch
2. **Loading States**: Show loading indicator selama fetching
3. **Caching**: Implementasi React Query atau SWR untuk efficient caching
4. **Pagination**: Implementasi pagination untuk large datasets
5. **Debouncing**: Debounce search/filter inputs
6. **Validation**: Client-side validation sebelum submit
7. **Security**: Never store sensitive data (passwords, full CC numbers)
8. **Optimistic Updates**: Update UI immediately, revert on error

---

## 🔄 React Query Integration (Advanced)

```javascript
import { useQuery, useMutation } from '@tanstack/react-query'
import { hotelService } from '../services/hotelService'

export default function HotelsPage() {
  const {
    data: hotels,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['hotels'],
    queryFn: () => hotelService.getAllHotels(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const createHotelMutation = useMutation({
    mutationFn: (data) => hotelService.createHotel(data),
    onSuccess: () => {
      refetch()
    },
  })

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {hotels && hotels.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}
    </div>
  )
}
```

