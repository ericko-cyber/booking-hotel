import { useState } from 'react'
import OwnerLayout from './OwnerLayout'
import { PageHeader, Btn, Modal, Field, Input, Confirm, Empty, Table } from './OwnerUI'
import { OWNER_HOTELS, OWNER_ROOMS as INIT, CURRENT_OWNER } from './OwnerData'
import styles from '../Rooms.module.css'

const FACILITIES_LIST = ['WiFi', 'AC', 'Minibar', 'Safe', 'Jacuzzi', 'Balcony', 'Butler', 'Pool', 'Fireplace', 'Terrace', 'Private Terrace', 'Ocean View']
const BLANK = { name: '', price: '', stock: '', facilities: [] }

export default function OwnerRooms() {
  const myHotels = OWNER_HOTELS.filter((h) => h.ownerId === CURRENT_OWNER.id)
  const [selectedHotel, setSelectedHotel] = useState(myHotels.find(h => h.status === 'approved')?.id || myHotels[0]?.id)
  const [rooms, setRooms] = useState(INIT)
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState(BLANK)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const toggleFacility = fac => setForm(f => ({
    ...f,
    facilities: f.facilities.includes(fac)
      ? f.facilities.filter(x => x !== fac)
      : [...f.facilities, fac]
  }))

  const hotel = myHotels.find(h => h.id === Number(selectedHotel))
  const hotelRooms = rooms[Number(selectedHotel)] || []

  const openAdd = () => { setForm(BLANK); setModal('add') }
  const openEdit = r => { setForm({ ...r, facilities: [...r.facilities] }); setModal(r) }

  const save = () => {
    if (!form.name || !form.price) return
    const hotelId = Number(selectedHotel)
    if (modal === 'add') {
      const newRoom = { ...form, id: Date.now(), price: Number(form.price), stock: Number(form.stock) || 1 }
      setRooms(r => ({ ...r, [hotelId]: [...(r[hotelId] || []), newRoom] }))
    } else {
      setRooms(r => ({ ...r, [hotelId]: r[hotelId].map(rm => rm.id === modal.id ? { ...rm, ...form, price: Number(form.price), stock: Number(form.stock) } : rm) }))
    }
    setModal(null)
  }

  const remove = () => {
    const hotelId = Number(selectedHotel)
    setRooms(r => ({ ...r, [hotelId]: r[hotelId].filter(rm => rm.id !== confirm) }))
    setConfirm(null)
  }

  return (
    <OwnerLayout active="rooms">
      <PageHeader
        title="Room Management"
        subtitle="Manage room types, pricing, and availability"
        action={<Btn onClick={openAdd} disabled={!hotel || hotel.status !== 'approved'}>+ Add Room</Btn>}
      />

      {/* Hotel selector */}
      <div className={styles.hotelPicker}>
        {myHotels.map(h => (
          <button
            key={h.id}
            className={`${styles.hotelTab} ${Number(selectedHotel) === h.id ? styles.hotelTabActive : ''}`}
            onClick={() => setSelectedHotel(h.id)}
          >
            <div className={styles.hotelTabThumb} style={{ background: h.photo }} />
            <div className={styles.hotelTabInfo}>
              <span className={styles.hotelTabName}>{h.name}</span>
              <span className={styles.hotelTabRooms}>{(rooms[h.id] || []).length} room types</span>
            </div>
            <span className={`${styles.hotelTabStatus} ${h.status === 'approved' ? styles.stGreen : h.status === 'pending' ? styles.stAmber : styles.stRed}`}>
              {h.status}
            </span>
          </button>
        ))}
      </div>

      {/* Warning for non-approved hotels */}
      {hotel && hotel.status !== 'approved' && (
        <div className={styles.warningBanner}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          This hotel has status <strong>{hotel.status}</strong> — rooms cannot be added until it is approved by an admin.
        </div>
      )}

      {/* Rooms list */}
      {hotelRooms.length === 0 ? (
        <Empty
          icon="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3"
          title={myHotels.length === 0 ? 'Daftarkan hotel terlebih dahulu' : 'Belum ada kamar'}
          desc={myHotels.length === 0 ? 'Anda perlu mendaftarkan hotel terlebih dahulu sebelum menambahkan tipe kamar.' : 'Tambahkan tipe kamar untuk hotel ini agar dapat menerima booking.'}
          action={myHotels.length === 0 ? <Btn onClick={() => (window.location.href = '/owner/hotels')}>Ke Pendaftaran Hotel</Btn> : hotel?.status === 'approved' ? <Btn onClick={openAdd}>Add First Room</Btn> : null}
        />
      ) : (
        <Table
          head={['Room Name', 'Price / night', 'Stock', 'Facilities', 'Actions']}
          rows={hotelRooms.map(r => [
            <span key="n" className={styles.roomName}>{r.name}</span>,
            <span key="p" className={styles.roomPrice}>£{r.price.toLocaleString()}</span>,
            <span key="s" className={styles.stockBadge}>{r.stock} available</span>,
            <div key="f" className={styles.facilityTags}>
              {r.facilities.slice(0, 3).map(f => <span key={f}>{f}</span>)}
              {r.facilities.length > 3 && <span className={styles.more}>+{r.facilities.length - 3}</span>}
            </div>,
            <div key="a" className={styles.tableActions}>
              <Btn variant="ghost" small onClick={() => openEdit(r)}>Edit</Btn>
              <Btn danger small onClick={() => setConfirm(r.id)}>Delete</Btn>
            </div>,
          ])}
        />
      )}

      {/* ── Add/Edit Modal ── */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add Room Type' : 'Edit Room Type'} width={520}>
        <Field label="Room Name">
          <Input placeholder="e.g. Deluxe Suite" value={form.name} onChange={set('name')} />
        </Field>
        <div className={styles.twoField}>
          <Field label="Price per Night (£)">
            <Input type="number" placeholder="850" value={form.price} onChange={set('price')} min="0" />
          </Field>
          <Field label="Stock (Available Units)">
            <Input type="number" placeholder="2" value={form.stock} onChange={set('stock')} min="1" />
          </Field>
        </div>
        <Field label="Facilities">
          <div className={styles.facilityPicker}>
            {FACILITIES_LIST.map(fac => (
              <button
                key={fac}
                type="button"
                className={`${styles.facChip} ${form.facilities?.includes(fac) ? styles.facChipOn : ''}`}
                onClick={() => toggleFacility(fac)}
              >
                {fac}
              </button>
            ))}
          </div>
        </Field>
        <div className={styles.modalActions}>
          <Btn variant="outline" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save} disabled={!form.name || !form.price}>Save Room</Btn>
        </div>
      </Modal>

      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        title="Delete Room"
        message="This room type will be removed from your hotel listing. Existing bookings are not affected."
      />
    </OwnerLayout>
  )
}