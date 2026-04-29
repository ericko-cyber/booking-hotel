import api from '../lib/api'

export const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile')
      return response
    } catch (error) {
      throw error
    }
  },

  // Update user profile
  updateProfile: async (data) => {
    try {
      const response = await api.put('/auth/profile', data)
      return response
    } catch (error) {
      throw error
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh')
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token)
      }
      return response
    } catch (error) {
      throw error
    }
  },
}
