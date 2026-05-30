import styles from '../Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>Edisi Musim Liburan</p>
        <h1 className={styles.headline}>
          Liburan ke Destinasi<br />Tak Terduga.
        </h1>

        {/* <div className={styles.searchBar}>
          <div className={styles.searchField}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div>
              <span className={styles.fieldLabel}>Hotel atau Lokasi</span>
              <input type="text" placeholder="Cari hotel atau kota" className={styles.fieldInput} />
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.searchField}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div>
              <span className={styles.fieldLabel}>Check-in — check-out</span>
              <input type="text" placeholder="Pilih tanggal" className={styles.fieldInput} />
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.searchField}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div>
              <span className={styles.fieldLabel}>Tamu</span>
              <input type="text" placeholder="Tambah tamu" className={styles.fieldInput} />
            </div>
          </div>
          <button className={styles.searchBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Cari
          </button>
        </div> */}
      </div>
    </section>
  )
}
