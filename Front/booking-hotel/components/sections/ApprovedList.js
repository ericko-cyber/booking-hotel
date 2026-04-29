import { useState } from 'react'
import styles from '../ApprovedList.module.css'

const properties = [
  {
    id: 1,
    name: 'The Lumina Heights',
    location: 'Paris, France',
    price: 850,
    rating: 4.9,
    tags: ['Suite Premium', 'Pemandangan Pegunungan'],
    image: 'https://images.unsplash.com/photo-1616594039964-2d4b53e51f6d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    name: 'Soma Sanctuary',
    location: 'Ubud, Bali',
    price: 1200,
    rating: 4.8,
    tags: ['Puncak Tebing', 'Kolam Privat'],
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    name: 'The Royal Connaught',
    location: 'London, UK',
    price: 640,
    rating: 4.9,
    tags: ['Bersejarah', 'Pusat Kota'],
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80',
  },
]

export default function ApprovedList() {
  const [saved, setSaved] = useState([])

  const toggleSave = (id) => {
    setSaved((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Pilihan Terbaik</p>
        <h2 className={styles.title}>Daftar Rekomendasi</h2>
        <p className={styles.subtitle}>
          Tim kami meninjau setiap properti. Hanya hotel terbaik yang masuk daftar ini.
        </p>
      </div>

      <div className={styles.grid}>
        {properties.map((prop) => (
          <div key={prop.id} className={styles.card}>
            <div className={styles.cardImg} style={{ backgroundImage: `url(${prop.image})` }}>
              <div className={styles.ratingBadge}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#c49a3c" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {prop.rating}
              </div>
              <button
                className={`${styles.saveBtn} ${saved.includes(prop.id) ? styles.saved : ''}`}
                onClick={() => toggleSave(prop.id)}
                title="Simpan properti"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={saved.includes(prop.id) ? '#e05a5a' : 'none'} stroke={saved.includes(prop.id) ? '#e05a5a' : 'white'} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTop}>
                <div>
                  <h3 className={styles.propName}>{prop.name}</h3>
                  <p className={styles.propLocation}>{prop.location}</p>
                </div>
                <div className={styles.priceBlock}>
                  <span className={styles.currency}>Rp</span>
                  <strong className={styles.price}>{prop.price.toLocaleString('id-ID')}</strong>
                  <span className={styles.perNight}>/ malam</span>
                </div>
              </div>
              <div className={styles.tags}>
                {prop.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
