import { useEffect, useMemo, useState } from 'react'
import AdminLayout from './AdminLayout'
import { PageHeader, Badge, Btn, Modal, Search } from './AdminUI'
import { adminService } from '../../services/adminService'
import styles from './AdminBookings.module.css'

const toNumber = (value) => Number(value || 0)

const readNullString = (value) => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value.Valid) return value.String || ''
  return ''
}

const formatDate = (value) => {
  if (!value) return '-'
  const raw = String(value)
  if (raw.length >= 10) return raw.slice(0, 10)
  return raw
}

const formatCurrency = (value) => `Rp ${toNumber(value).toLocaleString('id-ID')}`

const normalizeBooking = (booking) => {
  const paymentStatus = booking?.payment_status || ''
  const bookingStatus = booking?.status || 'pending'
  const status = bookingStatus === 'cancelled'
    ? 'cancelled'
    : paymentStatus === 'paid' || paymentStatus === 'success'
      ? 'paid'
      : 'pending'

  const total = toNumber(booking?.total_price ?? booking?.total)

  return {
    id: booking?.booking_code || booking?.id,
    rawId: booking?.id,
    guest: readNullString(booking?.guest_name) || readNullString(booking?.user_name) || 'Guest',
    hotel: readNullString(booking?.hotel_name) || booking?.hotel?.name || `Hotel #${booking?.hotel_id || '-'}`,
    room: readNullString(booking?.room_name) || booking?.room?.name || `Room #${booking?.room_id || '-'}`,
    checkIn: formatDate(booking?.check_in || booking?.checkIn),
    checkOut: formatDate(booking?.check_out || booking?.checkOut),
    nights: toNumber(booking?.nights),
    total,
    commission: status === 'paid' ? Math.round(total * 0.1) : 0,
    status,
    bookingStatus,
    paymentStatus,
    guestEmail: readNullString(booking?.guest_email),
    guestPhone: readNullString(booking?.guest_phone),
    specialNotes: readNullString(booking?.special_notes),
    createdAt: booking?.created_at || booking?.createdAt,
  }
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    const loadBookings = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await adminService.getAllBookings({ page: 1, page_size: 100 })
        const items = Array.isArray(response?.bookings) ? response.bookings.map(normalizeBooking) : []

        if (alive) {
          setBookings(items)
        }
      } catch (err) {
        if (alive) {
          setError(err?.message || 'Failed to load bookings')
          setBookings([])
        }
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }

    loadBookings()

    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => bookings.filter(b => {
    const ms = statusFilter === 'all' || b.status === statusFilter
    const query = search.toLowerCase()
    const mq = !query
      || b.guest.toLowerCase().includes(query)
      || b.hotel.toLowerCase().includes(query)
      || String(b.id).toLowerCase().includes(query)
    return ms && mq
  }), [bookings, search, statusFilter])

  const counts = {
    all: bookings.length,
    paid: bookings.filter(b => b.status === 'paid').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }
  const totalRev = bookings.filter(b => b.status === 'paid').reduce((s, b) => s + b.total, 0)
  const totalComm = bookings.filter(b => b.status === 'paid').reduce((s, b) => s + b.commission, 0)

  return (
    <AdminLayout active="bookings">
      <PageHeader eyebrow="Management" title="Booking Monitor" subtitle={`Platform revenue: ${formatCurrency(totalRev)} · Commission: ${formatCurrency(totalComm)}`} />

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {['all','paid','pending','cancelled'].map(s => (
            <button key={s} className={`${styles.tab} ${statusFilter === s ? styles.tabOn : ''}`} onClick={() => setStatusFilter(s)}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
              <span className={styles.cnt}>{counts[s]}</span>
            </button>
          ))}
        </div>
        <Search value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings..." />
      </div>

      {loading && <div className={styles.stateBox}>Memuat data booking...</div>}
      {!loading && error && <div className={styles.stateBox}>⚠ {error}</div>}
      {!loading && !error && filtered.length === 0 && <div className={styles.stateBox}>Tidak ada booking ditemukan.</div>}

      {!loading && !error && filtered.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Code</th><th>Guest</th><th>Hotel</th><th>Room</th><th>Check-in</th><th>Nights</th><th>Total</th><th>Commission</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className={styles.tr} onClick={() => setDetail(b)}>
                  <td className={styles.tdId}>{b.id}</td>
                  <td><div className={styles.guestCell}><div className={styles.gavt}>{b.guest[0]}</div><span>{b.guest}</span></div></td>
                  <td className={styles.tdMuted}>{b.hotel}</td>
                  <td className={styles.tdMuted}>{b.room}</td>
                  <td className={styles.tdMuted}>{b.checkIn}</td>
                  <td className={styles.tdCenter}>{b.nights}n</td>
                  <td className={styles.tdPrice}>{formatCurrency(b.total)}</td>
                  <td className={styles.tdComm}>{b.commission > 0 ? formatCurrency(b.commission) : '—'}</td>
                  <td><Badge status={b.status}/></td>
                  <td><Btn variant="ghost" small onClick={e => { e.stopPropagation(); setDetail(b) }}>Details</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Booking Details" width={440}>
        {detail && (
          <div className={styles.detailContent}>
            <div className={styles.detailHeader}>
              <div><p className={styles.detailId}>{detail.id}</p><p className={styles.detailGuest}>{detail.guest}</p></div>
              <Badge status={detail.status}/>
            </div>
            {[['Hotel', detail.hotel], ['Room', detail.room], ['Check-in', detail.checkIn], ['Check-out', detail.checkOut], ['Duration', `${detail.nights} nights`], ['Total', formatCurrency(detail.total)], ['Platform Commission (10%)', detail.commission > 0 ? formatCurrency(detail.commission) : '—'], ['Booking Status', detail.bookingStatus], ['Payment Status', detail.paymentStatus || '-'], ['Guest Email', detail.guestEmail || '-'], ['Guest Phone', detail.guestPhone || '-']].map(([l,v]) => (
              <div key={l} className={styles.detailRow}><span>{l}</span><strong>{v}</strong></div>
            ))}
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}