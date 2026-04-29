import { useState } from 'react'
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

const fmt = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BookingPanel({ hotel, onMembership, onVoucher }) {
  const t = today()
  const rooms = Array.isArray(hotel.rooms) && hotel.rooms.length > 0
    ? hotel.rooms
    : [{ name: 'Kamar Standar', price: hotel.price, available: true }]
  const [checkIn, setCheckIn] = useState(addDays(t, 1))
  const [checkOut, setCheckOut] = useState(addDays(t, 4))
  const [guests, setGuests] = useState(2)
  const [selectedRoom, setSelectedRoom] = useState(rooms.find(r => r.available)?.name || rooms[0].name)
  const [voucher, setVoucher] = useState('')
  const [voucherApplied, setVoucherApplied] = useState(false)
  const [voucherErr, setVoucherErr] = useState(false)
  const [booked, setBooked] = useState(false)
  const [saved, setSaved] = useState(false)

  const nights = diffDays(checkIn, checkOut)
  const room = rooms.find(r => r.name === selectedRoom) || rooms[0]
  const basePrice = (room?.price || hotel.price) * nights
  const taxRate = 0.10
  const discount = voucherApplied ? 250 : 0
  const taxes = Math.round(basePrice * taxRate)
  const total = basePrice + taxes - discount

  const applyVoucher = () => {
    if (voucher.toUpperCase().startsWith('SL-')) {
      setVoucherApplied(true)
      setVoucherErr(false)
    } else {
      setVoucherErr(true)
      setVoucherApplied(false)
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
            <div><span>Total</span><strong>£{total.toLocaleString()}</strong></div>
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
            <span>£</span><strong>{hotel.price.toLocaleString()}</strong>
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
            onChange={e => setCheckOut(e.target.value)}
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
        <label>Guests</label>
        <div className={styles.guestStepper}>
          <button onClick={() => setGuests(g => Math.max(1, g - 1))}>−</button>
          <span>{guests}</span>
          <button onClick={() => setGuests(g => Math.min(8, g + 1))}>+</button>
        </div>
      </div>

      <div className={styles.roomSelect}>
        <label>Room Type</label>
        <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
          {rooms.filter(r => r.available).map(r => (
            <option key={r.name} value={r.name}>{r.name} — £{r.price}/night</option>
          ))}
        </select>
      </div>

      <div className={styles.breakdown}>
        <div className={styles.breakdownRow}>
          <span>£{(room?.price || hotel.price).toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''}</span>
          <span>£{basePrice.toLocaleString()}</span>
        </div>
        <div className={styles.breakdownRow}>
          <span>Taxes & fees (10%)</span>
          <span>£{taxes.toLocaleString()}</span>
        </div>
        {voucherApplied && (
          <div className={`${styles.breakdownRow} ${styles.discountRow}`}>
            <span>Voucher discount</span>
            <span>−£{discount.toLocaleString()}</span>
          </div>
        )}
        <div className={`${styles.breakdownRow} ${styles.totalRow}`}>
          <strong>Total</strong>
          <strong>£{total.toLocaleString()}</strong>
        </div>
      </div>

      <div className={styles.voucherBlock}>
        <label>Sanctuary Voucher</label>
        <div className={styles.voucherInput}>
          <input
            type="text"
            placeholder="Enter code e.g. SL-SUMMER24"
            value={voucher}
            onChange={e => { setVoucher(e.target.value); setVoucherErr(false); setVoucherApplied(false) }}
            className={voucherErr ? styles.voucherInputErr : voucherApplied ? styles.voucherInputOk : ''}
          />
          <button onClick={applyVoucher}>Apply</button>
        </div>
        {voucherApplied && <p className={styles.voucherOk}>✓ £250 voucher applied</p>}
        {voucherErr && <p className={styles.voucherErrMsg}>Invalid code. Try SL-SUMMER24</p>}
        <button className={styles.viewVoucherLink} onClick={onVoucher}>View my vouchers →</button>
      </div>

      <button className={styles.bookBtn} onClick={() => setBooked(true)}>
        Reserve Now
      </button>

      <div className={styles.memberNote}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <span>
          <a onClick={onMembership} style={{ cursor: 'pointer' }}>Sanctuary Club members</a>
          {' '}get priority access & up to £1,500 in annual vouchers.
        </span>
      </div>
    </div>
  )
}
