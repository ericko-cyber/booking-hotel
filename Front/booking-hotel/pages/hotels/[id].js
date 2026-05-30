import HotelDetailPage from '../../components/hotel-detail/HotelDetailPage'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '')

const HOTEL_BG = [
  'linear-gradient(135deg, #3a2a1a 0%, #6b4a2a 60%, #8a6a40 100%)',
  'linear-gradient(135deg, #1a4a1a 0%, #2d7a3a 60%, #4a9a50 100%)',
  'linear-gradient(135deg, #1a3a5a 0%, #2a6a9a 60%, #4a8aba 100%)',
  'linear-gradient(135deg, #2a1a3a 0%, #5a3a6a 60%, #8a5a8a 100%)',
]

const nullStringValue = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value.Valid) return value.String || ''
  return ''
}

const nullNumberValue = (value) => {
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value.Valid) return Number(value.Float64 || 0)
  return 0
}

const parseJsonList = (value) => {
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

const moodFromHotel = (hotel) => {
  const explicit = nullStringValue(hotel.suasana)
  if (explicit) return explicit
  const category = nullStringValue(hotel.category).toLowerCase()
  if (category.includes('business')) return 'Perkotaan'
  if (category.includes('resort')) return 'Pesisir'
  return 'Alam'
}

const buildLocation = (hotel) => {
  const parts = [
    nullStringValue(hotel.location),
    nullStringValue(hotel.address),
    nullStringValue(hotel.city),
    nullStringValue(hotel.province),
    nullStringValue(hotel.country),
  ].filter(Boolean)

  if (parts.length >= 2) return `${parts[0]} • ${parts[1]}`
  return parts.join(' • ') || 'Lokasi tidak tersedia'
}

const mapHotelSummary = (hotel, index = 0) => {
  const roomsCount = Number(hotel.total_rooms || 0)
  const price = 300 + roomsCount * 50
  const category = nullStringValue(hotel.category) || 'Hotel'

  const hotelImages = parseHotelImages(hotel.image).map(resolveImageUrl)

  return {
    id: hotel.id,
    name: hotel.name,
    location: buildLocation(hotel),
    region: nullStringValue(hotel.city) || nullStringValue(hotel.province) || nullStringValue(hotel.country) || 'Indonesia',
    price,
    rating: Number(hotel.rating || 0),
    reviews: Number(hotel.review_count || 0),
    tags: [category.charAt(0).toUpperCase() + category.slice(1), `${roomsCount} Kamar`],
    mood: moodFromHotel(hotel),
    bg: HOTEL_BG[index % HOTEL_BG.length],
    bgImageUrl: hotelImages[0] || resolveImageUrl(nullStringValue(hotel.image)),
    amenities: parseJsonList(hotel.amenities),
    featured: Number(hotel.rating || 0) >= 4.8 || index === 0,
  }
}

const mapHotelDetail = (hotel, rooms = []) => {
  const description = nullStringValue(hotel.description)
  const totalRooms = Number(hotel.total_rooms || rooms.length || 0)
  const parsedAmenities = parseJsonList(hotel.amenities)
  const hotelImages = parseHotelImages(hotel.image).map(resolveImageUrl)
  const city = nullStringValue(hotel.city)
  const province = nullStringValue(hotel.province)
  const country = nullStringValue(hotel.country)

  const imageCards = (hotelImages.length > 0 ? hotelImages : [nullStringValue(hotel.image)]).filter(Boolean)

  const galleryImages = imageCards.length > 0
    ? imageCards.slice(0, 3).map((imageUrl, index) => ({
        bg: HOTEL_BG[index % HOTEL_BG.length],
        imageUrl,
        label: `Foto ${index + 1}`,
      }))
    : [
        { bg: HOTEL_BG[0], imageUrl: '', label: 'Foto 1' },
        { bg: HOTEL_BG[1], imageUrl: '', label: 'Foto 2' },
        { bg: HOTEL_BG[2], imageUrl: '', label: 'Foto 3' },
      ]

  while (galleryImages.length < 3) {
    const fallbackIndex = galleryImages.length
    galleryImages.push({
      bg: HOTEL_BG[fallbackIndex % HOTEL_BG.length],
      imageUrl: galleryImages[0]?.imageUrl || '',
      label: `Foto ${fallbackIndex + 1}`,
    })
  }

  return {
    id: hotel.id,
    name: hotel.name,
    bg: HOTEL_BG[0],
    bgImageUrl: nullStringValue(hotel.image),
    featured: Number(hotel.rating || 0) >= 4.8,
    mood: moodFromHotel(hotel),
    region: city || province || country || 'Indonesia',
    location: buildLocation(hotel),
    rating: Number(hotel.rating || 0),
    reviews: Number(hotel.review_count || 0),
    price: rooms.length > 0 ? Math.min(...rooms.map((room) => Number(room.price || 0)).filter(Boolean)) : 0,
    tags: [nullStringValue(hotel.category) || 'Hotel', `${totalRooms} Kamar`],
    amenities: parsedAmenities,
    desc: description || `${hotel.name} adalah properti terdaftar di database kami.`,
    longDesc: '',
    lat: nullNumberValue(hotel.latitude),
    lng: nullNumberValue(hotel.longitude),
    images: galleryImages.slice(0, 3),
    highlights: [],
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      size: `${Number(room.capacity || 0)} tamu`,
      capacity: Number(room.capacity || 0),
      beds: nullStringValue(room.room_type) || 'Tipe kamar',
      view: room.status === 'available' ? 'Tersedia' : room.status,
      price: Number(room.price || 0),
      available: room.status === 'available' && Number(room.stock || 0) > 0,
      facilities: parseJsonList(room.facilities),
    })),
    reviewList: Number(hotel.review_count || 0) > 0 ? [] : [
      {
        name: 'Belum ada ulasan',
        date: 'Saat ini',
        rating: Number(hotel.rating || 0),
        text: 'Hotel ini sudah tersedia di database, tetapi belum memiliki ulasan tamu.',
      },
    ],
  }
}

export async function getServerSideProps(context) {
  const { id } = context.params || {}

  try {
    const [hotelRes, roomsRes, hotelsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/hotels/${id}`),
      fetch(`${API_BASE_URL}/hotels/${id}/rooms`),
      fetch(`${API_BASE_URL}/hotels`),
    ])

    const hotelJson = await hotelRes.json()
    const roomsJson = await roomsRes.json()
    const hotelsJson = await hotelsRes.json()

    const rawHotel = hotelJson?.data
    if (!rawHotel || hotelJson?.success === false) {
      return { notFound: true }
    }

    const rooms = roomsJson?.data?.rooms || roomsJson?.data?.Rooms || []
    const hotel = mapHotelDetail(rawHotel, rooms)

    const approvedHotels = hotelsJson?.data?.hotels || hotelsJson?.data?.Hotels || []
    const similar = approvedHotels
      .filter((item) => String(item.id) !== String(id) && String(item.status || '').toLowerCase() === 'approved')
      .slice(0, 3)
      .map((item, index) => mapHotelSummary(item, index + 1))

    return {
      props: {
        hotel,
        similar,
      },
    }
  } catch (error) {
    console.error('Failed to load hotel detail', error)
    return { notFound: true }
  }
}

export default function HotelDetailRoute({ hotel, similar }) {
  return <HotelDetailPage hotel={hotel} similar={similar} />
}
