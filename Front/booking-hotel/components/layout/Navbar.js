import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '../Navbar.module.css'
import { authService } from '../../services/authService'

export default function Navbar({ onVoucherClick }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [profileLoaded, setProfileLoaded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const authenticated = mounted && authService.isAuthenticated()

  useEffect(() => {
    if (!mounted) return

    let active = true

    const syncProfile = async () => {
      if (!authenticated) {
        setCurrentUser(null)
        setProfileLoaded(true)
        return
      }

      setProfileLoaded(false)

      try {
        const response = await authService.getCurrentUser()
        const payload = response?.data?.data || response?.data || response
        const user = payload?.user || payload || null

        if (!active) return

        setCurrentUser(user)
        if (user && typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user))
        }
      } catch (error) {
        if (!active) return

        console.error('Failed to sync navbar membership status', error)
        setCurrentUser(null)
      } finally {
        if (active) {
          setProfileLoaded(true)
        }
      }
    }

    syncProfile()

    return () => {
      active = false
    }
  }, [authenticated, mounted, router.asPath])

  const membershipTier = profileLoaded ? (currentUser?.membership_tier || 'none').toString().toLowerCase() : 'none'
  const membershipStatus = profileLoaded ? (currentUser?.membership_status || 'nonaktif').toString().toLowerCase() : 'nonaktif'
  const membershipLabelMap = {
    none: 'Nonmember',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
  }
  const membershipLabel = profileLoaded ? (membershipLabelMap[membershipTier] || membershipTier || 'Nonmember') : 'Memuat...'
  const membershipActive = profileLoaded && (membershipStatus === 'active' || membershipStatus === 'aktif')

  const handleLogout = () => {
    authService.logout()
    router.push('/login')
  }

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>Booking Hotel</Link>

      <div className={styles.links}>
        <Link href="/" className={styles.link}>Dasbor</Link>
        <Link href="/hotels" className={styles.link}>Koleksi Hotel</Link>
        <Link href="/bookings" className={styles.link}>Riwayat Booking</Link>
        <Link href="/vouchers" className={styles.link}>Voucher</Link>
        {/* <Link href="/owner" className={styles.link}>Portal Pemilik</Link>
        <Link href="/admin" className={styles.adminLink}>Portal Admin</Link> */}
      </div>

      <div className={styles.actions}>
        {authenticated ? (
          <>
            <div className={styles.membershipBadge} title="Status membership">
              <span className={styles.membershipBadgeLabel}>Membership</span>
              <strong className={styles.membershipBadgeValue}>{membershipLabel}</strong>
              <span className={membershipActive ? styles.membershipActive : styles.membershipInactive}>
                {membershipActive ? 'Aktif' : 'Tidak aktif'}
              </span>
            </div>
            <button onClick={handleLogout} className={styles.link}>Keluar</button>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.link}>Masuk</Link>
            <Link href="/register" className={styles.link}>Daftar</Link>
            <button className={styles.inquiryBtn}>Pertanyaan</button>
          </>
        )}
      </div>
    </nav>
  )
}
