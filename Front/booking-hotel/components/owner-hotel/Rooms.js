import { useState, useEffect } from 'react'
import OwnerLayout from './OwnerLayout'
import { PageHeader, Btn, Modal, Field, Input, Select, Confirm, Empty, Table } from './OwnerUI'
import { CURRENT_OWNER } from './OwnerData'
import { hotelService } from '../../services/hotelService'
import { roomService } from '../../services/roomService'
import styles from '../Rooms.module.css'

const FACILITIES_OPTIONS = [
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'ac', label: 'AC' },
  { key: 'tv', label: 'TV' },
  { key: 'minibar', label: 'Minibar' },
  { key: 'safe', label: 'Brankas' },
  { key: 'jacuzzi', label: 'Jacuzzi' },
  { key: 'balcony', label: 'Balkon' },
  { key: 'butler', label: 'Pelayan Pribadi' },
  { key: 'pool', label: 'Kolam Renang' },
  { key: 'fireplace', label: 'Perapian' },
  { key: 'terrace', label: 'Terasa' },
  { key: 'private_terrace', label: 'Terasa Pribadi' },
  { key: 'ocean_view', label: 'Pemandangan Laut' },
]

const FACILITY_VARIANTS = [
  { key: 'wifi', variants: ['wifi', 'wi-fi', 'wi fi'] },
  { key: 'ac', variants: ['ac'] },
  { key: 'tv', variants: ['tv'] },
  { key: 'minibar', variants: ['minibar'] },
  { key: 'safe', variants: ['safe', 'brankas'] },
  { key: 'jacuzzi', variants: ['jacuzzi'] },
  { key: 'balcony', variants: ['balcony', 'balkon'] },
  { key: 'butler', variants: ['butler', 'pelayan'] },
  { key: 'pool', variants: ['pool', 'kolam'] },
  { key: 'fireplace', variants: ['fireplace', 'perapian'] },
  { key: 'terrace', variants: ['terrace', 'terasa'] },
  { key: 'private_terrace', variants: ['private terrace', 'terasa pribadi'] },
  { key: 'ocean_view', variants: ['ocean view', 'pemandangan laut'] },
]
const ROOM_TYPE_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'suite', label: 'Suite' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'presidential', label: 'Presidential' },
]

const BLANK = { name: '', description: '', capacity: '2', price: '', stock: '1', currency: 'IDR', room_type: 'deluxe', status: 'available', facilities: [] }

export default function OwnerRooms() {
  const [myHotels, setMyHotels] = useState([])
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState(BLANK)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const toggleFacility = key => setForm(f => ({
      ...f,
      facilities: f.facilities.includes(key)
        ? f.facilities.filter(x => x !== key)
        : [...(f.facilities || []), key]
    }))

  const mapFacilityToKey = (raw) => {
    if (!raw) return null
    const s = String(raw).toLowerCase().trim()
    for (const m of FACILITY_VARIANTS) {
      for (const v of m.variants) {
        if (s.includes(v)) return m.key
      }
    }
    // fallback: sanitize and use as-is
    return s.replace(/[^a-z0-9_]/g, '_')
  }

  const hotel = myHotels.find(h => h.id === Number(selectedHotel))
  const hotelRooms = rooms || []

  const openAdd = () => { setForm(BLANK); setModal('add') }
  const openEdit = r => { setForm({ ...r, facilities: [...r.facilities] }); setModal(r) }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const hs = await hotelService.getOwnerHotels()
        if (!hs || hs.length === 0) {
          setMyHotels([])
          return
        }
        if (mounted) {
          setMyHotels(hs)
          const first = hs.find(h => Number(h.total_rooms || 0) > 0 && h.status === 'approved')
            || hs.find(h => h.status === 'approved')
            || hs[0]
          setSelectedHotel(first?.id)
        }
      } catch (err) {
        console.error('Failed to load owner hotels', err)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!selectedHotel) return
    let mounted = true
    const loadRooms = async () => {
      try {
        const rs = await roomService.getRoomsByHotel(selectedHotel)
        // Normalize facilities to canonical keys
        const normalized = rs.map(r => ({
          ...r,
          facilities: Array.isArray(r.facilities) ? r.facilities.map(mapFacilityToKey).filter(Boolean) : []
        }))
        if (mounted) setRooms(normalized)
      } catch (err) {
        console.error('Failed to load rooms for hotel', selectedHotel, err)
      }
    }
    loadRooms()
    return () => { mounted = false }
  }, [selectedHotel])

  const save = async () => {
    if (!form.name || !form.price) return
    try {
      const hotelId = Number(selectedHotel)
      const payload = {
        name: form.name,
        description: form.description || '',
        capacity: Number(form.capacity) || 2,
        price: Number(form.price),
        currency: form.currency || 'IDR',
        stock: Number(form.stock) || 1,
        room_type: form.room_type || 'deluxe',
        status: form.status || 'available',
        facilities: form.facilities || [],
      }
      console.log('Saving room payload', payload)
      if (modal === 'add') {
        await roomService.createRoom(hotelId, payload)
      } else {
        await roomService.updateRoom(modal.id, payload)
      }
      const rs = await roomService.getRoomsByHotel(hotelId)
      const normalized = rs.map(r => ({
        ...r,
        facilities: Array.isArray(r.facilities) ? r.facilities.map(mapFacilityToKey).filter(Boolean) : []
      }))
      setRooms(normalized)
      setModal(null)
    } catch (err) {
      console.error('Failed to save room', err)
    }
  }

  const remove = async () => {
    try {
      await roomService.deleteRoom(confirm)
      setRooms(rs => rs.filter(rm => rm.id !== confirm))
      setConfirm(null)
    } catch (err) {
      console.error('Failed to delete room', err)
    }
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
              <span className={styles.hotelTabRooms}>{Number(h.total_rooms || 0)} room types</span>
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
            <span key="p" className={styles.roomPrice}>Rp{Number(r.price || 0).toLocaleString('id-ID')}</span>,
            <span key="s" className={styles.stockBadge}>{r.stock} available</span>,
            <div key="f" className={styles.facilityTags}>
              {r.facilities.slice(0, 3).map(f => {
                const label = FACILITIES_OPTIONS.find(o => o.key === f)?.label || f
                return <span key={f}>{label}</span>
              })}
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
          <Field label="Price per Night (Rp)">
            <Input type="number" placeholder="850000" value={form.price} onChange={set('price')} min="0" />
          </Field>
          <Field label="Stock (Available Units)">
            <Input type="number" placeholder="2" value={form.stock} onChange={set('stock')} min="1" />
          </Field>
        </div>
        <div className={styles.twoField}>
          <Field label="Capacity">
            <Input type="number" placeholder="2" value={form.capacity} onChange={set('capacity')} min="1" />
          </Field>
          <Field label="Room Type">
            <Select value={form.room_type} onChange={set('room_type')}>
              {ROOM_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Description">
          <Input placeholder="Optional description" value={form.description} onChange={set('description')} />
        </Field>
        <Field label="Currency">
          <Input value="Rupiah (IDR)" disabled />
        </Field>
        <Field label="Fasilitas">
          <div className={styles.facilityPicker}>
            {FACILITIES_OPTIONS.map(opt => (
              <button
                key={opt.key}
                type="button"
                className={`${styles.facChip} ${form.facilities?.includes(opt.key) ? styles.facChipOn : ''}`}
                onClick={() => toggleFacility(opt.key)}
              >
                {opt.label}
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