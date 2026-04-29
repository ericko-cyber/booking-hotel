import api from '../lib/api'

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      return response
    } catch (error) {
      throw error
    }
  },

  register: async (name, email, password, accountType = 'traveler') => {
    try {
      const payload = {
        name,
        email,
        password,
        role: accountType === 'owner' ? 'owner' : 'user',
      }
      const response = await api.post('/auth/register', payload)
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      return response
    } catch (error) {
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/profile')
      return response
    } catch (error) {
      throw error
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await api.put('/auth/profile', data)
      if (response.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      return response
    } catch (error) {
      throw error
    }
  },

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

  getUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    }
    return null
  },

  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token')
    }
    return false
  },
}
