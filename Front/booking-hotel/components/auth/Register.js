import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import styles from '../Auth.module.css'
import { authService } from '../../services/authService'

const ACCOUNT_TYPES = [
  {
    id: 'traveler',
    label: 'Saya Tamu',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
      </svg>
    ),
  },
  {
    id: 'owner',
    label: 'Saya Pemilik Hotel',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
]

export default function Register() {
  const router = useRouter()
  const [accountType, setAccountType] = useState('traveler')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    // Redirect if already logged in
    if (authService.isAuthenticated()) {
      router.push('/')
    }
  }, [router])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama lengkap wajib diisi'
    if (!form.email.includes('@')) e.email = 'Masukkan email yang valid'
    if (form.password.length < 8) e.password = 'Minimal 8 karakter'
    if (form.password !== form.confirm) e.confirm = 'Konfirmasi kata sandi tidak sama'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    setApiError('')
    if (validate()) {
      setLoading(true)
      try {
        const result = await authService.register(
          form.name,
          form.email,
          form.password,
          accountType
        )
        if (result.success) {
          setDone(true)
        }
      } catch (error) {
        setLoading(false)
        setApiError(error?.message || 'Registrasi gagal. Silakan coba lagi.')
      }
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <a href="/" className={styles.topClose} aria-label="Tutup">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </a>
        <a href="/" className={styles.topBrand}>The Sanctuary</a>
        <a href="#" className={styles.topSupport}>Bantuan</a>
      </header>

      <div className={styles.body}>
        <div className={styles.imgPanel}>
          <div className={styles.imgBg} />
          <div className={styles.imgOverlay} />
          <div className={styles.imgCaption}>
            <p className={styles.imgEyebrow}>Konsier Digital</p>
            <h2 className={styles.imgTitle}>Pilihan Hotel Terbaik,<br />Disesuaikan untuk Anda.</h2>
            <p className={styles.imgDesc}>
              Bergabunglah dengan komunitas eksklusif tamu dan pemilik hotel yang mengutamakan layanan terbaik. Setiap menginap adalah cerita istimewa.
            </p>
          </div>
        </div>

        <div className={styles.formPanel}>
          {done ? (
            <div className={styles.successState}>
              <div className={styles.successCheck}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className={styles.successTitle}>Akun Berhasil Dibuat</h2>
              <p className={styles.successDesc}>
                Selamat datang di The Sanctuary. Perjalanan Anda dimulai sekarang.
              </p>
              <a href="/login" className={styles.successBtn}>Masuk →</a>
            </div>
          ) : (
            <>
              <p className={styles.formEyebrow}>Registrasi Anggota</p>
              <h1 className={styles.formTitle}>Mulai Perjalanan Anda</h1>
              <p className={styles.formSub}>
                Sudah punya akun?{' '}
                <a href="/login" className={styles.signInLink}>Masuk</a>
              </p>

              <div className={styles.section}>
                <label className={styles.sectionLabel}>Jenis Akun</label>
                <div className={styles.typeList}>
                  {ACCOUNT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      className={`${styles.typeCard} ${accountType === t.id ? styles.typeCardActive : ''}`}
                      onClick={() => setAccountType(t.id)}
                      type="button"
                    >
                      <span className={`${styles.typeIcon} ${accountType === t.id ? styles.typeIconActive : ''}`}>
                        {t.icon}
                      </span>
                      <span className={styles.typeLabel}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <label className={styles.sectionLabel}>Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={form.name}
                  onChange={set('name')}
                  className={`${styles.input} ${errors.name ? styles.inputErr : ''}`}
                />
                {errors.name && <span className={styles.errMsg}>{errors.name}</span>}
              </div>

              <div className={styles.section}>
                <label className={styles.sectionLabel}>Alamat Email</label>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={set('email')}
                  className={`${styles.input} ${errors.email ? styles.inputErr : ''}`}
                />
                {errors.email && <span className={styles.errMsg}>{errors.email}</span>}
              </div>

              {apiError && <div className={styles.errMsg} style={{ marginBottom: '16px' }}>{apiError}</div>}

              <div className={styles.passwordRow}>
                <div className={styles.section} style={{ flex: 1 }}>
                  <label className={styles.sectionLabel}>Kata Sandi</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set('password')}
                    className={`${styles.input} ${errors.password ? styles.inputErr : ''}`}
                  />
                  {errors.password && <span className={styles.errMsg}>{errors.password}</span>}
                </div>
                <div className={styles.section} style={{ flex: 1 }}>
                  <label className={styles.sectionLabel}>Konfirmasi Kata Sandi</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={set('confirm')}
                    className={`${styles.input} ${errors.confirm ? styles.inputErr : ''}`}
                  />
                  {errors.confirm && <span className={styles.errMsg}>{errors.confirm}</span>}
                </div>
              </div>

              <button 
                className={`${styles.submitBtn} ${loading ? styles.submitLoading : ''}`}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <span className={styles.spinner} />
                ) : (
                  'Buat Akun →'
                )}
              </button>

              <p className={styles.legal}>
                Dengan menekan "Buat Akun", Anda menyetujui{' '}
                <a href="#">Syarat Layanan</a> dan <a href="#">Kebijakan Privasi</a> kami.
                Data Anda diproses menggunakan standar enkripsi tinggi.
              </p>
            </>
          )}
        </div>
      </div>

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>The Sanctuary</span>
        <div className={styles.footerLinks}>
          <a href="#">Kebijakan Privasi</a>
          <a href="#">Syarat Layanan</a>
          <a href="#">Pusat Mitra</a>
        </div>
        <span className={styles.footerCopy}>© 2024 THE SANCTUARY. SELURUH HAK CIPTA DILINDUNGI.</span>
      </footer>
    </div>
  )
}
