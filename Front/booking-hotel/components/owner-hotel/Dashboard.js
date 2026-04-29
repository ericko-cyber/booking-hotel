import OwnerLayout from './OwnerLayout'
import { StatCard, Card, StatusBadge, PageHeader } from './OwnerUI'
import { OWNER_HOTELS, OWNER_BOOKINGS, CURRENT_OWNER } from './OwnerData'
import styles from '../Dashboard.module.css'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function OwnerDashboard() {
  const myHotels = OWNER_HOTELS.filter((h) => h.ownerId === CURRENT_OWNER.id)
  const myHotelIds = myHotels.map((h) => h.id)
  const myBookings = OWNER_BOOKINGS.filter((b) => myHotelIds.includes(b.hotelId))

  const totalRevenue = myBookings.filter((b) => b.status === 'paid').reduce((s, b) => s + b.total, 0)
  const totalRooms = myHotels.reduce((s, h) => s + h.rooms, 0)
  const approvedHotels = myHotels.filter((h) => h.status === 'approved').length
  const pendingBookings = myBookings.filter((b) => b.status === 'pending').length

  const monthlyRevenue = MONTHS.map((month, index) => {
    const monthPaid = myBookings.filter((b) => {
      if (b.status !== 'paid') return false
      return new Date(b.checkIn).getMonth() === index
    })

    return {
      month,
      revenue: monthPaid.reduce((sum, b) => sum + b.total, 0),
    }
  })

  const maxRev = Math.max(1, ...monthlyRevenue.map((m) => m.revenue))
  const recentBookings = [...myBookings].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5)

  return (
    <OwnerLayout active="dashboard">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${CURRENT_OWNER.name} · ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      <div className={styles.statsGrid}>
        <StatCard
          label="Total Revenue"
          value={`£${totalRevenue.toLocaleString()}`}
          sub="From paid bookings"
          icon="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
          accent
        />
        <StatCard
          label="Total Bookings"
          value={myBookings.length}
          sub={`${pendingBookings} pending`}
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
        />
        <StatCard
          label="Active Hotels"
          value={approvedHotels}
          sub={`${myHotels.filter((h) => h.status === 'pending').length} pending review`}
          icon="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        />
        <StatCard
          label="Total Rooms"
          value={totalRooms}
          sub="Across all properties"
          icon="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3"
        />
      </div>

      <div className={styles.twoCol}>
        <Card>
          <div className={styles.chartHeader}>
            <div>
              <p className={styles.chartLabel}>Monthly Revenue</p>
              <p className={styles.chartTotal}>£{totalRevenue.toLocaleString()}</p>
            </div>
            <span className={styles.chartYear}>2024</span>
          </div>
          <div className={styles.barChart}>
            {monthlyRevenue.map((m) => (
              <div key={m.month} className={styles.barCol}>
                <div className={styles.barWrap}>
                  <div className={styles.bar} style={{ height: `${(m.revenue / maxRev) * 100}%` }} title={`£${m.revenue.toLocaleString()}`} />
                </div>
                <span className={styles.barMonth}>{m.month}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className={styles.cardTitleRow}>
            <p className={styles.cardTitle}>Your Properties</p>
            <a href="/owner/hotels" className={styles.cardLink}>View all →</a>
          </div>
          <div className={styles.hotelList}>
            {myHotels.map((h) => (
              <div key={h.id} className={styles.hotelRow}>
                <div className={styles.hotelThumb} style={{ background: h.photo }} />
                <div className={styles.hotelInfo}>
                  <p className={styles.hotelName}>{h.name}</p>
                  <p className={styles.hotelRooms}>{h.rooms} rooms</p>
                </div>
                <StatusBadge status={h.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className={styles.recentCard}>
        <div className={styles.cardTitleRow}>
          <p className={styles.cardTitle}>Recent Bookings</p>
          <a href="/owner/bookings" className={styles.cardLink}>View all →</a>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th><th>Guest</th><th>Hotel</th><th>Room</th><th>Check-in</th><th>Total</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id}>
                  <td className={styles.tdMono}>{b.id}</td>
                  <td>{b.guest}</td>
                  <td className={styles.tdMuted}>{b.hotel}</td>
                  <td className={styles.tdMuted}>{b.room}</td>
                  <td className={styles.tdMuted}>{b.checkIn}</td>
                  <td className={styles.tdBold}>£{b.total.toLocaleString()}</td>
                  <td><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </OwnerLayout>
  )
}
