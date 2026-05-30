import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '../layout/Navbar'
import Footer from '../layout/Footer'
import VoucherModal from '../modals/VoucherModal'
import api from '../../lib/api'
import MembershipModal from '../modals/MembershipModal'
import BookingPanel from './BookingPanel'

const AMENITY_META = {
  pool: { label: 'Kolam Renang', icon: 'M2 12h20M2 12c1.5-1 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1M2 17c1.5-1 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1' },
  spa: { label: 'Spa & Kebugaran', icon: 'M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z' },
  gym: { label: 'Pusat Kebugaran', icon: 'M6.5 6.5h11M6.5 17.5h11M3 9.5v5M21 9.5v5' },
  dining: { label: 'Restoran Premium', icon: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6h3.5a1.5 1.5 0 0 1 0 3H17l-1 4' },
  concierge: { label: 'Concierge 24 Jam', icon: 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3' },
}

const ROOM_FACILITY_META = {
  wifi: 'Wi-Fi',
  ac: 'AC',
  tv: 'TV',
  minibar: 'Minibar',
  safe: 'Brankas',
  jacuzzi: 'Jacuzzi',
  balcony: 'Balkon',
  butler: 'Pelayan Pribadi',
  pool: 'Kolam Renang',
  fireplace: 'Perapian',
  terrace: 'Terasa',
  private_terrace: 'Terasa Pribadi',
  ocean_view: 'Pemandangan Laut',
}

function StarRating({ rating, size = 14 }) {
  return (
    <span style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#c49a3c' : 'none'}
          stroke={i <= Math.round(rating) ? '#c49a3c' : '#ddd'}
          strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  )
}

export default function HotelDetailPage({ hotel, similar = [] }) {
  const [activeImg, setActiveImg] = useState(0)
  const [showVoucher, setShowVoucher] = useState(false)
  const [showMembership, setShowMembership] = useState(false)
  const [vouchersData, setVouchersData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  // fetch vouchers when modal opens
  useEffect(() => {
    let cancelled = false
    const fetchV = async () => {
      try {
        const res = await api.get('/vouchers/my-claims')
        const list = res?.data || res || []
        if (!cancelled) setVouchersData(list)
      } catch (err) {
        if (!cancelled) setVouchersData([])
      }
    }
    if (showVoucher) fetchV()
    return () => { cancelled = true }
  }, [showVoucher])
  const images = hotel.images?.length
    ? hotel.images
    : [
        { bg: hotel.bg, imageUrl: hotel.bgImageUrl, label: hotel.name },
        { bg: hotel.bg, imageUrl: hotel.bgImageUrl, label: hotel.location },
        { bg: hotel.bg, imageUrl: hotel.bgImageUrl, label: hotel.region },
      ]
  const highlights = hotel.highlights || []
  const rooms = hotel.rooms?.length
    ? hotel.rooms
    : [
        { name: 'Kamar Standar', size: '28 m²', beds: '1 King', view: 'City View', price: hotel.price, available: true },
      ]
  const reviewList = hotel.reviewList?.length
    ? hotel.reviewList
    : [
        { name: 'Tamu Booking Hotel', date: 'Baru saja', rating: hotel.rating, text: 'Properti ini siap untuk dipesan dan detailnya sedang dilengkapi.' },
      ]

  if (!hotel) return null

  return (
    <>
      <Navbar onVoucherClick={() => setShowVoucher(true)} />

      <div style={styles.breadcrumb}>
        <Link href="/">Beranda</Link>
        <span>/</span>
        <Link href="/hotels">Koleksi Hotel</Link>
        <span>/</span>
        <span>{hotel.name}</span>
      </div>

      <section style={styles.gallery}>
        <div
          style={images[activeImg]?.imageUrl
            ? { ...styles.galleryMain, backgroundImage: `url(${images[activeImg].imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { ...styles.galleryMain, background: images[activeImg]?.bg || hotel.bg }
          }
        >
          {hotel.featured && <span style={styles.editorBadge}>Pilihan Editor</span>}
          <div style={styles.galleryMainLabel}>{images[activeImg]?.label || hotel.name}</div>
          <button style={{ ...styles.galleryNav, ...styles.galleryPrev }} onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}>
            ‹
          </button>
          <button style={{ ...styles.galleryNav, ...styles.galleryNext }} onClick={() => setActiveImg((i) => (i + 1) % images.length)}>
            ›
          </button>
          <div style={styles.galleryDots}>
            {images.map((_, i) => (
              <button key={i} style={{ ...styles.dot, ...(i === activeImg ? styles.dotActive : {}) }} onClick={() => setActiveImg(i)} />
            ))}
          </div>
        </div>

        <div style={styles.galleryThumbs}>
          {images.map((img, i) => (
            <button
              key={i}
              style={img.imageUrl
                ? { ...styles.thumb, ...(i === activeImg ? styles.thumbActive : {}), backgroundImage: `url(${img.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { ...styles.thumb, ...(i === activeImg ? styles.thumbActive : {}), background: img.bg }
              }
              onClick={() => setActiveImg(i)}
            >
              <span style={styles.thumbLabel}>{img.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div style={styles.layout}>
        <div style={styles.content}>
          <div style={styles.hotelHeader}>
            <div style={styles.hotelMeta}>
              <span style={styles.moodTag}>{hotel.mood}</span>
              <span style={styles.regionTag}>{hotel.region}</span>
            </div>
            <h1 style={styles.hotelName}>{hotel.name}</h1>
            <div style={styles.hotelLocation}>{hotel.location}</div>
            <div style={styles.ratingRow}>
              <StarRating rating={hotel.rating} size={16} />
              <strong>{hotel.rating}</strong>
              <span>({hotel.reviews} ulasan)</span>
            </div>
          </div>

          <div style={styles.tabs}>
            {['overview', 'rooms', 'reviews'].map((tab) => (
              <button
                    key={tab}
                    style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
                    onClick={() => setActiveTab(tab)}
              >
                {tab === 'overview' ? 'Ikhtisar' : tab === 'rooms' ? 'Kamar' : 'Ulasan'}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <>
              <p style={styles.desc}>{hotel.desc}</p>

              {hotel.longDesc ? <p style={styles.longDesc}>{hotel.longDesc}</p> : null}

              {highlights.length > 0 && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>Sorotan Properti</h3>
                  <ul style={styles.highlightList}>
                    {highlights.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Fasilitas</h3>
                <div style={styles.amenityGrid}>
                    {(hotel.amenities || []).map((item) => (
                    <div key={item} style={styles.amenityCard}>
                      <span>{AMENITY_META[item]?.label || item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Lokasi</h3>
                <div style={styles.mapPlaceholder}>
                  <p style={styles.mapCoords}>{hotel.location}</p>
                  {/* <p style={styles.mapNote}>Lat {hotel.lat}° · Lng {hotel.lng}°</p> */}
                </div>
              </div>
            </>
          )}

          {activeTab === 'rooms' && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Tipe Kamar Tersedia</h3>
              <div style={styles.roomList}>
                {rooms.map((room, index) => (
                  <div key={index} style={{ ...styles.roomCard, ...(room.available ? {} : styles.roomUnavailable) }}>
                    <div style={styles.roomInfo}>
                      <h4 style={styles.roomName}>{room.name}</h4>
                      <div style={styles.roomMeta}>{room.size} • {room.beds} • {room.view}</div>
                        <div style={styles.roomFacilityRow}>
                        {room.facilities?.length > 0 ? room.facilities.map((facility) => (
                          <span key={facility} style={styles.roomFacilityChip}>
                            {ROOM_FACILITY_META[facility] || facility}
                          </span>
                        )) : (
                          <span style={styles.roomFacilityEmpty}>Belum ada fasilitas</span>
                        )}
                      </div>
                    </div>
                    <div style={styles.roomPrice}>
                      <strong>Rp{Number(room.price).toLocaleString('id-ID')}</strong>
                      <span>/ malam</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div style={styles.section}>
              <div style={styles.reviewSummary}>
                <div style={styles.reviewScore}>
                  <span style={styles.bigScore}>{hotel.rating}</span>
                  <div>
                    <StarRating rating={hotel.rating} size={18} />
                    <p>{hotel.reviews} ulasan terverifikasi</p>
                  </div>
                </div>
              </div>

              <div style={styles.reviewList}>
                {reviewList.map((review, index) => (
                  <div key={index} style={styles.reviewItem}>
                    <p style={styles.reviewName}>{review.name}</p>
                    <p style={styles.reviewDate}>{review.date}</p>
                    <p style={styles.reviewText}>{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside style={styles.aside}>
              <BookingPanel hotel={hotel} onMembership={() => setShowMembership(true)} onVoucher={() => setShowVoucher(true)} />
        </aside>
      </div>

      {similar.length > 0 && (
        <section style={styles.similar}>
          <div style={styles.similarInner}>
            <p style={styles.similarEyebrow}>Mungkin Anda juga suka</p>
            <h2 style={styles.similarTitle}>Properti Serupa</h2>
            <div style={styles.similarGrid}>
              {similar.map((item) => (
                <Link key={item.id} href={`/hotels/${item.id}`} style={styles.similarCard}>
                    <div style={item.bgImageUrl ? { ...styles.similarImg, backgroundImage: `url(${item.bgImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { ...styles.similarImg, background: item.bg }}>
                      {item.featured && <span style={styles.similarBadge}>Pilihan Editor</span>}
                    </div>
                    <div style={styles.similarBody}>
                      <p style={styles.similarName}>{item.name}</p>
                      <p style={styles.similarLoc}>{item.location}</p>
                      <div style={styles.similarPrice}><span>Rp</span><strong>{item.price.toLocaleString('id-ID')}</strong><small>/ malam</small></div>
                    </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
      {showVoucher && (
        <VoucherModal onClose={() => setShowVoucher(false)} vouchers={vouchersData} />
      )}
      {showMembership && <MembershipModal onClose={() => setShowMembership(false)} />}
    </>
  )
}

const styles = {
  breadcrumb: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    maxWidth: 1200,
    margin: '0 auto',
    padding: '96px 20px 18px',
    color: '#6b7280',
    fontSize: 13,
    flexWrap: 'wrap',
  },
  gallery: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 20px',
  },
  galleryMain: {
    height: 380,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  editorBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    padding: '8px 10px',
    borderRadius: 999,
    fontSize: 12,
    letterSpacing: '0.04em',
  },
  galleryMainLabel: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    color: '#fff',
    background: 'rgba(0,0,0,0.35)',
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
  },
  galleryNav: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: 'none',
    background: '#fff',
    cursor: 'pointer',
  },
  galleryPrev: { left: 14 },
  galleryNext: { right: 14 },
  galleryDots: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    display: 'flex',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.45)',
  },
  dotActive: { background: '#fff' },
  galleryThumbs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginTop: 10,
  },
  thumb: {
    height: 80,
    borderRadius: 12,
    border: '2px solid transparent',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
  },
  thumbActive: { borderColor: 'var(--teal-btn)' },
  thumbLabel: {
    position: 'absolute',
    left: 10,
    bottom: 8,
    color: '#fff',
    fontSize: 12,
    background: 'rgba(0,0,0,0.35)',
    padding: '4px 8px',
    borderRadius: 999,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: 32,
    maxWidth: 1200,
    margin: '0 auto',
    padding: '32px 20px 60px',
    alignItems: 'start',
  },
  content: {},
  aside: {},
  hotelHeader: {
    marginBottom: 24,
  },
  hotelMeta: {
    display: 'flex',
    gap: 8,
    marginBottom: 10,
  },
  moodTag: {
    background: 'rgba(13,61,74,0.1)',
    color: 'var(--teal-btn)',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  regionTag: {
    background: '#f0eee9',
    color: '#777',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  hotelName: {
    fontSize: 38,
    fontFamily: 'var(--serif)',
    marginBottom: 8,
    color: 'var(--text-dark)',
  },
  hotelLocation: { color: '#666', marginBottom: 8 },
  ratingRow: { display: 'flex', gap: 8, alignItems: 'center', color: '#666' },
  stars: { display: 'inline-flex', gap: 2, alignItems: 'center' },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: {
    border: '1px solid #e5e2de',
    background: '#fff',
    padding: '8px 14px',
    borderRadius: 999,
    cursor: 'pointer',
  },
  tabActive: { background: 'var(--teal-btn)', color: '#fff', borderColor: 'var(--teal-btn)' },
  desc: { color: '#555', lineHeight: 1.7, marginBottom: 16 },
  longDesc: { color: '#555', lineHeight: 1.7, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, marginBottom: 12, color: 'var(--text-dark)' },
  highlightList: { paddingLeft: 18, color: '#555', lineHeight: 1.7 },
  amenityGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
  amenityCard: { background: '#f9f8f6', padding: '12px 14px', borderRadius: 10, border: '1px solid #eee' },
  mapPlaceholder: { background: '#f9f8f6', padding: 18, borderRadius: 12, border: '1px solid #eee' },
  mapCoords: { fontWeight: 600, marginBottom: 4 },
  mapNote: { color: '#777' },
  roomList: { display: 'grid', gap: 12 },
  roomCard: { display: 'flex', justifyContent: 'space-between', gap: 16, padding: 16, borderRadius: 12, background: '#fff', border: '1px solid #ece8e2' },
  roomUnavailable: { opacity: 0.5 },
  roomInfo: {},
  roomName: { marginBottom: 4 },
  roomMeta: { color: '#777', fontSize: 13 },
  roomFacilityRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  roomFacilityChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 10px',
    borderRadius: 999,
    background: '#f4f1ec',
    border: '1px solid #e7e1d8',
    color: '#5f5a52',
    fontSize: 11,
    lineHeight: 1,
  },
  roomFacilityEmpty: { color: '#9a9186', fontSize: 12, fontStyle: 'italic' },
  roomPrice: { textAlign: 'right' },
  reviewSummary: { marginBottom: 18 },
  reviewScore: { display: 'flex', gap: 14, alignItems: 'center' },
  bigScore: { fontSize: 42, fontWeight: 700, color: 'var(--text-dark)' },
  reviewList: { display: 'grid', gap: 12 },
  reviewItem: { background: '#fff', border: '1px solid #ece8e2', borderRadius: 12, padding: 16 },
  reviewName: { fontWeight: 600, marginBottom: 4 },
  reviewDate: { fontSize: 12, color: '#888', marginBottom: 8 },
  reviewText: { color: '#555', lineHeight: 1.7 },
  similar: { background: '#faf9f7', borderTop: '1px solid #eee' },
  similarInner: { maxWidth: 1200, margin: '0 auto', padding: '40px 20px 60px' },
  similarEyebrow: { textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 12, color: '#888', marginBottom: 8 },
  similarTitle: { fontSize: 24, marginBottom: 18 },
  similarGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 },
  similarCard: { border: '1px solid #ece8e2', borderRadius: 14, overflow: 'hidden', background: '#fff' },
  similarImg: { height: 140, position: 'relative' },
  similarBadge: { position: 'absolute', left: 12, top: 12, background: '#000', color: '#fff', padding: '4px 8px', borderRadius: 999, fontSize: 11 },
  similarBody: { padding: 14 },
  similarName: { fontWeight: 600, marginBottom: 4 },
  similarLoc: { color: '#777', fontSize: 13, marginBottom: 10 },
  similarPrice: { display: 'flex', alignItems: 'baseline', gap: 3 },
}
