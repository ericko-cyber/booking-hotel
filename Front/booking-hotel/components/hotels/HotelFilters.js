import styles from '../HotelFilters.module.css'

const MOODS = ['Pesisir', 'Alam', 'Perkotaan']
const REGIONS = ['Bali', 'Jakarta', 'Malang', 'Jogja', 'Lombok']

export default function HotelFilters({ filters, setFilters, regions = REGIONS, amenities = [], priceBounds = { min: 0, max: 2500 }, defaultFilters }) {
  const normalizedRegionQuery = (filters.regionQuery || '').toLowerCase().trim()
  const matchedRegions = regions.filter(r => r.toLowerCase().includes(normalizedRegionQuery))

  const toggleAmenity = (key) => {
    setFilters(f => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter(a => a !== key)
        : [...f.amenities, key],
    }))
  }

  const reset = () => {
    setFilters(defaultFilters || { mood: '', region: '', regionQuery: '', priceMax: priceBounds.max, amenities: [], search: '' })
  }

  const hasActive =
    filters.mood || filters.region || filters.regionQuery || filters.priceMax < priceBounds.max || filters.amenities.length > 0

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
        <input
          type="text"
          value={filters.regionQuery || ''}
          onChange={(e) => setFilters(f => ({ ...f, regionQuery: e.target.value }))}
          placeholder="Cari wilayah..."
          className={styles.searchInput}
        />
        {(filters.regionQuery || '').trim() && (
          <p className={styles.searchHint}>Hasil hotel difilter berdasarkan wilayah yang Anda ketik.</p>
        )}
        <div className={styles.chipGroup}>
          {matchedRegions.map(r => (
            <button
              key={r}
              className={`${styles.chip} ${filters.region === r ? styles.chipActive : ''}`}
              onClick={() => setFilters(f => ({ ...f, region: f.region === r ? '' : r, regionQuery: r }))}
            >
              {r}
            </button>
          ))}
        </div>
        {matchedRegions.length === 0 && (
          <p className={styles.emptyHint}>Wilayah tidak ditemukan.</p>
        )}
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabelRow}>
          <p className={styles.groupLabel}>Harga Maksimal</p>
          <strong className={styles.priceValue}>Rp{Number(filters.priceMax).toLocaleString('id-ID')}</strong>
        </div>
        <input
          type="range"
          min={priceBounds.min}
          max={priceBounds.max}
          step={50}
          value={filters.priceMax}
          onChange={e => setFilters(f => ({ ...f, priceMax: Number(e.target.value) }))}
          className={styles.rangeInput}
          style={{ '--val': filters.priceMax, '--min': priceBounds.min, '--max': priceBounds.max }}
        />
        <div className={styles.rangeLabels}>
          <span>Rp{Number((priceBounds.min || 0)).toLocaleString('id-ID')}</span>
          <span>Rp{Number((priceBounds.max || 0)).toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className={styles.group}>
        <p className={styles.groupLabel}>Fasilitas</p>
        <div className={styles.checkList}>
          {amenities.length > 0 ? amenities.map(({ key, label }) => (
            <label key={key} className={styles.checkItem}>
              <input
                type="checkbox"
                checked={filters.amenities.includes(key)}
                onChange={() => toggleAmenity(key)}
              />
              <span>{label}</span>
            </label>
          )) : (
            <p className={styles.emptyHint}>Belum ada fasilitas yang tersedia.</p>
          )}
        </div>
      </div>
    </div>
  )
}
