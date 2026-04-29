import styles from '../OwnerUI.module.css'

/* ── Stat Card ── */
export function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div className={`${styles.stat} ${accent ? styles.statAccent : ''}`}>
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{label}</span>
        {icon && (
          <span className={styles.statIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d={icon} />
            </svg>
          </span>
        )}
      </div>
      <p className={styles.statValue}>{value}</p>
      {sub && <p className={styles.statSub}>{sub}</p>}
    </div>
  )
}

/* ── Page Header ── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSub}>{subtitle}</p>}
      </div>
      {action && <div className={styles.pageAction}>{action}</div>}
    </div>
  )
}

/* ── Status Badge ── */
const STATUS_MAP = {
  approved: { label: 'Approved', cls: 'statusGreen' },
  pending:  { label: 'Pending',  cls: 'statusAmber' },
  rejected: { label: 'Rejected', cls: 'statusRed'   },
  paid:      { label: 'Paid',     cls: 'statusGreen' },
  cancelled: { label: 'Cancelled',cls: 'statusRed'   },
  active:    { label: 'Active',   cls: 'statusGreen' },
  expired:   { label: 'Expired',  cls: 'statusGray'  },
}

export function StatusBadge({ status }) {
  const meta = STATUS_MAP[status] || { label: status, cls: 'statusGray' }
  return <span className={`${styles.badge} ${styles[meta.cls]}`}>{meta.label}</span>
}

/* ── Btn ── */
export function Btn({ children, variant = 'primary', onClick, small, danger, type = 'button', disabled }) {
  return (
    <button
      type={type}
      className={`${styles.btn}
        ${variant === 'ghost' ? styles.btnGhost : ''}
        ${variant === 'outline' ? styles.btnOutline : ''}
        ${danger ? styles.btnDanger : ''}
        ${small ? styles.btnSm : ''}
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

/* ── Section card ── */
export function Card({ children, className }) {
  return <div className={`${styles.card} ${className || ''}`}>{children}</div>
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null
  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalBox} style={{ maxWidth: width }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  )
}

/* ── Form field ── */
export function Field({ label, children, hint }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
      {hint && <p className={styles.fieldHint}>{hint}</p>}
    </div>
  )
}

export function Input({ ...props }) {
  return <input className={styles.input} {...props} />
}

export function Textarea({ ...props }) {
  return <textarea className={styles.textarea} rows={3} {...props} />
}

export function Select({ children, ...props }) {
  return <select className={styles.select} {...props}>{children}</select>
}

/* ── Table ── */
export function Table({ head, rows, onRowClick }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={onRowClick ? styles.trClickable : ''} onClick={() => onRowClick?.(i)}>
              {row.map((cell, j) => <td key={j}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Empty state ── */
export function Empty({ icon, title, desc, action }) {
  return (
    <div className={styles.empty}>
      {icon && (
        <div className={styles.emptyIcon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <path d={icon} />
          </svg>
        </div>
      )}
      <p className={styles.emptyTitle}>{title}</p>
      {desc && <p className={styles.emptyDesc}>{desc}</p>}
      {action}
    </div>
  )
}

/* ── Confirm dialog ── */
export function Confirm({ open, onClose, onConfirm, title, message }) {
  if (!open) return null
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox} style={{ maxWidth: 400 }}>
        <div className={styles.confirmContent}>
          <div className={styles.confirmIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3>{title}</h3>
          <p>{message}</p>
          <div className={styles.confirmBtns}>
            <Btn variant="outline" onClick={onClose}>Cancel</Btn>
            <Btn danger onClick={onConfirm}>Delete</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}