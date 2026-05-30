import api from '../lib/api'

export const userService = {
  // ── Auth ───────────────────────────────────────────────────

  getProfile: async () => {
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

  // ── Admin: User Management ─────────────────────────────────

  // GET /admin/users?page=1&pageSize=20&role=user
  getUsers: async ({ page = 1, pageSize = 20, role } = {}) => {
    try {
      const params = { page, limit: pageSize }
      if (role && role !== 'all') params.role = role
      const response = await api.get('/admin/users', { params })
      
      // api interceptor returns response.data, so backend payload is nested in response.data
      // Backend returns: { success, message, data: { items: [...], total: N, page: page, page_size: pageSize } }
      const payload = response?.data || {}
      return {
        data: payload?.items || [],
        total: payload?.total || 0,
        page: payload?.page || page,
        pageSize: payload?.page_size || pageSize
      }
    } catch (error) {
      throw error
    }
  },

  // PATCH /admin/users/:id/status  { status: 'active' | 'inactive' }
  updateUserStatus: async (id, status) => {
    try {
      return await api.patch(`/admin/users/${id}/status`, { status })
    } catch (error) {
      throw error
    }
  },
}