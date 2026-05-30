import api from '../lib/api'

export const adminService = {
  // Get all bookings (admin)
  getAllBookings: async (params = {}) => {
    try {
      const response = await api.get('/admin/bookings', { params })
      const payload = response?.data || {}
      return {
        bookings: payload?.bookings || [],
        total: payload?.total || 0,
        page: payload?.page || 1,
        page_size: payload?.page_size || 10,
      }
    } catch (error) {
      throw error
    }
  },

  // Get all hotels (admin)
  getAllHotels: async (params = {}) => {
    try {
      const response = await api.get('/admin/hotels', { params })
      const payload = response?.data || {}
      return {
        hotels: payload?.hotels || [],
        total: payload?.total || 0,
        page: payload?.page || 1,
        page_size: payload?.page_size || 10,
      }
    } catch (error) {
      throw error
    }
  },

  // Update hotel status (admin)
  updateHotelStatus: async (id, status) => {
    try {
      const response = await api.patch(`/admin/hotels/${id}/status`, { status })
      return response
    } catch (error) {
      throw error
    }
  },

  // Get all users (admin)
  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params })
      const payload = response?.data || {}
      return {
        items: payload?.items || [],
        total: payload?.total || 0,
        page: payload?.page || 1,
        page_size: payload?.page_size || 10,
      }
    } catch (error) {
      throw error
    }
  },
}
