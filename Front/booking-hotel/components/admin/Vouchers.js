import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  PageHeader, Badge, Btn, Card, CardTitle,
  Modal, Field, Input, Select, Confirm, Search, Empty, StatCard,
} from '../../components/admin/AdminUI'
import api from '../../lib/api'
import { voucherService } from '../../services/voucherService'
import styles from './Vouchers.module.css'

const BLANK = {
  code: '', type: 'percent', value: '', scope: 'global',
  hotel_id: '', hotel_name: '', room_type: '', expiry_date: '', usage_limit: '', status: 'active',
}

const approvedHotelsPlaceholder = []

const toDateInputValue = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value.slice(0, 10)
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object' && value !== null && typeof value.toISOString === 'function') {
    return value.toISOString().slice(0, 10)
  }
  return String(value).slice(0, 10)
}

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([])
  const [hotels, setHotels] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [roomTypesLoading, setRoomTypesLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [scopeFilter, setScopeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const allVouchers = vouchers

  const approvedHotels = hotels.length ? hotels.filter(h => h.status === 'approved') : approvedHotelsPlaceholder

  /* ── Fetch vouchers on mount ── */
  useEffect(() => {
    ;(async () => {
      await fetchHotels()
      await fetchVouchers()
    })()
  }, [])

  const fetchHotels = async () => {
    try {
      const res = await api.get('/hotels')
      // API may return { data: { hotels: [...] } } or { hotels: [...] }
      const apiHotels = res?.data?.hotels || res?.hotels || res?.Data?.Hotels || res?.Hotels || res?.data || []
      // normalize to expected shape (id, name, status, owner)
      const norm = (Array.isArray(apiHotels) ? apiHotels : []).map(h => ({
        id: h.id || h.ID || h.hotelId,
        name: h.name || h.title || h.hotel_name,
        status: h.status || 'pending',
        owner: h.owner_name || h.owner || (h.ownerId ? `Owner ${h.ownerId}` : ''),
      }))
      setHotels(norm)
    } catch (err) {
      console.error('Failed to fetch hotels for admin voucher form:', err)
    }
  }

  const loadRoomTypesForHotel = async (hotelId) => {
    if (!hotelId) {
      setRoomTypes([])
      return
    }

    try {
      setRoomTypesLoading(true)
      const res = await api.get(`/hotels/${hotelId}/rooms?page_size=1000`)
      const apiRooms = res?.data?.rooms || res?.rooms || res?.Data?.Rooms || res?.Rooms || res?.data || []
      const normalizedRooms = (Array.isArray(apiRooms) ? apiRooms : [])
        .map(room => ({
          value: room.room_type || room.roomType || '',
          label: room.name || room.room_name || room.roomName || room.room_type || room.roomType || '',
        }))
        .filter(room => room.value)

      const uniqueRooms = []
      const seen = new Set()
      normalizedRooms.forEach(room => {
        if (seen.has(room.value)) return
        seen.add(room.value)
        uniqueRooms.push(room)
      })

      setRoomTypes(uniqueRooms)
    } catch (err) {
      console.error('Failed to fetch room types for hotel:', err)
      setRoomTypes([])
    } finally {
      setRoomTypesLoading(false)
    }
  }

  useEffect(() => {
    if (form.scope === 'hotel' && form.hotel_id) {
      loadRoomTypesForHotel(form.hotel_id)
      return
    }

    setRoomTypes([])
  }, [form.scope, form.hotel_id])

  const fetchVouchers = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)
      const data = await voucherService.getAdminVouchers()
      const normalized = data.map(v => ({
        id: v.id,
        code: v.code,
        type: v.benefitType,
        value: v.benefit,
        scope: v.scope === 'room_type' ? 'hotel' : v.scope,
        membershipTier: v.membershipTier || 'none',
        hotel_id: v.hotelId,
        room_type: v.roomType,
        hotel_name: (hotels.find(h => Number(h.id) === Number(v.hotelId))?.name) || (v.category === 'hotel' ? `Hotel ${v.hotelId}` : null),
        expiry_date: toDateInputValue(v.expiresAt),
        usage_limit: v.quota,
        used: v.used,
        status: v.status,
        description: v.description,
      }))
      setVouchers(normalized)
    } catch (error) {
      console.error('Failed to fetch vouchers:', error)
      setErrorMsg('Failed to load vouchers: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrors(er => ({ ...er, [k]: '' }))
  }

  /* ── Open modals ── */
  const openAdd = () => { setForm(BLANK); setErrors({}); setErrorMsg(null); setModal('add') }
  const openEdit = v => {
    const hotelName = approvedHotels.find(h => h.id === v.hotel_id)?.name || v.hotel_name
    setForm({
      id: v.id,
      code: v.code,
      type: v.type,
      value: String(v.value),
      scope: v.scope === 'room_type' ? 'hotel' : v.scope,
      hotel_id: v.hotel_id || '',
      hotel_name: hotelName,
      room_type: v.room_type || '',
      expiry_date: toDateInputValue(v.expiry_date),
      usage_limit: String(v.usage_limit),
      status: v.status,
      description: v.description || '',
    })
    setErrors({})
    setErrorMsg(null)
    setModal(v)
  }

  /* ── Validate ── */
  const validate = () => {
    const e = {}
    if (!form.code.trim())  e.code  = 'Code is required'
    if (!form.value || Number(form.value) <= 0) e.value = 'Enter a valid value'
    if (form.type === 'percent' && Number(form.value) > 100) e.value = 'Percentage cannot exceed 100'
    if (!form.expiry_date) e.expiry_date = 'Expiry date is required'
    if (!form.usage_limit || Number(form.usage_limit) < 1) e.usage_limit = 'Enter a valid quota'
    if (form.scope === 'hotel' && !form.hotel_id) e.hotel_id = 'Select a hotel for hotel-scoped voucher'
    setErrors(e)
    return !Object.keys(e).length
  }

  /* ── Save ── */
  const save = async () => {
    if (!validate()) return

    try {
      setSaving(true)
      setErrorMsg(null)

      const payload = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
        scope: form.scope,
        membership_tier: 'none',
        expiry_date: form.expiry_date,
        usage_limit: Number(form.usage_limit),
        description: form.description,
      }

      if (form.scope === 'hotel' && form.hotel_id) {
        payload.hotel_id = Number(form.hotel_id)
      }

      if (form.scope === 'hotel' && form.room_type.trim()) {
        payload.room_type = form.room_type.trim()
      }

      if (modal === 'add') {
        // Create new voucher
        await voucherService.createVoucher(payload)
        await fetchVouchers()
      } else {
        // Update existing voucher
        await voucherService.updateVoucher(form.id, {
          code: form.code.toUpperCase(),
          type: form.type,
          value: Number(form.value),
          scope: form.scope,
          membership_tier: 'none',
          hotel_id: form.scope === 'hotel' && form.hotel_id ? Number(form.hotel_id) : undefined,
          room_type: form.scope === 'hotel' ? form.room_type.trim() : undefined,
          expiry_date: form.expiry_date,
          usage_limit: Number(form.usage_limit),
          min_booking_amount: 0,
          status: form.status,
          description: form.description,
        })
        await fetchVouchers()
      }

      setModal(null)
    } catch (error) {
      console.error('Error saving voucher:', error)
      setErrorMsg('Failed to save voucher: ' + (error.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  /* ── Delete ── */
  const remove = async () => {
    try {
      setDeleting(true)
      setErrorMsg(null)
      await voucherService.deleteVoucher(confirm)
      await fetchVouchers()
      setConfirm(null)
    } catch (error) {
      console.error('Error deleting voucher:', error)
      setErrorMsg('Failed to delete voucher: ' + (error.message || 'Unknown error'))
      setDeleting(false)
    }
  }

  /* ── Filter ── */
  const filtered = allVouchers.filter(v => {
    const ms = scopeFilter  === 'all' || v.scope   === scopeFilter
    const mt = statusFilter === 'all' || v.status  === statusFilter
    const mq = !search || v.code.toLowerCase().includes(search.toLowerCase()) || (v.hotel_name || '').toLowerCase().includes(search.toLowerCase())
    return ms && mt && mq
  })

  /* ── Summary stats ── */
  const totalActive  = allVouchers.filter(v => v.status === 'active').length
  const totalUsed    = allVouchers.reduce((s, v) => s + v.used, 0)
  const totalQuota   = allVouchers.reduce((s, v) => s + v.usage_limit, 0)
  const globalCount  = allVouchers.filter(v => v.scope === 'global').length

  return (
    <AdminLayout active="vouchers">
      <PageHeader
        eyebrow="Platform"
        title="Voucher Management"
        subtitle={`${totalActive} active vouchers · ${totalUsed.toLocaleString()} total redemptions`}
        action={<Btn onClick={openAdd}>+ Create Voucher</Btn>}
      />

      {errorMsg && (
        <div style={{
          background: '#fee',
          border: '1px solid #f99',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#c00',
          fontSize: '13px'
        }}>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
          <p>Loading vouchers...</p>
        </div>
      ) : (
        <>
      {/* ── Summary stats ── */}
      <div className={styles.statsRow}>
        <StatCard
          label="Active Vouchers" value={totalActive}
          sub={`${allVouchers.filter(v => v.status === 'expired').length} expired`}
          icon="M20 12V22H4V12 M22 7H2v5h20V7z M12 22V7"
        />
        <StatCard
          label="Total Redemptions" value={totalUsed.toLocaleString()}
          sub={`of ${totalQuota.toLocaleString()} total quota`}
          icon="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"
          accent
        />
        <StatCard
          label="Global Vouchers" value={globalCount}
          sub={`${allVouchers.length - globalCount} hotel-specific`}
          icon="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"
        />
        <StatCard
          label="Avg Usage Rate"
          value={`${Math.round((totalUsed / Math.max(totalQuota,1)) * 100)}%`}
          sub="Across all vouchers"
          icon="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </div>

      {/* ── Filters toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          {/* Scope filter */}
          <div className={styles.segmented}>
            {['all','global','hotel'].map(s => (
              <button
                key={s}
                className={`${styles.seg} ${scopeFilter === s ? styles.segOn : ''}`}
                onClick={() => setScopeFilter(s)}
              >
                {s === 'all' ? 'All Scopes' : s === 'global' ? '🌐 Global' : '🏨 Per Hotel'}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className={styles.segmented}>
            {['all','active','expired'].map(s => (
              <button
                key={s}
                className={`${styles.seg} ${statusFilter === s ? styles.segOn : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <Search value={search} onChange={e => setSearch(e.target.value)} placeholder="Search code or hotel..." />
      </div>

      {/* ── Voucher grid ── */}
      {filtered.length === 0 ? (
        <Empty
          icon="M20 12V22H4V12 M22 7H2v5h20V7z"
          title="No vouchers found"
          desc="Try adjusting your filters or create a new voucher."
          action={<Btn onClick={openAdd}>Create Voucher</Btn>}
        />
      ) : (
        <div className={styles.voucherGrid}>
          {filtered.map(v => {
            const usagePct = Math.min(100, Math.round((v.used / v.usage_limit) * 100))
            const isExpired = v.status === 'expired'
            return (
              <div key={v.id} className={`${styles.vCard} ${isExpired ? styles.vCardDim : ''}`}>
                {/* Left accent strip */}
                <div className={`${styles.vStrip} ${v.scope === 'global' ? styles.vStripGlobal : styles.vStripHotel}`}>
                  <span className={styles.vValue}>
                    {v.type === 'percent' ? `${v.value}%` : `Rp${Number(v.value).toLocaleString('id-ID')}`}
                  </span>
                  <span className={styles.vType}>
                    {v.type === 'percent' ? 'off' : 'fixed'}
                  </span>
                </div>

                {/* Content */}
                <div className={styles.vContent}>
                  <div className={styles.vTopRow}>
                    <code className={styles.vCode}>{v.code}</code>
                    <div className={styles.vBadges}>
                      <Badge status={v.scope === 'global' ? 'global' : 'hotel'} />
                      <Badge status={v.membershipTier || 'none'} />
                      <Badge status={v.status} />
                    </div>
                  </div>

                  <div className={styles.vMeta}>
                    {v.scope === 'hotel' && v.hotel_name && (
                      <span className={styles.vHotel}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                        {v.hotel_name}
                      </span>
                    )}
                    {v.scope === 'hotel' && v.room_type && (
                      <span className={styles.vHotel}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M4 4h16v16H4z"/>
                          <path d="M4 9h16"/>
                        </svg>
                        {v.room_type}
                      </span>
                    )}
                    {v.scope === 'global' && (
                      <span className={styles.vHotel}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="2" y1="12" x2="22" y2="12"/>
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                        All hotels
                      </span>
                    )}
                    <span className={styles.vExpiry}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Expires {v.expiry_date}
                    </span>
                  </div>

                  {/* Usage bar */}
                  <div className={styles.vUsageRow}>
                    <div className={styles.vUsageBar}>
                      <div
                        className={`${styles.vUsageFill} ${usagePct >= 90 ? styles.vUsageFull : ''}`}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                    <span className={styles.vUsageText}>
                      {v.used}/{v.usage_limit} used ({usagePct}%)
                    </span>
                  </div>

                  {/* Actions */}
                  <div className={styles.vActions}>
                    <Btn variant="ghost" small onClick={() => openEdit(v)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </Btn>
                    <Btn danger small onClick={() => setConfirm(v.id)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                      Delete
                    </Btn>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Create New Voucher' : 'Edit Voucher'}
        width={560}
      >
        {errorMsg && (
          <div style={{
            background: '#fee',
            border: '1px solid #f99',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#c00',
            fontSize: '13px'
          }}>
            {errorMsg}
          </div>
        )}
        <div className={styles.modalGrid}>
          <Field label="Voucher Code" hint="Letters, numbers, hyphens only. Will be uppercased.">
            <Input
              placeholder="e.g. SUMMER25"
              value={form.code}
              onChange={set('code')}
              style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.08em' }}
            />
            {errors.code && <span className={styles.err}>{errors.code}</span>}
          </Field>

          <div className={styles.twoField}>
            <Field label="Discount Type">
              <Select value={form.type} onChange={set('type')}>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (£)</option>
              </Select>
            </Field>
            <Field label="Fixed Amount (Rp)">
              <Input
                type="number" min="1"
                placeholder="50000"
                value={form.value} onChange={set('value')}
              />
              {errors.value && <span className={styles.err}>{errors.value}</span>}
            </Field>
          </div>

          <Field label="Voucher Scope">
            <div className={styles.scopeCards}>
              {['global', 'hotel'].map(s => (
                <button
                  key={s} type="button"
                  className={`${styles.scopeCard} ${form.scope === s ? styles.scopeCardOn : ''}`}
                  onClick={() => setForm(f => ({ ...f, scope: s, hotel_id: '', hotel_name: '', room_type: '' }))}
                >
                  <div className={styles.scopeIcon}>
                    {s === 'global' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    )}
                  </div>
                  <div className={styles.scopeText}>
                    <strong>{s === 'global' ? 'Global' : 'Per Hotel'}</strong>
                    <span>{s === 'global' ? 'Applies to all hotels on the platform' : 'Applies to one specific hotel only'}</span>
                  </div>
                  {form.scope === s && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b4d5c" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </Field>

          {form.scope === 'hotel' && (
            <Field label="Select Hotel">
              <Select value={form.hotel_id} onChange={e => {
                const hotelId = e.target.value
                setForm(f => ({ ...f, hotel_id: hotelId, room_type: '' }))
                setErrors(er => ({ ...er, hotel_id: '', room_type: '' }))
              }}>
                <option value="">— Choose a hotel —</option>
                {approvedHotels.map(h => (
                  <option key={h.id} value={h.id}>{h.name} ({h.owner})</option>
                ))}
              </Select>
              {errors.hotel_id && <span className={styles.err}>{errors.hotel_id}</span>}
            </Field>
          )}

          {form.scope === 'hotel' && (
            <Field label={form.scope === 'hotel' ? 'Room Type (optional)' : 'Room Type'}>
              <Select
                value={form.room_type}
                onChange={set('room_type')}
                disabled={form.scope === 'hotel' && !form.hotel_id}
              >
                <option value="">— Any room type —</option>
                {roomTypesLoading ? (
                  <option value="">Loading room types...</option>
                ) : (
                  roomTypes.map(room => (
                    <option key={room.value} value={room.value}>
                      {room.label}
                    </option>
                  ))
                )}
              </Select>
              {errors.room_type && <span className={styles.err}>{errors.room_type}</span>}
            </Field>
          )}

          <div className={styles.twoField}>
            <Field label="Expiry Date">
              <Input type="date" value={form.expiry_date} onChange={set('expiry_date')} />
              {errors.expiry_date && <span className={styles.err}>{errors.expiry_date}</span>}
            </Field>
            <Field label="Usage Quota">
              <Input type="number" min="1" placeholder="100" value={form.usage_limit} onChange={set('usage_limit')} />
              {errors.usage_limit && <span className={styles.err}>{errors.usage_limit}</span>}
            </Field>
          </div>

          <Field label="Status">
            <Select value={form.status} onChange={set('status')}>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </Select>
          </Field>
        </div>

        {/* Preview strip */}
        <div className={styles.previewStrip}>
          <div className={`${styles.previewLeft} ${form.scope === 'global' ? styles.previewGlobal : styles.previewHotel}`}>
            <span>{form.type === 'percent' ? `${form.value || '?'}%` : `Rp${Number(form.value || 0).toLocaleString('id-ID')}`}</span>
            <span>{form.type === 'percent' ? 'off' : 'off'}</span>
          </div>
          <div className={styles.previewRight}>
            <code>{form.code || 'VOUCHER-CODE'}</code>
            <span>{form.scope === 'global' ? '🌐 All hotels' : form.hotel_name ? `🏨 ${form.hotel_name}${form.room_type ? ` · 🛏️ ${form.room_type}` : ''}` : '🏨 Select hotel'}</span>
          </div>
        </div>

        <div className={styles.modalActions}>
          <Btn variant="outline" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving...' : modal === 'add' ? 'Create Voucher' : 'Save Changes'}</Btn>
        </div>
      </Modal>

      {/* ── Delete confirm ── */}
      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        title="Delete Voucher"
        message="This voucher will be permanently removed. Guests who have already used it will not be affected."
        confirmLabel="Delete Voucher"
        confirmDanger
        disabled={deleting}
      />
      </>
      )}
    </AdminLayout>
  )
}