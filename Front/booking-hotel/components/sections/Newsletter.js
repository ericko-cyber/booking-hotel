import { useState } from 'react'
import styles from '../Newsletter.module.css'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
      setEmail('')
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <p className={styles.eyebrow}>Hotel Update Mingguan</p>
          <h2 className={styles.title}>Promo kamar hotel<br />langsung ke email Anda.</h2>
          <div className={styles.form}>
            {submitted ? (
              <p className={styles.success}>Berhasil berlangganan. Penawaran terbaru akan kami kirim.</p>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="Masukkan email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.emailInput}
                />
                <button className={styles.subscribeBtn} onClick={handleSubmit}>
                  Dapatkan Promo
                </button>
              </>
            )}
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.polaroid}>
            <div className={styles.cameraTag}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(13,61,74,0.8)" strokeWidth="1.4">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div className={styles.photo} />
          </div>
        </div>
      </div>
    </section>
  )
}
