import { useState } from 'react'
import styles from '../Modal.module.css'
import vStyles from '../VoucherModal.module.css'

export default function VoucherModal({ onClose, vouchers = null }) {
  const [copied, setCopied] = useState(null)

  const formatDate = (d) => {
    if (!d) return '-'
    try {
      const dt = new Date(d)
      return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch (e) {
      return d
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
        <h2 className={styles.modalTitle}>Voucher Saya</h2>

        <div className={vStyles.voucherList}>
          <div className={vStyles.totalBar}>
            <span>Voucher Saya</span>
            <strong>{Array.isArray(vouchers) ? vouchers.length : '...'}</strong>
          </div>

          {vouchers === null ? (
            <div className={vStyles.emptyState}>Memuat voucher...</div>
          ) : vouchers.length === 0 ? (
            <div className={vStyles.emptyState}>Anda belum claim voucher apa pun.</div>
          ) : (
            vouchers.map((vv) => {
              // if API returned a claim object with nested voucher, prefer that
              const src = vv.voucher || vv
              // normalize display fields
              const code = src.code || src.Code || src.code_value || vv.code || ''
              const title = src.title || src.description || src.Title || code
              const expiry = src.expiresAt || src.expiry || src.ExpiryDate || src.expiry_date || vv.claimed_at || ''
              const used = vv.status === 'used' || vv.status === 'redeemed' || src.used || false
              const value = src.value || src.benefit || 0
              const color = src.color || 'var(--teal)'

              return (
                <div
                  key={vv.id || vv.code}
                  className={`${vStyles.voucherCard} ${used ? vStyles.voucherUsed : ''}`}
                >
                  <div className={vStyles.voucherLeft} style={{ background: color }}>
                    {typeof value === 'number' && value > 0 ? (
                      <>
                        <span className={vStyles.vValue}>{typeof value === 'number' ? `Rp${Number(value).toLocaleString('id-ID')}` : value}</span>
                        <span className={vStyles.vLabel}>kredit</span>
                      </>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                  <div className={vStyles.voucherInfo}>
                    <h4>{title}</h4>
                    <p>Kode: <code>{code}</code></p>
                    <p className={vStyles.vExpiry}>Berlaku sampai {formatDate(expiry)}</p>
                    {vv.claim_code && (
                      <p className={vStyles.vClaim}>Kode Klaim: <strong>{vv.claim_code}</strong></p>
                    )}
                    {vv.claimed_at && (
                      <p className={vStyles.vClaimDate}>Diklaim pada {formatDate(vv.claimed_at)}</p>
                    )}
                  </div>
                  <div className={vStyles.voucherActions}>
                    {code && (
                      <button
                        className={vStyles.copyBtn}
                        onClick={() => handleCopy(code)}
                      >
                        {copied === code ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                        {copied === code ? 'Tersalin!' : 'Salin'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
