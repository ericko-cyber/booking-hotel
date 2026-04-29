import { useState, useMemo } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import VoucherModal from '../components/modals/VoucherModal'
import MembershipModal from '../components/modals/MembershipModal'
import HotelCard from '../components/hotels/HotelCard'
import HotelFilters from '../components/hotels/HotelFilters'
import styles from '../components/Hotels.module.css'

export const ALL_HOTELS = [
  {
    id: 1,
    name: 'The Lumina Heights',
    location: 'Paris, France',
    region: 'Jogja',
    price: 850,
    rating: 4.9,
    reviews: 312,
    tags: ['Suite Premium', 'Pemandangan Pegunungan'],
    mood: 'Perkotaan',
    bg: 'linear-gradient(135deg, #3a2a1a 0%, #6b4a2a 60%, #8a6a40 100%)',
    amenities: ['pool', 'spa', 'gym', 'concierge'],
    featured: true,
  },
  {
    id: 2,
    name: 'Soma Sanctuary',
    location: 'Ubud, Bali',
    region: 'Bali',
    price: 1200,
    rating: 4.8,
    reviews: 198,
    tags: ['Puncak Tebing', 'Kolam Privat'],
    mood: 'Alam',
    bg: 'linear-gradient(135deg, #1a4a1a 0%, #2d7a3a 60%, #4a9a50 100%)',
    amenities: ['pool', 'spa', 'dining', 'concierge'],
    featured: true,
  },
  {
    id: 3, 
    name: 'The Royal Connaught',
    location: 'London, UK',
    region: 'Jogja',
    price: 640,
    rating: 4.9,
    reviews: 521,
    tags: ['Bersejarah', 'Pusat Kota'],
    mood: 'Perkotaan',
    bg: 'linear-gradient(135deg, #4a3a1a 0%, #8a6a30 60%, #c49a50 100%)',
    amenities: ['spa', 'dining', 'gym', 'concierge'],
    featured: false,
  },
  {
    id: 4,
    name: 'Amalfi Cliffside',
    location: 'Positano, Italy',
    region: 'Jogja',
    price: 980,
    rating: 4.7,
    reviews: 145,
    tags: ['Sisi Tebing', 'Pemandangan Laut'],
    mood: 'Pesisir',
    bg: 'linear-gradient(135deg, #1a3a5a 0%, #2a6a9a 60%, #4a8aba 100%)',
    amenities: ['pool', 'dining', 'concierge'],
    featured: false,
  },
  {
    id: 5,
    name: 'Desert Bloom Retreat',
    location: 'Marrakech, Morocco',
    region: 'Malang',
    price: 420,
    rating: 4.6,
    reviews: 87,
    tags: ['Riad', 'Kolam Rooftop'],
    mood: 'Alam',
    bg: 'linear-gradient(135deg, #5a2a1a 0%, #9a4a20 60%, #c06a30 100%)',
    amenities: ['pool', 'spa', 'dining'],
    featured: false,
  },
  {
    id: 6,
    name: 'Kyoto Zen House',
    location: 'Kyoto, Japan',
    region: 'Jakarta',
    price: 760,
    rating: 4.9,
    reviews: 203,
    tags: ['Ryokan', 'Pemandangan Taman'],
    mood: 'Alam',
    bg: 'linear-gradient(135deg, #2a1a3a 0%, #5a3a6a 60%, #8a5a8a 100%)',
    amenities: ['spa', 'dining', 'concierge'],
    featured: true,
  },
  {
    id: 7,
    name: 'Maldives Pearl Villa',
    location: 'North Male Atoll, Maldives',
    region: 'Jakarta',
    price: 2100,
    rating: 5.0,
    reviews: 64,
    tags: ['Atas Air', 'Pantai Privat'],
    mood: 'Lombok',
    bg: 'linear-gradient(135deg, #0d3d4a 0%, #1a6a7a 60%, #2a9aaa 100%)',
    amenities: ['pool', 'spa', 'dining', 'gym', 'concierge'],
    featured: true,
  },
  {
    id: 8,
    name: 'Cape Vineyard Estate',
    location: 'Franschhoek, South Africa',
    region: 'Lombok',
    price: 390,
    rating: 4.7,
    reviews: 119,
    tags: ['Perkebunan Anggur', 'Latar Pegunungan'],
    mood: 'Alam',
    bg: 'linear-gradient(135deg, #3a1a1a 0%, #6a2a2a 60%, #8a4a3a 100%)',
    amenities: ['pool', 'dining', 'concierge'],
    featured: false,
  },
  {
    id: 9,
    name: 'Manhattan Sky Loft',
    location: 'New York, USA',
    region: 'Malang',
    price: 1100,
    rating: 4.8,
    reviews: 432,
    tags: ['Penthouse', 'Pemandangan Kota'],
    mood: 'Perkotaan',
    bg: 'linear-gradient(135deg, #1a1a2a 0%, #2a2a4a 60%, #4a4a7a 100%)',
    amenities: ['gym', 'dining', 'concierge'],
    featured: false,
  },
]

const SORT_OPTIONS = [
  { value: 'featured', label: 'Unggulan' },
  { value: 'price_asc', label: 'Harga: Terendah ke Tertinggi' },
  { value: 'price_desc', label: 'Harga: Tertinggi ke Terendah' },
  { value: 'rating', label: 'Rating Tertinggi' },
  { value: 'reviews', label: 'Ulasan Terbanyak' },
]

export default function Hotels() {
  const [showVoucher, setShowVoucher] = useState(false)
  const [showMembership, setShowMembership] = useState(false)
  const [filters, setFilters] = useState({
    mood: '',
    region: '',
    priceMax: 2500,
    amenities: [],
    search: '',
  })
  const [sort, setSort] = useState('featured')
  const [saved, setSaved] = useState([])

  const toggleSave = (id) => {
    setSaved((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const filtered = useMemo(() => {
    let list = [...ALL_HOTELS]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.location.toLowerCase().includes(q) ||
          h.mood.toLowerCase().includes(q),
      )
    }
    if (filters.mood) list = list.filter((h) => h.mood === filters.mood)
    if (filters.region) list = list.filter((h) => h.region === filters.region)
    list = list.filter((h) => h.price <= filters.priceMax)
    if (filters.amenities.length > 0) {
      list = list.filter((h) => filters.amenities.every((a) => h.amenities.includes(a)))
    }

    if (sort === 'featured') list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    else if (sort === 'price_asc') list.sort((a, b) => a.price - b.price)
    else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price)
    else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating)
    else if (sort === 'reviews') list.sort((a, b) => b.reviews - a.reviews)

    return list
  }, [filters, sort])

  return (
    <>
      <Navbar onVoucherClick={() => setShowVoucher(true)} />

      <div className={styles.pageHero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Koleksi Hotel</p>
          <h1 className={styles.heroTitle}>Semua Properti</h1>
          <p className={styles.heroSubtitle}>
            Temukan Hotel <strong> Terbaik Anda</strong> - semuanya
            telah ditinjau dan diverifikasi tim kami.
          </p>
          <div className={styles.heroSearch}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Cari berdasarkan nama, lokasi, atau suasana..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <HotelFilters filters={filters} setFilters={setFilters} />
        </aside>

        <main className={styles.main}>
          <div className={styles.toolbar}>
            <p className={styles.resultCount}>
              <strong>{filtered.length}</strong> properti ditemukan
            </p>
            <div className={styles.sortRow}>
              <label>Urutkan</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={styles.sortSelect}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className={styles.grid}>
              {filtered.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  saved={saved.includes(hotel.id)}
                  onSave={() => toggleSave(hotel.id)}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" strokeWidth="1.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p>Tidak ada properti yang sesuai dengan filter Anda.</p>
              <button
                className={styles.resetBtn}
                onClick={() => setFilters({ mood: '', region: '', priceMax: 2500, amenities: [], search: '' })}
              >
                Reset Filter
              </button>
            </div>
          )}
        </main>
      </div>

      <Footer />
      {showVoucher && <VoucherModal onClose={() => setShowVoucher(false)} />}
      {showMembership && <MembershipModal onClose={() => setShowMembership(false)} />}
    </>
  )
}