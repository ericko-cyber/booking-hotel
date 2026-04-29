import { useState } from 'react'
import AdminLayout from './AdminLayout'
import { PageHeader, Badge, Btn, Modal, Card, Confirm, Search, Empty } from './AdminUI'
import { ALL_HOTELS_ADMIN as INIT } from './AdminData'
import styles from './HotelApprovals.module.css'

export default function AdminHotels() {
  const [hotels, setHotels] = useState(INIT)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [confirm, setConfirm] = useState(null) // {id, action}

  const filtered = hotels.filter(h => {
    const matchStatus = filter === 'all' || h.status === filter
    const matchSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.owner.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const act = (id, action) => setConfirm({ id, action })

  const doAction = () => {
    const { id, action } = confirm
    setHotels(hs => hs.map(h => h.id === id ? { ...h, status: action === 'approve' ? 'approved' : 'rejected' } : h))
    setConfirm(null)
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

      {filtered.length === 0 ? (
        <Empty icon="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" title="No hotels found" desc="Try adjusting your filters." />
      ) : (
        <div className={styles.grid}>
          {filtered.map(h => (
            <div key={h.id} className={styles.card}>
              <div className={styles.cardImg} style={{ background: h.photo }}>
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
            <div className={styles.detailImg} style={{ background: detail.photo }}/>
            {[['Hotel Name', detail.name], ['Owner', detail.owner], ['Address', detail.address],
              ['Rooms', `${detail.rooms} room types`], ['Submitted', detail.submitted],
              ['Status', <Badge key="s" status={detail.status}/>]
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