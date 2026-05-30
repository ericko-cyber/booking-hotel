import api from '../lib/api'

/**
 * Transform database voucher to UI format
 */
const normalizeVoucher = (v) => {
  // helper to unwrap possible Go sql.Null-like objects
  const unwrap = (val) => {
    if (val == null) return null
    if (typeof val === 'object') {
      if (val.String !== undefined) return val.String
      if (val.Int64 !== undefined) return Number(val.Int64)
      if (val.Int !== undefined) return Number(val.Int)
      if (val.Valid !== undefined && val.String !== undefined) return val.String
    }
    return val
  }

  const inferMembershipTier = (explicitTier, code, description) => {
    const normalizedTier = (explicitTier || '').toString().toLowerCase()
    if (normalizedTier && normalizedTier !== 'none') return normalizedTier

    const haystack = `${code || ''} ${description || ''}`.toLowerCase()
    if (/\bplatinum\b/.test(haystack)) return 'platinum'
    if (/\bgold\b/.test(haystack)) return 'gold'
    if (/\bsilver\b/.test(haystack)) return 'silver'

    return 'none'
  }

  const benefitType = unwrap(v?.type) || 'percent' // 'percent' atau 'fixed'

  // Tentukan category berdasarkan scope dan property lainnya
  const scope = unwrap(v?.scope) || (v?.scope) || 'global'
  const description = unwrap(v?.description) || ''
  const code = unwrap(v?.code) || ''
  const membershipTier = inferMembershipTier(unwrap(v?.membership_tier) || v?.membership_tier || 'none', code, description)
  let category = 'general'
  if (scope === 'hotel' || unwrap(v?.hotel_id)) {
    category = 'hotel'
  } else if (scope === 'room_type' || unwrap(v?.room_type)) {
    category = 'room'
  }

  // Format benefit value untuk display
  const benefit = benefitType === 'fixed' ? Number(unwrap(v?.value) ?? 0) : Number(unwrap(v?.value) ?? 0)

  // Determine requirement text
  let requirementText = 'Umum'
  if (membershipTier !== 'none') {
    requirementText = `Member ${membershipTier.charAt(0).toUpperCase() + membershipTier.slice(1)}`
  }

  return {
    id: unwrap(v?.id) || v?.code,
    code: unwrap(v?.code) || '',
    title: description || `Voucher ${unwrap(v?.code)}`,
    description: description,
    benefit: benefit,
    value: benefit,
    benefitType: benefitType,
    category: category,
    minSpend: Number(unwrap(v?.min_booking_amount) ?? 0),
    expiresAt: unwrap(v?.expiry_date) || '',
    expiryDate: unwrap(v?.expiry_date) || '',
    quota: Number(unwrap(v?.usage_limit) ?? 0),
    usageLimit: Number(unwrap(v?.usage_limit) ?? 0),
    used: Number(unwrap(v?.used_count) ?? 0),
    status: unwrap(v?.status) || 'active',
    scope: scope,
    hotelId: unwrap(v?.hotel_id),
    roomType: unwrap(v?.room_type),
    startDate: unwrap(v?.start_date),
    membershipTier: membershipTier,
    requirementText: requirementText,
    requiresMembership: membershipTier !== 'none'
  }
}

const toVoucherList = (response) => {
  const payload = response?.data || response
  if (Array.isArray(payload?.data)) return payload.data.map(normalizeVoucher)
  if (Array.isArray(payload?.vouchers)) return payload.vouchers.map(normalizeVoucher)
  if (Array.isArray(payload)) return payload.map(normalizeVoucher)
  return []
}

export const voucherService = {
  /**
   * Get all active vouchers
   */
  getVouchers: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.scope) params.append('scope', filters.scope)
      
      const response = await api.get(`/vouchers${params.toString() ? `?${params}` : ''}`)
      return toVoucherList(response)
    } catch (error) {
      console.error('Error fetching vouchers:', error)
      throw error
    }
  },

  /**
   * Get single voucher by code
   */
  getVoucherByCode: async (code) => {
    try {
      const response = await api.get(`/vouchers/${code}`)
      const payload = response?.data || response
      return normalizeVoucher(payload?.data || payload)
    } catch (error) {
      console.error('Error fetching voucher:', error)
      throw error
    }
  },

  /**
   * Apply voucher to booking (validate and get discount)
   */
  validateVoucher: async (code, bookingData = {}) => {
    try {
      const response = await api.post('/vouchers/validate', {
        code,
        ...bookingData,
      })
      return response?.data || response
    } catch (error) {
      console.error('Error validating voucher:', error)
      throw error
    }
  },

  /**
   * Get vouchers applicable for specific hotel
   */
  getVouchersForHotel: async (hotelId) => {
    try {
      const response = await api.get(`/hotels/${hotelId}/vouchers`)
      return toVoucherList(response)
    } catch (error) {
      console.error('Error fetching hotel vouchers:', error)
      throw error
    }
  },

  /**
   * Get user's available vouchers (for members)
   */
  getUserVouchers: async () => {
    try {
      const response = await api.get('/users/me/vouchers')
      return toVoucherList(response)
    } catch (error) {
      console.error('Error fetching user vouchers:', error)
      throw error
    }
  },

  getMyClaimedVoucherIds: async () => {
    try {
      const claims = await voucherService.getMyClaims()
      return claims
        .map((claim) => Number(claim?.voucher?.id || claim?.voucher_id || claim?.id))
        .filter((id) => Number.isFinite(id) && id > 0)
    } catch (error) {
      console.error('Error fetching claimed voucher ids:', error)
      throw error
    }
  },

  getMyClaims: async () => {
    try {
      const response = await api.get('/vouchers/my-claims')
      // axios interceptor already returns response.data from backend
      // expected shape: { success, message, data: [...] }
      if (Array.isArray(response?.data)) return response.data
      if (Array.isArray(response?.Data)) return response.Data
      if (Array.isArray(response)) return response
      return []
    } catch (error) {
      console.error('Error fetching my claims:', error)
      throw error
    }
  },

  claimVoucher: async (voucherId) => {
    try {
      const response = await api.post(`/vouchers/${voucherId}/claim`)
      return response?.data || response
    } catch (error) {
      console.error('Error claiming voucher:', error)
      
      // Transform error to have consistent structure
      const transformedError = new Error()
      if (error?.message) {
        transformedError.message = error.message
      } else if (typeof error === 'string') {
        transformedError.message = error
      } else {
        transformedError.message = 'Gagal claim voucher'
      }
      transformedError.response = error?.response || {}
      
      throw transformedError
    }
  },

  /* ────── ADMIN METHODS ────── */

  /**
   * Get all vouchers (admin view)
   */
  getAdminVouchers: async () => {
    try {
      const response = await api.get('/admin/vouchers')
      return toVoucherList(response)
    } catch (error) {
      console.error('Error fetching admin vouchers:', error)
      throw error
    }
  },

  /**
   * Create a new voucher
   */
  createVoucher: async (voucherData) => {
    try {
      const payload = {
        code: voucherData.code,
        type: voucherData.type,
        value: Number(voucherData.value),
        scope: voucherData.scope,
        membership_tier: voucherData.membership_tier || 'none',
        expiry_date: voucherData.expiry_date || voucherData.expiry,
        usage_limit: Number(voucherData.usage_limit || voucherData.quota),
        min_booking_amount: voucherData.min_booking_amount || 0,
        description: voucherData.description || '',
      }

      if (voucherData.start_date) {
        payload.start_date = voucherData.start_date
      }

      if (voucherData.scope === 'hotel' && voucherData.hotel_id) {
        payload.hotel_id = Number(voucherData.hotel_id)
      }

      if (voucherData.room_type) {
        payload.room_type = voucherData.room_type
      }

      const response = await api.post('/admin/vouchers', payload)
      const result = response?.data || response
      return normalizeVoucher(result?.data || result)
    } catch (error) {
      console.error('Error creating voucher:', error)
      throw error
    }
  },

  /**
   * Update an existing voucher
   */
  updateVoucher: async (voucherId, updates) => {
    try {
      const payload = {}

      if (updates.code !== undefined) payload.code = updates.code
      if (updates.type !== undefined) payload.type = updates.type
      if (updates.value !== undefined) payload.value = Number(updates.value)
      if (updates.min_booking_amount !== undefined) payload.min_booking_amount = Number(updates.min_booking_amount)
      if (updates.scope !== undefined) payload.scope = updates.scope
      if (updates.membership_tier !== undefined) payload.membership_tier = updates.membership_tier
      if (updates.hotel_id !== undefined) payload.hotel_id = updates.hotel_id === null ? null : Number(updates.hotel_id)
      if (updates.room_type !== undefined) payload.room_type = updates.room_type
      if (updates.start_date !== undefined) payload.start_date = updates.start_date
      if (updates.status !== undefined) payload.status = updates.status
      if (updates.usage_limit !== undefined) payload.usage_limit = Number(updates.usage_limit)
      if (updates.expiry_date !== undefined) payload.expiry_date = updates.expiry_date
      if (updates.description !== undefined) payload.description = updates.description

      const response = await api.put(`/admin/vouchers/${voucherId}`, payload)
      const result = response?.data || response
      return normalizeVoucher(result?.data || result)
    } catch (error) {
      console.error('Error updating voucher:', error)
      throw error
    }
  },

  /**
   * Delete a voucher
   */
  deleteVoucher: async (voucherId) => {
    try {
      const response = await api.delete(`/admin/vouchers/${voucherId}`)
      return response?.data || response
    } catch (error) {
      console.error('Error deleting voucher:', error)
      throw error
    }
  },
}
