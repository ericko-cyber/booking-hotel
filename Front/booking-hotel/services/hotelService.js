import api from '../lib/api'

export const hotelService = {
  // Get all approved hotels
  getAllHotels: async (params = {}) => {
    try {
      const response = await api.get('/hotels', { params })
      return response.data || []
      const response = await api.get('/hotels/search', { params })
      return response.data || []
    } catch (error) {
      throw error
    }
  },

  // Get specific hotel details
  getHotelById: async (id) => {
    try {
      const response = await api.get(`/hotels/${id}`)
      return response.data || response.hotel
    } catch (error) {
      throw error
    }
  },

  // Get rooms of a hotel (public)
  getRoomsByHotel: async (hotelId, params = {}) => {
    try {
      const response = await api.get(`/hotels/${hotelId}/rooms`, { params })
      return response.data || []
    } catch (error) {
      throw error
    }
  },

  // Create hotel (owner)
  createHotel: async (data) => {
    try {
      const response = await api.post('/hotels', data)
      return response
    } catch (error) {
      throw error
    }
  },

  // Update hotel (owner)
  updateHotel: async (id, data) => {
    try {
      const response = await api.put(`/hotels/${id}`, data)
      return response
    } catch (error) {
      throw error
    }
  },

  // Delete hotel (owner)
  deleteHotel: async (id) => {
    try {
      const response = await api.delete(`/hotels/${id}`)
      return response
    } catch (error) {
      throw error
    }
  },

  // Get owner's hotels
  getOwnerHotels: async () => {
    try {
      const response = await api.get('/hotels/owner/my-hotels')
      return response.data || []
    } catch (error) {
      throw error
    }
  },
}
