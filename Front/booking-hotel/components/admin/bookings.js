import { useState } from 'react'
import AdminLayout from './AdminLayout'
import { PageHeader, Badge, Btn, Modal, Search } from './AdminUI'
import { ALL_BOOKINGS_ADMIN } from './AdminData'
import styles from './AdminBookings.module.css'

export default function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)

  const filtered = ALL_BOOKINGS_ADMIN.filter(b => {
    const ms = statusFilter === 'all' || b.status === statusFilter
    const mq = !search || b.guest.toLowerCase().includes(search.toLowerCase()) || b.hotel.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase())
    return ms && mq
  })

  const counts = { all: ALL_BOOKINGS_ADMIN.length, paid: ALL_BOOKINGS_ADMIN.filter(b => b.status === 'paid').length, pending: ALL_BOOKINGS_ADMIN.filter(b => b.status === 'pending').length, cancelled: ALL_BOOKINGS_ADMIN.filter(b => b.status === 'cancelled').length }
  const totalRev = ALL_BOOKINGS_ADMIN.filter(b => b.status === 'paid').reduce((s,b) => s+b.total, 0)
  const totalComm = ALL_BOOKINGS_ADMIN.filter(b => b.status === 'paid').reduce((s,b) => s+b.commission, 0)

  return (
    <AdminLayout active="bookings">
      <PageHeader eyebrow="Management" title="Booking Monitor" subtitle={`Platform revenue: £${totalRev.toLocaleString()} · Commission: £${totalComm.toLocaleString()}`} />

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

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>ID</th><th>Guest</th><th>Hotel</th><th>Room</th><th>Check-in</th><th>Nights</th><th>Total</th><th>Commission</th><th>Status</th><th></th></tr>
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
                <td className={styles.tdPrice}>£{b.total.toLocaleString()}</td>
                <td className={styles.tdComm}>{b.commission > 0 ? `£${b.commission}` : '—'}</td>
                <td><Badge status={b.status}/></td>
                <td><Btn variant="ghost" small onClick={e => { e.stopPropagation(); setDetail(b) }}>Details</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Booking Details" width={440}>
        {detail && (
          <div className={styles.detailContent}>
            <div className={styles.detailHeader}>
              <div><p className={styles.detailId}>{detail.id}</p><p className={styles.detailGuest}>{detail.guest}</p></div>
              <Badge status={detail.status}/>
            </div>
            {[['Hotel', detail.hotel], ['Room', detail.room], ['Check-in', detail.checkIn], ['Check-out', detail.checkOut], ['Duration', `${detail.nights} nights`], ['Total', `£${detail.total.toLocaleString()}`], ['Platform Commission (10%)', detail.commission > 0 ? `£${detail.commission}` : '—']].map(([l,v]) => (
              <div key={l} className={styles.detailRow}><span>{l}</span><strong>{v}</strong></div>
            ))}
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}