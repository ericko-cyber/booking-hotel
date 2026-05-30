import api from '../lib/api'

/**
 * Transform database benefit to UI format
 */
const normalizeBenefit = (b) => {
  // helper to unwrap possible Go sql.Null-like objects
  const unwrap = (val) => {
    if (val == null) return null
    if (typeof val === 'object') {
      if (val.Float64 !== undefined) return Number(val.Float64)
      if (val.String !== undefined) return val.String
      if (val.Int64 !== undefined) return Number(val.Int64)
      if (val.Int !== undefined) return Number(val.Int)
      if (val.Valid !== undefined && val.String !== undefined) return val.String
      if (val.Valid !== undefined && val.Float64 !== undefined) return Number(val.Float64)
      if (val.Valid !== undefined && val.Int64 !== undefined) return Number(val.Int64)
    }
    return val
  }

  const pick = (...values) => {
    for (const value of values) {
      const unwrapped = unwrap(value)
      if (unwrapped !== null && unwrapped !== undefined && unwrapped !== '') return unwrapped
    }
    return null
  }

  const toNumberOrNull = (value) => {
    const raw = unwrap(value)
    if (raw === null || raw === undefined || raw === '') return null
    const num = Number(raw)
    return Number.isNaN(num) ? null : num
  }

  const benefitType = pick(b?.type, b?.benefit_type, b?.benefitType) || 'discount'
  const title = pick(b?.title, b?.name) || ''
  const description = pick(b?.description) || ''
  const discountPercent = pick(b?.discount_percent, b?.discountPercent, b?.discount_value, b?.discountValue)
  const discountAmount = pick(b?.discount_amount, b?.discountAmount)
  const voucherID = pick(b?.voucher_id, b?.voucherID)
  const membershipTier = pick(b?.membership_tier, b?.membershipTier, b?.tier) || 'none'
  const scope = pick(b?.scope) || 'global'
  const hotelID = pick(b?.hotel_id, b?.hotelID)
  const roomType = pick(b?.room_type, b?.roomType)
  const status = pick(b?.status) || 'active'
  const startDate = pick(b?.start_date, b?.startDate)
  const expiryDate = pick(b?.expiry_date, b?.expiryDate, b?.end_date, b?.endDate)
  const usageLimit = pick(b?.usage_limit, b?.usageLimit)

  return {
    id: pick(b?.id),
    type: benefitType,
    title: title,
    description: description,
    discountPercent: toNumberOrNull(discountPercent),
    value: toNumberOrNull(discountPercent),
    discountAmount: toNumberOrNull(discountAmount),
    voucherID: toNumberOrNull(voucherID),
    membershipTier: membershipTier,
    scope: scope,
    hotelID: toNumberOrNull(hotelID),
    roomType: roomType,
    startDate: startDate,
    expiryDate: expiryDate,
    usageLimit: toNumberOrNull(usageLimit),
    status: status,
    createdAt: pick(b?.created_at, b?.createdAt),
    updatedAt: pick(b?.updated_at, b?.updatedAt),
  }
}

const toBenefitList = (response) => {
  const payload = response?.data || response
  if (Array.isArray(payload?.data)) return payload.data.map(normalizeBenefit)
  if (Array.isArray(payload?.benefits)) return payload.benefits.map(normalizeBenefit)
  if (Array.isArray(payload)) return payload.map(normalizeBenefit)
  return []
}

export const benefitService = {
  /**
   * Get all membership benefits with optional filters
   */
  getBenefits: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      if (filters.membership_tier) params.append('membership_tier', filters.membership_tier)
      if (filters.type) params.append('type', filters.type)
      if (filters.status) params.append('status', filters.status)
      if (filters.scope) params.append('scope', filters.scope)
      if (filters.hotel_id) params.append('hotel_id', filters.hotel_id)
      if (filters.room_type) params.append('room_type', filters.room_type)

      const response = await api.get(`/admin/benefits${params.toString() ? `?${params}` : ''}`)
      return toBenefitList(response)
    } catch (error) {
      console.error('Error fetching benefits:', error)
      throw error
    }
  },

  /**
   * Get single benefit by ID
   */
  getBenefitByID: async (id) => {
    try {
      const response = await api.get(`/admin/benefits/${id}`)
      const payload = response?.data || response
      return normalizeBenefit(payload?.data || payload)
    } catch (error) {
      console.error('Error fetching benefit:', error)
      throw error
    }
  },

  /**
   * Get benefits for specific membership tier
   */
  getBenefitsByTier: async (tier) => {
    try {
      const response = await api.get(`/admin/benefits/tier/${tier}`)
      return toBenefitList(response)
    } catch (error) {
      console.error(`Error fetching benefits for tier ${tier}:`, error)
      throw error
    }
  },

  /**
   * Create new membership benefit
   */
  createBenefit: async (benefitData) => {
    try {
      const response = await api.post('/admin/benefits', benefitData)
      const payload = response?.data || response
      return normalizeBenefit(payload?.data || payload)
    } catch (error) {
      console.error('Error creating benefit:', error)
      throw error
    }
  },

  /**
   * Update membership benefit
   */
  updateBenefit: async (id, updates) => {
    try {
      const response = await api.put(`/admin/benefits/${id}`, updates)
      const payload = response?.data || response
      return normalizeBenefit(payload?.data || payload)
    } catch (error) {
      console.error('Error updating benefit:', error)
      throw error
    }
  },

  /**
   * Delete membership benefit
   */
  deleteBenefit: async (id) => {
    try {
      const response = await api.delete(`/admin/benefits/${id}`)
      return response
    } catch (error) {
      console.error('Error deleting benefit:', error)
      throw error
    }
  },
}
