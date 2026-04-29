import styles from '../Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.brand}>Booking Hotel</span>
      <div className={styles.links}>
        <a href="#">Kebijakan Privasi</a>
        <a href="#">Syarat Layanan</a>
        <a href="#">Kit Media</a>
        <a href="#">Hubungi Kami</a>
      </div>
    </footer>
  )
}
