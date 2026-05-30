import { useState, useEffect } from 'react'
import OwnerLayout from './OwnerLayout'
import { PageHeader, StatCard, Card } from './OwnerUI'
import { CURRENT_OWNER } from './OwnerData'
import { bookingService } from '../../services/bookingService'
import { hotelService } from '../../services/hotelService'
import styles from '../Revenue.module.css'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function OwnerRevenue() {
  const [period, setPeriod] = useState('year')
  const [myHotels, setMyHotels] = useState([])
  const [myBookings, setMyBookings] = useState([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [hs, bs] = await Promise.all([hotelService.getOwnerHotels(), bookingService.getOwnerBookings()])
        if (mounted) {
          setMyHotels(hs)
          setMyBookings(bs)
        }
      } catch (err) {
        console.error('Failed to load revenue data', err)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const myHotelIds = myHotels.map((h) => h.id)
  const myBookingsFiltered = myBookings.filter((b) => myHotelIds.includes(b.hotelId))

  const paid = myBookingsFiltered.filter(b => b.status === 'paid')
  const totalRevenue = paid.reduce((s, b) => s + (b.total || 0), 0)
  const avgPerBooking = paid.length ? Math.round(totalRevenue / paid.length) : 0
  const monthlyRevenue = MONTHS.map((month, index) => {
    const monthPaid = paid.filter((b) => new Date(b.checkIn).getMonth() === index)
    return {
      month,
      revenue: monthPaid.reduce((sum, b) => sum + b.total, 0),
      bookings: monthPaid.length,
    }
  })

  const maxRev = Math.max(1, ...monthlyRevenue.map(m => m.revenue))
  const topMonth = monthlyRevenue.reduce((max, m) => (m.revenue > max.revenue ? m : max), monthlyRevenue[0])

  const perHotel = myHotels.map((hotel) => ({
    name: hotel.name,
    revenue: paid.filter(b => b.hotelId === hotel.id).reduce((s, b) => s + (b.total || 0), 0),
    bookings: paid.filter(b => b.hotelId === hotel.id).length,
  }))

  return (
    <OwnerLayout active="revenue">
      <PageHeader title="Revenue Report" subtitle="Financial overview for all your properties" />

      <div className={styles.statsRow}>
        <StatCard label="Total Revenue" value={`£${totalRevenue.toLocaleString()}`} sub="From paid bookings" icon="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" accent />
        <StatCard label="Paid Bookings" value={paid.length} sub={`${myBookings.length} total bookings`} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
        <StatCard label="Avg per Booking" value={`£${avgPerBooking.toLocaleString()}`} sub="Across paid orders" icon="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
        <StatCard label="Best Month" value={topMonth.month} sub={`£${topMonth.revenue.toLocaleString()}`} icon="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </div>

      <div className={styles.twoCol}>
        {/* ── Monthly chart ── */}
        <Card>
          <div className={styles.chartTop}>
            <div>
              <p className={styles.chartLabel}>Monthly Revenue Trend</p>
              <p className={styles.chartValue}>£{totalRevenue.toLocaleString()}</p>
            </div>
            <div className={styles.periodSwitch}>
              {['year', 'q1', 'q2', 'q3', 'q4'].map(p => (
                <button key={p} className={`${styles.pBtn} ${period === p ? styles.pBtnOn : ''}`} onClick={() => setPeriod(p)}>
                  {p === 'year' ? 'Full Year' : p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Bar + line chart */}
          <div className={styles.chartArea}>
            {monthlyRevenue.map((m, i) => {
              const inPeriod = period === 'year'
                ? true
                : period === 'q1' ? i < 3
                : period === 'q2' ? i >= 3 && i < 6
                : period === 'q3' ? i >= 6 && i < 9
                : i >= 9
              return (
                <div key={m.month} className={`${styles.col} ${!inPeriod ? styles.colFade : ''}`}>
                  <span className={styles.colVal}>£{(m.revenue / 1000).toFixed(0)}k</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ height: `${(m.revenue / maxRev) * 100}%` }} />
                  </div>
                  <span className={styles.colMonth}>{m.month}</span>
                  <span className={styles.colBookings}>{m.bookings}</span>
                </div>
              )
            })}
          </div>
          <p className={styles.chartNote}>Numbers in bars = bookings that month</p>
        </Card>

        {/* ── Per-property breakdown ── */}
        <div className={styles.rightCol}>
          <Card>
            <p className={styles.cardTitle}>Revenue by Property</p>
            <div className={styles.propList}>
              {perHotel.sort((a, b) => b.revenue - a.revenue).map((h, i) => {
                const pct = totalRevenue ? Math.round((h.revenue / totalRevenue) * 100) : 0
                return (
                  <div key={h.name} className={styles.propItem}>
                    <div className={styles.propRank}>{i + 1}</div>
                    <div className={styles.propInfo}>
                      <p className={styles.propName}>{h.name}</p>
                      <div className={styles.propBar}>
                        <div className={styles.propBarFill} style={{ width: `${pct}%` }} />
                      </div>
                      <p className={styles.propMeta}>{h.bookings} bookings · {pct}% of total</p>
                    </div>
                    <p className={styles.propRev}>£{h.revenue.toLocaleString()}</p>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <p className={styles.cardTitle}>Booking Status Split</p>
            <div className={styles.donutArea}>
              <div className={styles.donutRing}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  {(() => {
                    const data = [
                      { label: 'Paid', count: myBookings.filter(b => b.status === 'paid').length, color: '#1b4d5c' },
                      { label: 'Pending', count: myBookings.filter(b => b.status === 'pending').length, color: '#c49a3c' },
                      { label: 'Cancelled', count: myBookings.filter(b => b.status === 'cancelled').length, color: '#e8e0d5' },
                    ]
                    const total = data.reduce((s, d) => s + d.count, 0)
                    let offset = 0
                    const r = 46, cx = 60, cy = 60, strokeW = 16
                    const circ = 2 * Math.PI * r
                    return data.map(d => {
                      const pct = total ? d.count / total : 0
                      const dash = circ * pct
                      const gap = circ - dash
                      const el = (
                        <circle key={d.label}
                          cx={cx} cy={cy} r={r}
                          fill="none"
                          stroke={d.color}
                          strokeWidth={strokeW}
                          strokeDasharray={`${dash} ${gap}`}
                          strokeDashoffset={-offset}
                          transform="rotate(-90 60 60)"
                        />
                      )
                      offset += dash
                      return el
                    })
                  })()}
                  <text x="60" y="56" textAnchor="middle" className={styles.donutTotal} style={{ fontSize: 18, fontWeight: 700, fill: '#111', fontFamily: 'Georgia' }}>
                    {myBookings.length}
                  </text>
                  <text x="60" y="70" textAnchor="middle" style={{ fontSize: 9, fill: '#aaa' }}>total</text>
                </svg>
              </div>
              <div className={styles.donutLegend}>
                {[
                  { label: 'Paid', count: myBookings.filter(b => b.status === 'paid').length, color: '#1b4d5c' },
                  { label: 'Pending', count: myBookings.filter(b => b.status === 'pending').length, color: '#c49a3c' },
                  { label: 'Cancelled', count: myBookings.filter(b => b.status === 'cancelled').length, color: '#e8e0d5' },
                ].map(d => (
                  <div key={d.label} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: d.color }} />
                    <span>{d.label}</span>
                    <strong>{d.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </OwnerLayout>
  )
}