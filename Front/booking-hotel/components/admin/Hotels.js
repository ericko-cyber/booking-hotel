import { useEffect, useMemo, useState } from 'react'
import AdminLayout from './AdminLayout'
import { PageHeader, Badge, Btn, Modal, Card, Confirm, Search, Empty } from './AdminUI'
import { adminService } from '../../services/adminService'
import styles from './HotelApprovals.module.css'

const readNullString = (value) => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value.Valid) return value.String || ''
  return ''
}

const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '')

const parseHotelImage = (value) => {
  const raw = readNullString(value)
  if (!raw) return ''

  let candidate = raw

  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        candidate = parsed[0] || ''
      }
    } catch {
      candidate = raw
    }
  }

  if (!candidate) return ''
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) return candidate
  if (candidate.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${candidate}`

  return candidate
}

const normalizeHotel = (hotel) => ({
  id: hotel?.id,
  name: hotel?.name || 'Untitled Hotel',
  owner: hotel?.owner_name || `Owner #${hotel?.owner_id || '-'}`,
  ownerId: hotel?.owner_id,
  address: readNullString(hotel?.address) || readNullString(hotel?.location) || '-',
  status: hotel?.status || 'pending',
  rooms: hotel?.total_rooms ?? 0,
  submitted: hotel?.created_at ? String(hotel.created_at).slice(0, 10) : '-',
  photo: parseHotelImage(hotel?.image) || 'linear-gradient(135deg,#3a2a1a 0%,#6b4a2a 60%,#8a6a40 100%)',
  city: readNullString(hotel?.city),
  province: readNullString(hotel?.province),
  country: readNullString(hotel?.country),
  location: readNullString(hotel?.location),
})

const hotelImageStyle = (value) => {
  if (!value) {
    return { background: 'linear-gradient(135deg,#3a2a1a 0%,#6b4a2a 60%,#8a6a40 100%)' }
  }

  if (value.startsWith('linear-gradient')) {
    return { background: value }
  }

  return {
    backgroundImage: `url("${value}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }
}

export default function AdminHotels() {
  const [hotels, setHotels] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [confirm, setConfirm] = useState(null) // {id, action}
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    const loadHotels = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await adminService.getAllHotels({ page: 1, page_size: 100 })
        const items = Array.isArray(response?.hotels) ? response.hotels.map(normalizeHotel) : []
        if (alive) setHotels(items)
      } catch (err) {
        if (alive) {
          setError(err?.message || 'Failed to load hotels')
          setHotels([])
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadHotels()

    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => hotels.filter(h => {
    const matchStatus = filter === 'all' || h.status === filter
    const query = search.toLowerCase()
    const matchSearch = !query || h.name.toLowerCase().includes(query) || h.owner.toLowerCase().includes(query) || String(h.id).toLowerCase().includes(query)
    return matchStatus && matchSearch
  }), [filter, hotels, search])

  const act = (id, action) => setConfirm({ id, action })

  const doAction = async () => {
    const { id, action } = confirm
    try {
      const nextStatus = action === 'approve' ? 'approved' : 'rejected'
      await adminService.updateHotelStatus(id, nextStatus)
      setHotels(hs => hs.map(h => h.id === id ? { ...h, status: nextStatus } : h))
      setDetail(d => d?.id === id ? { ...d, status: nextStatus } : d)
    } catch (err) {
      alert('Gagal update status hotel: ' + (err?.message || err))
    } finally {
      setConfirm(null)
    }
  }

  const counts = { all: hotels.length, pending: hotels.filter(h => h.status === 'pending').length, approved: hotels.filter(h => h.status === 'approved').length, rejected: hotels.filter(h => h.status === 'rejected').length }

  return (
    <AdminLayout active="hotels">
      <PageHeader
        eyebrow="Management"
        title="Hotel Approvals"
        subtitle={`${counts.pending} pending review · ${counts.approved} live on platform`}
      />

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {['all','pending','approved','rejected'].map(s => (
            <button key={s} className={`${styles.tab} ${filter === s ? styles.tabOn : ''}`} onClick={() => setFilter(s)}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
              <span className={styles.tabCount}>{counts[s]}</span>
            </button>
          ))}
        </div>
        <Search value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hotels or owners..." />
      </div>

      {loading && <div className={styles.stateBox}>Memuat data hotel...</div>}
      {!loading && error && <div className={styles.stateBox}>⚠ {error}</div>}
      {!loading && !error && filtered.length === 0 ? (
        <Empty icon="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" title="No hotels found" desc="Try adjusting your filters." />
      ) : (
        <div className={styles.grid}>
          {filtered.map(h => (
            <div key={h.id} className={styles.card}>
              <div className={styles.cardImg} style={hotelImageStyle(h.photo)}>
                <div className={`${styles.statusOverlay} ${h.status === 'pending' ? styles.ovAmber : h.status === 'approved' ? styles.ovGreen : styles.ovRed}`}>
                  {h.status.toUpperCase()}
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <div>
                    <h3 className={styles.cardName}>{h.name}</h3>
                    <p className={styles.cardOwner}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      {h.owner}
                    </p>
                  </div>
                  <Badge status={h.status} />
                </div>
                <p className={styles.cardAddr}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {h.address}
                </p>
                <div className={styles.cardMeta}>
                  <span>{h.rooms} rooms</span>
                  <span>·</span>
                  <span>Submitted {h.submitted}</span>
                </div>
              </div>
              <div className={styles.cardActions}>
                <Btn variant="ghost" small onClick={() => setDetail(h)}>View Details</Btn>
                {h.status !== 'approved' && (
                  <Btn variant="success" small onClick={() => act(h.id, 'approve')}>Approve</Btn>
                )}
                {h.status !== 'rejected' && (
                  <Btn danger small onClick={() => act(h.id, 'reject')}>Reject</Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Hotel Details" width={480}>
        {detail && (
          <div className={styles.detailContent}>
            <div className={styles.detailImg} style={hotelImageStyle(detail.photo)}/>
            {[['Hotel Name', detail.name], ['Owner', detail.owner], ['Owner ID', `#${detail.ownerId || '-'}`], ['Address', detail.address],
              ['Rooms', `${detail.rooms} room types`], ['Submitted', detail.submitted],
              ['City', detail.city || '-'], ['Province', detail.province || '-'], ['Country', detail.country || '-'],
              ['Location', detail.location || '-'], ['Status', <Badge key="s" status={detail.status}/>]
            ].map(([l,v]) => (
              <div key={l} className={styles.detailRow}><span>{l}</span><strong>{v}</strong></div>
            ))}
            {detail.status === 'pending' && (
              <div className={styles.detailBtns}>
                <Btn variant="success" onClick={() => { setDetail(null); act(detail.id, 'approve') }}>Approve Hotel</Btn>
                <Btn danger onClick={() => { setDetail(null); act(detail.id, 'reject') }}>Reject Hotel</Btn>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doAction}
        title={confirm?.action === 'approve' ? 'Approve Hotel?' : 'Reject Hotel?'}
        message={confirm?.action === 'approve'
          ? 'This hotel will become visible to all guests on the platform.'
          : 'This hotel will be hidden from guests and the owner will be notified.'}
        confirmLabel={confirm?.action === 'approve' ? 'Approve' : 'Reject'}
        confirmDanger={confirm?.action !== 'approve'}
      />
    </AdminLayout>
  )
}