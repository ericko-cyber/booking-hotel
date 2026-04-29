import { useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { PageHeader, Card, CardTitle, StatCard, Badge } from '../../components/admin/AdminUI'
import {
  ALL_USERS, ALL_HOTELS_ADMIN, ALL_BOOKINGS_ADMIN,
  PLATFORM_MONTHLY, MEMBERSHIP_LEVELS,
} from './AdminData'
import styles from './Analytics.module.css'

/* ── Helpers ── */
const fmt = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n)

export default function AdminAnalytics() {
  const [period, setPeriod]   = useState('12m')
  const [chartMode, setChartMode] = useState('revenue') // revenue | bookings | users

  /* ── Derived metrics ── */
  const paid      = ALL_BOOKINGS_ADMIN.filter(b => b.status === 'paid')
  const totalRev  = paid.reduce((s,b) => s + b.total, 0)
  const totalComm = paid.reduce((s,b) => s + b.commission, 0)
  const convRate  = Math.round((paid.length / ALL_BOOKINGS_ADMIN.length) * 100)
  const avgOrder  = Math.round(totalRev / Math.max(paid.length, 1))
  const totalMembers = MEMBERSHIP_LEVELS.reduce((s,l) => s + l.members, 0)

  /* ── Monthly slice by period ── */
  const monthSlice = period === '3m'
    ? PLATFORM_MONTHLY.slice(-3)
    : period === '6m'
    ? PLATFORM_MONTHLY.slice(-6)
    : PLATFORM_MONTHLY

  const maxVal = {
    revenue:  Math.max(...monthSlice.map(m => m.revenue)),
    bookings: Math.max(...monthSlice.map(m => m.bookings)),
    users:    Math.max(...monthSlice.map(m => m.users)),
  }

  /* ── Hotel performance ── */
  const hotelPerf = ALL_HOTELS_ADMIN.filter(h => h.status === 'approved').map(h => {
    const hBookings = ALL_BOOKINGS_ADMIN.filter(b => b.hotelId === h.id)
    const hPaid     = hBookings.filter(b => b.status === 'paid')
    return {
      ...h,
      totalBookings: hBookings.length,
      totalRevenue:  hPaid.reduce((s,b) => s + b.total, 0),
      convRate:      hBookings.length ? Math.round((hPaid.length / hBookings.length) * 100) : 0,
    }
  }).sort((a,b) => b.totalRevenue - a.totalRevenue)

  const topHotelRev = hotelPerf[0]?.totalRevenue || 1

  /* ── Booking status breakdown ── */
  const statusBreakdown = [
    { label: 'Paid',      count: ALL_BOOKINGS_ADMIN.filter(b => b.status === 'paid').length,      color: '#1b4d5c', pct: 0 },
    { label: 'Pending',   count: ALL_BOOKINGS_ADMIN.filter(b => b.status === 'pending').length,   color: '#c49a3c', pct: 0 },
    { label: 'Cancelled', count: ALL_BOOKINGS_ADMIN.filter(b => b.status === 'cancelled').length, color: '#e8e0d5', pct: 0 },
  ].map(s => ({ ...s, pct: Math.round((s.count / ALL_BOOKINGS_ADMIN.length) * 100) }))

  /* ── SVG donut helper ── */
  const Donut = ({ data, total, cx = 60, cy = 60, r = 46, sw = 15 }) => {
    const circ = 2 * Math.PI * r
    let offset = 0
    return (
      <svg width="120" height="120" viewBox="0 0 120 120">
        {data.map(d => {
          const pct  = d.count / total
          const dash = circ * pct
          const el   = (
            <circle key={d.label} cx={cx} cy={cy} r={r}
              fill="none" stroke={d.color} strokeWidth={sw}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          )
          offset += dash
          return el
        })}
        <text x="60" y="56" textAnchor="middle"
          style={{ fontSize: 18, fontWeight: 700, fill: '#111', fontFamily: 'Georgia, serif' }}>
          {total}
        </text>
        <text x="60" y="70" textAnchor="middle" style={{ fontSize: 9, fill: '#aaa' }}>total</text>
      </svg>
    )
  }

  return (
    <AdminLayout active="analytics">
      <PageHeader
        eyebrow="Platform"
        title="Analytics & Reports"
        subtitle="Full platform performance overview"
        action={
          <div className={styles.periodSwitch}>
            {['3m','6m','12m'].map(p => (
              <button key={p} className={`${styles.pBtn} ${period === p ? styles.pBtnOn : ''}`} onClick={() => setPeriod(p)}>
                {p === '12m' ? 'Full Year' : p === '6m' ? 'Last 6M' : 'Last 3M'}
              </button>
            ))}
          </div>
        }
      />

      {/* ── Top KPIs ── */}
      <div className={styles.kpiGrid}>
        <StatCard label="Gross Revenue"      value={`£${totalRev.toLocaleString()}`}   sub="All paid bookings"          icon="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" trend={22} accent />
        <StatCard label="Platform Commission" value={`£${totalComm.toLocaleString()}`} sub="10% of gross revenue"        icon="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2" trend={18} />
        <StatCard label="Conversion Rate"     value={`${convRate}%`}                   sub="Paid / total bookings"       icon="M16 8v8m-8-5v5m4-9v9" trend={5} />
        <StatCard label="Avg Order Value"     value={`£${avgOrder.toLocaleString()}`}  sub="Per paid booking"            icon="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25" trend={8} />
      </div>

      {/* ── Main chart ── */}
      <Card className={styles.mainChartCard}>
        <div className={styles.chartHeader}>
          <div>
            <p className={styles.chartTitle}>Platform Trend</p>
            <p className={styles.chartSub}>
              {period === '3m' ? 'Last 3 months' : period === '6m' ? 'Last 6 months' : 'Full year 2024'}
            </p>
          </div>
          <div className={styles.chartModeTabs}>
            {['revenue','bookings','users'].map(m => (
              <button
                key={m}
                className={`${styles.modeTab} ${chartMode === m ? styles.modeTabOn : ''}`}
                onClick={() => setChartMode(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.chartArea}>
          {monthSlice.map(m => {
            const val = m[chartMode]
            const h   = maxVal[chartMode] > 0 ? (val / maxVal[chartMode]) * 100 : 0
            return (
              <div key={m.month} className={styles.chartCol}>
                <div className={styles.barTooltip}>
                  {chartMode === 'revenue' ? `£${val.toLocaleString()}` : val}
                </div>
                <div className={styles.barTrack}>
                  <div className={`${styles.barFill} ${styles[`bar_${chartMode}`]}`} style={{ height: `${h}%` }} />
                </div>
                <span className={styles.colLabel}>{m.month}</span>
              </div>
            )
          })}
        </div>

        {/* Summary below chart */}
        <div className={styles.chartSummary}>
          <div className={styles.chartSumItem}>
            <span>Total {period === '12m' ? 'YTD' : period}</span>
            <strong>
              {chartMode === 'revenue'
                ? `£${monthSlice.reduce((s,m) => s+m.revenue, 0).toLocaleString()}`
                : monthSlice.reduce((s,m) => s+m[chartMode], 0).toLocaleString()}
            </strong>
          </div>
          <div className={styles.chartSumItem}>
            <span>Peak month</span>
            <strong>
              {monthSlice.reduce((max,m) => m[chartMode] > max[chartMode] ? m : max).month}
            </strong>
          </div>
          <div className={styles.chartSumItem}>
            <span>Average / month</span>
            <strong>
              {chartMode === 'revenue'
                ? `£${Math.round(monthSlice.reduce((s,m) => s+m.revenue, 0) / monthSlice.length).toLocaleString()}`
                : Math.round(monthSlice.reduce((s,m) => s+m[chartMode], 0) / monthSlice.length).toLocaleString()}
            </strong>
          </div>
        </div>
      </Card>

      {/* ── 3-column row ── */}
      <div className={styles.threeCol}>

        {/* Booking status donut */}
        <Card>
          <CardTitle>Booking Status</CardTitle>
          <div className={styles.donutWrap}>
            <Donut data={statusBreakdown} total={ALL_BOOKINGS_ADMIN.length} />
            <div className={styles.donutLegend}>
              {statusBreakdown.map(s => (
                <div key={s.label} className={styles.legendRow}>
                  <span className={styles.legendDot} style={{ background: s.color }} />
                  <span className={styles.legendLabel}>{s.label}</span>
                  <strong>{s.count}</strong>
                  <span className={styles.legendPct}>{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* User breakdown donut */}
        <Card>
          <CardTitle>User Roles</CardTitle>
          <div className={styles.donutWrap}>
            {(() => {
              const d = [
                { label: 'Guests',  count: ALL_USERS.filter(u => u.role === 'user').length,  color: '#1b4d5c' },
                { label: 'Owners',  count: ALL_USERS.filter(u => u.role === 'owner').length, color: '#c49a3c' },
                { label: 'Admins',  count: ALL_USERS.filter(u => u.role === 'admin').length, color: '#6a2aaa' },
              ]
              return (
                <>
                  <Donut data={d} total={ALL_USERS.length} />
                  <div className={styles.donutLegend}>
                    {d.map(s => (
                      <div key={s.label} className={styles.legendRow}>
                        <span className={styles.legendDot} style={{ background: s.color }} />
                        <span className={styles.legendLabel}>{s.label}</span>
                        <strong>{s.count}</strong>
                        <span className={styles.legendPct}>{Math.round((s.count / ALL_USERS.length) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )
            })()}
          </div>
        </Card>

        {/* Membership breakdown */}
        <Card>
          <CardTitle>Membership Tiers</CardTitle>
          <div className={styles.memberBreakdown}>
            {MEMBERSHIP_LEVELS.map(l => {
              const pct = Math.round((l.members / totalMembers) * 100)
              return (
                <div key={l.id} className={styles.memberRow}>
                  <div className={styles.memberRowTop}>
                    <div className={styles.memberName}>
                      <span className={styles.memberDot} style={{ background: l.color }} />
                      <strong>{l.name}</strong>
                    </div>
                    <span className={styles.memberCount}>{l.members.toLocaleString()}</span>
                  </div>
                  <div className={styles.memberBar}>
                    <div className={styles.memberBarFill} style={{ width: `${pct}%`, background: l.color }} />
                  </div>
                  <span className={styles.memberPct}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* ── Hotel performance table ── */}
      <Card className={styles.hotelPerfCard}>
        <CardTitle>Hotel Performance</CardTitle>
        <div className={styles.perfTableWrap}>
          <table className={styles.perfTable}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Hotel</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Bookings</th>
                <th>Gross Revenue</th>
                <th>Conv. Rate</th>
                <th>Revenue Share</th>
              </tr>
            </thead>
            <tbody>
              {hotelPerf.map((h, i) => {
                const share = Math.round((h.totalRevenue / Math.max(totalRev, 1)) * 100)
                return (
                  <tr key={h.id}>
                    <td className={styles.tdRank}>
                      <span className={`${styles.rankBadge} ${i === 0 ? styles.rankGold : i === 1 ? styles.rankSilver : i === 2 ? styles.rankBronze : ''}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td>
                      <div className={styles.hotelNameCell}>
                        <div className={styles.hotelThumb} style={{ background: h.photo }} />
                        <div>
                          <p className={styles.hotelName}>{h.name}</p>
                          <p className={styles.hotelAddr}>{h.address.split(',').slice(-2).join(',').trim()}</p>
                        </div>
                      </div>
                    </td>
                    <td className={styles.tdMuted}>{h.owner}</td>
                    <td><Badge status={h.status} /></td>
                    <td className={styles.tdCenter}>{h.totalBookings}</td>
                    <td className={styles.tdPrice}>£{h.totalRevenue.toLocaleString()}</td>
                    <td className={styles.tdCenter}>
                      <span className={`${styles.convBadge} ${h.convRate >= 70 ? styles.convHigh : h.convRate >= 40 ? styles.convMid : styles.convLow}`}>
                        {h.convRate}%
                      </span>
                    </td>
                    <td>
                      <div className={styles.shareCell}>
                        <div className={styles.shareTrack}>
                          <div className={styles.shareFill} style={{ width: `${(h.totalRevenue / topHotelRev) * 100}%` }} />
                        </div>
                        <span>{share}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Bottom row: Top guests + Platform health ── */}
      <div className={styles.bottomRow}>
        {/* Top guests */}
        <Card>
          <CardTitle>Top Guests by Spend</CardTitle>
          <div className={styles.guestList}>
            {ALL_USERS.filter(u => u.role === 'user' && u.bookings > 0)
              .sort((a,b) => b.bookings - a.bookings)
              .slice(0, 5)
              .map((u, i) => {
                const userPaid = ALL_BOOKINGS_ADMIN.filter(b => b.guest === u.name && b.status === 'paid')
                const spend    = userPaid.reduce((s,b) => s + b.total, 0)
                return (
                  <div key={u.id} className={styles.guestRow}>
                    <span className={styles.guestRank}>{i + 1}</span>
                    <div className={styles.guestAvt} style={{ background: ['#1b4d5c','#c49a3c','#6a2aaa','#1e7a3a','#c0392b'][i] }}>
                      {u.name[0]}
                    </div>
                    <div className={styles.guestInfo}>
                      <p className={styles.guestName}>{u.name}</p>
                      <p className={styles.guestMeta}>{u.bookings} bookings</p>
                    </div>
                    <p className={styles.guestSpend}>£{spend.toLocaleString()}</p>
                  </div>
                )
              })}
          </div>
        </Card>

        {/* Platform health */}
        <Card>
          <CardTitle>Platform Health</CardTitle>
          <div className={styles.healthList}>
            {[
              { label: 'Hotel Approval Rate', val: Math.round((ALL_HOTELS_ADMIN.filter(h => h.status === 'approved').length / ALL_HOTELS_ADMIN.length) * 100), color: '#1e7a3a', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
              { label: 'Booking Conversion',  val: convRate,   color: '#1b4d5c', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14' },
              { label: 'Active User Rate',    val: Math.round((ALL_USERS.filter(u => u.status === 'active').length / ALL_USERS.length) * 100), color: '#c49a3c', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
              { label: 'Voucher Usage Rate',  val: 61,         color: '#6a2aaa', icon: 'M20 12V22H4V12 M22 7H2v5h20V7z' },
            ].map(h => (
              <div key={h.label} className={styles.healthRow}>
                <div className={styles.healthIcon} style={{ background: `${h.color}18` }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={h.color} strokeWidth="2" strokeLinecap="round">
                    <path d={h.icon}/>
                  </svg>
                </div>
                <div className={styles.healthInfo}>
                  <p className={styles.healthLabel}>{h.label}</p>
                  <div className={styles.healthBar}>
                    <div className={styles.healthBarFill} style={{ width: `${h.val}%`, background: h.color }} />
                  </div>
                </div>
                <span className={styles.healthPct} style={{ color: h.color }}>{h.val}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}