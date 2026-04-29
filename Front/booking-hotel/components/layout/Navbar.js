import styles from '../Navbar.module.css'

export default function Navbar({ onVoucherClick }) {
  return (
    <nav className={styles.nav}>
      <a href="/" className={styles.logo}>Booking Hotel</a>

      <div className={styles.links}>
        <a href="/" className={styles.link}>Dasbor</a>
        <a href="/hotels" className={styles.link}>Koleksi Hotel</a>
        <a href="/bookings" className={styles.link}>Riwayat Booking</a>
        <a href="/owner" className={styles.link}>Portal Pemilik</a>
        <a href="/admin" className={styles.adminLink}>Portal Admin</a>
      </div>

      <div className={styles.actions}>
        <a href="/login" className={styles.link}>Masuk</a>
        <a href="/register" className={styles.link}>Daftar</a>
        <button className={styles.inquiryBtn}>Pertanyaan</button>
      </div>
    </nav>
  )
}
