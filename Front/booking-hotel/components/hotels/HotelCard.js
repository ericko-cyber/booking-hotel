import styles from '../HotelCard.module.css'

const AMENITY_ICONS = {
  pool: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title="Kolam Renang">
      <path d="M2 12h20M2 12c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1" />
      <path d="M2 17c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1" />
    </svg>
  ),
  spa: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
    </svg>
  ),
  gym: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6.5 6.5h11M6.5 17.5h11M3 9.5v5M21 9.5v5M3 12h1M20 12h1" />
    </svg>
  ),
  dining: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6h3.5a1.5 1.5 0 0 1 0 3H17l-1 4" />
    </svg>
  ),
  concierge: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
    </svg>
  ),
}

const MOOD_COLORS = {
  Pesisir: '#1a6a9a',
  Alam: '#2d7a3a',
  Perkotaan: '#2a2a4a',
}

export default function HotelCard({ hotel, saved, onSave }) {
  return (
    <div className={styles.card}>
      <div className={styles.imgWrap} style={{ background: hotel.bg }}>
        {hotel.featured && (
          <span className={styles.featuredBadge}>Pilihan Editor</span>
        )}
        <div className={styles.ratingBadge}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#c49a3c">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {hotel.rating}
          <span className={styles.reviewCount}>({hotel.reviews})</span>
        </div>
        <button
          className={`${styles.saveBtn} ${saved ? styles.savedActive : ''}`}
          onClick={onSave}
          title={saved ? 'Hapus dari favorit' : 'Simpan ke favorit'}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill={saved ? '#e05a5a' : 'none'}
            stroke={saved ? '#e05a5a' : 'white'}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <span
          className={styles.moodChip}
          style={{ background: MOOD_COLORS[hotel.mood] || '#444' }}
        >
          {hotel.mood}
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.topRow}>
          <div className={styles.nameBlock}>
            <h3 className={styles.name}>{hotel.name}</h3>
            <p className={styles.location}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {hotel.location}
            </p>
          </div>
          <div className={styles.priceBlock}>
            <div className={styles.price}>
              <span>Rp</span><strong>{hotel.price.toLocaleString('id-ID')}</strong>
            </div>
            <span className={styles.perNight}>/ malam</span>
          </div>
        </div>

        <div className={styles.tags}>
          {hotel.tags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>

        <div className={styles.amenities}>
          {hotel.amenities.map(a => (
            <span key={a} className={styles.amenityIcon} title={a}>
              {AMENITY_ICONS[a]}
            </span>
          ))}
        </div>

        <a href={`/hotels/${hotel.id}`} className={styles.viewBtn}>
          Lihat Properti →
        </a>
      </div>
    </div>
  )
}
