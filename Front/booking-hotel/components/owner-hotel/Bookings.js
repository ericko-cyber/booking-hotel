import { useState } from 'react'
import OwnerLayout from './OwnerLayout'
import { PageHeader, StatusBadge, Btn, Modal, Empty } from './OwnerUI'
import { OWNER_BOOKINGS, OWNER_HOTELS, CURRENT_OWNER } from './OwnerData'
import styles from '../Bookings.module.css'

export default function OwnerBookings() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [detail, setDetail] = useState(null)

  const myHotelIds = OWNER_HOTELS.filter((h) => h.ownerId === CURRENT_OWNER.id).map((h) => h.id)
  const myBookings = OWNER_BOOKINGS.filter((b) => myHotelIds.includes(b.hotelId))

  const filtered = myBookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (dateFilter && b.checkIn < dateFilter) return false
    return true
  })

  const counts = {
    all: myBookings.length,
    paid: myBookings.filter(b => b.status === 'paid').length,
    pending: myBookings.filter(b => b.status === 'pending').length,
    cancelled: myBookings.filter(b => b.status === 'cancelled').length,
  }

  return (
    <OwnerLayout active="bookings">
      <PageHeader
        title="Booking Management"
        subtitle={`${counts.all} total · ${counts.pending} pending · ${counts.paid} paid`}
      />

      {/* ── Filters ── */}
      <div className={styles.filterBar}>
        <div className={styles.statusTabs}>
          {['all', 'paid', 'pending', 'cancelled'].map(s => (
            <button
              key={s}
              className={`${styles.sTab} ${statusFilter === s ? styles.sTabActive : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className={styles.sCount}>{counts[s]}</span>
            </button>
          ))}
        </div>
        <div className={styles.dateFilter}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            placeholder="Filter from date"
          />
          {dateFilter && (
            <button className={styles.clearDate} onClick={() => setDateFilter('')}>×</button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <Empty
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
          title={myHotelIds.length === 0 ? 'Belum ada hotel terdaftar' : 'No bookings found'}
          desc={myHotelIds.length === 0 ? 'Daftarkan hotel Anda terlebih dahulu agar bisa menerima booking.' : 'Try adjusting your filters.'}
          action={myHotelIds.length === 0 ? <Btn onClick={() => (window.location.href = '/owner/hotels')}>Daftarkan Hotel</Btn> : <Btn variant="outline" onClick={() => { setStatusFilter('all'); setDateFilter('') }}>Reset Filters</Btn>}
        />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Booking ID</th><th>Guest</th><th>Hotel</th><th>Room</th>
                <th>Check-in</th><th>Check-out</th><th>Nights</th><th>Total</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className={styles.tr} onClick={() => setDetail(b)}>
                  <td className={styles.tdId}>{b.id}</td>
                  <td className={styles.tdGuest}>
                    <div className={styles.guestAvatar}>{b.guest.split(' ').map(n => n[0]).join('')}</div>
                    {b.guest}
                  </td>
                  <td className={styles.tdMuted}>{b.hotel}</td>
                  <td className={styles.tdMuted}>{b.room}</td>
                  <td className={styles.tdDate}>{b.checkIn}</td>
                  <td className={styles.tdDate}>{b.checkOut}</td>
                  <td className={styles.tdCenter}>{b.nights}n</td>
                  <td className={styles.tdPrice}>£{b.total.toLocaleString()}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    <Btn variant="ghost" small onClick={e => { e.stopPropagation(); setDetail(b) }}>Details</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Booking detail modal ── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Booking Details" width={460}>
        {detail && (
          <div className={styles.detailContent}>
            <div className={styles.detailHeader}>
              <div>
                <p className={styles.detailId}>{detail.id}</p>
                <p className={styles.detailGuest}>{detail.guest}</p>
              </div>
              <StatusBadge status={detail.status} />
            </div>
            <div className={styles.detailGrid}>
              {[
                ['Hotel', detail.hotel],
                ['Room', detail.room],
                ['Check-in', detail.checkIn],
                ['Check-out', detail.checkOut],
                ['Duration', `${detail.nights} nights`],
                ['Total Amount', `£${detail.total.toLocaleString()}`],
              ].map(([label, value]) => (
                <div key={label} className={styles.detailItem}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className={styles.detailActions}>
              {detail.status === 'pending' && (
                <p className={styles.pendingNote}>This booking is awaiting payment confirmation from the guest.</p>
              )}
              {detail.status === 'cancelled' && (
                <p className={styles.cancelledNote}>This booking was cancelled. No revenue was collected.</p>
              )}
              <Btn variant="outline" onClick={() => setDetail(null)}>Close</Btn>
            </div>
          </div>
        )}
      </Modal>
    </OwnerLayout>
  )
}