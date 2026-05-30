import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import styles from '../Modal.module.css'
import { authService } from '../../services/authService'
import api from '../../lib/api'

const PLANS = [
  {
    id: 'essential',
    name: 'Silver',
    price: 299000,
    period: '/tahun',
    desc: 'Mulai hemat di setiap pemesanan dengan diskon member dan voucher tahunan eksklusif.',
    membershipTier: 'silver',
    voucherPercent: 5, // percent discount voucher
    voucherFixed: 50000,  // fixed Rp voucher per year
    features: [],
  },
  {
    id: 'signature',
    name: 'Gold',
    price: 699000,
    period: '/tahun',
    popular: true,
    desc: 'Pilihan favorit untuk menikmati potongan harga lebih besar dan voucher tahunan bernilai lebih.',
    membershipTier: 'gold',
    voucherPercent: 10,
    voucherFixed: 100000,
    features: [],
  },
  {
    id: 'luminary',
    name: 'Platinum',
    price: 1499000,
    period: '/tahun',
    desc: 'Maksimalkan penghematan dengan diskon tertinggi dan voucher tahunan terbesar.',
    membershipTier: 'platinum',
    voucherPercent: 15,
    voucherFixed: 200000,
    features: [],
  },
]

export default function MembershipModal({ onClose }) {
  const router = useRouter()
  const [selected, setSelected] = useState('signature')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentTier, setCurrentTier] = useState('none')

  const tierRank = {
    none: 0,
    silver: 1,
    gold: 2,
    platinum: 3,
  }

  useEffect(() => {
    if (!authService.isAuthenticated()) return

    const user = authService.getUser()
    if (!user) return

    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    })
  }, [])

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setCurrentTier('none')
      return
    }

    let active = true

    const syncMembership = async () => {
      try {
        const response = await authService.getCurrentUser()
        const payload = response?.data?.data || response?.data || response
        const user = payload?.user || payload || null
        const tier = String(user?.membership_tier || 'none').toLowerCase()

        if (!active) return

        setCurrentTier(tier)
        if (tier !== 'none' && PLANS.some(plan => plan.membershipTier === tier)) {
          setSelected(PLANS.find(plan => plan.membershipTier === tier)?.id || 'signature')
        }
        if (user && typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user))
        }
      } catch (error) {
        if (!active) return
        console.error('Failed to load membership tier', error)
        const cachedUser = authService.getUser()
        setCurrentTier(String(cachedUser?.membership_tier || 'none').toLowerCase())
      }
    }

    syncMembership()

    return () => {
      active = false
    }
  }, [])

  const selectedPlan = PLANS.find(plan => plan.id === selected)
  const selectedPlanTier = selectedPlan?.membershipTier || 'none'
  const selectedPlanIsOwned = tierRank[currentTier] > 0 && tierRank[currentTier] >= tierRank[selectedPlanTier]
  const selectedPlanIsUpgrade = tierRank[selectedPlanTier] > tierRank[currentTier]
  const selectedPlanActionLabel = selectedPlanIsOwned
    ? 'Sudah Dimiliki'
    : selectedPlanIsUpgrade
      ? `Upgrade ke ${selectedPlan?.name}`
      : `Pilih ${selectedPlan?.name}`

  const handleContinue = () => {
    if (!authService.isAuthenticated()) {
      onClose?.()
      router.push(`/login?next=${encodeURIComponent(router.asPath || '/')}`)
      return
    }

    setStep(2)
  }

  const handleSubmit = async () => {
    if (!selectedPlan || submitting) return

    if (!authService.isAuthenticated()) {
      onClose?.()
      router.push(`/login?next=${encodeURIComponent(router.asPath || '/')}`)
      return
    }

    try {
      setSubmitting(true)
      // create a pending payment for this membership purchase
      const res = await api.post('/payments/create-membership', {
        membership_tier: selectedPlan.membershipTier,
      })

      const data = res?.data?.data || res?.data || {}
      const checkoutUrl =
        data.checkout_url ||
        data.checkoutUrl ||
        data.redirect_url ||
        data.redirectUrl ||
        (data.payment?.checkout_url || '')
      const paymentPath = data.payment_path || (data.paymentPath || '')
      const paymentId = data.payment_id || data.paymentId

      // redirect user straight to Midtrans checkout when available
      if (checkoutUrl) {
        onClose?.()
        window.location.assign(checkoutUrl)
        return
      }

      // fallback to internal payment page when checkout URL is unavailable
      if (paymentPath) {
        onClose?.()
        router.push(paymentPath)
        return
      }

      if (paymentId) {
        onClose?.()
        router.push(`/payment/${paymentId}`)
        return
      }

      // fallback: show success
      setDone(true)
    } catch (error) {
      console.error('Failed to create payment', error)
      alert(error?.message || 'Gagal membuat pembayaran')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {done ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className={styles.successTitle}>Selamat Datang di Club</h2>
            <p className={styles.successDesc}>
              Pengajuan keanggotaan {PLANS.find(p => p.id === selected)?.name} Anda telah kami terima.
              Kami akan menghubungi Anda dalam 24 jam.
            </p>
            <button className={styles.doneBtn} onClick={onClose}>Tutup</button>
          </div>
        ) : (
          <>
            <p className={styles.modalEyebrow}>Member Booking Hotel</p>
            <h2 className={styles.modalTitle}>Pilih Paket Keanggotaan</h2>

            {step === 1 && (
              <>
                <div className={styles.plans}>
                  {PLANS.map((plan) => {
                    const planTier = plan.membershipTier || 'none'
                    const isOwned = tierRank[currentTier] > 0 && tierRank[currentTier] >= tierRank[planTier]
                    const isUpgrade = tierRank[planTier] > tierRank[currentTier]

                    return (
                    <div
                      key={plan.id}
                      className={`${styles.planCard} ${selected === plan.id ? styles.planSelected : ''} ${plan.popular ? styles.planPopular : ''} ${isOwned ? styles.planOwned : ''}`}
                      onClick={() => setSelected(plan.id)}
                    >
                      {plan.popular && <span className={styles.popularBadge}>Paling Populer</span>}
                      <span className={isOwned ? styles.ownedBadge : styles.upgradeBadge}>
                        {isOwned ? 'Owned' : isUpgrade ? 'Upgrade' : 'Pilih'}
                      </span>
                      <h3 className={styles.planName}>{plan.name}</h3>
                      <div className={styles.planPrice}>
                        <span className={styles.planCurrency}>Rp</span>
                        <strong>{plan.price.toLocaleString('id-ID')}</strong>
                        <span className={styles.planPeriod}>{plan.period}</span>
                      </div>
                      <p className={styles.planDesc}>{plan.desc}</p>
                      <div className={styles.planVoucher}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        <strong>
                          {plan.voucherPercent}%
                        </strong>
                        {' '}voucher persen • Rp{plan.voucherFixed.toLocaleString('id-ID')} voucher fixed per tahun
                      </div>
                      <ul className={styles.planFeatures}>
                        {plan.features.map(f => (
                          <li key={f}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d3d4a" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    )
                  })}
                </div>
                <button className={styles.nextBtn} onClick={handleContinue} disabled={selectedPlanIsOwned}>
                  {selectedPlanActionLabel} →
                </button>
              </>
            )}

            {step === 2 && (
              <div className={styles.formSection}>
                <p className={styles.formNote}>
                  Dipilih: <strong>{selectedPlan?.name}</strong> — Rp{selectedPlan?.price.toLocaleString('id-ID')}/tahun
                  <button className={styles.changeBtn} onClick={() => setStep(1)}>Ubah</button>
                </p>
                <div className={styles.formGroup}>
                  <label>Nama Lengkap</label>
                  <input
                    type="text"
                    placeholder="Nama lengkap Anda"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Alamat Email</label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Nomor Telepon</label>
                  <input
                    type="tel"
                    placeholder="+44 123 456 7890"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className={styles.formActions}>
                  <button className={styles.backBtn} onClick={() => setStep(1)}>← Kembali</button>
                  <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={submitting || !selectedPlan}
                  >
                    {submitting ? 'Memproses...' : 'Ajukan Keanggotaan'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
