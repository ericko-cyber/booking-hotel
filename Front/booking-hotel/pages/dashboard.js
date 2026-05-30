import { useMemo } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { authService } from '../services/authService'

const stats = [
  { label: 'Pemesanan Bulan Ini', value: '1.248' },
  { label: 'Check-in Hari Ini', value: '37 Tamu' },
  { label: 'Kamar Tersedia Hari Ini', value: '64 Kamar' },
  { label: 'Pendapatan Bulan Ini', value: 'Rp84.200' },
]

const todayBookings = [
  { kode: 'BK-24021', tamu: 'Andi Pratama', hotel: 'The Lumina Heights', status: 'Check-in 14:00' },
  { kode: 'BK-24022', tamu: 'Rina Putri', hotel: 'Kyoto Zen House', status: 'Check-in 15:30' },
  { kode: 'BK-24023', tamu: 'Budi Santoso', hotel: 'Manhattan Sky Loft', status: 'Menunggu Konfirmasi' },
]

export default function DashboardPage() {
  const router = useRouter()
  const user = authService.getUser()

  const membershipInfo = useMemo(() => {
    const queryTier = Array.isArray(router.query?.membership_tier) ? router.query.membership_tier[0] : router.query?.membership_tier
    const queryStatus = Array.isArray(router.query?.membership_status) ? router.query.membership_status[0] : router.query?.membership_status
    const tier = (queryTier || user?.membership_tier || 'none').toString().toLowerCase()
    const status = (queryStatus || user?.membership_status || 'nonaktif').toString().toLowerCase()
    const labels = {
      none: 'Nonmember',
      silver: 'Silver',
      gold: 'Gold',
      platinum: 'Platinum',
    }

    return {
      tier,
      status,
      label: labels[tier] || tier || 'Nonmember',
      isActive: status === 'active' || status === 'aktif',
    }
  }, [router.query?.membership_status, router.query?.membership_tier, user?.membership_status, user?.membership_tier])

  const successMessage = router.query?.payment === 'success'
    ? `Selamat, status membership ${membershipInfo.label} sudah aktif.`
    : null

  return (
    <>
      <Navbar />
      <main style={styles.main}>
        <section style={styles.hero}>
          <div style={styles.heroTopRow}>
            <div>
              <p style={styles.eyebrow}>DASHBOARD BOOKING HOTEL</p>
              <h1 style={styles.title}>Ringkasan Operasional Hotel</h1>
              <p style={styles.subtitle}>
                Pantau pemesanan, check-in, ketersediaan kamar, dan pendapatan harian di satu halaman.
              </p>
            </div>
            <div style={styles.membershipBadge}>
              <span style={styles.membershipBadgeLabel}>Status Membership</span>
              <strong style={styles.membershipBadgeValue}>{membershipInfo.label}</strong>
              <span style={membershipInfo.isActive ? styles.membershipActive : styles.membershipInactive}>
                {membershipInfo.isActive ? 'Aktif' : 'Tidak aktif'}
              </span>
            </div>
          </div>
          {successMessage ? <p style={styles.successBanner}>{successMessage}</p> : null}
        </section>

        <section style={styles.grid}>
          {stats.map((item) => (
            <article key={item.label} style={styles.card}>
              <p style={styles.cardLabel}>{item.label}</p>
              <p style={styles.cardValue}>{item.value}</p>
            </article>
          ))}
        </section>

        <section style={styles.panelWrap}>
          <article style={styles.panel}>
            <div style={styles.panelHead}>
              <h2 style={styles.panelTitle}>Pemesanan Hari Ini</h2>
              <button style={styles.panelBtn}>Lihat Semua</button>
            </div>
            <div style={styles.list}>
              {todayBookings.map((b) => (
                <div key={b.kode} style={styles.listRow}>
                  <p style={styles.bookingCode}>{b.kode}</p>
                  <p style={styles.bookingText}>{b.tamu}</p>
                  <p style={styles.bookingText}>{b.hotel}</p>
                  <p style={styles.bookingStatus}>{b.status}</p>
                </div>
              ))}
            </div>
          </article>

          <article style={styles.panel}>
            <h2 style={styles.panelTitle}>Aksi Cepat</h2>
            <div style={styles.quickActions}>
              <button style={styles.quickBtn}>Tambah Reservasi</button>
              <button style={styles.quickBtn}>Atur Harga Kamar</button>
              <button style={styles.quickBtn}>Laporan Harian</button>
            </div>
          </article>
        </section>
      </main>
      <Footer />
    </>
  )
}

const styles = {
  main: {
    background: '#f8f5f0',
    minHeight: '100vh',
    padding: '96px 24px 56px',
  },
  hero: {
    maxWidth: 1100,
    margin: '0 auto 22px',
    background: '#0f172a',
    borderRadius: 14,
    padding: '24px 28px',
    color: '#fff',
  },
  heroTopRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 24,
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    opacity: 0.75,
  },
  title: {
    margin: '8px 0 4px',
    fontSize: 34,
    lineHeight: 1.1,
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    opacity: 0.85,
    fontSize: 14,
  },
  membershipBadge: {
    minWidth: 180,
    padding: '12px 14px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    textAlign: 'right',
  },
  membershipBadgeLabel: {
    display: 'block',
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    opacity: 0.72,
    marginBottom: 6,
  },
  membershipBadgeValue: {
    display: 'block',
    fontSize: 20,
    lineHeight: 1.2,
    marginBottom: 4,
  },
  membershipActive: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: 999,
    background: '#22c55e',
    color: '#052e16',
    fontSize: 12,
    fontWeight: 700,
  },
  membershipInactive: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: 999,
    background: '#facc15',
    color: '#422006',
    fontSize: 12,
    fontWeight: 700,
  },
  successBanner: {
    margin: '14px 0 0',
    padding: '12px 14px',
    borderRadius: 10,
    background: 'rgba(34, 197, 94, 0.14)',
    border: '1px solid rgba(34, 197, 94, 0.35)',
    color: '#dcfce7',
    fontSize: 14,
    fontWeight: 600,
  },
  grid: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid rgba(0,0,0,0.08)',
    padding: '16px 18px',
  },
  cardLabel: {
    margin: 0,
    color: '#6b7280',
    fontSize: 12,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  cardValue: {
    margin: '8px 0 0',
    color: '#111111',
    fontSize: 30,
    fontWeight: 600,
  },
  panelWrap: {
    maxWidth: 1100,
    margin: '18px auto 0',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 16,
  },
  panel: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid rgba(0,0,0,0.08)',
    padding: 16,
  },
  panelHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  panelTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#111111',
  },
  panelBtn: {
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#111827',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 600,
  },
  list: {
    display: 'grid',
    gap: 8,
  },
  listRow: {
    display: 'grid',
    gridTemplateColumns: '110px 1fr 1fr 150px',
    alignItems: 'center',
    gap: 8,
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '10px 12px',
  },
  bookingCode: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    color: '#334155',
  },
  bookingText: {
    margin: 0,
    fontSize: 13,
    color: '#111827',
  },
  bookingStatus: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    color: '#0f766e',
  },
  quickActions: {
    display: 'grid',
    gap: 10,
    marginTop: 12,
  },
  quickBtn: {
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    color: '#0f172a',
    borderRadius: 10,
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: 13,
    fontWeight: 600,
  },
}
