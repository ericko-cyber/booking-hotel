import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import {
  PageHeader, Badge, Btn, Card, CardTitle,
  Modal, Field, Input, Select, Confirm, Search, Empty, StatCard,
} from '../../components/admin/AdminUI'
import { adminService } from '../../services/adminService'
import { benefitService } from '../../services/benefitService'
import { voucherService } from '../../services/voucherService'
import styles from './Membership.module.css'

const MEMBERSHIP_TIERS = [
  { id: 'silver', name: 'Silver', color: '#9aa0a6', icon: '🥈' },
  { id: 'gold', name: 'Gold', color: '#c49a3c', icon: '🥇' },
  { id: 'platinum', name: 'Platinum', color: '#1b4d5c', icon: '👑' },
]

const MEMBERSHIP_DISCOUNT_DEFAULTS = {
  silver: 5,
  gold: 10,
  platinum: 15,
}

const BLANK_DISCOUNT = { tier: '', title: '', description: '', discount: '', expiry: '', status: 'active' }
const BLANK_VOUCHER = {
  tier: '',
  code: '',
  type: 'percent',
  value: '',
  scope: 'global',
  hotelId: '',
  roomType: '',
  usageLimit: '',
  voucherID: '',
  title: '',
  description: '',
  expiry: '',
  status: 'active',
}

const formatDate = value => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID')
}

const formatRawDate = value => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

const formatText = value => (value == null || value === '' ? '-' : String(value))

const extractPercentFromText = value => {
  if (!value) return null
  const match = String(value).match(/(\d+(?:\.\d+)?)\s*%/)
  if (!match) return null

  const parsed = Number(match[1])
  return Number.isNaN(parsed) ? null : parsed
}

const resolveDiscountPercent = benefit => {
  const raw =
    benefit?.discountPercent ??
    benefit?.discount_percent ??
    benefit?.discountValue ??
    benefit?.discount_value ??
    benefit?.value ??
    benefit?.discount ??
    null

  if (raw != null && raw !== '') {
    const value = typeof raw === 'string'
      ? Number(raw.replace(/%/g, '').replace(/,/g, '').trim())
      : Number(raw)

    if (!Number.isNaN(value) && value > 0) {
      return value
    }
  }

  const textFallback = extractPercentFromText(benefit?.description) ?? extractPercentFromText(benefit?.title)
  if (textFallback != null) {
    return textFallback
  }

  const tierFallback = MEMBERSHIP_DISCOUNT_DEFAULTS[resolveBenefitTier(benefit)]
  return tierFallback || 0
}

const resolveBenefitTier = benefit => {
  return String(
    benefit?.membershipTier ??
    benefit?.membership_tier ??
    benefit?.tier ??
    ''
  ).trim().toLowerCase()
}

const pickBestDiscountBenefit = (allDiscounts, tierId) => {
  const normalizedTierId = String(tierId || '').trim().toLowerCase()
  const candidates = allDiscounts.filter(item => resolveBenefitTier(item) === normalizedTierId)
  if (!candidates.length) return null

  const withValue = candidates.filter(item => resolveDiscountPercent(item) > 0)
  if (withValue.length) {
    return withValue.sort((a, b) => resolveDiscountPercent(b) - resolveDiscountPercent(a))[0]
  }

  return candidates[0]
}

export default function AdminMembership() {
  const [membershipUsers, setMembershipUsers] = useState([])
  const [memberSearch, setMemberSearch] = useState('')
  const [memberLoading, setMemberLoading] = useState(true)
  const [memberError, setMemberError] = useState('')

  const [discounts, setDiscounts] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [voucherCatalog, setVoucherCatalog] = useState([])
  const [benefitsLoading, setBenefitsLoading] = useState(false)

  const [tab, setTab] = useState('discounts')
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [discountModal, setDiscountModal] = useState(null)
  const [voucherModal, setVoucherModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [discountForm, setDiscountForm] = useState(BLANK_DISCOUNT)
  const [voucherForm, setVoucherForm] = useState(BLANK_VOUCHER)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Load membership users
  useEffect(() => {
    let alive = true

    const loadUsers = async () => {
      setMemberLoading(true)
      setMemberError('')

      try {
        const response = await adminService.getAllUsers({ limit: 100, page: 1 })
        const items = Array.isArray(response?.items) ? response.items : []

        if (alive) {
          setMembershipUsers(items)
        }
      } catch (error) {
        if (alive) {
          setMemberError(error?.message || 'Failed to load membership users')
        }
      } finally {
        if (alive) {
          setMemberLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true

    const loadVoucherCatalog = async () => {
      try {
        const list = await voucherService.getAdminVouchers()
        if (alive) {
          setVoucherCatalog(Array.isArray(list) ? list : [])
          setVouchers(Array.isArray(list) ? list : [])
        }
      } catch (error) {
        console.error('Failed to load voucher catalog:', error)
      }
    }

    loadVoucherCatalog()

    return () => {
      alive = false
    }
  }, [])

  // Load benefits
  useEffect(() => {
    let alive = true

    const loadBenefits = async () => {
      setBenefitsLoading(true)

      try {
        const benefits = await benefitService.getBenefits({ status: 'active' })
        if (alive) {
          const discountBenefits = benefits.filter(b => b.type === 'discount')
          setDiscounts(discountBenefits)
        }
      } catch (error) {
        console.error('Failed to load benefits:', error)
      } finally {
        if (alive) {
          setBenefitsLoading(false)
        }
      }
    }

    loadBenefits()

    return () => {
      alive = false
    }
  }, [])

  const setDiscountField = key => event => {
    setDiscountForm(form => ({ ...form, [key]: event.target.value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const setVoucherField = key => event => {
    setVoucherForm(form => ({ ...form, [key]: event.target.value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const openAddDiscount = (tier) => {
    setDiscountForm({ ...BLANK_DISCOUNT, tier })
    setErrors({})
    setDiscountModal('add')
  }

  const openEditDiscount = discount => {
    setDiscountForm({
      tier: discount.membershipTier,
      title: discount.title,
      description: discount.description || '',
      discount: String(resolveDiscountPercent(discount)),
      expiry: discount.expiryDate ? discount.expiryDate.split('T')[0] : (discount.expiry_date ? String(discount.expiry_date).split('T')[0] : ''),
      status: discount.status,
    })
    setErrors({})
    setDiscountModal(discount)
  }

  const validateDiscount = () => {
    const nextErrors = {}
    if (!discountForm.tier) nextErrors.tier = 'Tier is required'
    if (!discountForm.title.trim()) nextErrors.title = 'Title is required'
    if (!discountForm.discount || Number(discountForm.discount) < 0 || Number(discountForm.discount) > 100) nextErrors.discount = 'Discount must be 0-100%'
    setErrors(nextErrors)
    return !Object.keys(nextErrors).length
  }

  const saveDiscount = async () => {
    if (!validateDiscount()) return

    setSaving(true)
    try {
      const benefitData = {
        type: 'discount',
        title: discountForm.title,
        description: discountForm.description,
        discount_percent: Number(discountForm.discount),
        membership_tier: discountForm.tier,
        scope: 'global',
        expiry_date: discountForm.expiry || null,
        status: discountForm.status,
      }

      let result
      if (discountModal === 'add') {
        result = await benefitService.createBenefit(benefitData)
        console.log('Created benefit result:', result)
        
        // Ensure result has required fields
        if (result && typeof result === 'object') {
          if (!result.id) {
            console.warn('Benefit created but missing id field:', result)
            result = { ...result, id: result.id || Date.now() }
          }
          setDiscounts(list => [...list, result])
        } else {
          throw new Error('Invalid benefit response format')
        }
      } else {
        result = await benefitService.updateBenefit(discountModal.id, benefitData)
        console.log('Updated benefit result:', result)
        setDiscounts(list => list.map(item => (item.id === discountModal.id ? result : item)))
      }
      setDiscountModal(null)
    } catch (error) {
      console.error('Error saving discount:', error)
      setErrors({ submit: error?.message || 'Failed to save discount' })
    } finally {
      setSaving(false)
    }
  }

  const removeDiscount = async () => {
    if (!confirm) return
    setSaving(true)
    try {
      await benefitService.deleteBenefit(confirm)
      setDiscounts(list => list.filter(item => item.id !== confirm))
      setConfirm(null)
    } catch (error) {
      console.error('Failed to delete discount:', error)
    } finally {
      setSaving(false)
    }
  }

  const openAddVoucher = () => {
    setVoucherForm(BLANK_VOUCHER)
    setErrors({})
    setVoucherModal('add')
  }

  const openEditVoucher = voucher => {
    setVoucherForm({
      tier: voucher.membershipTier || voucher.membership_tier || '',
      code: voucher.code || '',
      type: voucher.type || voucher.benefitType || 'percent',
      value: String(voucher.value ?? voucher.benefit ?? ''),
      scope: voucher.scope || 'global',
      hotelId: voucher.hotelId || voucher.hotel_id || '',
      roomType: voucher.roomType || voucher.room_type || '',
      usageLimit: String(voucher.usageLimit ?? voucher.quota ?? voucher.usage_limit ?? ''),
      voucherID: String(voucher.id || ''),
      description: voucher.description || '',
      expiry: voucher.expiresAt ? String(voucher.expiresAt).split('T')[0] : (voucher.expiryDate ? String(voucher.expiryDate).split('T')[0] : (voucher.expiry_date ? String(voucher.expiry_date).split('T')[0] : '')),
      status: voucher.status || 'active',
    })
    setErrors({})
    setVoucherModal(voucher)
  }

  const validateVoucher = () => {
    const nextErrors = {}
    if (!voucherForm.tier) nextErrors.tier = 'Tier is required'

    // For both add and edit modes: validate these fields
    if (!voucherForm.code.trim()) nextErrors.code = 'Voucher code is required'
    if (!voucherForm.type) nextErrors.type = 'Voucher type is required'
    if (!voucherForm.value || Number(voucherForm.value) <= 0) nextErrors.value = 'Voucher value is required'
    if (!voucherForm.scope) nextErrors.scope = 'Voucher scope is required'
    if (!voucherForm.usageLimit || Number(voucherForm.usageLimit) < 1) nextErrors.usageLimit = 'Usage limit is required'

    setErrors(nextErrors)
    return !Object.keys(nextErrors).length
  }

  const saveVoucher = async () => {
    if (!validateVoucher()) return

    setSaving(true)
    try {
      if (voucherModal === 'add') {
        // Saat add: buat voucher baru di tabel vouchers saja
        const createdVoucher = await voucherService.createVoucher({
          code: voucherForm.code.toUpperCase(),
          type: voucherForm.type,
          value: Number(voucherForm.value),
          scope: voucherForm.scope,
          membership_tier: voucherForm.tier,
          hotel_id: voucherForm.scope === 'hotel' && voucherForm.hotelId ? Number(voucherForm.hotelId) : undefined,
          room_type: voucherForm.scope === 'room_type' && voucherForm.roomType ? voucherForm.roomType : undefined,
          expiry_date: voucherForm.expiry || null,
          usage_limit: Number(voucherForm.usageLimit),
          min_booking_amount: 0,
          description: voucherForm.description || voucherForm.title,
        })

        const voucherId = Number(createdVoucher?.id || createdVoucher?.ID || 0)
        if (!voucherId) {
          throw new Error('Voucher created but no voucher ID returned from server')
        }

        // Update state dengan voucher baru
        setVoucherCatalog(list => [...list, { ...createdVoucher, id: voucherId, code: createdVoucher.code || voucherForm.code.toUpperCase() }])
        setVouchers(list => [...list, createdVoucher])
      } else {
        // Saat edit: update voucher yang sudah ada
        const voucherId = Number(voucherForm.voucherID)
        const updated = await voucherService.updateVoucher(voucherId, {
          code: voucherForm.code.toUpperCase(),
          type: voucherForm.type,
          value: Number(voucherForm.value),
          scope: voucherForm.scope,
          membership_tier: voucherForm.tier,
          hotel_id: voucherForm.scope === 'hotel' && voucherForm.hotelId ? Number(voucherForm.hotelId) : undefined,
          room_type: voucherForm.scope === 'room_type' && voucherForm.roomType ? voucherForm.roomType : undefined,
          expiry_date: voucherForm.expiry || null,
          usage_limit: Number(voucherForm.usageLimit),
          description: voucherForm.description || voucherForm.title,
          status: voucherForm.status,
        })

        setVouchers(list => list.map(item => (item.id === voucherId ? updated : item)))
      }

      setVoucherModal(null)
    } catch (error) {
      setErrors({ submit: error?.message || 'Failed to save voucher' })
    } finally {
      setSaving(false)
    }
  }

  const removeVoucher = async () => {
    if (!confirm) return
    setSaving(true)
    try {
      await voucherService.deleteVoucher(confirm)
      setVouchers(list => list.filter(item => item.id !== confirm))
      setConfirm(null)
    } catch (error) {
      console.error('Failed to delete voucher:', error)
    } finally {
      setSaving(false)
    }
  }

  const tierSummary = useMemo(() => {
    return MEMBERSHIP_TIERS.map(tier => {
      const discount = pickBestDiscountBenefit(discounts, tier.id)
      return {
        ...tier,
        benefit: discount || null,
        discount: discount ? resolveDiscountPercent(discount) : 0,
      }
    })
  }, [discounts])

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(voucher => {
      const voucherTier = String(voucher.membershipTier || voucher.membership_tier || '').trim().toLowerCase()
      if (!voucherTier || voucherTier === 'none') return false

      const matchTier = tierFilter === 'all' || voucherTier === tierFilter
      const matchSearch = !search || voucher.title.toLowerCase().includes(search.toLowerCase())
      return matchTier && matchSearch
    })
  }, [vouchers, tierFilter, search])

  const filteredMembers = useMemo(() => {
    // only show users that have a membership tier (exclude 'none')
    const base = membershipUsers.filter(user => user.membership_tier && user.membership_tier !== 'none')
    const query = memberSearch.trim().toLowerCase()
    if (!query) return base

    return base.filter(user => {
      return [user.name, user.email, user.role, user.membership_tier, user.membership_status]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query))
    })
  }, [membershipUsers, memberSearch])

  const totalDiscounts = discounts.length
  const totalVouchers = vouchers.filter(voucher => String(voucher.membershipTier || voucher.membership_tier || '').trim().toLowerCase() !== 'none').length
  const avgDiscount = discounts.length ? Math.round(discounts.reduce((sum, item) => sum + resolveDiscountPercent(item), 0) / discounts.length) : 0
  const totalMembers = membershipUsers.filter(user => user.membership_tier && user.membership_tier !== 'none').length
  const activeMembers = membershipUsers.filter(user => user.membership_tier !== 'none' && user.membership_status === 'active').length

  return (
    <AdminLayout active="membership">
      <PageHeader
        eyebrow="Membership"
        title="Membership Benefits"
        subtitle="Kelola benefit membership dan lihat daftar pengguna langsung dari database"
      />

      <div className={styles.statsRow}>
        <StatCard label="Membership Users" value={totalMembers} sub={`${activeMembers} active memberships`} icon="M16 14a4 4 0 1 0-8 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 0c5 0 9 2.5 9 5.5V20H3v-3.5c0-3 4-5.5 9-5.5z" accent />
        <StatCard label="Discount Tiers" value={totalDiscounts} sub="Silver, Gold, Platinum" icon="M12 2l3.09 6.26L22 9.27l-5 4.87" />
        <StatCard label="Member Vouchers" value={totalVouchers} sub={`${totalVouchers} active vouchers`} icon="M20 12V22H4V12 M22 7H2v5h20V7z M12 22V7" />
        <StatCard label="Avg Discount" value={`${avgDiscount}%`} sub="Across all tiers" icon="M12 8V4M12 20v-4M4 12h4M16 12h4" />
      </div>

      <Card className={styles.memberSection}>
        <div className={styles.memberSectionHeader}>
          <div>
            <CardTitle>Membership Users</CardTitle>
            <p>Menampilkan kolom membership tier saja dari tabel users.</p>
          </div>
          <div className={styles.memberSectionMeta}>
            <span>{filteredMembers.length} shown</span>
            <span>{activeMembers} active</span>
          </div>
        </div>

        <div className={styles.memberToolbar}>
          <Search value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search tier..." />
        </div>

        {memberLoading ? (
          <div className={styles.memberState}>
            <p>Loading membership users...</p>
          </div>
        ) : memberError ? (
          <Empty title="Unable to load members" desc={memberError} />
        ) : filteredMembers.length > 0 ? (
          <div className={styles.memberTableWrap}>
            <div className={styles.memberTableHeader}>
              <div>Name</div>
              <div>Tier</div>
              <div>Joined</div>
            </div>

            {filteredMembers.map(user => (
              <div key={user.id} className={styles.memberTableRow}>
                <div className={styles.memberIdentity}>
                  <strong>{user.name || '-'}</strong>
                  <div className={styles.memberEmail}>{user.email}</div>
                </div>
                <div>
                  <Badge status={user.membership_tier || 'none'} />
                </div>
                <div>
                  {formatDate(user.membership_start_date || user.joined_date || user.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No members found" desc="Tidak ada user yang cocok dengan filter saat ini." />
        )}
      </Card>

      <div className={styles.tabBar}>
        <button className={`${styles.tab} ${tab === 'discounts' ? styles.tabActive : ''}`} onClick={() => setTab('discounts')}>Tier Discounts</button>
        <button className={`${styles.tab} ${tab === 'vouchers' ? styles.tabActive : ''}`} onClick={() => setTab('vouchers')}>Member Vouchers</button>
      </div>

      {tab === 'discounts' && (
        <div className={styles.content}>
          <div className={styles.sectionHeader}>
            <h2>Tier Discounts</h2>
          </div>

          {benefitsLoading ? (
            <p>Loading benefits...</p>
          ) : (
            <div className={styles.tierCardsGrid}>
              {tierSummary.map(tier => (
                <Card key={tier.id} className={styles.tierCard}>
                  <div className={styles.tierCardHeader} style={{ borderColor: tier.color }}>
                    <span className={styles.tierIcon}>{tier.icon}</span>
                    <h3>{tier.name}</h3>
                  </div>
                  <div className={styles.tierCardContent}>
                    <div className={styles.tierStat}><span>Discount</span><strong>{tier.discount}%</strong></div>
                    <div className={styles.tierStat}><span>Record ID</span><strong>{formatText(tier.benefit?.id)}</strong></div>
                    <div className={styles.tierStat}><span>Title</span><strong>{formatText(tier.benefit?.title)}</strong></div>
                    <div className={styles.tierStat}><span>Description</span><strong>{formatText(tier.benefit?.description)}</strong></div>
                    <div className={styles.tierStat}><span>Tier</span><strong>{formatText(tier.benefit?.membershipTier)}</strong></div>
                    <div className={styles.tierStat}><span>Scope</span><strong>{formatText(tier.benefit?.scope)}</strong></div>
                    <div className={styles.tierStat}><span>Expiry</span><strong>{formatRawDate(tier.benefit?.expiryDate || tier.benefit?.expiry_date)}</strong></div>
                    <div className={styles.tierCardActions}>
                      {tier.benefit ? (
                        <>
                          <Btn small variant="secondary" onClick={() => openEditDiscount(tier.benefit)}>Edit</Btn>
                          <Btn small danger onClick={() => setConfirm(tier.benefit.id)}>Delete</Btn>
                        </>
                      ) : (
                        <Btn small onClick={() => openAddDiscount(tier.id)} style={{ width: '100%' }}>Add Discount</Btn>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'vouchers' && (
        <div className={styles.content}>
          <div className={styles.sectionHeader}>
            <div className={styles.filterRow}>
              <Search value={search} onChange={e => setSearch(e.target.value)} placeholder="Search voucher title..." />
              <Select value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
                <option value="all">All Tiers</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </Select>
              <Btn onClick={openAddVoucher}>+ Add Voucher</Btn>
            </div>
          </div>

          {filteredVouchers.length > 0 ? (
            <div className={styles.voucherTable}>
              <div className={styles.tableHeader}>
                <div>ID</div>
                <div>Title</div>
                <div>Description</div>
                <div>Tier</div>
                <div>Voucher Code</div>
                <div>Scope</div>
                <div>Expiry</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {filteredVouchers.map(voucher => (
                <div key={voucher.id} className={styles.tableRow}>
                  <div>#{voucher.id}</div>
                  <div><strong>{formatText(voucher.title)}</strong></div>
                  <div>{formatText(voucher.description)}</div>
                  <div><Badge status={voucher.membershipTier} /></div>
                  <div><code>{formatText(voucher.code || '-')}</code></div>
                  <div>{formatText(voucher.scope)}</div>
                  <div>{voucher.expiresAt ? formatDate(voucher.expiresAt) : (voucher.expiryDate ? formatDate(voucher.expiryDate) : (voucher.expiry_date ? formatDate(voucher.expiry_date) : '-'))}</div>
                  <div><Badge status={voucher.status} /></div>
                  <div className={styles.rowActions}>
                    <Btn small variant="secondary" onClick={() => openEditVoucher(voucher)}>Edit</Btn>
                    <Btn small danger onClick={() => setConfirm(voucher.id)}>Delete</Btn>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No vouchers found" desc="Create membership vouchers to get started" />
          )}
        </div>
      )}

      <Modal
        open={!!discountModal}
        title={discountModal === 'add' ? 'Add Discount Benefit' : 'Edit Discount Benefit'}
        onClose={() => setDiscountModal(null)}
      >
        {errors.submit && <div style={{ fontSize: '12px', color: '#c0392b', marginBottom: '12px', padding: '8px', background: '#fdd7d7', borderRadius: '4px' }}>{errors.submit}</div>}

        <Field label="Tier">
          <Input value={discountForm.tier.charAt(0).toUpperCase() + discountForm.tier.slice(1)} disabled style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
        </Field>
        {errors.tier && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '8px' }}>{errors.tier}</div>}

        <Field label="Title">
          <Input value={discountForm.title} onChange={setDiscountField('title')} placeholder="e.g. Silver Member Discount" />
        </Field>
        <Field label="Description">
          <Input value={discountForm.description} onChange={setDiscountField('description')} placeholder="e.g. 5% discount for Silver tier" />
        </Field>
        {errors.title && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '8px' }}>{errors.title}</div>}

        <Field label="Discount (%)">
          <Input type="number" min="0" max="100" value={discountForm.discount} onChange={setDiscountField('discount')} placeholder="e.g. 5" />
        </Field>
        {errors.discount && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '8px' }}>{errors.discount}</div>}

        <Field label="Expiry Date (Optional)">
          <Input type="date" value={discountForm.expiry} onChange={setDiscountField('expiry')} />
        </Field>

        <Field label="Status">
          <Select value={discountForm.status} onChange={setDiscountField('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </Field>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={() => setDiscountModal(null)} disabled={saving}>Cancel</Btn>
          <Btn onClick={saveDiscount} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Btn>
        </div>
      </Modal>

      <Modal
        open={!!voucherModal}
        title={voucherModal === 'add' ? 'Add Voucher Benefit' : 'Edit Voucher Benefit'}
        onClose={() => setVoucherModal(null)}
      >
        {errors.submit && <div style={{ fontSize: '12px', color: '#c0392b', marginBottom: '12px', padding: '8px', background: '#fdd7d7', borderRadius: '4px' }}>{errors.submit}</div>}

        <Field label="Tier">
          <Select value={voucherForm.tier} onChange={setVoucherField('tier')} disabled={voucherModal !== 'add'}>
            <option value="">Select tier</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </Select>
        </Field>
        {errors.tier && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '8px' }}>{errors.tier}</div>}

        {voucherModal === 'add' ? (
          <>
            <Field label="Voucher Code" hint="Letters, numbers, hyphens only. Will be uppercased.">
              <Input value={voucherForm.code} onChange={setVoucherField('code')} placeholder="e.g. SUMMER25" style={{ textTransform: 'uppercase', fontFamily: 'monospace' }} />
            </Field>
            {errors.code && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '8px' }}>{errors.code}</div>}

            <Field label="Description">
              <Input value={voucherForm.description} onChange={setVoucherField('description')} placeholder="e.g. Welcome voucher for Silver members" />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Discount Type">
                <Select value={voucherForm.type} onChange={setVoucherField('type')}>
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rp)</option>
                </Select>
              </Field>
              <Field label="Discount Value">
                <Input type="number" min="1" value={voucherForm.value} onChange={setVoucherField('value')} placeholder={voucherForm.type === 'fixed' ? 'e.g. 50000' : 'e.g. 10'} />
              </Field>
            </div>
            {errors.type && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '8px' }}>{errors.type}</div>}
            {errors.value && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '8px' }}>{errors.value}</div>}

            <Field label="Voucher Scope">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setVoucherForm(f => ({ ...f, scope: 'global' }))
                    setErrors(p => ({ ...p, scope: '' }))
                  }}
                  style={{
                    border: voucherForm.scope === 'global' ? '2px solid #0d3d4a' : '1px solid #ddd',
                    borderRadius: '12px',
                    padding: '16px',
                    background: voucherForm.scope === 'global' ? '#f0f8f9' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>🌐</div>
                  <strong style={{ display: 'block', fontSize: '14px' }}>Global</strong>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Applies to all hotels on the platform</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVoucherForm(f => ({ ...f, scope: 'hotel' }))
                    setErrors(p => ({ ...p, scope: '' }))
                  }}
                  style={{
                    border: voucherForm.scope === 'hotel' ? '2px solid #0d3d4a' : '1px solid #ddd',
                    borderRadius: '12px',
                    padding: '16px',
                    background: voucherForm.scope === 'hotel' ? '#f0f8f9' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>🏨</div>
                  <strong style={{ display: 'block', fontSize: '14px' }}>Per Hotel</strong>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Applies to one specific hotel only</div>
                  {voucherForm.scope === 'hotel' && <div style={{ fontSize: '16px', position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>✓</div>}
                </button>
              </div>
            </Field>
            {errors.scope && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '8px' }}>{errors.scope}</div>}

            {voucherForm.scope === 'hotel' && (
              <>
                <Field label="Select Hotel">
                  <Select value={voucherForm.hotelId || ''} onChange={(e) => setVoucherField('hotelId')(e.target.value)}>
                    <option value="">— Choose a hotel —</option>
                    {/* Will populate from hotels loaded by component */}
                  </Select>
                </Field>
              </>
            )}

            {voucherForm.scope === 'room_type' && (
              <>
                <Field label="Room Type (Optional)">
                  <Select value={voucherForm.roomType || ''} onChange={(e) => setVoucherField('roomType')(e.target.value)}>
                    <option value="">— Any room type —</option>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="suite">Suite</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="presidential">Presidential</option>
                  </Select>
                </Field>
              </>
            )}

            <Field label="Usage Quota">
              <Input type="number" min="1" value={voucherForm.usageLimit} onChange={setVoucherField('usageLimit')} placeholder="e.g. 100" />
            </Field>
            {errors.usageLimit && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '8px' }}>{errors.usageLimit}</div>}

            <Field label="Expiry Date">
              <Input type="date" value={voucherForm.expiry} onChange={setVoucherField('expiry')} />
            </Field>

            <Field label="Status">
              <Select value={voucherForm.status} onChange={setVoucherField('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
          </>
        ) : (
          <>
            <Field label="Voucher Code" hint="Letters, numbers, hyphens only. Will be uppercased.">
              <Input value={voucherForm.code} onChange={setVoucherField('code')} placeholder="e.g. SUMMER25" style={{ textTransform: 'uppercase', fontFamily: 'monospace' }} />
            </Field>
            {errors.code && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '8px' }}>{errors.code}</div>}

            <Field label="Description">
              <Input value={voucherForm.description} onChange={setVoucherField('description')} placeholder="e.g. Welcome voucher for Silver members" />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Discount Type">
                <Select value={voucherForm.type} onChange={setVoucherField('type')}>
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rp)</option>
                </Select>
              </Field>
              <Field label="Discount Value">
                <Input type="number" min="1" value={voucherForm.value} onChange={setVoucherField('value')} placeholder={voucherForm.type === 'fixed' ? 'e.g. 50000' : 'e.g. 10'} />
              </Field>
            </div>
            {errors.type && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '8px' }}>{errors.type}</div>}
            {errors.value && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '8px' }}>{errors.value}</div>}

            <Field label="Voucher Scope">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setVoucherForm(f => ({ ...f, scope: 'global' }))
                    setErrors(p => ({ ...p, scope: '' }))
                  }}
                  style={{
                    border: voucherForm.scope === 'global' ? '2px solid #0d3d4a' : '1px solid #ddd',
                    borderRadius: '12px',
                    padding: '16px',
                    background: voucherForm.scope === 'global' ? '#f0f8f9' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>🌐</div>
                  <strong style={{ display: 'block', fontSize: '14px' }}>Global</strong>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Applies to all hotels on the platform</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVoucherForm(f => ({ ...f, scope: 'hotel' }))
                    setErrors(p => ({ ...p, scope: '' }))
                  }}
                  style={{
                    border: voucherForm.scope === 'hotel' ? '2px solid #0d3d4a' : '1px solid #ddd',
                    borderRadius: '12px',
                    padding: '16px',
                    background: voucherForm.scope === 'hotel' ? '#f0f8f9' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                  }}
                >
                  <div style={{ fontSize: '20px', marginBottom: '6px' }}>🏨</div>
                  <strong style={{ display: 'block', fontSize: '14px' }}>Per Hotel</strong>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Applies to one specific hotel only</div>
                  {voucherForm.scope === 'hotel' && <div style={{ fontSize: '16px', position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>✓</div>}
                </button>
              </div>
            </Field>
            {errors.scope && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '8px' }}>{errors.scope}</div>}

            {voucherForm.scope === 'hotel' && (
              <>
                <Field label="Select Hotel">
                  <Select value={voucherForm.hotelId || ''} onChange={(e) => setVoucherField('hotelId')(e.target.value)}>
                    <option value="">— Choose a hotel —</option>
                  </Select>
                </Field>
              </>
            )}

            {voucherForm.scope === 'room_type' && (
              <>
                <Field label="Room Type (Optional)">
                  <Select value={voucherForm.roomType || ''} onChange={(e) => setVoucherField('roomType')(e.target.value)}>
                    <option value="">— Any room type —</option>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="suite">Suite</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="presidential">Presidential</option>
                  </Select>
                </Field>
              </>
            )}

            <Field label="Usage Quota">
              <Input type="number" min="1" value={voucherForm.usageLimit} onChange={setVoucherField('usageLimit')} placeholder="e.g. 100" />
            </Field>
            {errors.usageLimit && <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '8px' }}>{errors.usageLimit}</div>}

            <Field label="Expiry Date">
              <Input type="date" value={voucherForm.expiry} onChange={setVoucherField('expiry')} />
            </Field>

            <Field label="Status">
              <Select value={voucherForm.status} onChange={setVoucherField('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
          </>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={() => setVoucherModal(null)} disabled={saving}>Cancel</Btn>
          <Btn onClick={saveVoucher} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Btn>
        </div>
      </Modal>

      <Confirm
        open={!!confirm}
        title="Delete Membership Benefit"
        message="This action cannot be undone."
        onConfirm={() => {
          const isDiscount = discounts.some(item => item.id === confirm)
          if (isDiscount) {
            removeDiscount()
          } else {
            removeVoucher()
          }
        }}
        onClose={() => setConfirm(null)}
        disabled={saving}
      />
    </AdminLayout>
  )
}