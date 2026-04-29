import api from '../lib/api'

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
      const response = await api.get('/bookings/user/my-bookings', { params })
      return response.data || []
    } catch (error) {
      throw error
    }
  },

  // Cancel booking
  cancelBooking: async (id) => {
    try {
      const response = await api.put(`/bookings/${id}/cancel`)
      return response
    } catch (error) {
      throw error
    }
  },

  // Update booking status
  updateBookingStatus: async (id, status) => {
    try {
      const response = await api.put(`/bookings/${id}/status`, { status })
      return response
    } catch (error) {
      throw error
    }
  },

  // Get owner's bookings
  getOwnerBookings: async (params = {}) => {
    try {
      const response = await api.get('/bookings/owner/my-bookings', { params })
      return response.data || []
    } catch (error) {
      throw error
    }
  },
}
