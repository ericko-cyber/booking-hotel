import api from '../lib/api'

const extractAuthPayload = (response) => {
  if (!response) return {}
  if (response?.data?.token || response?.data?.user) return response.data
  if (response?.token || response?.user) return response
  return {}
}

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const payload = extractAuthPayload(response)
      if (payload.token) {
        localStorage.setItem('token', payload.token)
      }
      if (payload.user) {
        localStorage.setItem('user', JSON.stringify(payload.user))
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
      const authPayload = extractAuthPayload(response)
      if (authPayload.token) {
        localStorage.setItem('token', authPayload.token)
      }
      if (authPayload.user) {
        localStorage.setItem('user', JSON.stringify(authPayload.user))
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
      const payload = response?.data || response
      if (payload?.user) {
        localStorage.setItem('user', JSON.stringify(payload.user))
      }
      return response
    } catch (error) {
      throw error
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh')
      const payload = response?.data || response
      if (payload?.token) {
        localStorage.setItem('token', payload.token)
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
