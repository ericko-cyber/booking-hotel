import { useState } from 'react'
import OwnerLayout from './OwnerLayout'
import { PageHeader, StatusBadge, Btn, Modal, Field, Input, Textarea, Select, Confirm, Empty } from './OwnerUI'
import { OWNER_HOTELS as INIT, CURRENT_OWNER } from './OwnerData'
import styles from './Hotels.module.css'

const BLANK = { name: '', address: '', description: '', photo: '', status: 'pending' }
const PHOTO_OPTIONS = [
  { label: 'Warm Amber', value: 'linear-gradient(135deg,#3a2a1a 0%,#6b4a2a 60%,#8a6a40 100%)' },
  { label: 'Ocean Blue', value: 'linear-gradient(135deg,#1a3a5a 0%,#2a6a9a 60%,#4a8aba 100%)' },
  { label: 'Forest Green', value: 'linear-gradient(135deg,#1a4a1a 0%,#2d7a3a 60%,#4a9a50 100%)' },
  { label: 'Dusk Purple', value: 'linear-gradient(135deg,#2a1a3a 0%,#5a3a6a 60%,#8a5a8a 100%)' },
  { label: 'Slate Steel', value: 'linear-gradient(135deg,#1a2a3a 0%,#2a4a6a 60%,#4a6a8a 100%)' },
]

export default function OwnerHotels() {
  const [hotels, setHotels] = useState(INIT.filter((h) => h.ownerId === CURRENT_OWNER.id))
  const [modal, setModal] = useState(null) // null | 'add' | hotel obj (edit)
  const [confirm, setConfirm] = useState(null) // hotel id
  const [detail, setDetail] = useState(null) // hotel obj
  const [form, setForm] = useState(BLANK)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const openAdd = () => { setForm({ ...BLANK, photo: PHOTO_OPTIONS[0].value }); setModal('add') }
  const openEdit = (h) => { setForm({ ...h }); setModal(h) }

  const save = () => {
    if (!form.name || !form.address) return
    if (modal === 'add') {
      setHotels(hs => [...hs, { ...form, ownerId: CURRENT_OWNER.id, id: Date.now(), status: 'pending', rooms: 0, createdAt: new Date().toISOString().split('T')[0] }])
    } else {
      setHotels(hs => hs.map(h => h.id === modal.id ? { ...h, ...form } : h))
    }
    setModal(null)
  }

  const remove = () => {
    setHotels(hs => hs.filter(h => h.id !== confirm))
    setConfirm(null)
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
              <div className={styles.cardImg} style={{ background: h.photo }}>
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
        <Field label="Address">
          <Input placeholder="Street, City, Country" value={form.address} onChange={set('address')} />
        </Field>
        <Field label="Description">
          <Textarea placeholder="Describe what makes this property exceptional..." value={form.description} onChange={set('description')} />
        </Field>
        <Field label="Cover Photo Style" hint="Real image upload coming soon.">
          <Select value={form.photo} onChange={set('photo')}>
            {PHOTO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <div className={styles.photoPreview} style={{ background: form.photo }} />
        </Field>
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
            <div className={styles.detailImg} style={{ background: detail.photo }} />
            <div className={styles.detailRows}>
              {[
                ['Hotel Name', detail.name],
                ['Address', detail.address],
                ['Status', <StatusBadge key="s" status={detail.status} />],
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