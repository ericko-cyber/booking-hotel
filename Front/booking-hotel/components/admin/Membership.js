import { useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  PageHeader, Badge, Btn, Card, CardTitle,
  Modal, Field, Input, Select, Confirm, StatCard,
} from '../../components/admin/AdminUI'
import { MEMBERSHIP_LEVELS as INIT } from './AdminData'
import styles from './Membership.module.css'

const TIER_COLORS = [
  { label: 'Grey (Basic)',    value: '#888888' },
  { label: 'Silver',         value: '#9aa0a6' },
  { label: 'Gold',           value: '#c49a3c' },
  { label: 'Navy (Luminary)',value: '#1b4d5c' },
  { label: 'Purple',         value: '#6a2aaa' },
  { label: 'Rose',           value: '#c0392b' },
]

const BLANK = { name: '', discount: '', minSpend: '', color: '#888888', benefits: [''] }

export default function AdminMembership() {
  const [levels, setLevels] = useState(INIT)
  const [modal, setModal]   = useState(null) // null | 'add' | level-obj
  const [confirm, setConfirm] = useState(null)
  const [form, setForm]     = useState(BLANK)
  const [errors, setErrors] = useState({})

  const totalMembers = levels.reduce((s, l) => s + l.members, 0)

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrors(er => ({ ...er, [k]: '' }))
  }

  /* Benefits helpers */
  const setBenefit = (i, val) =>
    setForm(f => ({ ...f, benefits: f.benefits.map((b, idx) => idx === i ? val : b) }))
  const addBenefit = () =>
    setForm(f => ({ ...f, benefits: [...f.benefits, ''] }))
  const removeBenefit = i =>
    setForm(f => ({ ...f, benefits: f.benefits.filter((_, idx) => idx !== i) }))

  /* Open */
  const openAdd = () => { setForm(BLANK); setErrors({}); setModal('add') }
  const openEdit = l => {
    setForm({ ...l, discount: String(l.discount), minSpend: String(l.minSpend), benefits: [...l.benefits] })
    setErrors({})
    setModal(l)
  }

  /* Validate */
  const validate = () => {
    const e = {}
    if (!form.name.trim())    e.name    = 'Name is required'
    if (form.discount === '' || Number(form.discount) < 0 || Number(form.discount) > 50)
      e.discount = 'Enter a discount between 0 and 50%'
    if (form.minSpend === '' || Number(form.minSpend) < 0)
      e.minSpend = 'Enter a valid minimum spend (≥ 0)'
    if (form.benefits.some(b => !b.trim()))
      e.benefits = 'Remove or fill all benefit fields'
    setErrors(e)
    return !Object.keys(e).length
  }

  /* Save */
  const save = () => {
    if (!validate()) return
    const entry = {
      ...form,
      discount: Number(form.discount),
      minSpend: Number(form.minSpend),
      id: modal === 'add' ? Date.now() : modal.id,
      members: modal === 'add' ? 0 : modal.members,
      benefits: form.benefits.filter(b => b.trim()),
    }
    if (modal === 'add') setLevels(ls => [...ls, entry])
    else setLevels(ls => ls.map(l => l.id === modal.id ? entry : l))
    setModal(null)
  }

  /* Delete */
  const remove = () => {
    setLevels(ls => ls.filter(l => l.id !== confirm))
    setConfirm(null)
  }

  return (
    <AdminLayout active="membership">
      <PageHeader
        eyebrow="Platform"
        title="Membership Management"
        subtitle={`${levels.length} tiers · ${totalMembers.toLocaleString()} total members`}
        action={<Btn onClick={openAdd}>+ New Tier</Btn>}
      />

      {/* ── Stats ── */}
      <div className={styles.statsRow}>
        <StatCard
          label="Total Members" value={totalMembers.toLocaleString()}
          sub="Across all tiers" icon="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8"
          accent
        />
        <StatCard
          label="Membership Tiers" value={levels.length}
          sub="Active levels" icon="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
        <StatCard
          label="Max Discount"
          value={`${Math.max(...levels.map(l => l.discount))}%`}
          sub={`${levels.find(l => l.discount === Math.max(...levels.map(l => l.discount)))?.name} tier`}
          icon="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
        />
        <StatCard
          label="Premium Members"
          value={(levels.filter(l => l.discount > 0).reduce((s,l) => s + l.members, 0)).toLocaleString()}
          sub="Non-Basic members"
          icon="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"
        />
      </div>

      {/* ── Tier cards ── */}
      <div className={styles.tierGrid}>
        {levels.map((level, idx) => {
          const pct = Math.round((level.members / totalMembers) * 100)
          return (
            <div key={level.id} className={styles.tierCard}>
              {/* Header */}
              <div className={styles.tierHeader} style={{ background: level.color }}>
                <div className={styles.tierRank}>#{idx + 1}</div>
                <div className={styles.tierNameBlock}>
                  <h3 className={styles.tierName}>{level.name}</h3>
                  <span className={styles.tierDiscount}>
                    {level.discount === 0 ? 'No discount' : `${level.discount}% off bookings`}
                  </span>
                </div>
                <div className={styles.tierMemberCount}>
                  <span className={styles.tierMemberNum}>{level.members.toLocaleString()}</span>
                  <span className={styles.tierMemberLabel}>members</span>
                </div>
              </div>

              {/* Body */}
              <div className={styles.tierBody}>
                {/* Min spend */}
                <div className={styles.tierMeta}>
                  <div className={styles.tierMetaItem}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <span>Min. spend: <strong>£{level.minSpend.toLocaleString()}</strong></span>
                  </div>
                  <div className={styles.tierMetaItem}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>{pct}% of members</span>
                  </div>
                </div>

                {/* Member share bar */}
                <div className={styles.shareBar}>
                  <div className={styles.shareBarFill} style={{ width: `${pct}%`, background: level.color }} />
                </div>

                {/* Benefits */}
                <div className={styles.benefitList}>
                  <p className={styles.benefitTitle}>Benefits</p>
                  {level.benefits.map((b, i) => (
                    <div key={i} className={styles.benefitItem}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={level.color} strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className={styles.tierActions}>
                  <Btn variant="outline" small onClick={() => openEdit(level)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit Tier
                  </Btn>
                  {level.members === 0 && (
                    <Btn danger small onClick={() => setConfirm(level.id)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      </svg>
                      Delete
                    </Btn>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Add new tier card */}
        <button className={styles.addTierCard} onClick={openAdd}>
          <div className={styles.addTierIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <p>Add New Tier</p>
        </button>
      </div>

      {/* ── Comparison table ── */}
      <Card className={styles.compareCard}>
        <CardTitle>Tier Comparison</CardTitle>
        <div className={styles.compareTableWrap}>
          <table className={styles.compareTable}>
            <thead>
              <tr>
                <th>Tier</th>
                <th>Discount</th>
                <th>Min Spend</th>
                <th>Members</th>
                <th>Share</th>
                <th>Benefits Count</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(l => (
                <tr key={l.id}>
                  <td>
                    <div className={styles.compareName}>
                      <span className={styles.compareDot} style={{ background: l.color }} />
                      <strong>{l.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span className={styles.compareDiscount} style={{ color: l.color }}>
                      {l.discount === 0 ? '—' : `${l.discount}%`}
                    </span>
                  </td>
                  <td className={styles.tdMuted}>
                    {l.minSpend === 0 ? 'Free' : `£${l.minSpend.toLocaleString()}`}
                  </td>
                  <td className={styles.tdBold}>{l.members.toLocaleString()}</td>
                  <td>
                    <div className={styles.compareBarRow}>
                      <div className={styles.compareBarTrack}>
                        <div
                          className={styles.compareBarFill}
                          style={{ width: `${Math.round((l.members / totalMembers) * 100)}%`, background: l.color }}
                        />
                      </div>
                      <span>{Math.round((l.members / totalMembers) * 100)}%</span>
                    </div>
                  </td>
                  <td className={styles.tdCenter}>{l.benefits.length} benefits</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Create New Membership Tier' : `Edit: ${modal?.name}`}
        width={560}
      >
        <div className={styles.twoField}>
          <Field label="Tier Name">
            <Input placeholder="e.g. Platinum" value={form.name} onChange={set('name')} />
            {errors.name && <span className={styles.err}>{errors.name}</span>}
          </Field>
          <Field label="Tier Colour">
            <Select value={form.color} onChange={set('color')}>
              {TIER_COLORS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
            <div className={styles.colorPreview} style={{ background: form.color }} />
          </Field>
        </div>

        <div className={styles.twoField}>
          <Field label="Booking Discount (%)" hint="0 = no discount. Max 50%.">
            <Input type="number" min="0" max="50" placeholder="10" value={form.discount} onChange={set('discount')} />
            {errors.discount && <span className={styles.err}>{errors.discount}</span>}
          </Field>
          <Field label="Minimum Lifetime Spend (£)" hint="0 = no minimum (entry level).">
            <Input type="number" min="0" placeholder="8000" value={form.minSpend} onChange={set('minSpend')} />
            {errors.minSpend && <span className={styles.err}>{errors.minSpend}</span>}
          </Field>
        </div>

        <Field label="Tier Benefits">
          <div className={styles.benefitEditor}>
            {form.benefits.map((b, i) => (
              <div key={i} className={styles.benefitRow}>
                <Input
                  placeholder={`Benefit ${i + 1}`}
                  value={b}
                  onChange={e => setBenefit(i, e.target.value)}
                />
                {form.benefits.length > 1 && (
                  <button className={styles.removeBenefit} onClick={() => removeBenefit(i)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button className={styles.addBenefit} onClick={addBenefit}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add benefit
            </button>
          </div>
          {errors.benefits && <span className={styles.err}>{errors.benefits}</span>}
        </Field>

        {/* Live preview */}
        <div className={styles.previewCard} style={{ borderColor: form.color }}>
          <div className={styles.previewHeader} style={{ background: form.color }}>
            <span className={styles.previewName}>{form.name || 'Tier Name'}</span>
            <span className={styles.previewDiscount}>
              {form.discount ? `${form.discount}% off` : 'No discount'}
            </span>
          </div>
          <div className={styles.previewBenefits}>
            {form.benefits.filter(b => b.trim()).slice(0, 3).map((b, i) => (
              <div key={i} className={styles.previewBenefitItem}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={form.color} strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>{b}</span>
              </div>
            ))}
            {form.benefits.filter(b => b.trim()).length === 0 && (
              <span className={styles.previewEmpty}>Add benefits above…</span>
            )}
          </div>
        </div>

        <div className={styles.modalActions}>
          <Btn variant="outline" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save}>{modal === 'add' ? 'Create Tier' : 'Save Changes'}</Btn>
        </div>
      </Modal>

      {/* ── Delete confirm ── */}
      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        title="Delete Membership Tier"
        message="This tier will be permanently removed. It can only be deleted if it has 0 members."
        confirmLabel="Delete Tier"
        confirmDanger
      />
    </AdminLayout>
  )
}