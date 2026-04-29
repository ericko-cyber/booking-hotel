import api from '../lib/api'

export const adminService = {
  // Get all bookings (admin)
  getAllBookings: async (params = {}) => {
    try {
      const response = await api.get('/admin/bookings', { params })
      return response.data || []
    } catch (error) {
      throw error
    }
  },

  // Get all hotels (admin) - for approval
  getAllHotels: async (params = {}) => {
    try {
      const response = await api.get('/hotels', { params })
      return response.data || []
    } catch (error) {
      throw error
    }
  },

  // Get all users (admin)
  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params })
      return response.data || []
    } catch (error) {
      throw error
    }
  },
}
