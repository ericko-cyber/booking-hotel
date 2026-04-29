import { useState } from 'react'
import styles from '../Modal.module.css'
import vStyles from '../VoucherModal.module.css'

const VOUCHERS = [
  {
    id: 'SL-2024-SUMMER',
    code: 'SL-SUMMER24',
    title: 'Voucher Liburan Musim Panas',
    value: 500,
    expiry: '31 Aug 2025',
    type: 'retreat',
    color: 'var(--teal)',
    used: false,
  },
  {
    id: 'SL-2024-WELCOME',
    code: 'SL-WELCOME',
    title: 'Voucher Selamat Datang Anggota',
    value: 250,
    expiry: '31 Dec 2025',
    type: 'general',
    color: 'var(--gold)',
    used: false,
  },
  {
    id: 'SL-2024-UPGRADE',
    code: 'SL-UPGRADE',
    title: 'Voucher Upgrade Kamar',
    value: 0,
    expiry: '28 Feb 2025',
    type: 'upgrade',
    color: '#7a5c2a',
    used: true,
  },
]

export default function VoucherModal({ onClose }) {
  const [tab, setTab] = useState('my')
  const [redeemCode, setRedeemCode] = useState('')
  const [redeemMsg, setRedeemMsg] = useState(null)
  const [copied, setCopied] = useState(null)

  const handleRedeem = () => {
    if (!redeemCode.trim()) return
    if (redeemCode.toUpperCase().startsWith('SL-')) {
      setRedeemMsg({ type: 'success', text: `Voucher "${redeemCode.toUpperCase()}" berhasil ditukarkan!` })
    } else {
      setRedeemMsg({ type: 'error', text: 'Kode voucher tidak valid. Cek kembali lalu coba lagi.' })
    }
  }

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${vStyles.voucherModal}`}>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <p className={styles.modalEyebrow}>Sanctuary Club</p>
        <h2 className={styles.modalTitle}>Voucher & Kredit</h2>

        <div className={vStyles.tabs}>
          <button
            className={`${vStyles.tab} ${tab === 'my' ? vStyles.tabActive : ''}`}
            onClick={() => setTab('my')}
          >
            Voucher Saya
          </button>
          <button
            className={`${vStyles.tab} ${tab === 'redeem' ? vStyles.tabActive : ''}`}
            onClick={() => setTab('redeem')}
          >
            Tukar Kode
          </button>
        </div>

        {tab === 'my' && (
          <div className={vStyles.voucherList}>
            <div className={vStyles.totalBar}>
              <span>Saldo Tersedia</span>
              <strong>Rp750</strong>
            </div>
            {VOUCHERS.map((v) => (
              <div
                key={v.id}
                className={`${vStyles.voucherCard} ${v.used ? vStyles.voucherUsed : ''}`}
              >
                <div className={vStyles.voucherLeft} style={{ background: v.color }}>
                  {v.value > 0 ? (
                    <>
                      <span className={vStyles.vValue}>Rp{v.value.toLocaleString('id-ID')}</span>
                      <span className={vStyles.vLabel}>kredit</span>
                    </>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
                <div className={vStyles.voucherInfo}>
                  <h4>{v.title}</h4>
                  <p>Kode: <code>{v.code}</code></p>
                  <p className={vStyles.vExpiry}>Berlaku sampai {v.expiry}</p>
                  {v.used && <span className={vStyles.usedBadge}>Terpakai</span>}
                </div>
                <div className={vStyles.voucherActions}>
                  {!v.used && (
                    <button
                      className={vStyles.copyBtn}
                      onClick={() => handleCopy(v.code)}
                    >
                      {copied === v.code ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                      {copied === v.code ? 'Tersalin!' : 'Salin'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'redeem' && (
          <div className={vStyles.redeemSection}>
            <p className={vStyles.redeemDesc}>
              Punya kode voucher? Masukkan di bawah untuk menambahkan kredit ke akun Sanctuary Club Anda.
            </p>
            <div className={vStyles.redeemInput}>
              <input
                type="text"
                placeholder="contoh: SL-SUMMER24"
                value={redeemCode}
                onChange={(e) => {
                  setRedeemCode(e.target.value)
                  setRedeemMsg(null)
                }}
              />
              <button onClick={handleRedeem}>Tukar</button>
            </div>
            {redeemMsg && (
              <div className={`${vStyles.redeemMsg} ${redeemMsg.type === 'success' ? vStyles.msgSuccess : vStyles.msgError}`}>
                {redeemMsg.type === 'success' ? '✓' : '✕'} {redeemMsg.text}
              </div>
            )}
            <div className={vStyles.redeemNote}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Kode tidak membedakan huruf besar/kecil dan hanya bisa dipakai sekali. Masa berlaku kredit mengikuti tiap voucher.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
