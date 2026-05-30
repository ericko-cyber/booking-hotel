import { useState, useEffect } from 'react'
import OwnerLayout from './OwnerLayout'
import { PageHeader, StatusBadge, Btn, Modal, Field, Input, Textarea, Select, Confirm, Empty } from './OwnerUI'
import { CURRENT_OWNER } from './OwnerData'
import { hotelService } from '../../services/hotelService'
import styles from './Hotels.module.css'

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '')

const BLANK = { name: '', location: '', address: '', city: '', province: '', country: '', description: '', images: ['', '', ''], imageFiles: [null, null, null], amenities: [], status: 'pending', suasana: '' }

const parseStoredImages = (value) => {
  if (!value) return ['', '', '']
  if (Array.isArray(value)) return [...value, '', '', ''].slice(0, 3)
  if (typeof value !== 'string') return ['', '', '']
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return [...parsed, '', '', ''].slice(0, 3)
  } catch {
    return [value, '', '']
  }
  return ['', '', '']
}

const parseMaybeArray = (value) => {
  if (Array.isArray(value)) return value
  if (!value) return []
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const getPrimaryImage = (value) => parseStoredImages(value)[0]

const resolveImageUrl = (value) => {
  if (!value) return ''
  if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:')) return value
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`
  return value
}

const getPreviewStyle = (value) => {
  if (!value) return { background: 'linear-gradient(135deg,#3a2a1a 0%,#6b4a2a 60%,#8a6a40 100%)' }
  const resolved = resolveImageUrl(value)
  if (resolved.startsWith('http') || resolved.startsWith('data:') || resolved.startsWith('blob:')) {
    return { backgroundImage: `url(${resolved})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  return { background: resolved }
}

export default function OwnerHotels() {
  const [hotels, setHotels] = useState([])
  const [modal, setModal] = useState(null) // null | 'add' | hotel obj (edit)
  const [confirm, setConfirm] = useState(null) // hotel id
  const [detail, setDetail] = useState(null) // hotel obj
  const [form, setForm] = useState(BLANK)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const uploadImage = (index) => (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setForm(f => {
      const nextImages = [...(f.images || ['', '', ''])]
      const nextFiles = [...(f.imageFiles || [null, null, null])]
      nextImages[index] = previewUrl
      nextFiles[index] = file
      return { ...f, images: nextImages, imageFiles: nextFiles }
    })
  }

  const openAdd = () => { setForm({ ...BLANK, images: ['', '', ''], imageFiles: [null, null, null] }); setModal('add') }
  const openEdit = (h) => { setForm({ ...BLANK, ...h, images: parseStoredImages(h.image), imageFiles: [null, null, null], amenities: parseMaybeArray(h.amenities), suasana: h.suasana || '', location: h.location || '' }); setModal(h) }
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const hs = await hotelService.getOwnerHotels()
        if (mounted) setHotels(hs)
      } catch (err) {
        console.error('Failed to load owner hotels', err)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const save = async () => {
    if (!form.name || !form.address) return
    try {
      const uploadedImages = []
      for (let index = 0; index < 3; index += 1) {
        const file = form.imageFiles?.[index]
        const currentValue = form.images?.[index]

        if (file) {
          const uploadResult = await hotelService.uploadHotelImage(file)
          uploadedImages.push(uploadResult?.data?.url || uploadResult?.Data?.url || uploadResult?.url || '')
        } else if (typeof currentValue === 'string' && currentValue && !currentValue.startsWith('blob:')) {
          uploadedImages.push(currentValue)
        }
      }

      const payload = {
        ...form,
        image: JSON.stringify(uploadedImages.filter(Boolean)),
        amenities: parseMaybeArray(form.amenities),
      }
      console.log('Saving hotel payload:', payload)
      let resp
      if (modal === 'add') {
        resp = await hotelService.createHotel(payload)
      } else {
        resp = await hotelService.updateHotel(modal.id, payload)
      }
      console.log('Save response:', resp)
      const hs = await hotelService.getOwnerHotels()
      console.log('Owner hotels after save:', hs)
      setHotels(hs)
      setModal(null)
    } catch (err) {
      console.error('Failed to save hotel', err)
    }
  }

  const remove = async () => {
    try {
      await hotelService.deleteHotel(confirm)
      setHotels(hs => hs.filter(h => h.id !== confirm))
      setConfirm(null)
    } catch (err) {
      console.error('Failed to delete hotel', err)
    }
  }

  return (
    <OwnerLayout active="hotels">
      <PageHeader
        title="Pendaftaran Hotel Owner"
        subtitle={`${hotels.length} hotel terdaftar · ${hotels.filter(h => h.status === 'approved').length} disetujui`}
        action={<Btn onClick={openAdd}>+ Daftarkan Hotel</Btn>}
      />

      {/* Summary */}
      <div className={styles.statRow}>
        {[
          { label: 'Total', value: hotels.length, cls: '' },
          { label: 'Approved', value: hotels.filter(h => h.status === 'approved').length, cls: 'green' },
          { label: 'Pending', value: hotels.filter(h => h.status === 'pending').length, cls: 'amber' },
          { label: 'Rejected', value: hotels.filter(h => h.status === 'rejected').length, cls: 'red' },
        ].map(s => (
          <div key={s.label} className={`${styles.miniStat} ${styles[s.cls]}`}>
            <span className={styles.miniLabel}>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>

      {hotels.length === 0 ? (
        <Empty
          icon="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          title="Belum ada hotel terdaftar"
          desc="Mulai dengan mendaftarkan hotel pertama Anda. Setelah disetujui admin, Anda bisa mengelola kamar dan booking."
          action={<Btn onClick={openAdd}>Daftarkan Hotel</Btn>}
        />
      ) : (
        <div className={styles.grid}>
          {hotels.map(h => (
            <div key={h.id} className={styles.card}>
              <div className={styles.cardImg} style={getPreviewStyle(getPrimaryImage(h.image))}>
                <span className={`${styles.statusPill} ${h.status === 'approved' ? styles.pillGreen : h.status === 'pending' ? styles.pillAmber : styles.pillRed}`}>
                  {h.status}
                </span>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardName}>{h.name}</h3>
                <p className={styles.cardAddr}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {h.address}
                </p>
                <p className={styles.cardDesc}>{h.description}</p>
                <div className={styles.cardMeta}>
                  <span>{h.rooms} rooms</span>
                  <span>Added {h.createdAt}</span>
                </div>
                {h.status === 'rejected' && (
                  <p className={styles.rejectedNote}>
                    This property was not approved. Please review the listing and resubmit.
                  </p>
                )}
                {h.status === 'pending' && (
                  <p className={styles.pendingNote}>
                    Awaiting admin approval before it appears to guests.
                  </p>
                )}
              </div>
              <div className={styles.cardActions}>
                <Btn variant="outline" small onClick={() => setDetail(h)}>Details</Btn>
                <Btn variant="ghost" small onClick={() => openEdit(h)}>Edit</Btn>
                <Btn danger small onClick={() => setConfirm(h.id)}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Add New Hotel' : 'Edit Hotel'}
        width={560}
      >
        <Field label="Hotel Name">
          <Input placeholder="e.g. The Grand Riviera" value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Location">
          <Input placeholder="Neighborhood / area" value={form.location || ''} onChange={set('location')} />
        </Field>
        <Field label="Address">
          <Input placeholder="Street and number" value={form.address} onChange={set('address')} />
        </Field>
        <Field label="City">
          <Input placeholder="City" value={form.city || ''} onChange={set('city')} />
        </Field>
        <Field label="Province">
          <Input placeholder="Province / State" value={form.province || ''} onChange={set('province')} />
        </Field>
        <Field label="Country">
          <Input placeholder="Country" value={form.country || ''} onChange={set('country')} />
        </Field>
        <Field label="Description">
          <Textarea placeholder="Describe what makes this property exceptional..." value={form.description} onChange={set('description')} />
        </Field>
        <Field label="Suasana">
          <Select value={form.suasana || ''} onChange={(e) => setForm(f => ({ ...f, suasana: e.target.value }))}>
            <option value="">Pilih suasana</option>
            <option value="Pesisir">Pesisir</option>
            <option value="Alam">Alam</option>
            <option value="Perkotaan">Perkotaan</option>
          </Select>
        </Field>
        <div className={styles.imageUploaderGroup}>
          <p className={styles.fieldLabel}>Foto Hotel</p>
          <p className={styles.fieldHint}>Upload 3 foto untuk ditampilkan di detail properti.</p>
          <div className={styles.imageGrid}>
            {(form.images || ['', '', '']).map((imageValue, index) => (
              <div key={index} className={styles.imageSlot}>
                <label className={styles.imageSlotLabel}>Foto {index + 1}</label>
                <Input type="file" accept="image/*" onChange={uploadImage(index)} />
                <div className={styles.photoPreview} style={getPreviewStyle(imageValue)} />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.modalNote}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {modal === 'add'
            ? 'New hotels are set to pending and require admin approval before becoming visible to guests.'
            : 'Edits are saved immediately. Hotel status can only be changed by an admin.'}
        </div>
        <div className={styles.modalActions}>
          <Btn variant="outline" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save} disabled={!form.name || !form.address}>
            {modal === 'add' ? 'Submit for Review' : 'Save Changes'}
          </Btn>
        </div>
      </Modal>

      {/* ── Detail drawer ── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Property Details" width={500}>
        {detail && (
          <>
            <div className={styles.detailImg} style={getPreviewStyle(getPrimaryImage(detail.image))} />
            <div className={styles.detailRows}>
              {[
                ['Hotel Name', detail.name],
                ['Address', detail.address],
                ['Status', <StatusBadge key="s" status={detail.status} />],
                ['Suasana', detail.suasana || '-'],
                ['Rooms', `${detail.rooms} room types`],
                ['Added', detail.createdAt],
              ].map(([label, val]) => (
                <div key={label} className={styles.detailRow}>
                  <span>{label}</span>
                  <strong>{val}</strong>
                </div>
              ))}
            </div>
            <p className={styles.detailDesc}>{detail.description}</p>
          </>
        )}
      </Modal>

      {/* ── Delete confirm ── */}
      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        title="Delete Hotel"
        message="This will permanently remove the hotel and all associated data. This action cannot be undone."
      />
    </OwnerLayout>
  )
}