import { useMemo, useState, useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
const Navbar = dynamic(() => import('../components/layout/Navbar'), { ssr: false })
const Footer = dynamic(() => import('../components/layout/Footer'), { ssr: false })
const VoucherModal = dynamic(() => import('../components/modals/VoucherModal'), { ssr: false })
import styles from '../components/Vouchers.module.css'
import { authService } from '../services/authService'
import { voucherService } from '../services/voucherService'

const FILTERS = [
  { value: 'all', label: 'Semua Voucher' },
  { value: 'global', label: 'Voucher Umum' },
  { value: 'hotel', label: 'Khusus Hotel' },
  { value: 'room_type', label: 'Khusus Tipe Kamar' },
]

const formatRupiah = (value) => `Rp${Number(value).toLocaleString('id-ID')}`

const formatBenefit = (voucher) => {
  if (voucher.benefitType === 'fixed') return `${formatRupiah(voucher.benefit)}`
  return `${voucher.benefit}%`
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatMembershipTier = (tier) => {
  if (!tier || tier === 'none') return 'Member'
  return `Member ${tier.charAt(0).toUpperCase() + tier.slice(1)}`
}

const normalizeTier = (tierValue) => (tierValue || '').toString().trim().toLowerCase()

export default function VouchersPage() {
  const router = useRouter()
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const authenticated = hydrated && authService.isAuthenticated()
  const user = hydrated ? authService.getUser() : null
  const isMember = user?.membership_status === 'active' || user?.level_name || user?.is_member === true
  const [activeFilter, setActiveFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [vouchers, setVouchers] = useState([])
  const [claimedVoucherIds, setClaimedVoucherIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [claimingId, setClaimingId] = useState(null)
  const [claimError, setClaimError] = useState(null)
  const [claimSuccess, setClaimSuccess] = useState(null)
  const [showMyVouchers, setShowMyVouchers] = useState(false)
  const [myClaims, setMyClaims] = useState([])

  useEffect(() => {
    if (!hydrated) return
    if (!authService.isAuthenticated()) {
      router.push('/login')
      return
    }

    const fetchVouchers = async () => {
      try {
        setLoading(true)
        setError(null)
        const [data, claims] = await Promise.all([
          voucherService.getVouchers({ status: 'active' }),
          voucherService.getMyClaims(),
        ])
        setVouchers(data)
        setMyClaims(claims)
        setClaimedVoucherIds(
          claims
            .map((claim) => Number(claim?.voucher?.id || claim?.voucher_id || claim?.id))
            .filter((id) => Number.isFinite(id) && id > 0)
        )
      } catch (err) {
        console.error('Failed to fetch vouchers:', err)
        setError('Gagal memuat voucher. Silakan coba lagi.')
      } finally {
        setLoading(false)
      }
    }

    fetchVouchers()
  }, [hydrated, router])

  const handleClaimVoucher = async (voucherId, voucherCode) => {
    // Clear previous messages
    setClaimError(null)
    setClaimSuccess(null)

    // Show confirmation
    const confirmed = window.confirm(
      `Yakin ingin claim voucher ${voucherCode}? Voucher yang sudah diklaim tidak bisa dibatalkan.`
    )
    if (!confirmed) return

    try {
      setClaimingId(voucherId)
      const response = await voucherService.claimVoucher(voucherId)
      
      // Update claimed list
      setClaimedVoucherIds((current) => 
        current.includes(voucherId) ? current : [...current, voucherId]
      )
      
      // Extract claim code from response (handle nested data structure)
      const claimCode = response?.data?.claim_code || response?.claim_code || 'N/A'
      
      // Show success message with claim code
      setClaimSuccess(`✓ Voucher ${voucherCode} berhasil diklaim! Kode: ${claimCode}`)

      // Refresh claims so modal always shows latest claimed vouchers from DB
      const claims = await voucherService.getMyClaims()
      setMyClaims(claims)
      setClaimedVoucherIds(
        claims
          .map((claim) => Number(claim?.voucher?.id || claim?.voucher_id || claim?.id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
      
      // Auto-clear success after 4 seconds
      setTimeout(() => setClaimSuccess(null), 4000)
    } catch (err) {
      console.error('Claim voucher error:', err)
      
      // Parse error message from backend or network error
      let errorMsg = 'Gagal claim voucher. Silakan coba lagi.'
      
      if (err?.response?.data?.message) {
        errorMsg = err.response.data.message
      } else if (err?.message) {
        errorMsg = err.message
      }
      
      // Check for specific membership error
      if (errorMsg.toLowerCase().includes('membership')) {
        errorMsg = `❌ ${errorMsg} Silakan aktifkan membership untuk claim voucher ini.`
      } else if (errorMsg.toLowerCase().includes('expired')) {
        errorMsg = `⏰ Voucher sudah kadaluarsa.`
      } else if (errorMsg.toLowerCase().includes('already claimed')) {
        errorMsg = `✓ Voucher sudah pernah diklaim oleh Anda.`
      } else if (errorMsg.toLowerCase().includes('exhausted')) {
        errorMsg = `📊 Kuota voucher telah habis.`
      }
      
      setClaimError(errorMsg)
      
      // Auto-clear error after 5 seconds
      setTimeout(() => setClaimError(null), 5000)
    } finally {
      setClaimingId(null)
    }
  }

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const matchesFilter = activeFilter === 'all' || voucher.scope === activeFilter
      const cleanQuery = query.trim().toLowerCase()
      const matchesQuery =
        !cleanQuery ||
        voucher.code.toLowerCase().includes(cleanQuery) ||
        voucher.title.toLowerCase().includes(cleanQuery) ||
        voucher.description.toLowerCase().includes(cleanQuery)

      return matchesFilter && matchesQuery
    })
  }, [activeFilter, query, vouchers])

  const totalVouchers = vouchers.length
  const hotelVouchers = vouchers.filter((voucher) => voucher.scope === 'hotel').length
  const availableVouchers = vouchers.filter((voucher) => voucher.quota <= 0 || voucher.used < voucher.quota).length

  if (!hydrated) return null

  return (
    <>
      <Navbar />

      <main className={styles.voucherPage}>
        <section className={styles.voucherHero}>
          <div className={styles.voucherHeroInner}>
            <p className={styles.voucherEyebrow}>PROGRAM VOUCHER</p>
            <h1 className={styles.voucherTitle}>Diskon terbaik untuk perjalanan berikutnya.</h1>
            <p className={styles.voucherSubtitle}>
              Gunakan voucher aktif untuk menghemat biaya menginap. Voucher membership memberikan benefit eksklusif untuk pengalaman premium.
            </p>

            <div className={styles.voucherHeroStats}>
              <article className={styles.heroStatCard}>
                <span className={styles.heroStatLabel}>Total Voucher</span>
                <strong className={styles.heroStatValue}>{totalVouchers}</strong>
              </article>
              <article className={styles.heroStatCard}>
                <span className={styles.heroStatLabel}>Voucher Hotel</span>
                <strong className={styles.heroStatValue}>{hotelVouchers}</strong>
              </article>
              <article className={styles.heroStatCard}>
                <span className={styles.heroStatLabel}>Voucher Aktif</span>
                <strong className={styles.heroStatValue}>{availableVouchers}</strong>
              </article>
              <article className={styles.heroStatCard}>
                <span className={styles.heroStatLabel}>Status Membership</span>
                <strong className={styles.heroStatValue}>{isMember ? 'Aktif' : 'Belum Aktif'}</strong>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.voucherContent}>
          <aside className={styles.voucherSidebar}>
            <div className={styles.voucherSideCard}>
              <p className={styles.voucherSideTitle}>Akses Cepat</p>
              <div className={styles.voucherSideActions}>
                <Link href="/bookings" className={styles.sideButtonPrimary}>Riwayat Booking</Link>
                <Link href="/hotels" className={styles.sideButtonSecondary}>Cari Hotel</Link>
              </div>
            </div>

            <div className={styles.voucherSideCard}>
              <p className={styles.voucherSideTitle}>Voucher Khusus</p>
              <p className={styles.voucherSideText}>
                {isMember
                  ? 'Anda bisa memakai semua voucher khusus yang tersedia sekarang.'
                  : 'Aktifkan membership untuk membuka voucher eksklusif dan benefit tambahan.'}
              </p>
              {!isMember && (
                <Link href="/" className={styles.sideButtonPrimary}>Aktifkan Membership</Link>
              )}
            </div>
          </aside>

          <section className={styles.voucherMain}>
            <div className={styles.voucherToolbar}>
              <div className={styles.voucherTabs}>
                {FILTERS.map((filter) => {
                  const count = filter.value === 'all'
                    ? vouchers.length
                    : vouchers.filter((voucher) => voucher.scope === filter.value).length

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      className={`${styles.voucherTab} ${activeFilter === filter.value ? styles.voucherTabActive : ''}`}
                      onClick={() => setActiveFilter(filter.value)}
                    >
                      {filter.label}
                      <span className={styles.voucherTabCount}>{count}</span>
                    </button>
                  )
                })}
              </div>

              <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                <button
                  type="button"
                  className={styles.voucherTab}
                  onClick={() => setShowMyVouchers(true)}
                  style={{padding: '6px 12px', border: '1px solid #e6e6e6', borderRadius: 20}}
                >
                  Voucher Saya
                </button>
              </div>

              <label className={styles.voucherSearch}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari kode voucher atau benefit..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>

            {claimSuccess && (
              <div style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                color: '#155724',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✓</span>
                <span>{claimSuccess}</span>
              </div>
            )}

            {claimError && (
              <div style={{
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                color: '#721c24',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠</span>
                <span>{claimError}</span>
              </div>
            )}

            {loading ? (
              <div className={styles.voucherEmpty}>
                <h2>Memuat voucher...</h2>
                <p>Tunggu sebentar saat kami mengambil data voucher terbaru.</p>
              </div>
            ) : error ? (
              <div className={styles.voucherEmpty}>
                <h2>Terjadi kesalahan</h2>
                <p>{error}</p>
              </div>
            ) : filteredVouchers.length > 0 ? (
              <div className={styles.voucherGrid}>
                {filteredVouchers.map((voucher) => {
                  const exhausted = voucher.quota > 0 && voucher.used >= voucher.quota
                  const claimed = claimedVoucherIds.includes(Number(voucher.id))
                  const scopeLabel = {
                    global: 'Umum',
                    hotel: `Hotel #${voucher.hotelId}`,
                    room_type: `Kamar ${voucher.roomType}`,
                  }[voucher.scope] || voucher.scope

                  const membershipLabel = formatMembershipTier(voucher.membershipTier)
                  const userMembershipTier = normalizeTier(user?.membership_tier || user?.level_name || 'none')
                  const userMembershipActive = normalizeTier(user?.membership_status) === 'active'
                  const voucherMembershipTier = normalizeTier(voucher.membershipTier)
                  const isMembershipVoucher = voucher.requiresMembership && voucher.membershipTier !== 'none'
                  const canClaimVoucher = !isMembershipVoucher || (userMembershipActive && userMembershipTier === voucherMembershipTier)

                  const buttonDisabledReason = claimed
                    ? 'Sudah Diklaim'
                    : exhausted
                    ? 'Kuota Habis'
                    : (isMembershipVoucher && !canClaimVoucher)
                    ? membershipLabel
                    : null

                  const buttonLabel = claimed
                    ? 'Sudah Diklaim'
                    : exhausted
                    ? 'Kuota Habis'
                    : isMembershipVoucher && !canClaimVoucher
                    ? membershipLabel
                    : 'Klaim Voucher'

                  return (
                    <article key={voucher.id} className={`${styles.voucherCard}`}>
                      <div className={styles.voucherCardHead}>
                        <p className={styles.voucherCode}>{voucher.code}</p>
                        <span className={`${styles.voucherBadge} ${styles.voucherBadgeGeneral}`}>
                          {scopeLabel}
                        </span>
                      </div>

                      <h2 className={styles.voucherName}>{voucher.title}</h2>
                      <p className={styles.voucherDesc}>{voucher.description}</p>

                      <div className={styles.voucherMeta}>
                        <div>
                          <span>Benefit</span>
                          <strong>{formatBenefit(voucher)}</strong>
                        </div>
                        <div>
                          <span>Min. transaksi</span>
                          <strong>{formatRupiah(voucher.minSpend)}</strong>
                        </div>
                        <div>
                          <span>Berlaku hingga</span>
                          <strong>{formatDate(voucher.expiresAt)}</strong>
                        </div>
                      </div>

                      <div className={styles.voucherCardFoot}>
                        <p className={styles.voucherQuota}>Terpakai {voucher.used}/{voucher.quota}</p>
                        {buttonDisabledReason ? (
                          <button className={styles.claimButtonDisabled} disabled>{buttonLabel}</button>
                        ) : (
                          <button
                            className={styles.claimButton}
                            onClick={() => handleClaimVoucher(voucher.id, voucher.code)}
                            disabled={claimingId === voucher.id}
                          >
                            {claimingId === voucher.id ? 'Memproses...' : buttonLabel}
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className={styles.voucherEmpty}>
                <h2>Voucher tidak ditemukan.</h2>
                <p>Coba ubah filter atau kata kunci pencarian Anda.</p>
              </div>
            )}
            {showMyVouchers && (
              <VoucherModal
                onClose={() => setShowMyVouchers(false)}
                vouchers={myClaims}
              />
            )}
          </section>
        </section>
      </main>

      <Footer />
    </>
  )
}
