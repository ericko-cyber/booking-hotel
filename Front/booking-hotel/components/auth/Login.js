import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import styles from '../Auth.module.css'
import { authService } from '../../services/authService'

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    // Redirect if already logged in
    if (authService.isAuthenticated()) {
      router.push('/dashboard')
    }
  }, [router])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.email.includes('@')) e.email = 'Masukkan email yang valid'
    if (!form.password) e.password = 'Kata sandi wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    setApiError('')
    if (validate()) {
      setLoading(true)
      try {
        const result = await authService.login(form.email, form.password)
        if (result.success) {
          setDone(true)
          setTimeout(() => {
            router.push('/dashboard')
          }, 1200)
        }
      } catch (error) {
        setLoading(false)
        setApiError(error?.message || 'Login gagal. Silakan coba lagi.')
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
      </header>

      <div className={styles.body}>
        <div className={styles.imgPanel}>
          <div className={styles.imgBg} />
          <div className={styles.imgOverlay} />
          <div className={styles.imgCaption}>
            <p className={styles.imgEyebrow}>Konsier Digital</p>
            <h2 className={styles.imgTitle}>Selamat<br />Datang Kembali.</h2>
            <p className={styles.imgDesc}>
              Liburan premium berikutnya menanti. Masuk untuk mengakses pemesanan, voucher, dan benefit eksklusif anggota.
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
              <h2 className={styles.successTitle}>Berhasil Masuk</h2>
              <p className={styles.successDesc}>Selamat datang kembali di The Sanctuary.</p>
              <a href="/" className={styles.successBtn}>Ke Dasbor →</a>
            </div>
          ) : (
            <>
              <p className={styles.formEyebrow}>Akses Anggota</p>
              <h1 className={styles.formTitle}>Masuk</h1>
              <p className={styles.formSub}>
                Baru di The Sanctuary?{' '}
                <a href="/register" className={styles.signInLink}>Buat akun</a>
              </p>

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

              <div className={styles.section}>
                <div className={styles.labelRow}>
                  <label className={styles.sectionLabel}>Kata Sandi</label>
                  <a href="#" className={styles.forgotLink}>Lupa kata sandi?</a>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  className={`${styles.input} ${errors.password ? styles.inputErr : ''}`}
                />
                {errors.password && <span className={styles.errMsg}>{errors.password}</span>}
              </div>

              <label className={styles.checkRow}>
                <input type="checkbox" className={styles.checkbox} />
                <span className={styles.checkLabel}>Tetap masuk di perangkat ini</span>
              </label>

              <button
                className={`${styles.submitBtn} ${loading ? styles.submitLoading : ''}`}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <span className={styles.spinner} />
                ) : (
                  'Masuk →'
                )}
              </button>
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
