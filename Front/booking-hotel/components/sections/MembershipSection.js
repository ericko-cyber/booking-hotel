import styles from '../MembershipSection.module.css'

export default function MembershipSection({ onApply }) {
  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <div className={styles.left}>
          <p className={styles.eyebrow}>Program Member</p>
          <h2 className={styles.title}>Gabung Member Booking Hotel</h2>
          <p className={styles.desc}>
            Dapatkan harga spesial, prioritas pemesanan, dan promo eksklusif untuk setiap booking.
            Member juga menikmati dukungan prioritas dan <strong>voucher diskon hotel</strong> hingga
            Rp1.500 sepanjang periode promo.
          </p>

          <ul className={styles.perks}>
            <li>
              <span className={styles.perkIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </span>
              <div>
                <strong>Akses Prioritas</strong>
                <span>Pemesanan awal koleksi pilihan</span>
              </div>
            </li>
            <li>
              <span className={styles.perkIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </span>
              <div>
                <strong>Voucher Anggota</strong>
                <span>Diskon dan benefit khusus member</span>
              </div>
            </li>
          </ul>

          <div className={styles.actions}>
            <button className={styles.applyBtn} onClick={onApply}>
              Ajukan Keanggotaan
            </button>
            <button className={styles.voucherLink}>
              Lihat semua benefit
            </button>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.imageStack}>
            <div className={`${styles.imgCard} ${styles.imgCard1}`}>
              <div className={styles.imgPlaceholder1} />
            </div>
            <div className={`${styles.imgCard} ${styles.imgCard2}`}>
              <div className={styles.imgPlaceholder2} />
            </div>
          </div>
          <div className={styles.badge}>
            <span>Hingga</span>
            <strong>Rp1.500</strong>
            <span>dalam voucher</span>
          </div>
        </div>
      </div>
    </section>
  )
}
