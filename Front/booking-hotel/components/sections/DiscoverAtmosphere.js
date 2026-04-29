import styles from '../DiscoverAtmosphere.module.css'

const moods = [
  {
    id: 1,
    name: 'Pesisir',
    desc: 'Pelarian tepi laut dengan garis pantai privat untuk ketenangan Anda.',
    image: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1000&q=80',
    span: 'tall',
  },
  {
    id: 2,
    name: 'Alam',
    desc: 'Pengalaman menginap menyatu dengan alam yang masih terjaga.',
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80',
    span: 'normal',
  },
  {
    id: 3,
    name: 'Perkotaan',
    desc: 'Pengalaman kuliner berkelas di pusat kota-kota budaya ikonik.',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80',
    span: 'normal',
  },
]

export default function DiscoverAtmosphere() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Rekomendasi Hotel</p>
          <h2 className={styles.title}>Temukan Hotel Sesuai Kebutuhan</h2>
        </div>
        <button className={styles.viewAll}>Lihat Semua Hotel</button>
      </div>

      <div className={styles.grid}>
        {moods.map((mood) => (
          <div
            key={mood.id}
            className={`${styles.card} ${styles[mood.span]}`}
            style={{ backgroundImage: `url(${mood.image})` }}
          >
            <div className={styles.cardContent}>
              <h3 className={styles.moodName}>{mood.name}</h3>
              <p className={styles.moodDesc}>{mood.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
