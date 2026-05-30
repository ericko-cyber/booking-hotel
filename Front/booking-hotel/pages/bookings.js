import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import styles from '../components/Bookings.module.css'
import api from '../lib/api'
import { authService } from '../services/authService'
import { bookingService } from '../services/bookingService'

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

const readNullString = (value) => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'String' in value && 'Valid' in value) {
    return value.Valid === true && value.String ? String(value.String) : ''
  }
  return ''
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
  const router = useRouter()
  const authenticated = authService.isAuthenticated()
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState(null)
  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [payingBookingId, setPayingBookingId] = useState(null)
  
  useEffect(() => {
    if (!authenticated) {
      router.push('/login')
    }
  }, [authenticated, router])
  
  useEffect(() => {
    let mounted = true
    const loadBookings = async () => {
      setLoading(true)
      try {
        const data = await bookingService.getUserBookings()
        if (mounted) setBookings(data)
      } catch (err) {
        console.error('Failed to load user bookings', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (authenticated) loadBookings()
    return () => { mounted = false }
  }, [authenticated])

  useEffect(() => {
    if (!router.isReady) return

    const paymentId = router.query?.paymentId
    const orderId = router.query?.order_id
    const transactionStatus = router.query?.transaction_status
    const statusCode = router.query?.status_code

    if (!paymentId || !orderId || !transactionStatus || !statusCode) {
      return
    }

    let mounted = true
    const syncAndRefresh = async () => {
      try {
        await api.post(`/payments/${paymentId}/sync`)
        setLoading(true)
        try {
          const data = await bookingService.getUserBookings()
          if (mounted) setBookings(data)
        } finally {
          if (mounted) setLoading(false)
        }
      } catch (err) {
        console.error('Failed to sync payment after Midtrans return', err)
      } finally {
        if (mounted) {
          router.replace('/bookings')
        }
      }
    }

    syncAndRefresh()

    return () => {
      mounted = false
    }
  }, [router, router.isReady, router.query?.paymentId, router.query?.order_id, router.query?.transaction_status, router.query?.status_code])

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const statusMatch = statusFilter === 'all' || booking.status === statusFilter
      const query = search.trim().toLowerCase()
      const searchMatch = !query || (
        (booking.bookingCode || booking.booking_code || booking.id || '').toString().toLowerCase().includes(query) ||
        (booking.hotel || '').toString().toLowerCase().includes(query) ||
        (booking.location || '').toString().toLowerCase().includes(query) ||
        (booking.room || '').toString().toLowerCase().includes(query)
      )

      return statusMatch && searchMatch
    })
  }, [search, statusFilter, bookings])

  const activeBookingId = selectedBookingId && filteredBookings.some((booking) => booking.id === selectedBookingId)
    ? selectedBookingId
    : filteredBookings[0]?.id || null

  const openBookingDetail = (bookingId) => {
    setSelectedBookingId(bookingId)
    setIsDetailModalOpen(true)
  }

  const closeBookingDetail = () => {
    setIsDetailModalOpen(false)
  }

  const payBookingNow = async (booking) => {
    if (!booking?.id) return

    setPayingBookingId(booking.id)
    try {
      const detail = await bookingService.getBookingByIdNormalized(booking.id)
      const paymentId = detail?.paymentId || detail?.paymentDetail?.id

      if (!paymentId) {
        alert('Payment belum siap. Silakan buka detail booking atau coba lagi.')
        return
      }

      const paymentRes = await api.post(`/payments/${paymentId}/midtrans`)
      const payload = paymentRes?.data || paymentRes
      const checkoutUrl = payload?.checkout_url || payload?.data?.checkout_url

      if (checkoutUrl) {
        window.location.assign(checkoutUrl)
        return
      }

      alert('Checkout Midtrans tidak tersedia.')
    } catch (error) {
      console.error('Failed to open Midtrans checkout', error)
      alert('Gagal membuka checkout Midtrans.')
    } finally {
      setPayingBookingId(null)
    }
  }

  useEffect(() => {
    if (!activeBookingId) {
      return
    }

    let mounted = true
    const loadDetail = async () => {
      setDetailLoading(true)
      try {
        const detail = await bookingService.getBookingByIdNormalized(activeBookingId)
        if (mounted) setSelectedBookingDetail(detail)
      } catch (err) {
        console.error('Failed to load booking detail', err)
        if (mounted) {
          const fallback = bookings.find((booking) => booking.id === activeBookingId) || null
          setSelectedBookingDetail(fallback)
        }
      } finally {
        if (mounted) setDetailLoading(false)
      }
    }

    loadDetail()

    return () => {
      mounted = false
    }
  }, [activeBookingId, bookings])

  const selectedBooking = activeBookingId ? (selectedBookingDetail || bookings.find((booking) => booking.id === activeBookingId) || filteredBookings[0] || null) : null

  const paymentMethodLabel = readNullString(selectedBooking?.paymentDetail?.payment_method)
    || readNullString(selectedBooking?.paymentMethod)
    || readNullString(selectedBooking?.payment_method)
    || selectedBooking?.payment
    || 'Belum tersedia'

  const paymentGatewayLabel = readNullString(selectedBooking?.paymentDetail?.payment_gateway)
    || readNullString(selectedBooking?.paymentGateway)
    || readNullString(selectedBooking?.payment_gateway)
    || 'Belum tersedia'

  const transactionIdLabel = readNullString(selectedBooking?.paymentDetail?.transaction_id)
    || readNullString(selectedBooking?.transactionId)
    || readNullString(selectedBooking?.transaction_id)
    || '-'

  const paymentStatusLabel = selectedBooking?.paymentDetail?.status
    || selectedBooking?.paymentStatus
    || 'pending'

  const totalBookings = bookings.length
  const completedBookings = bookings.filter((booking) => booking.status === 'completed' || booking.status === 'paid').length
  const upcomingBookings = bookings.filter((booking) => booking.status === 'upcoming').length
  const totalSpent = bookings.filter((booking) => booking.status !== 'cancelled').reduce((sum, booking) => sum + Number(booking.total || booking.total_price || 0), 0)
  const totalSavings = bookings.reduce((sum, booking) => {
    const voucherSaved = Number(booking.voucherDiscount ?? booking.voucher_discount ?? 0)
    const membershipSaved = Number(booking.membershipDiscount ?? booking.membership_discount ?? 0)
    return sum + voucherSaved + membershipSaved
  }, 0)

  const selectedVoucherDiscount = Number(selectedBooking?.voucherDiscount ?? selectedBooking?.voucher_discount ?? 0)
  const selectedMembershipDiscount = Number(selectedBooking?.membershipDiscount ?? selectedBooking?.membership_discount ?? 0)
  const selectedSubtotal = Number(
    selectedBooking?.subtotal
    ?? selectedBooking?.subtotal_price
    ?? selectedBooking?.total_before_discount
    ?? selectedBooking?.total
    ?? selectedBooking?.total_price
    ?? 0,
  )
  const selectedTaxAmount = Number(selectedBooking?.taxAmount ?? selectedBooking?.tax_amount ?? 0)
  const selectedFinalTotal = Number(selectedBooking?.total || selectedBooking?.total_price || 0)

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
              <article className={styles.heroStatCard}>
                <span className={styles.heroStatLabel}>Total Hemat</span>
                <strong className={styles.heroStatValue}>{formatMoney(totalSavings)}</strong>
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
                  <strong>{bookings[0]?.bookingCode || bookings[0]?.booking_code || bookings[0]?.id || '-'}</strong>
                </div>
                <div className={styles.bookingSideItem}>
                  <span>Hotel berikutnya</span>
                  <strong>{bookings.find((booking) => booking.status === 'upcoming')?.hotel || '-'}</strong>
                </div>
                <div className={styles.bookingSideItem}>
                  <span>Status aktif</span>
                  <strong>{upcomingBookings + bookings.filter((booking) => booking.status === 'pending').length} booking</strong>
                </div>
              </div>
            </div>

            <div className={styles.bookingSideCard}>
              <p className={styles.bookingSideTitle}>Akses Cepat</p>
              <p className={styles.bookingSideText}>
                Kelola booking baru, lihat properti lain, atau lanjut pesan hotel yang pernah Anda kunjungi.
              </p>
              <div className={styles.bookingSideActions}>
                <Link href="/hotels" className={styles.bookingSideButtonPrimary}>Cari Hotel</Link>
                <Link href="/vouchers" className={styles.bookingSideButtonSecondary}>Lihat Voucher</Link>
              </div>
            </div>
          </aside>

          <section className={styles.bookingMain}>
            <div className={styles.bookingToolbar}>
              <div className={styles.bookingTabs}>
                {STATUS_FILTERS.map((filter) => {
                  const count = filter.value === 'all'
                    ? bookings.length
                    : bookings.filter((booking) => booking.status === filter.value).length

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
                        <p className={styles.bookingCode}>{booking.bookingCode || booking.id}</p>
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
                        <p className={styles.bookingBookedAt}>Dipesan pada {booking.bookedAt ? new Date(booking.bookedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
                        <p className={styles.bookingTotal}>{formatMoney(booking.total)}</p>
                        {Number(booking.membershipDiscount ?? booking.membership_discount ?? 0) > 0 ? (
                          <p className={styles.bookingSavings}>
                            Hemat membership {formatMoney(Number(booking.membershipDiscount ?? booking.membership_discount ?? 0))}
                          </p>
                        ) : null}
                      </div>
                      <div className={styles.bookingActions}>
                        {booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'pending' ? (
                          <button
                            type="button"
                            className={styles.bookingActionPrimary}
                            onClick={() => payBookingNow(booking)}
                            disabled={payingBookingId === booking.id}
                          >
                            {payingBookingId === booking.id ? 'Membuka Midtrans...' : 'Bayar Sekarang'}
                          </button>
                        ) : (
                          <>
                            <Link href={`/hotels/${booking.hotelId}`} className={styles.bookingActionPrimary}>
                              Lihat Hotel
                            </Link>
                            <button
                              type="button"
                              className={styles.bookingActionSecondary}
                              onClick={() => openBookingDetail(booking.id)}
                            >
                              Detail Booking
                            </button>
                            <Link href="/hotels" className={styles.bookingActionSecondary}>
                              Pesan Lagi
                            </Link>
                          </>
                        )}
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
                <Link href="/hotels" className={styles.bookingEmptyButton}>Cari Hotel</Link>
              </div>
            )}
            </section>
        </section>

        {isDetailModalOpen && selectedBooking ? (
          <div className={styles.bookingModalOverlay} onClick={closeBookingDetail} role="presentation">
            <div
              className={styles.bookingModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-detail-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.bookingModalHeader}>
                <div>
                  <p className={styles.bookingDetailCode}>{selectedBooking.bookingCode || selectedBooking.id}</p>
                  <h2 id="booking-detail-title" className={styles.bookingDetailHotel}>{selectedBooking.hotel}</h2>
                  <p className={styles.bookingDetailLocation}>{selectedBooking.location || 'Lokasi belum tersedia'}</p>
                </div>
                <button type="button" className={styles.bookingModalClose} onClick={closeBookingDetail} aria-label="Tutup detail booking">
                  ×
                </button>
              </div>

              <div className={styles.bookingModalBody}>
                <div className={styles.bookingModalStatusRow}>
                  <span className={`${styles.bookingStatus} ${STATUS_CLASS_MAP[selectedBooking.status]}`}>
                    {selectedBooking.statusLabel}
                  </span>
                  {detailLoading ? <span className={styles.bookingSideLoading}>Memuat detail</span> : null}
                </div>

                  {selectedMembershipDiscount > 0 || selectedVoucherDiscount > 0 ? (
                    <div className={styles.bookingSavingsBanner}>
                      <div>
                        <p className={styles.bookingSavingsTitle}>Potongan aktif</p>
                        <p className={styles.bookingSavingsText}>
                          {selectedMembershipDiscount > 0 ? `Membership hemat ${formatMoney(selectedMembershipDiscount)}` : null}
                          {selectedMembershipDiscount > 0 && selectedVoucherDiscount > 0 ? ' · ' : null}
                          {selectedVoucherDiscount > 0 ? `Voucher hemat ${formatMoney(selectedVoucherDiscount)}` : null}
                        </p>
                      </div>
                      <strong className={styles.bookingSavingsValue}>
                        {formatMoney(selectedMembershipDiscount + selectedVoucherDiscount)}
                      </strong>
                    </div>
                  ) : null}

                <div className={styles.bookingDetailGrid}>
                  <div className={styles.bookingDetailItem}>
                    <span>Room</span>
                    <strong>{selectedBooking.room || '-'}</strong>
                  </div>
                  <div className={styles.bookingDetailItem}>
                    <span>Tamu</span>
                    <strong>{selectedBooking.guests || 0} orang</strong>
                  </div>
                  <div className={styles.bookingDetailItem}>
                    <span>Check-in</span>
                    <strong>{selectedBooking.checkIn ? new Date(selectedBooking.checkIn).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</strong>
                  </div>
                  <div className={styles.bookingDetailItem}>
                    <span>Check-out</span>
                    <strong>{selectedBooking.checkOut ? new Date(selectedBooking.checkOut).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</strong>
                  </div>
                  <div className={styles.bookingDetailItem}>
                    <span>Metode Bayar</span>
                    <strong>{paymentMethodLabel}</strong>
                  </div>
                  <div className={styles.bookingDetailItem}>
                    <span>Gateway</span>
                    <strong>{paymentGatewayLabel}</strong>
                  </div>
                  <div className={styles.bookingDetailItem}>
                    <span>Status Pembayaran</span>
                    <strong>{paymentStatusLabel}</strong>
                  </div>
                  <div className={styles.bookingDetailItem}>
                    <span>Transaction ID</span>
                    <strong>{transactionIdLabel}</strong>
                  </div>
                </div>

                <div className={styles.bookingCostBreakdown}>
                  <div className={styles.bookingCostRow}>
                    <span>Subtotal</span>
                    <strong>{formatMoney(selectedSubtotal)}</strong>
                  </div>
                  <div className={styles.bookingCostRow}>
                    <span>Pajak</span>
                    <strong>{formatMoney(selectedTaxAmount)}</strong>
                  </div>
                  <div className={styles.bookingCostRow}>
                    <span>Potongan membership</span>
                    <strong>- {formatMoney(selectedMembershipDiscount)}</strong>
                  </div>
                  <div className={styles.bookingCostRow}>
                    <span>Potongan voucher</span>
                    <strong>- {formatMoney(selectedVoucherDiscount)}</strong>
                  </div>
                  <div className={`${styles.bookingCostRow} ${styles.bookingCostTotal}`}>
                    <span>Total akhir</span>
                    <strong>{formatMoney(selectedFinalTotal)}</strong>
                  </div>
                </div>

                <div className={styles.bookingDetailSummary}>
                  <div>
                    <span>Total</span>
                    <strong>{formatMoney(selectedFinalTotal)}</strong>
                  </div>
                  <div>
                    <span>Booking dibuat</span>
                    <strong>{selectedBooking.bookedAt ? new Date(selectedBooking.bookedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </>
  )
}