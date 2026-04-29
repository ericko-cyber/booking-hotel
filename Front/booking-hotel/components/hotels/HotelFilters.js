import styles from '../HotelFilters.module.css'

const MOODS = ['Pesisir', 'Alam', 'Perkotaan']
const REGIONS = ['Bali', 'Jakarta', 'Malang', 'Jogja', 'Lombok']
const AMENITY_LIST = [
  { key: 'pool', label: 'Kolam Renang' },
  { key: 'spa', label: 'Spa & Kebugaran' },
  { key: 'gym', label: 'Pusat Kebugaran' },
  { key: 'dining', label: 'Restoran Premium' },
  { key: 'concierge', label: 'Layanan Concierge' },
]

export default function HotelFilters({ filters, setFilters }) {
  const toggleAmenity = (key) => {
    setFilters(f => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter(a => a !== key)
        : [...f.amenities, key],
    }))
  }

  const reset = () => {
    setFilters({ mood: '', region: '', priceMax: 2500, amenities: [], search: '' })
  }

  const hasActive =
    filters.mood || filters.region || filters.priceMax < 2500 || filters.amenities.length > 0

  return (
    <div className={styles.filters}>
      <div className={styles.filterHeader}>
        <h3>Filter</h3>
        {hasActive && (
          <button className={styles.clearAll} onClick={reset}>Hapus semua</button>
        )}
      </div>

      <div className={styles.group}>
        <p className={styles.groupLabel}>Suasana</p>
        <div className={styles.chipGroup}>
          {MOODS.map(m => (
            <button
              key={m}
              className={`${styles.chip} ${filters.mood === m ? styles.chipActive : ''}`}
              onClick={() => setFilters(f => ({ ...f, mood: f.mood === m ? '' : m }))}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <p className={styles.groupLabel}>Wilayah</p>
        <div className={styles.chipGroup}>
          {REGIONS.map(r => (
            <button
              key={r}
              className={`${styles.chip} ${filters.region === r ? styles.chipActive : ''}`}
              onClick={() => setFilters(f => ({ ...f, region: f.region === r ? '' : r }))}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabelRow}>
          <p className={styles.groupLabel}>Harga Maksimal</p>
          <strong className={styles.priceValue}>Rp{filters.priceMax.toLocaleString('id-ID')}</strong>
        </div>
        <input
          type="range"
          min={200}
          max={2500}
          step={50}
          value={filters.priceMax}
          onChange={e => setFilters(f => ({ ...f, priceMax: Number(e.target.value) }))}
          className={styles.rangeInput}
        />
        <div className={styles.rangeLabels}>
          <span>Rp200</span>
          <span>Rp2.500</span>
        </div>
      </div>

      <div className={styles.group}>
        <p className={styles.groupLabel}>Fasilitas</p>
        <div className={styles.checkList}>
          {AMENITY_LIST.map(({ key, label }) => (
            <label key={key} className={styles.checkItem}>
              <input
                type="checkbox"
                checked={filters.amenities.includes(key)}
                onChange={() => toggleAmenity(key)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
