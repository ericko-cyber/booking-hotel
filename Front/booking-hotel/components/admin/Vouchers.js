import { useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  PageHeader, Badge, Btn, Card, CardTitle,
  Modal, Field, Input, Select, Confirm, Search, Empty, StatCard,
} from '../../components/admin/AdminUI'
import { PLATFORM_VOUCHERS as INIT, ALL_HOTELS_ADMIN } from './AdminData'
import styles from './Vouchers.module.css'

const BLANK = {
  code: '', type: 'percent', value: '', scope: 'global',
  hotel: '', expiry: '', quota: '', status: 'active',
}

const approvedHotels = ALL_HOTELS_ADMIN.filter(h => h.status === 'approved')

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState(INIT)
  const [search, setSearch] = useState('')
  const [scopeFilter, setScopeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null)   // null | 'add' | voucher-obj
  const [confirm, setConfirm] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [errors, setErrors] = useState({})

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrors(er => ({ ...er, [k]: '' }))
  }

  /* ── Open modals ── */
  const openAdd = () => { setForm(BLANK); setErrors({}); setModal('add') }
  const openEdit = v => { setForm({ ...v, value: String(v.value), quota: String(v.quota) }); setErrors({}); setModal(v) }

  /* ── Validate ── */
  const validate = () => {
    const e = {}
    if (!form.code.trim())  e.code  = 'Code is required'
    if (!form.value || Number(form.value) <= 0) e.value = 'Enter a valid value'
    if (form.type === 'percent' && Number(form.value) > 100) e.value = 'Percentage cannot exceed 100'
    if (!form.expiry) e.expiry = 'Expiry date is required'
    if (!form.quota || Number(form.quota) < 1) e.quota = 'Enter a valid quota'
    if (form.scope === 'hotel' && !form.hotel) e.hotel = 'Select a hotel for hotel-scoped voucher'
    setErrors(e)
    return !Object.keys(e).length
  }

  /* ── Save ── */
  const save = () => {
    if (!validate()) return
    const entry = {
      ...form,
      value: Number(form.value),
      quota: Number(form.quota),
      used: modal === 'add' ? 0 : modal.used,
      id: modal === 'add' ? Date.now() : modal.id,
      hotel: form.scope === 'global' ? null : form.hotel,
    }
    if (modal === 'add') {
      setVouchers(v => [entry, ...v])
    } else {
      setVouchers(v => v.map(x => x.id === modal.id ? entry : x))
    }
    setModal(null)
  }

  /* ── Delete ── */
  const remove = () => {
    setVouchers(v => v.filter(x => x.id !== confirm))
    setConfirm(null)
  }

  /* ── Filter ── */
  const filtered = vouchers.filter(v => {
    const ms = scopeFilter  === 'all' || v.scope   === scopeFilter
    const mt = statusFilter === 'all' || v.status  === statusFilter
    const mq = !search || v.code.toLowerCase().includes(search.toLowerCase()) || (v.hotel || '').toLowerCase().includes(search.toLowerCase())
    return ms && mt && mq
  })

  /* ── Summary stats ── */
  const totalActive  = vouchers.filter(v => v.status === 'active').length
  const totalUsed    = vouchers.reduce((s, v) => s + v.used, 0)
  const totalQuota   = vouchers.reduce((s, v) => s + v.quota, 0)
  const globalCount  = vouchers.filter(v => v.scope === 'global').length

  return (
    <AdminLayout active="vouchers">
      <PageHeader
        eyebrow="Platform"
        title="Voucher Management"
        subtitle={`${totalActive} active vouchers · ${totalUsed.toLocaleString()} total redemptions`}
        action={<Btn onClick={openAdd}>+ Create Voucher</Btn>}
      />

      {/* ── Summary stats ── */}
      <div className={styles.statsRow}>
        <StatCard
          label="Active Vouchers" value={totalActive}
          sub={`${vouchers.filter(v => v.status === 'expired').length} expired`}
          icon="M20 12V22H4V12 M22 7H2v5h20V7z M12 22V7"
        />
        <StatCard
          label="Total Redemptions" value={totalUsed.toLocaleString()}
          sub={`of ${totalQuota.toLocaleString()} total quota`}
          icon="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"
          accent
        />
        <StatCard
          label="Global Vouchers" value={globalCount}
          sub={`${vouchers.length - globalCount} hotel-specific`}
          icon="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"
        />
        <StatCard
          label="Avg Usage Rate"
          value={`${Math.round((totalUsed / Math.max(totalQuota,1)) * 100)}%`}
          sub="Across all vouchers"
          icon="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </div>

      {/* ── Filters toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          {/* Scope filter */}
          <div className={styles.segmented}>
            {['all','global','hotel'].map(s => (
              <button
                key={s}
                className={`${styles.seg} ${scopeFilter === s ? styles.segOn : ''}`}
                onClick={() => setScopeFilter(s)}
              >
                {s === 'all' ? 'All Scopes' : s === 'global' ? '🌐 Global' : '🏨 Per Hotel'}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className={styles.segmented}>
            {['all','active','expired'].map(s => (
              <button
                key={s}
                className={`${styles.seg} ${statusFilter === s ? styles.segOn : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <Search value={search} onChange={e => setSearch(e.target.value)} placeholder="Search code or hotel..." />
      </div>

      {/* ── Voucher grid ── */}
      {filtered.length === 0 ? (
        <Empty
          icon="M20 12V22H4V12 M22 7H2v5h20V7z"
          title="No vouchers found"
          desc="Try adjusting your filters or create a new voucher."
          action={<Btn onClick={openAdd}>Create Voucher</Btn>}
        />
      ) : (
        <div className={styles.voucherGrid}>
          {filtered.map(v => {
            const usagePct = Math.min(100, Math.round((v.used / v.quota) * 100))
            const isExpired = v.status === 'expired'
            return (
              <div key={v.id} className={`${styles.vCard} ${isExpired ? styles.vCardDim : ''}`}>
                {/* Left accent strip */}
                <div className={`${styles.vStrip} ${v.scope === 'global' ? styles.vStripGlobal : styles.vStripHotel}`}>
                  <span className={styles.vValue}>
                    {v.type === 'percent' ? `${v.value}%` : `£${v.value}`}
                  </span>
                  <span className={styles.vType}>
                    {v.type === 'percent' ? 'off' : 'fixed'}
                  </span>
                </div>

                {/* Content */}
                <div className={styles.vContent}>
                  <div className={styles.vTopRow}>
                    <code className={styles.vCode}>{v.code}</code>
                    <div className={styles.vBadges}>
                      <Badge status={v.scope === 'global' ? 'global' : 'hotel'} />
                      <Badge status={v.status} />
                    </div>
                  </div>

                  <div className={styles.vMeta}>
                    {v.scope === 'hotel' && v.hotel && (
                      <span className={styles.vHotel}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                        {v.hotel}
                      </span>
                    )}
                    {v.scope === 'global' && (
                      <span className={styles.vHotel}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="2" y1="12" x2="22" y2="12"/>
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                        All hotels
                      </span>
                    )}
                    <span className={styles.vExpiry}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Expires {v.expiry}
                    </span>
                  </div>

                  {/* Usage bar */}
                  <div className={styles.vUsageRow}>
                    <div className={styles.vUsageBar}>
                      <div
                        className={`${styles.vUsageFill} ${usagePct >= 90 ? styles.vUsageFull : ''}`}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                    <span className={styles.vUsageText}>
                      {v.used}/{v.quota} used ({usagePct}%)
                    </span>
                  </div>

                  {/* Actions */}
                  <div className={styles.vActions}>
                    <Btn variant="ghost" small onClick={() => openEdit(v)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </Btn>
                    <Btn danger small onClick={() => setConfirm(v.id)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                      Delete
                    </Btn>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Create New Voucher' : 'Edit Voucher'}
        width={560}
      >
        <div className={styles.modalGrid}>
          <Field label="Voucher Code" hint="Letters, numbers, hyphens only. Will be uppercased.">
            <Input
              placeholder="e.g. SUMMER25"
              value={form.code}
              onChange={set('code')}
              style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.08em' }}
            />
            {errors.code && <span className={styles.err}>{errors.code}</span>}
          </Field>

          <div className={styles.twoField}>
            <Field label="Discount Type">
              <Select value={form.type} onChange={set('type')}>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (£)</option>
              </Select>
            </Field>
            <Field label={form.type === 'percent' ? 'Discount Value (%)' : 'Discount Value (£)'}>
              <Input
                type="number" min="1" max={form.type === 'percent' ? 100 : undefined}
                placeholder={form.type === 'percent' ? '10' : '50'}
                value={form.value} onChange={set('value')}
              />
              {errors.value && <span className={styles.err}>{errors.value}</span>}
            </Field>
          </div>

          <Field label="Voucher Scope">
            <div className={styles.scopeCards}>
              {['global', 'hotel'].map(s => (
                <button
                  key={s} type="button"
                  className={`${styles.scopeCard} ${form.scope === s ? styles.scopeCardOn : ''}`}
                  onClick={() => setForm(f => ({ ...f, scope: s, hotel: '' }))}
                >
                  <div className={styles.scopeIcon}>
                    {s === 'global' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    )}
                  </div>
                  <div className={styles.scopeText}>
                    <strong>{s === 'global' ? 'Global' : 'Per Hotel'}</strong>
                    <span>{s === 'global' ? 'Applies to all hotels on the platform' : 'Applies to one specific hotel only'}</span>
                  </div>
                  {form.scope === s && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b4d5c" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </Field>

          {form.scope === 'hotel' && (
            <Field label="Select Hotel">
              <Select value={form.hotel} onChange={set('hotel')}>
                <option value="">— Choose a hotel —</option>
                {approvedHotels.map(h => (
                  <option key={h.id} value={h.name}>{h.name} ({h.owner})</option>
                ))}
              </Select>
              {errors.hotel && <span className={styles.err}>{errors.hotel}</span>}
            </Field>
          )}

          <div className={styles.twoField}>
            <Field label="Expiry Date">
              <Input type="date" value={form.expiry} onChange={set('expiry')} />
              {errors.expiry && <span className={styles.err}>{errors.expiry}</span>}
            </Field>
            <Field label="Usage Quota">
              <Input type="number" min="1" placeholder="100" value={form.quota} onChange={set('quota')} />
              {errors.quota && <span className={styles.err}>{errors.quota}</span>}
            </Field>
          </div>

          <Field label="Status">
            <Select value={form.status} onChange={set('status')}>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </Select>
          </Field>
        </div>

        {/* Preview strip */}
        <div className={styles.previewStrip}>
          <div className={`${styles.previewLeft} ${form.scope === 'global' ? styles.previewGlobal : styles.previewHotel}`}>
            <span>{form.type === 'percent' ? `${form.value || '?'}%` : `£${form.value || '?'}`}</span>
            <span>{form.type === 'percent' ? 'off' : 'off'}</span>
          </div>
          <div className={styles.previewRight}>
            <code>{form.code || 'VOUCHER-CODE'}</code>
            <span>{form.scope === 'global' ? '🌐 All hotels' : form.hotel ? `🏨 ${form.hotel}` : '🏨 Select hotel'}</span>
          </div>
        </div>

        <div className={styles.modalActions}>
          <Btn variant="outline" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save}>{modal === 'add' ? 'Create Voucher' : 'Save Changes'}</Btn>
        </div>
      </Modal>

      {/* ── Delete confirm ── */}
      <Confirm
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        title="Delete Voucher"
        message="This voucher will be permanently removed. Guests who have already used it will not be affected."
        confirmLabel="Delete Voucher"
        confirmDanger
      />
    </AdminLayout>
  )
}