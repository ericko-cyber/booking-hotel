import api from '../lib/api'

const readNullString = (value) => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  // Handle sql.NullString-like objects: { String: "...", Valid: true }
  if (typeof value === 'object' && 'String' in value && 'Valid' in value) {
    return value.Valid === true && value.String ? String(value.String) : ''
  }
  return ''
}

const formatPaymentLabel = (paymentStatus) => {
  if (!paymentStatus) return 'Menunggu pembayaran'
  if (paymentStatus === 'paid' || paymentStatus === 'success') return 'Lunas'
  if (paymentStatus === 'refunded') return 'Refund diproses'
  if (paymentStatus === 'processing') return 'Diproses'
  return paymentStatus
}

const formatStatusLabel = (status) => {
  switch (status) {
    case 'completed':
      return 'Selesai'
    case 'upcoming':
      return 'Akan datang'
    case 'pending':
      return 'Menunggu'
    case 'cancelled':
      return 'Dibatalkan'
    default:
      return status || 'Menunggu'
  }
}

const normalizeBooking = (b) => {
  const paymentStatus = b?.payment_status || b?.paymentStatus || ''
  const rawStatus = b?.status || 'pending'
  const status = rawStatus === 'cancelled'
    ? 'cancelled'
    : rawStatus === 'checked-out'
      ? 'completed'
      : rawStatus === 'confirmed' || rawStatus === 'checked-in'
        ? 'upcoming'
        : 'pending'

  // hotel/room may come as nested objects, plain strings, or sql.NullString-like objects
  const extractName = (obj) => {
    if (!obj) return ''
    if (typeof obj === 'string') return obj
    if (typeof obj === 'object') {
      // handle common variants: { name }, { Name }, sql.NullString-like { String, Valid }
      if (obj.name) return obj.name
      if (obj.Name) return obj.Name
      if (obj.String && obj.Valid) return obj.String
    }
    return ''
  }

  const hotelName = extractName(b?.hotel) || readNullString(b?.hotel_name) || `Hotel #${b?.hotel_id || '-'}`
  const roomName = extractName(b?.room) || readNullString(b?.room_name) || `Room #${b?.room_id || '-'}`
  const location = readNullString(b?.location) || extractName(b?.location) || ''

  return {
    ...b,
    bookingCode: b?.booking_code || b?.bookingCode || b?.id,
    hotelId: b?.hotelId ?? b?.hotel_id,
    roomId: b?.roomId ?? b?.room_id,
    checkIn: b?.checkIn ?? b?.check_in,
    checkOut: b?.checkOut ?? b?.check_out,
    bookedAt: b?.bookedAt ?? b?.created_at ?? b?.createdAt,
    total: Number(b?.total ?? b?.total_price ?? 0),
    nights: Number(b?.nights ?? 0),
    guests: Number(b?.guests ?? b?.guests_count ?? 0),
    guest: b?.guest || readNullString(b?.guest_name) || 'Guest',
    location,
    payment: formatPaymentLabel(paymentStatus),
    hotel: hotelName,
    room: roomName,
    status,
    statusLabel: formatStatusLabel(status),
    paymentStatus,
    voucherDiscount: Number(b?.voucherDiscount ?? b?.voucher_discount ?? 0),
    membershipDiscount: Number(b?.membershipDiscount ?? b?.membership_discount ?? 0),
    discountAmount: Number(b?.discountAmount ?? b?.discount_amount ?? 0),
  }
}

const toBookingList = (response) => {
  const payload = response?.data || response
  if (Array.isArray(payload?.bookings)) return payload.bookings.map(normalizeBooking)
  if (Array.isArray(payload)) return payload.map(normalizeBooking)
  return []
}

export const bookingService = {
  // Create a booking
  createBooking: async (data) => {
    try {
      const response = await api.post('/bookings', data)
      return response
    } catch (error) {
      throw error
    }
  },

  // Get booking by ID
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/bookings/${id}`)
      return response
    } catch (error) {
      throw error
    }
  },

  // Get booking by ID and return normalized booking object
  getBookingByIdNormalized: async (id) => {
    try {
      const response = await api.get(`/bookings/${id}`)
      const payload = response?.data || response
      
      // Handle BookingDetailResponse structure: { booking, room, hotel, payment, user }
      let booking = payload?.booking || payload
      
      // Merge room and hotel data into booking if they exist
      if (payload?.room) {
        booking.room = payload.room
      }
      if (payload?.hotel) {
        booking.hotel = payload.hotel
      }

      const normalized = normalizeBooking(booking)
      normalized.paymentDetail = payload?.payment || null
      normalized.paymentId = payload?.payment?.id || null
      normalized.qrisString = payload?.payment?.qris_string || payload?.payment?.qrisString || ''
      return normalized
    } catch (error) {
      throw error
    }
  },

  // Get booking by code
  getBookingByCode: async (code) => {
    try {
      const response = await api.get(`/bookings/code/${code}`)
      return response
    } catch (error) {
      throw error
    }
  },

  // Get user's bookings
  getUserBookings: async (params = {}) => {
    try {
      const response = await api.get('/bookings', { params })
      return toBookingList(response)
    } catch (error) {
      throw error
    }
  },

  // Cancel booking
  cancelBooking: async (id) => {
    try {
      const response = await api.delete(`/bookings/${id}/cancel`)
      return response
    } catch (error) {
      throw error
    }
  },

  // Update booking status
  updateBookingStatus: async (id, updateData) => {
    try {
      // Support both old format (string) and new format (object)
      const payload = typeof updateData === 'string' ? { status: updateData } : updateData
      const response = await api.put(`/bookings/${id}/status`, payload)
      return response
    } catch (error) {
      throw error
    }
  },

  // Get owner's bookings
  getOwnerBookings: async (params = {}) => {
    try {
      const response = await api.get('/bookings/owner/my-bookings', { params })
      return toBookingList(response)
    } catch (error) {
      throw error
    }
  },
}
