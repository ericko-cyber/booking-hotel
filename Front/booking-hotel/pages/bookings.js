import { useMemo, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import styles from '../components/Bookings.module.css'

const BOOKING_HISTORY = [
  {
    id: 'BK-25091',
    hotelId: 1,
    hotel: 'The Lumina Heights',
    location: 'Paris, France',
    room: 'Deluxe Skyline',
    checkIn: '2026-04-28',
    checkOut: '2026-04-30',
    nights: 2,
    guests: 2,
    total: 4240000,
    payment: 'Kartu kredit',
    bookedAt: '14 Apr 2026',
    status: 'completed',
    statusLabel: 'Selesai',
  },
  {
    id: 'BK-25087',
    hotelId: 2,
    hotel: 'Soma Sanctuary',
    location: 'Ubud, Bali',
    room: 'Garden Pool Villa',
    checkIn: '2026-05-05',
    checkOut: '2026-05-08',
    nights: 3,
    guests: 2,
    total: 7500000,
    payment: 'Deposit',
    bookedAt: '20 Apr 2026',
    status: 'upcoming',
    statusLabel: 'Akan datang',
  },
  {
    id: 'BK-25071',
    hotelId: 6,
    hotel: 'Kyoto Zen House',
    location: 'Kyoto, Japan',
    room: 'Tatami Suite',
    checkIn: '2026-03-14',
    checkOut: '2026-03-17',
    nights: 3,
    guests: 1,
    total: 5280000,
    payment: 'Transfer bank',
    bookedAt: '25 Feb 2026',
    status: 'completed',
    statusLabel: 'Selesai',
  },
  {
    id: 'BK-25064',
    hotelId: 9,
    hotel: 'Manhattan Sky Loft',
    location: 'New York, USA',
    room: 'Corner Suite',
    checkIn: '2026-02-09',
    checkOut: '2026-02-12',
    nights: 3,
    guests: 2,
    total: 8100000,
    payment: 'Refund diproses',
    bookedAt: '31 Jan 2026',
    status: 'cancelled',
    statusLabel: 'Dibatalkan',
  },
  {
    id: 'BK-25052',
    hotelId: 4,
    hotel: 'Amalfi Cliffside',
    location: 'Positano, Italy',
    room: 'Ocean View Room',
    checkIn: '2026-01-01',
    checkOut: '2026-01-04',
    nights: 3,
    guests: 2,
    total: 6960000,
    payment: 'Kartu debit',
    bookedAt: '18 Dec 2025',
    status: 'completed',
    statusLabel: 'Selesai',
  },
  {
    id: 'BK-25047',
    hotelId: 7,
    hotel: 'Maldives Pearl Villa',
    location: 'North Male Atoll, Maldives',
    room: 'Overwater Villa',
    checkIn: '2026-06-11',
    checkOut: '2026-06-15',
    nights: 4,
    guests: 2,
    total: 17800000,
    payment: 'Menunggu pembayaran',
    bookedAt: '27 Apr 2026',
    status: 'pending',
    statusLabel: 'Menunggu',
  },
]

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'completed', label: 'Selesai' },
  { value: 'upcoming', label: 'Akan Datang' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'cancelled', label: 'Dibatalkan' },
]

const STATUS_CLASS_MAP = {
  completed: styles.statusCompleted,
  upcoming: styles.statusUpcoming,
  pending: styles.statusPending,
  cancelled: styles.statusCancelled,
}

const formatMoney = (amount) => `Rp${amount.toLocaleString('id-ID')}`

const formatStayRange = (checkIn, checkOut) => {
  const start = new Date(checkIn).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const end = new Date(checkOut).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return `${start} - ${end}`
}

export default function BookingHistoryPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filteredBookings = useMemo(() => {
    return BOOKING_HISTORY.filter((booking) => {
      const statusMatch = statusFilter === 'all' || booking.status === statusFilter
      const query = search.trim().toLowerCase()
      const searchMatch =
        !query ||
        booking.id.toLowerCase().includes(query) ||
        booking.hotel.toLowerCase().includes(query) ||
        booking.location.toLowerCase().includes(query) ||
        booking.room.toLowerCase().includes(query)

      return statusMatch && searchMatch
    })
  }, [search, statusFilter])

  const totalBookings = BOOKING_HISTORY.length
  const completedBookings = BOOKING_HISTORY.filter((booking) => booking.status === 'completed').length
  const upcomingBookings = BOOKING_HISTORY.filter((booking) => booking.status === 'upcoming').length
  const totalSpent = BOOKING_HISTORY.filter((booking) => booking.status !== 'cancelled').reduce(
    (sum, booking) => sum + booking.total,
    0,
  )

  return (
    <>
      <Navbar />

      <main className={styles.bookingHistoryPage}>
        <section className={styles.bookingHero}>
          <div className={styles.bookingHeroInner}>
            <p className={styles.bookingEyebrow}>RIWAYAT BOOKING</p>
            <h1 className={styles.bookingTitle}>Semua pemesanan Anda dalam satu tempat.</h1>
            <p className={styles.bookingSubtitle}>
              Lihat status booking, jadwal menginap, detail kamar, dan perjalanan yang sudah Anda selesaikan.
            </p>

            <div className={styles.bookingHeroStats}>
              <article className={styles.heroStatCard}>
                <span className={styles.heroStatLabel}>Total Booking</span>
                <strong className={styles.heroStatValue}>{totalBookings}</strong>
              </article>
              <article className={styles.heroStatCard}>
                <span className={styles.heroStatLabel}>Booking Selesai</span>
                <strong className={styles.heroStatValue}>{completedBookings}</strong>
              </article>
              <article className={styles.heroStatCard}>
                <span className={styles.heroStatLabel}>Booking Mendatang</span>
                <strong className={styles.heroStatValue}>{upcomingBookings}</strong>
              </article>
              <article className={styles.heroStatCard}>
                <span className={styles.heroStatLabel}>Total Pengeluaran</span>
                <strong className={styles.heroStatValue}>{formatMoney(totalSpent)}</strong>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.bookingContent}>
          <aside className={styles.bookingSidebar}>
            <div className={styles.bookingSideCard}>
              <p className={styles.bookingSideTitle}>Ringkasan Cepat</p>
              <div className={styles.bookingSideList}>
                <div className={styles.bookingSideItem}>
                  <span>Kode booking terbaru</span>
                  <strong>{BOOKING_HISTORY[0].id}</strong>
                </div>
                <div className={styles.bookingSideItem}>
                  <span>Hotel berikutnya</span>
                  <strong>{BOOKING_HISTORY.find((booking) => booking.status === 'upcoming')?.hotel}</strong>
                </div>
                <div className={styles.bookingSideItem}>
                  <span>Status aktif</span>
                  <strong>{upcomingBookings + BOOKING_HISTORY.filter((booking) => booking.status === 'pending').length} booking</strong>
                </div>
              </div>
            </div>

            <div className={styles.bookingSideCard}>
              <p className={styles.bookingSideTitle}>Akses Cepat</p>
              <p className={styles.bookingSideText}>
                Kelola booking baru, lihat properti lain, atau lanjut pesan hotel yang pernah Anda kunjungi.
              </p>
              <div className={styles.bookingSideActions}>
                <a href="/hotels" className={styles.bookingSideButtonPrimary}>Cari Hotel</a>
                <a href="/dashboard" className={styles.bookingSideButtonSecondary}>Buka Dashboard</a>
              </div>
            </div>
          </aside>

          <section className={styles.bookingMain}>
            <div className={styles.bookingToolbar}>
              <div className={styles.bookingTabs}>
                {STATUS_FILTERS.map((filter) => {
                  const count = filter.value === 'all'
                    ? BOOKING_HISTORY.length
                    : BOOKING_HISTORY.filter((booking) => booking.status === filter.value).length

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      className={`${styles.bookingTab} ${statusFilter === filter.value ? styles.bookingTabActive : ''}`}
                      onClick={() => setStatusFilter(filter.value)}
                    >
                      {filter.label}
                      <span className={styles.bookingTabCount}>{count}</span>
                    </button>
                  )
                })}
              </div>

              <label className={styles.bookingSearch}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari kode booking, hotel, atau kamar..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
            </div>

            {filteredBookings.length > 0 ? (
              <div className={styles.bookingList}>
                {filteredBookings.map((booking) => (
                  <article key={booking.id} className={styles.bookingCard}>
                    <div className={styles.bookingCardTop}>
                      <div>
                        <p className={styles.bookingCode}>{booking.id}</p>
                        <h2 className={styles.bookingHotel}>{booking.hotel}</h2>
                        <p className={styles.bookingLocation}>{booking.location}</p>
                      </div>
                      <span className={`${styles.bookingStatus} ${STATUS_CLASS_MAP[booking.status]}`}>
                        {booking.statusLabel}
                      </span>
                    </div>

                    <div className={styles.bookingMetaGrid}>
                      <div className={styles.bookingMetaItem}>
                        <span>Check-in</span>
                        <strong>{formatStayRange(booking.checkIn, booking.checkOut)}</strong>
                      </div>
                      <div className={styles.bookingMetaItem}>
                        <span>Kamar</span>
                        <strong>{booking.room}</strong>
                      </div>
                      <div className={styles.bookingMetaItem}>
                        <span>Tamu</span>
                        <strong>{booking.guests} orang</strong>
                      </div>
                      <div className={styles.bookingMetaItem}>
                        <span>Pembayaran</span>
                        <strong>{booking.payment}</strong>
                      </div>
                    </div>

                    <div className={styles.bookingCardBottom}>
                      <div>
                        <p className={styles.bookingBookedAt}>Dipesan pada {booking.bookedAt}</p>
                        <p className={styles.bookingTotal}>{formatMoney(booking.total)}</p>
                      </div>
                      <div className={styles.bookingActions}>
                        <a href={`/hotels/${booking.hotelId}`} className={styles.bookingActionPrimary}>
                          Lihat Hotel
                        </a>
                        <a href="/hotels" className={styles.bookingActionSecondary}>
                          Pesan Lagi
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.bookingEmpty}>
                <div className={styles.bookingEmptyIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h2>Tidak ada booking yang cocok.</h2>
                <p>Ubah filter atau kata kunci pencarian untuk melihat riwayat booking lainnya.</p>
                <a href="/hotels" className={styles.bookingEmptyButton}>Cari Hotel</a>
              </div>
            )}
          </section>
        </section>
      </main>

      <Footer />
    </>
  )
}