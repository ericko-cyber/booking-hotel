import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import OwnerLayout from './OwnerLayout'
import { StatCard, Card, StatusBadge, PageHeader, Empty } from './OwnerUI'
import { hotelService } from '../../services/hotelService'
import { bookingService } from '../../services/bookingService'
import { authService } from '../../services/authService'
import styles from '../Dashboard.module.css'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function OwnerDashboard() {
  const [ownerName, setOwnerName] = useState('Owner')
  const [hotels, setHotels] = useState([])
  const [roomsByHotel, setRoomsByHotel] = useState({})
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const cachedUser = authService.getUser()
        if (isMounted && cachedUser?.name) {
          setOwnerName(cachedUser.name)
        }

        const [ownerHotels, ownerBookings] = await Promise.all([
          hotelService.getOwnerHotels(),
          bookingService.getOwnerBookings(),
        ])

        const hotelsSafe = Array.isArray(ownerHotels) ? ownerHotels : []
        const bookingsSafe = Array.isArray(ownerBookings) ? ownerBookings : []

        if (!isMounted) return

        setHotels(hotelsSafe)
        setBookings(bookingsSafe)

        const roomResults = await Promise.all(
          hotelsSafe.map(async (hotel) => {
            try {
              const rooms = await hotelService.getRoomsByHotel(hotel.id, { page_size: 100 })
              return [hotel.id, Array.isArray(rooms) ? rooms : []]
            } catch {
              return [hotel.id, []]
            }
          })
        )

        if (!isMounted) return
        setRoomsByHotel(Object.fromEntries(roomResults))
      } catch (err) {
        if (!isMounted) return
        setError(err?.message || 'Failed to load owner dashboard data')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const hotelNameById = useMemo(
    () => Object.fromEntries(hotels.map((hotel) => [hotel.id, hotel.name])),
    [hotels]
  )

  const roomNameById = useMemo(() => {
    const map = {}
    Object.values(roomsByHotel).forEach((rooms) => {
      rooms.forEach((room) => {
        map[room.id] = room.name
      })
    })
    return map
  }, [roomsByHotel])

  const totalRevenue = bookings
    .filter((booking) => booking.payment_status === 'paid')
    .reduce((sum, booking) => sum + Number(booking.total_price || 0), 0)

  const totalRooms = hotels.reduce((sum, hotel) => sum + Number(hotel.total_rooms || 0), 0)
  const approvedHotels = hotels.filter((hotel) => hotel.status === 'approved').length
  const pendingBookings = bookings.filter((booking) => booking.status === 'pending').length

  const monthlyRevenue = MONTHS.map((month, index) => {
    const monthPaid = bookings.filter((booking) => {
      if (booking.payment_status !== 'paid') return false
      return new Date(booking.check_in).getMonth() === index
    })

    return {
      month,
      revenue: monthPaid.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0),
    }
  })

  const maxRev = Math.max(1, ...monthlyRevenue.map((item) => item.revenue))
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)

  const formatMoney = (value) => {
    const amount = Number(value || 0)
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  const formatDate = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleDateString('id-ID')
  }

  const nullStringValue = (value) => {
    if (!value) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'object' && value.Valid) return value.String || ''
    return ''
  }

  return (
    <OwnerLayout active="dashboard">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${ownerName} · ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      {error && (
        <Card>
          <p className={styles.cardTitle}>Failed to load dashboard</p>
          <p className={styles.tdMuted}>{error}</p>
        </Card>
      )}

      {loading && (
        <Card>
          <p className={styles.cardTitle}>Loading...</p>
          <p className={styles.tdMuted}>Mengambil data hotel, kamar, dan booking dari database.</p>
        </Card>
      )}

      {!loading && hotels.length === 0 && (
        <Empty
          icon="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          title="Belum ada hotel owner"
          desc="Daftarkan hotel terlebih dahulu agar statistik dashboard terisi dari database."
        />
      )}

      <div className={styles.statsGrid}>
        <StatCard
          label="Total Revenue"
          value={formatMoney(totalRevenue)}
          sub="From paid bookings"
          icon="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
          accent
        />
        <StatCard
          label="Total Bookings"
          value={bookings.length}
          sub={`${pendingBookings} pending`}
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
        />
        <StatCard
          label="Active Hotels"
          value={approvedHotels}
          sub={`${hotels.filter((hotel) => hotel.status === 'pending').length} pending review`}
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
              <p className={styles.chartTotal}>{formatMoney(totalRevenue)}</p>
            </div>
            <span className={styles.chartYear}>{new Date().getFullYear()}</span>
          </div>
          <div className={styles.barChart}>
            {monthlyRevenue.map((item) => (
              <div key={item.month} className={styles.barCol}>
                <div className={styles.barWrap}>
                  <div className={styles.bar} style={{ height: `${(item.revenue / maxRev) * 100}%` }} title={formatMoney(item.revenue)} />
                </div>
                <span className={styles.barMonth}>{item.month}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className={styles.cardTitleRow}>
            <p className={styles.cardTitle}>Your Properties</p>
            <Link href="/owner/hotels" className={styles.cardLink}>View all →</Link>
          </div>
          <div className={styles.hotelList}>
            {hotels.map((hotel) => (
              <div key={hotel.id} className={styles.hotelRow}>
                <div className={styles.hotelThumb} style={{ background: 'linear-gradient(135deg,#1b4d5c 0%,#256a78 60%,#2f7f8f 100%)' }} />
                <div className={styles.hotelInfo}>
                  <p className={styles.hotelName}>{hotel.name}</p>
                  <p className={styles.hotelRooms}>{Number(hotel.total_rooms || 0)} rooms</p>
                </div>
                <StatusBadge status={hotel.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className={styles.recentCard}>
        <div className={styles.cardTitleRow}>
          <p className={styles.cardTitle}>Recent Bookings</p>
          <Link href="/owner/bookings" className={styles.cardLink}>View all →</Link>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th><th>Guest</th><th>Hotel</th><th>Room</th><th>Check-in</th><th>Total</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className={styles.tdMono}>{booking.booking_code || booking.id}</td>
                  <td>{nullStringValue(booking.guest_name) || '-'}</td>
                  <td className={styles.tdMuted}>{hotelNameById[booking.hotel_id] || '-'}</td>
                  <td className={styles.tdMuted}>{roomNameById[booking.room_id] || '-'}</td>
                  <td className={styles.tdMuted}>{formatDate(booking.check_in)}</td>
                  <td className={styles.tdBold}>{formatMoney(booking.total_price)}</td>
                  <td><StatusBadge status={booking.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </OwnerLayout>
  )
}
