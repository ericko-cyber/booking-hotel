import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import VoucherModal from '../components/modals/VoucherModal'
import api from '../lib/api'
import MembershipModal from '../components/modals/MembershipModal'
import HotelCard from '../components/hotels/HotelCard'
import HotelFilters from '../components/hotels/HotelFilters'
import styles from '../components/Hotels.module.css'

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '')

const nullStringValue = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value.Valid) return value.String || ''
  return ''
}

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

const DUMMY_BG = [
  'linear-gradient(135deg, #3a2a1a 0%, #6b4a2a 60%, #8a6a40 100%)',
  'linear-gradient(135deg, #1a4a1a 0%, #2d7a3a 60%, #4a9a50 100%)',
  'linear-gradient(135deg, #1a3a5a 0%, #2a6a9a 60%, #4a8aba 100%)',
  'linear-gradient(135deg, #2a1a3a 0%, #5a3a6a 60%, #8a5a8a 100%)',
]

const parseAmenityList = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const parseHotelImages = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'object' && value.Valid) return parseHotelImages(value.String)
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return [value]
  }
}

const resolveImageUrl = (value) => {
  if (!value) return ''
  if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:')) return value
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`
  return value
}

const mapApiHotelToCard = (hotel, index = 0) => {
  const region = hotel.city || hotel.province || hotel.country || 'Indonesia'
  const location = [hotel.location, hotel.address].filter(Boolean).join(' • ') || region
  const amenityList = parseAmenityList(hotel.amenities)
  const category = hotel.category ? String(hotel.category) : 'hotel'
  const priceBase = 300 + (Number(hotel.total_rooms || 1) * 50)
  const hotelImages = parseHotelImages(hotel.image)

  const moodVal = nullStringValue(hotel.suasana) || (hotel.status === 'approved' ? 'Perkotaan' : 'Alam')

  return {
    id: hotel.id,
    name: hotel.name,
    location,
    region,
    price: Number(hotel.price || priceBase),
    rating: Number(hotel.rating || 0),
    reviews: Number(hotel.review_count || 0),
    tags: [category.charAt(0).toUpperCase() + category.slice(1), `${Number(hotel.total_rooms || 0)} Kamar`],
    mood: moodVal,
    bg: DUMMY_BG[index % DUMMY_BG.length],
    bgImageUrl: resolveImageUrl(hotelImages[0] || ''),
    amenities: amenityList,
    featured: Number(hotel.rating || 0) >= 4.8 || index === 0,
  }
}

export default function Hotels({ initialHotels = [] }) {
  const [showVoucher, setShowVoucher] = useState(false)
  const [vouchersData, setVouchersData] = useState(null)
  const [showMembership, setShowMembership] = useState(false)
  const [hotels, setHotels] = useState(initialHotels)
  const [sort, setSort] = useState('featured')
  const [saved, setSaved] = useState([])

  const priceBounds = useMemo(() => {
    const prices = hotels.map((hotel) => Number(hotel.price || 0)).filter((price) => price > 0)
    if (prices.length === 0) {
      return { min: 0, max: 2500 }
    }
    const min = Math.max(0, Math.min(...prices))
    const maxRaw = Math.max(...prices)
    return {
      min,
      max: maxRaw === min ? min + 1 : maxRaw,
    }
  }, [hotels])

  const availableAmenityOptions = useMemo(() => {
    const labels = new Map([
      ['pool', 'Kolam Renang'],
      ['spa', 'Spa & Kebugaran'],
      ['gym', 'Pusat Kebugaran'],
      ['dining', 'Restoran Premium'],
      ['concierge', 'Layanan Concierge'],
      ['wifi', 'Wi-Fi'],
      ['ac', 'AC'],
      ['tv', 'TV'],
      ['minibar', 'Minibar'],
      ['safe', 'Brankas'],
      ['jacuzzi', 'Jacuzzi'],
      ['balcony', 'Balkon'],
      ['butler', 'Pelayan Pribadi'],
      ['fireplace', 'Perapian'],
      ['terrace', 'Terasa'],
      ['private_terrace', 'Terasa Pribadi'],
      ['ocean_view', 'Pemandangan Laut'],
      ['parking', 'Parkir'],
      ['restaurant', 'Restoran'],
    ])

    const keys = new Set()
    hotels.forEach((hotel) => {
      (hotel.amenities || []).forEach((amenity) => {
        if (amenity) keys.add(String(amenity))
      })
    })

    return [...keys].sort().map((key) => ({
      key,
      label: labels.get(key) || key,
    }))
  }, [hotels])

  const defaultFilters = useMemo(() => ({
    mood: '',
    region: '',
    regionQuery: '',
    priceMax: priceBounds.max,
    amenities: [],
    search: '',
  }), [priceBounds.max])

  const [filters, setFilters] = useState(() => defaultFilters)

  // Keep a derived view of filters where priceMax is clamped to available bounds.
  const effectiveFilters = useMemo(() => ({
    ...filters,
    priceMax: Math.min(Math.max(Number(filters.priceMax || 0), priceBounds.min), priceBounds.max),
  }), [filters, priceBounds.min, priceBounds.max])

  // Fetch user's vouchers when voucher modal opens
  useEffect(() => {
    let cancelled = false
    const fetchVouchers = async () => {
      try {
        const res = await api.get('/vouchers/my-claims')
        // api returns { success, data } or direct data depending on wrapper
        const list = res?.data || res || []
        if (!cancelled) setVouchersData(list)
      } catch (err) {
        if (!cancelled) setVouchersData([])
      }
    }
    if (showVoucher) fetchVouchers()
    return () => { cancelled = true }
  }, [showVoucher])

  const toggleSave = (id) => {
    setSaved((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const filtered = useMemo(() => {
    const f = effectiveFilters
    let list = [...hotels]

    if (f.search) {
      const q = f.search.toLowerCase()
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.location.toLowerCase().includes(q) ||
          h.mood.toLowerCase().includes(q),
      )
    }
    if (f.mood) list = list.filter((h) => h.mood === f.mood)
    if (f.region) list = list.filter((h) => h.region === f.region)
    if (f.regionQuery?.trim()) {
      const regionKeyword = f.regionQuery.trim().toLowerCase()
      list = list.filter((h) =>
        h.region.toLowerCase().includes(regionKeyword) ||
        h.location.toLowerCase().includes(regionKeyword),
      )
    }
    list = list.filter((h) => h.price <= f.priceMax)
    if (f.amenities.length > 0) {
      list = list.filter((h) => f.amenities.every((a) => h.amenities.includes(a)))
    }

    if (sort === 'featured') list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    else if (sort === 'price_asc') list.sort((a, b) => a.price - b.price)
    else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price)
    else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating)
    else if (sort === 'reviews') list.sort((a, b) => b.reviews - a.reviews)

    return list
  }, [effectiveFilters, sort, hotels])

  const availableRegions = useMemo(() => {
    const unique = new Set(hotels.map((h) => h.region).filter(Boolean))
    return [...unique].sort((a, b) => a.localeCompare(b))
  }, [hotels])

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
            <HotelFilters
              filters={filters}
              setFilters={setFilters}
              regions={availableRegions}
              amenities={availableAmenityOptions}
              priceBounds={priceBounds}
              defaultFilters={defaultFilters}
            />
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
                onClick={() => setFilters(defaultFilters)}
              >
                Reset Filter
              </button>
            </div>
          )}
        </main>
      </div>

      <Footer />
      {showVoucher && (
        <VoucherModal
          onClose={() => setShowVoucher(false)}
          vouchers={vouchersData}
        />
      )}
      {showMembership && <MembershipModal onClose={() => setShowMembership(false)} />}
    </>
  )
}

export async function getServerSideProps() {
  try {
    const res = await fetch('http://localhost:8080/api/hotels')
    const json = await res.json()
    const apiHotels = json?.data?.hotels || json?.data?.Hotels || []
    const approvedList = apiHotels.filter((hotel) => hotel.status === 'approved' && Number(hotel.total_rooms || 0) > 0)

    const enriched = await Promise.all(approvedList.map(async (hotel) => {
      try {
        const roomsRes = await fetch(`http://localhost:8080/api/hotels/${hotel.id}/rooms`)
        const roomsJson = await roomsRes.json()
        const rooms = roomsJson?.data?.rooms || roomsJson?.data || []
        const prices = rooms.map((r) => Number(r.price || 0)).filter((p) => p > 0)
        const displayPrice = prices.length ? Math.min(...prices) : undefined

        const card = mapApiHotelToCard(hotel)
        if (typeof displayPrice !== 'undefined') card.price = Number(displayPrice)
        return card
      } catch (err) {
        return mapApiHotelToCard(hotel)
      }
    }))

    const approvedHotels = enriched

    return {
      props: {
        initialHotels: approvedHotels,
      },
    }
  } catch (error) {
    console.error('Failed to load hotels on server', error)
    return {
      props: {
        initialHotels: [],
      },
    }
  }
}