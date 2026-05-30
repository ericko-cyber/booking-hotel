import { useState } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { benefitService } from '../../services/benefitService'
import { voucherService } from '../../services/voucherService'
import { bookingService } from '../../services/bookingService'
import { authService } from '../../services/authService'
import styles from './BookingPanel.module.css'

const today = () => {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

const addDays = (dateStr, n) => {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

const diffDays = (a, b) => {
  const da = new Date(a), db = new Date(b)
  return Math.max(1, Math.round((db - da) / 86400000))
}

const money = (value) => Number(value || 0).toLocaleString('id-ID')

// Stored prices are in full rupiah units (e.g. 450000 means Rp450.000).
const rupiah = (value) => `Rp${Number(value || 0).toLocaleString('id-ID')}`

const MEMBERSHIP_DISCOUNT_DEFAULTS = {
  silver: 5,
  gold: 10,
  platinum: 15,
}

const extractPercentFromText = (value) => {
  if (!value) return null
  const match = String(value).match(/(\d+(?:\.\d+)?)\s*%/)
  if (!match) return null

  const parsed = Number(match[1])
  return Number.isNaN(parsed) ? null : parsed
}

const normalizeTier = (tierValue) => (tierValue || '').toString().trim().toLowerCase()

const resolveBenefitTier = (benefit) => normalizeTier(
  benefit?.membershipTier ??
  benefit?.membership_tier ??
  benefit?.tier ??
  ''
)

const resolveDiscountPercent = (benefit) => {
  const raw =
    benefit?.discountPercent ??
    benefit?.discount_percent ??
    benefit?.discountValue ??
    benefit?.discount_value ??
    benefit?.value ??
    benefit?.discount ??
    null

  if (raw != null && raw !== '') {
    const value = typeof raw === 'string'
      ? Number(raw.replace(/%/g, '').replace(/,/g, '').trim())
      : Number(raw)

    if (!Number.isNaN(value) && value > 0) {
      return value
    }
  }

  const textFallback = extractPercentFromText(benefit?.description) ?? extractPercentFromText(benefit?.title)
  if (textFallback != null) {
    return textFallback
  }

  return MEMBERSHIP_DISCOUNT_DEFAULTS[resolveBenefitTier(benefit)] || 0
}

const pickBestDiscountBenefit = (allDiscounts, tierId) => {
  const normalizedTierId = normalizeTier(tierId)
  const candidates = allDiscounts.filter((item) => resolveBenefitTier(item) === normalizedTierId)
  if (!candidates.length) return null

  const withValue = candidates.filter((item) => resolveDiscountPercent(item) > 0)
  if (withValue.length) {
    return withValue.sort((a, b) => resolveDiscountPercent(b) - resolveDiscountPercent(a))[0]
  }

  return candidates[0]
}

const formatMemberTier = (tier) => {
  const normalized = normalizeTier(tier)
  if (!normalized || normalized === 'none') return 'Member'
  return `Member ${normalized.charAt(0).toUpperCase() + normalized.slice(1)}`
}

const fmt = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BookingPanel({ hotel, onMembership, onVoucher }) {
  const router = useRouter()
  const t = today()
  const rooms = Array.isArray(hotel.rooms) && hotel.rooms.length > 0
    ? hotel.rooms
    : [{ name: 'Kamar Standar', price: hotel.price, available: true, capacity: 2 }]
  const [checkIn, setCheckIn] = useState(addDays(t, 1))
  const [checkOut, setCheckOut] = useState(addDays(t, 4))
  const [guests, setGuests] = useState(Math.min(2, Math.max(1, Number(rooms.find(r => r.available)?.capacity || rooms[0]?.capacity || 2))))
  const [selectedRoom, setSelectedRoom] = useState(rooms.find(r => r.available)?.name || rooms[0].name)
  const [voucher, setVoucher] = useState('')
  const [voucherApplied, setVoucherApplied] = useState(false)
  const [voucherErr, setVoucherErr] = useState(false)
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherDiscount, setVoucherDiscount] = useState(0)
  const [voucherMessage, setVoucherMessage] = useState('')
  const [booked, setBooked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [membershipDiscountRate, setMembershipDiscountRate] = useState(0)
  const [membershipDiscountLabel, setMembershipDiscountLabel] = useState('')

  const nights = diffDays(checkIn, checkOut)
  const room = rooms.find(r => r.name === selectedRoom) || rooms[0]
  const maxGuests = Math.max(1, Number(room?.capacity || hotel.max_guests || room?.size || 1))
  const roomPrice = Number(room?.price || hotel.price || 0)
  const basePrice = roomPrice * nights
  const taxRate = 0.10
  const membershipDiscount = Math.round(basePrice * (membershipDiscountRate / 100))
  const discount = voucherApplied ? voucherDiscount : 0
  const taxes = Math.round(basePrice * taxRate)
  const total = Math.max(0, basePrice + taxes - membershipDiscount - discount)
  const hasMembershipDiscount = membershipDiscount > 0
  const discountSummary = [
    hasMembershipDiscount ? `${membershipDiscountLabel || 'Member'} diskon ${membershipDiscountRate}%` : null,
    voucherApplied ? 'Voucher diterapkan' : null,
  ].filter(Boolean)

  useEffect(() => {
    if (guests <= maxGuests) return
    const t = setTimeout(() => {
      setGuests((current) => Math.min(current, maxGuests))
    }, 0)
    return () => clearTimeout(t)
  }, [maxGuests, guests])

  useEffect(() => {
    let cancelled = false

    const fetchMembershipDiscount = async () => {
      try {
        if (!authService.isAuthenticated()) {
          if (!cancelled) {
            setMembershipDiscountRate(0)
            setMembershipDiscountLabel('')
          }
          return
        }

        const user = authService.getUser()
        const tier = normalizeTier(user?.membership_tier || user?.level_name || user?.tier || 'none')
        if (!tier || tier === 'none') {
          if (!cancelled) {
            setMembershipDiscountRate(0)
            setMembershipDiscountLabel('')
          }
          return
        }

        const benefits = await benefitService.getBenefits({ status: 'active', type: 'discount' })
        const matchedBenefit = pickBestDiscountBenefit(benefits, tier)
        const rate = matchedBenefit ? resolveDiscountPercent(matchedBenefit) : 0

        if (!cancelled) {
          setMembershipDiscountRate(rate)
          setMembershipDiscountLabel(formatMemberTier(tier))
        }
      } catch (error) {
        const user = authService.getUser()
        const tier = normalizeTier(user?.membership_tier || user?.level_name || user?.tier || 'none')
        if (!cancelled) {
          setMembershipDiscountRate(MEMBERSHIP_DISCOUNT_DEFAULTS[tier] || 0)
          setMembershipDiscountLabel(formatMemberTier(tier))
        }
      }
    }

    fetchMembershipDiscount()

    return () => {
      cancelled = true
    }
  }, [])

  const handleReserveNow = async () => {
    setBookingError('')
    const selectedVoucherCode = voucherApplied && voucher.trim()
      ? voucher.trim().toUpperCase()
      : ''

    if (!room?.id) {
      setBookingError('Data kamar tidak lengkap. Silakan pilih kamar lain.')
      return
    }

    setBookingLoading(true)
    try {
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        setBookingError('Silakan login terlebih dahulu untuk melanjutkan booking.')
        router.push('/login')
        return
      }

      // Create booking in database
      const bookingData = {
        room_id: room.id,
        hotel_id: hotel.id,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guests,
        voucher_code: selectedVoucherCode,
      }

      const response = await bookingService.createBooking(bookingData)
      // API response structure: { success, message, data: { booking, payment, checkout_url } }
      const payload = response?.data?.data || response?.data || response || {}
      const booking = payload?.booking || payload?.Booking || payload?.data?.booking || payload?.data?.Booking
      const payment = payload?.payment || payload?.Payment || payload?.data?.payment || payload?.data?.Payment
      
      if (!booking?.id) {
        setBookingError('Gagal membuat booking. Silakan coba lagi.')
        return
      }

      const paymentId = payment?.id || payload?.payment_id || payload?.paymentId || payload?.data?.payment_id || payload?.data?.paymentId
      const checkoutUrl =
        payload?.checkout_url ||
        payload?.redirect_url ||
        payload?.checkoutUrl ||
        payload?.data?.checkout_url ||
        payload?.data?.redirect_url ||
        payload?.data?.checkoutUrl ||
        payment?.checkout_url ||
        payment?.redirect_url ||
        payment?.checkoutUrl

      // If Midtrans checkout URL is provided, redirect user immediately to Midtrans
      if (checkoutUrl) {
        window.location.assign(checkoutUrl)
        return
      }

      if (paymentId) {
        await router.push(`/payment/${paymentId}`)
        return
      }

      setBookingError('Midtrans checkout belum tersedia. Silakan coba lagi.')
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Gagal membuat booking. Silakan coba lagi.'
      setBookingError(errorMessage)
    } finally {
      setBookingLoading(false)
    }
  }

  const applyVoucher = async () => {
    const code = voucher.trim().toUpperCase()
    if (!code) {
      setVoucherErr(true)
      setVoucherApplied(false)
      setVoucherMessage('Masukkan kode voucher terlebih dahulu.')
      return
    }

    setVoucherLoading(true)
    try {
      const result = await voucherService.validateVoucher(code, {
        booking_amount: basePrice,
        hotel_id: hotel.id,
        room_type: room?.name,
      })

      if (!result?.valid) {
        setVoucherErr(true)
        setVoucherApplied(false)
        setVoucherDiscount(0)
        setVoucherMessage(result?.message || 'Kode voucher tidak valid.')
        return
      }

      setVoucherApplied(true)
      setVoucherErr(false)
      setVoucherDiscount(Number(result?.discount || 0))
      setVoucherMessage(result?.message || `Voucher ${code} berhasil diterapkan.`)
    } catch (error) {
      setVoucherErr(true)
      setVoucherApplied(false)
      setVoucherDiscount(0)
      const message = typeof error === 'string'
        ? error
        : error?.message || 'Gagal memvalidasi voucher.'
      setVoucherMessage(message)
    } finally {
      setVoucherLoading(false)
    }
  }

  if (booked) {
    return (
      <div className={styles.panel}>
        <div className={styles.bookingSuccess}>
          <div className={styles.successIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3>Booking Confirmed!</h3>
          <p>Your reservation at <strong>{hotel.name}</strong> has been received. Check your email for the confirmation details.</p>
          <div className={styles.confirmDetails}>
            <div><span>Check-in</span><strong>{fmt(checkIn)}</strong></div>
            <div><span>Check-out</span><strong>{fmt(checkOut)}</strong></div>
            <div><span>Room</span><strong>{selectedRoom}</strong></div>
            <div><span>Guests</span><strong>{guests}</strong></div>
            <div><span>Total</span><strong>{rupiah(total)}</strong></div>
          </div>
          <button className={styles.newBookingBtn} onClick={() => setBooked(false)}>
            Modify Booking
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.priceDisplay}>
          <span className={styles.from}>From</span>
          <div className={styles.priceNum}>
            <span>Rp</span><strong>{money(hotel.price)}</strong>
          </div>
          <span className={styles.perNight}>/ night</span>
        </div>
        <button
          className={`${styles.saveBtn} ${saved ? styles.saveBtnActive : ''}`}
          onClick={() => setSaved(s => !s)}
          title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24"
            fill={saved ? '#e05a5a' : 'none'}
            stroke={saved ? '#e05a5a' : 'currentColor'} strokeWidth="2" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      <div className={styles.dateRow}>
        <div className={styles.dateField}>
          <label>Check-in</label>
          <input
            type="date"
            value={checkIn}
            min={addDays(t, 1)}
            onChange={e => {
              setCheckIn(e.target.value)
              setVoucher('')
              setVoucherApplied(false)
              setVoucherDiscount(0)
              setVoucherErr(false)
              setVoucherMessage('')
              if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 3))
            }}
          />
        </div>
        <div className={styles.dateSep}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
        <div className={styles.dateField}>
          <label>Check-out</label>
          <input
            type="date"
            value={checkOut}
            min={addDays(checkIn, 1)}
            onChange={e => {
              setCheckOut(e.target.value)
              setVoucher('')
              setVoucherApplied(false)
              setVoucherDiscount(0)
              setVoucherErr(false)
              setVoucherMessage('')
            }}
          />
        </div>
      </div>

      <div className={styles.nightsSummary}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        {nights} night{nights !== 1 ? 's' : ''} · {fmt(checkIn)} – {fmt(checkOut)}
      </div>

      <div className={styles.guestRow}>
        <label>Guests <span style={{ color: '#999', fontWeight: 500 }}>(max {maxGuests})</span></label>
        <div className={styles.guestStepper}>
          <button onClick={() => setGuests(g => Math.max(1, g - 1))}>−</button>
          <span>{guests}</span>
          <button onClick={() => setGuests(g => Math.min(maxGuests, g + 1))}>+</button>
        </div>
      </div>

      <div className={styles.roomSelect}>
        <label>Room Type</label>
        <select
          value={selectedRoom}
          onChange={e => {
            setSelectedRoom(e.target.value)
            setVoucher('')
            setVoucherApplied(false)
            setVoucherDiscount(0)
            setVoucherErr(false)
            setVoucherMessage('')
          }}
        >
          {rooms.filter(r => r.available).map(r => (
            <option key={r.name} value={r.name}>{r.name} — {rupiah(r.price)}/night</option>
          ))}
        </select>
      </div>

      <div className={styles.breakdown}>
        <div className={styles.breakdownRow}>
          <span>{rupiah(room?.price || hotel.price)} × {nights} night{nights !== 1 ? 's' : ''}</span>
          <span>{rupiah(basePrice)}</span>
        </div>
        <div className={styles.breakdownRow}>
          <span>Taxes & fees (10%)</span>
          <span>{rupiah(taxes)}</span>
        </div>
        {hasMembershipDiscount && (
          <div className={`${styles.breakdownRow} ${styles.discountRow}`}>
            <span>{membershipDiscountLabel || 'Member'} discount</span>
            <span>−{rupiah(membershipDiscount)}</span>
          </div>
        )}
        {voucherApplied && (
          <div className={`${styles.breakdownRow} ${styles.discountRow}`}>
            <span>Voucher discount</span>
            <span>−{rupiah(discount)}</span>
          </div>
        )}
        <div className={`${styles.breakdownRow} ${styles.totalRow}`}>
          <strong>Total</strong>
          <strong>{rupiah(total)}</strong>
        </div>
      </div>

      {discountSummary.length > 0 && (
        <div className={styles.savingsBanner}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2v20M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7" />
          </svg>
          <span>
            {hasMembershipDiscount ? `Hemat ${rupiah(membershipDiscount)} dengan ${membershipDiscountLabel || 'membership'}.` : 'Membership aktif akan mendapat diskon otomatis.'}
          </span>
        </div>
      )}

      <div className={styles.voucherBlock}>
        <label>Sanctuary Voucher</label>
        <div className={styles.voucherInput}>
          <input
            type="text"
            placeholder="Enter code e.g. SL-SUMMER24"
            value={voucher}
            onChange={e => { setVoucher(e.target.value); setVoucherErr(false); setVoucherApplied(false); setVoucherMessage(''); setVoucherDiscount(0) }}
            className={voucherErr ? styles.voucherInputErr : voucherApplied ? styles.voucherInputOk : ''}
          />
          <button onClick={applyVoucher} disabled={voucherLoading}>{voucherLoading ? '...' : 'Apply'}</button>
        </div>
        {voucherApplied && <p className={styles.voucherOk}>✓ {voucherMessage || 'Voucher applied'}</p>}
        {voucherErr && <p className={styles.voucherErrMsg}>{voucherMessage || 'Invalid code.'}</p>}
        <button className={styles.viewVoucherLink} onClick={onVoucher}>View my vouchers →</button>
      </div>

      <button className={styles.bookBtn} onClick={handleReserveNow} disabled={bookingLoading}>
        {bookingLoading ? 'Processing...' : 'Reserve Now'}
      </button>

      {bookingError && <p style={{ color: '#b42318', marginTop: 12, fontSize: 13 }}>{bookingError}</p>}

      <div className={styles.memberNote}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <span>
          <a onClick={onMembership} style={{ cursor: 'pointer' }}>Sanctuary Club members</a>
          {' '}get priority access & up to Rp1.500.000 in annual vouchers.
        </span>
      </div>
    </div>
  )
}
