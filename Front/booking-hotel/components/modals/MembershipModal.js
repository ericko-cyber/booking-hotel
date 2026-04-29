import { useState } from 'react'
import styles from '../Modal.module.css'

const PLANS = [
  {
    id: 'essential',
    name: 'Esensial',
    price: 299,
    period: '/tahun',
    desc: 'Cocok untuk tamu premium yang sesekali berlibur.',
    vouchers: 'Rp500',
    features: ['Akses pemesanan prioritas', 'Rp500 voucher diskon hotel', 'Dukungan chat khusus', 'Info promo mingguan'],
  },
  {
    id: 'signature',
    name: 'Signature',
    price: 699,
    period: '/tahun',
    popular: true,
    desc: 'Paket paling populer untuk tamu yang sering bepergian.',
    vouchers: 'Rp1.000',
    features: ['Semua fitur Esensial', 'Rp1.000 voucher diskon hotel', 'Prioritas layanan pelanggan', 'Akses awal ke properti baru', 'Peluang upgrade kamar gratis'],
  },
  {
    id: 'luminary',
    name: 'Luminary',
    price: 1499,
    period: '/tahun',
    desc: 'Akses premium tanpa kompromi untuk anggota pilihan.',
    vouchers: 'Rp1.500',
    features: ['Semua fitur Signature', 'Rp1.500 voucher diskon hotel', 'Dukungan prioritas 24/7', 'Event eksklusif anggota', 'Paket liburan tahunan', 'Benefit partner perjalanan'],
  },
]

export default function MembershipModal({ onClose }) {
  const [selected, setSelected] = useState('signature')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [done, setDone] = useState(false)

  const handleSubmit = () => {
    setDone(true)
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
                  {PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className={`${styles.planCard} ${selected === plan.id ? styles.planSelected : ''} ${plan.popular ? styles.planPopular : ''}`}
                      onClick={() => setSelected(plan.id)}
                    >
                      {plan.popular && <span className={styles.popularBadge}>Paling Populer</span>}
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
                        {plan.vouchers} voucher per tahun
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
                  ))}
                </div>
                <button className={styles.nextBtn} onClick={() => setStep(2)}>
                  Lanjut dengan {PLANS.find(p => p.id === selected)?.name} →
                </button>
              </>
            )}

            {step === 2 && (
              <div className={styles.formSection}>
                <p className={styles.formNote}>
                  Dipilih: <strong>{PLANS.find(p => p.id === selected)?.name}</strong> — Rp{PLANS.find(p => p.id === selected)?.price.toLocaleString('id-ID')}/tahun
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
                    disabled={!form.name || !form.email}
                  >
                    Ajukan Keanggotaan
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
