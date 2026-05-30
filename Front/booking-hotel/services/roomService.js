import api from '../lib/api'

const parseFacilities = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || value.length === 0) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const normalizeRoom = (room) => ({
  ...room,
  hotelId: room?.hotelId ?? room?.hotel_id,
  facilities: parseFacilities(room?.facilities),
})

export const roomService = {
  // Get room by ID
  getRoomById: async (id) => {
    try {
      const response = await api.get(`/rooms/${id}`)
      return response
    } catch (error) {
      throw error
    }
  },

  // Update room
  updateRoom: async (id, data) => {
    try {
      const response = await api.put(`/rooms/${id}`, data)
      return response
    } catch (error) {
      throw error
    }
  },

  // Delete room
  deleteRoom: async (id) => {
    try {
      const response = await api.delete(`/rooms/${id}`)
      return response
    } catch (error) {
      throw error
    }
  },

  // Get rooms by hotel
  getRoomsByHotel: async (hotelId, params = {}) => {
    try {
      const response = await api.get(`/hotels/${hotelId}/rooms`, { params })
      const payload = response?.data || response
      const rooms = payload?.rooms || payload || []
      return Array.isArray(rooms) ? rooms.map(normalizeRoom) : []
    } catch (error) {
      throw error
    }
  },

  // Create room
  createRoom: async (hotelId, data) => {
    try {
      const response = await api.post(`/hotels/${hotelId}/rooms`, data)
      return response
    } catch (error) {
      throw error
    }
  },
}
