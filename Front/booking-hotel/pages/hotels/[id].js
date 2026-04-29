import { ALL_HOTELS } from '../hotels'
import HotelDetailPage from '../../components/hotel-detail/HotelDetailPage'

export async function getStaticPaths() {
  return {
    paths: ALL_HOTELS.map((hotel) => ({ params: { id: String(hotel.id) } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const hotel = ALL_HOTELS.find((item) => String(item.id) === String(params.id)) || null
  const similar = ALL_HOTELS.filter((item) => item.id !== Number(params.id) && item.mood === hotel?.mood).slice(0, 3)
  return {
    props: { hotel, similar },
  }
}

export default function HotelDetailRoute({ hotel, similar }) {
  return <HotelDetailPage hotel={hotel} similar={similar} />
}
