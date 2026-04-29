import AdminLayout from './AdminLayout'
import { StatCard, Card, CardTitle, Badge, PageHeader } from './AdminUI'
import { ALL_USERS, ALL_HOTELS_ADMIN, ALL_BOOKINGS_ADMIN, PLATFORM_MONTHLY } from './AdminData'
import styles from './Admindashboard.module.css'

export default function AdminDashboard() {
  const totalRevenue = ALL_BOOKINGS_ADMIN.filter(b => b.status === 'paid').reduce((s, b) => s + b.total, 0)
  const platformCommission = ALL_BOOKINGS_ADMIN.filter(b => b.status === 'paid').reduce((s, b) => s + b.commission, 0)
  const pendingHotels = ALL_HOTELS_ADMIN.filter(h => h.status === 'pending').length
  const maxRev = Math.max(...PLATFORM_MONTHLY.map(m => m.revenue))
  const maxBook = Math.max(...PLATFORM_MONTHLY.map(m => m.bookings))

  const recentBookings = [...ALL_BOOKINGS_ADMIN].slice(-5).reverse()
  const pendingList = ALL_HOTELS_ADMIN.filter(h => h.status === 'pending')

  return (
    <AdminLayout active="dashboard">
      <PageHeader
        eyebrow="Admin Console"
        title="Platform Overview"
        subtitle={`${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        <StatCard label="Total Users" value={ALL_USERS.length.toLocaleString()} sub={`${ALL_USERS.filter(u => u.role === 'owner').length} hotel owners`} icon="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8" trend={12} />
        <StatCard label="Total Hotels" value={ALL_HOTELS_ADMIN.length} sub={`${pendingHotels} awaiting approval`} icon="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" trend={8} accent />
        <StatCard label="Total Bookings" value={ALL_BOOKINGS_ADMIN.length} sub={`${ALL_BOOKINGS_ADMIN.filter(b => b.status === 'pending').length} pending`} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" trend={18} />
        <StatCard label="Platform Revenue" value={`£${totalRevenue.toLocaleString()}`} sub={`£${platformCommission.toLocaleString()} commission (10%)`} icon="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" trend={22} />
      </div>

      {/* ── Charts row ── */}
      <div className={styles.chartsRow}>
        {/* Revenue Chart */}
        <Card>
          <CardTitle>Monthly Revenue & Bookings</CardTitle>
          <div className={styles.dualChart}>
            {PLATFORM_MONTHLY.map(m => (
              <div key={m.month} className={styles.dualCol}>
                <div className={styles.dualBars}>
                  <div className={styles.revBar} style={{ height: `${(m.revenue / maxRev) * 100}%` }} title={`£${m.revenue.toLocaleString()}`} />
                  <div className={styles.bookBar} style={{ height: `${(m.bookings / maxBook) * 100}%` }} title={`${m.bookings} bookings`} />
                </div>
                <span className={styles.dualMonth}>{m.month}</span>
              </div>
            ))}
          </div>
          <div className={styles.legend}>
            <span className={styles.legendRev}><span/>Revenue</span>
            <span className={styles.legendBook}><span/>Bookings</span>
          </div>
        </Card>

        {/* Quick stats */}
        <div className={styles.quickStats}>
          <Card>
            <CardTitle>Hotel Status</CardTitle>
            {[
              { label: 'Approved', count: ALL_HOTELS_ADMIN.filter(h => h.status === 'approved').length, color: '#1e7a3a', pct: null },
              { label: 'Pending',  count: ALL_HOTELS_ADMIN.filter(h => h.status === 'pending').length,  color: '#b07d1a', pct: null },
              { label: 'Rejected', count: ALL_HOTELS_ADMIN.filter(h => h.status === 'rejected').length, color: '#c0392b', pct: null },
            ].map(s => (
              <div key={s.label} className={styles.miniRow}>
                <span className={styles.miniDot} style={{ background: s.color }} />
                <span className={styles.miniLabel}>{s.label}</span>
                <strong>{s.count}</strong>
              </div>
            ))}
          </Card>

          <Card>
            <CardTitle>User Breakdown</CardTitle>
            {[
              { label: 'Guests',  count: ALL_USERS.filter(u => u.role === 'user').length,  color: '#1a5aaa' },
              { label: 'Owners',  count: ALL_USERS.filter(u => u.role === 'owner').length, color: '#6a2aaa' },
              { label: 'Admins',  count: ALL_USERS.filter(u => u.role === 'admin').length, color: '#8a6010' },
            ].map(s => (
              <div key={s.label} className={styles.miniRow}>
                <span className={styles.miniDot} style={{ background: s.color }} />
                <span className={styles.miniLabel}>{s.label}</span>
                <strong>{s.count}</strong>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className={styles.bottomRow}>
        {/* Pending approvals */}
        <Card>
          <CardTitle action={<a href="/admin/hotels" className={styles.link}>View all →</a>}>
            Pending Approvals
          </CardTitle>
          {pendingList.length === 0 ? (
            <p className={styles.emptyMsg}>No hotels awaiting approval.</p>
          ) : (
            <div className={styles.pendingList}>
              {pendingList.map(h => (
                <div key={h.id} className={styles.pendingRow}>
                  <div className={styles.pendingThumb} style={{ background: h.photo }} />
                  <div className={styles.pendingInfo}>
                    <p className={styles.pendingName}>{h.name}</p>
                    <p className={styles.pendingMeta}>{h.owner} · {h.submitted}</p>
                  </div>
                  <Badge status="pending" />
                  <a href="/admin/hotels" className={styles.reviewLink}>Review →</a>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent bookings */}
        <Card>
          <CardTitle action={<a href="/admin/bookings" className={styles.link}>View all →</a>}>
            Recent Bookings
          </CardTitle>
          <div className={styles.recentList}>
            {recentBookings.map(b => (
              <div key={b.id} className={styles.recentRow}>
                <div className={styles.recentAvatar}>{b.guest[0]}</div>
                <div className={styles.recentInfo}>
                  <p className={styles.recentGuest}>{b.guest}</p>
                  <p className={styles.recentHotel}>{b.hotel} · {b.room}</p>
                </div>
                <div className={styles.recentRight}>
                  <p className={styles.recentPrice}>£{b.total.toLocaleString()}</p>
                  <Badge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}