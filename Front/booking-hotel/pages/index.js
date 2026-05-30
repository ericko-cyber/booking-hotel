import Navbar from '../components/layout/Navbar'
import Hero from '../components/sections/Hero'
import MembershipSection from '../components/sections/MembershipSection'
import DiscoverAtmosphere from '../components/sections/DiscoverAtmosphere'
import ApprovedList from '../components/sections/ApprovedList'
import Footer from '../components/layout/Footer'
import MembershipModal from '../components/modals/MembershipModal'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '')

const resolveImageUrl = (value) => {
  if (!value) return ''
  if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:')) return value
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`
  return value
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

export default function Home({ initialHotels = [] }) {
  const [showMembership, setShowMembership] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const router = useRouter()
  const membershipTier = Array.isArray(router.query?.membership_tier) ? router.query.membership_tier[0] : router.query?.membership_tier
  const membershipStatus = Array.isArray(router.query?.membership_status) ? router.query.membership_status[0] : router.query?.membership_status
  const isPaymentSuccess = router.query?.payment === 'success'
  const tierLabelMap = {
    none: 'Nonmember',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
  }
  const tierLabel = tierLabelMap[(membershipTier || 'none').toString().toLowerCase()] || membershipTier || 'Nonmember'
  const statusLabel = ['active', 'aktif'].includes((membershipStatus || 'aktif').toString().toLowerCase())
    ? 'Aktif'
    : 'Tidak aktif'

  useEffect(() => {
    setShowSuccessModal(isPaymentSuccess)
  }, [isPaymentSuccess])

  const closeSuccessModal = () => {
    setShowSuccessModal(false)
    router.replace('/', undefined, { shallow: true })
  }

  return (
    <>
      <Navbar />
      {showSuccessModal ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(event) => event.target === event.currentTarget && closeSuccessModal()}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 400,
            background: 'rgba(15, 23, 42, 0.52)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{
            width: 'min(92vw, 460px)',
            borderRadius: 20,
            background: '#fff',
            boxShadow: '0 24px 80px rgba(15, 23, 42, 0.28)',
            border: '1px solid rgba(15, 118, 110, 0.12)',
            padding: '26px 24px 22px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #0f766e, #22c55e)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontSize: 24,
              fontWeight: 800,
            }}>
              ✓
            </div>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#0f766e', fontWeight: 700 }}>
              Pembayaran Berhasil
            </p>
            <h2 style={{ margin: '10px 0 8px', fontSize: 24, lineHeight: 1.15, color: '#0f172a' }}>
              Selamat, membership {tierLabel} sudah {statusLabel.toLowerCase()}.
            </h2>
            <p style={{ margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.65 }}>
              Status membership Anda sudah diperbarui dan siap dipakai untuk benefit hotel.
            </p>
            <button
              type="button"
              onClick={closeSuccessModal}
              style={{
                marginTop: 18,
                border: 'none',
                borderRadius: 999,
                padding: '10px 16px',
                background: '#0f766e',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      ) : null}
      <Hero />
      <MembershipSection onApply={() => setShowMembership(true)} />
      <DiscoverAtmosphere />
      <ApprovedList initialHotels={initialHotels} />
      <Footer />
      {showMembership && <MembershipModal onClose={() => setShowMembership(false)} />}
    </>
  )
}

export async function getServerSideProps() {
  try {
    const res = await fetch('http://localhost:8080/api/hotels')
    const json = await res.json()
    const hotels = json?.data?.hotels || json?.data?.Hotels || []

    const approvedList = hotels.filter((hotel) => hotel.status === 'approved' && Number(hotel.total_rooms || 0) > 0)
    // For each hotel, try to fetch its rooms to determine a realistic display price (min room price)
    const enriched = await Promise.all(approvedList.map(async (hotel, index) => {
      try {
        const roomsRes = await fetch(`http://localhost:8080/api/hotels/${hotel.id}/rooms`)
        const roomsJson = await roomsRes.json()
        const rooms = roomsJson?.data?.rooms || roomsJson?.data || []
        const prices = rooms.map((r) => Number(r.price || 0)).filter((p) => p > 0)
        const displayPrice = prices.length ? Math.min(...prices) : Number(hotel.price || 0)

        const hotelImages = parseHotelImages(hotel.image)
        const firstImg = resolveImageUrl(hotelImages[0] || '')

        return {
          id: hotel.id,
          name: hotel.name,
          location: [hotel.location, hotel.address].filter(Boolean).join(' • ') || hotel.city || hotel.province || hotel.country || 'Indonesia',
          price: Number(displayPrice || 0),
          rating: Number(hotel.rating || 0),
          tags: [hotel.category ? String(hotel.category) : 'Hotel', `${Number(hotel.total_rooms || 0)} Kamar`],
          image: firstImg,
          bgImageUrl: firstImg,
          bg: hotel.bg || ['linear-gradient(135deg, #3a2a1a 0%, #6b4a2a 60%, #8a6a40 100%)', 'linear-gradient(135deg, #1a4a1a 0%, #2d7a3a 60%, #4a9a50 100%)', 'linear-gradient(135deg, #1a3a5a 0%, #2a6a9a 60%, #4a8aba 100%)'][index % 3],
          featured: Number(hotel.rating || 0) >= 4.8 || index === 0,
        }
      } catch (err) {
        const hotelImages = parseHotelImages(hotel.image)
        const firstImg = resolveImageUrl(hotelImages[0] || '')
        return {
          id: hotel.id,
          name: hotel.name,
          location: [hotel.location, hotel.address].filter(Boolean).join(' • ') || hotel.city || hotel.province || hotel.country || 'Indonesia',
          price: Number(hotel.price || 0),
          rating: Number(hotel.rating || 0),
          tags: [hotel.category ? String(hotel.category) : 'Hotel', `${Number(hotel.total_rooms || 0)} Kamar`],
          image: firstImg,
          bgImageUrl: firstImg,
          bg: hotel.bg || ['linear-gradient(135deg, #3a2a1a 0%, #6b4a2a 60%, #8a6a40 100%)', 'linear-gradient(135deg, #1a4a1a 0%, #2d7a3a 60%, #4a9a50 100%)', 'linear-gradient(135deg, #1a3a5a 0%, #2a6a9a 60%, #4a8aba 100%)'][index % 3],
          featured: Number(hotel.rating || 0) >= 4.8 || index === 0,
        }
      }
    }))

    const approvedHotels = enriched

    return {
      props: {
        initialHotels: approvedHotels,
      },
    }
  } catch (error) {
    console.error('Failed to load homepage hotels', error)
    return {
      props: {
        initialHotels: [],
      },
    }
  }
}
