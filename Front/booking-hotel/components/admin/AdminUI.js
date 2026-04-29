import styles from './AdminUI.module.css'

/* ── Stat Card ── */
export function StatCard({ label, value, sub, icon, trend, accent }) {
  return (
    <div className={`${styles.stat} ${accent ? styles.statAccent : ''}`}>
      <div className={styles.statTop}>
        <div className={styles.statIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d={icon}/>
          </svg>
        </div>
        {trend && (
          <span className={`${styles.trend} ${trend > 0 ? styles.trendUp : styles.trendDown}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
      {sub && <p className={styles.statSub}>{sub}</p>}
    </div>
  )
}

/* ── Page Header ── */
export function PageHeader({ title, subtitle, action, eyebrow }) {
  return (
    <div className={styles.pageHeader}>
      <div>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSub}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

/* ── Status Badge ── */
const BADGE_MAP = {
  approved: { label: 'Approved', cls: 'bgGreen'  },
  pending:  { label: 'Pending',  cls: 'bgAmber'  },
  rejected: { label: 'Rejected', cls: 'bgRed'    },
  paid:     { label: 'Paid',     cls: 'bgGreen'  },
  cancelled:{ label: 'Cancelled',cls: 'bgRed'    },
  active:   { label: 'Active',   cls: 'bgGreen'  },
  inactive: { label: 'Inactive', cls: 'bgGray'   },
  expired:  { label: 'Expired',  cls: 'bgGray'   },
  user:     { label: 'User',     cls: 'bgBlue'   },
  owner:    { label: 'Owner',    cls: 'bgPurple' },
  admin:    { label: 'Admin',    cls: 'bgGold'   },
  global:   { label: 'Global',   cls: 'bgBlue'   },
  hotel:    { label: 'Per Hotel',cls: 'bgPurple' },
}
export function Badge({ status }) {
  const m = BADGE_MAP[status] || { label: status, cls: 'bgGray' }
  return <span className={`${styles.badge} ${styles[m.cls]}`}>{m.label}</span>
}

/* ── Btn ── */
export function Btn({ children, variant = 'primary', onClick, small, danger, disabled, type = 'button' }) {
  return (
    <button type={type} disabled={disabled}
      className={`${styles.btn}
        ${variant === 'ghost' ? styles.ghost : ''}
        ${variant === 'outline' ? styles.outline : ''}
        ${variant === 'success' ? styles.success : ''}
        ${danger ? styles.danger : ''}
        ${small ? styles.sm : ''}
      `}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

/* ── Card ── */
export function Card({ children, className, noPad }) {
  return <div className={`${styles.card} ${noPad ? styles.cardNoPad : ''} ${className || ''}`}>{children}</div>
}

/* ── Section title inside card ── */
export function CardTitle({ children, action }) {
  return (
    <div className={styles.cardHead}>
      <p className={styles.cardTitle}>{children}</p>
      {action}
    </div>
  )
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalBox} style={{ maxWidth: width }}>
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  )
}

/* ── Confirm ── */
export function Confirm({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', confirmDanger = true }) {
  if (!open) return null
  return (
    <div className={styles.overlay}>
      <div className={styles.modalBox} style={{ maxWidth: 380 }}>
        <div className={styles.confirmContent}>
          <div className={`${styles.confirmIcon} ${confirmDanger ? styles.confirmDanger : styles.confirmWarn}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={confirmDanger ? '#c0392b' : '#b07d1a'} strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3>{title}</h3>
          <p>{message}</p>
          <div className={styles.confirmBtns}>
            <Btn variant="outline" onClick={onClose}>Cancel</Btn>
            <Btn danger={confirmDanger} variant={confirmDanger ? 'primary' : 'primary'} onClick={onConfirm}>{confirmLabel}</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Form helpers ── */
export function Field({ label, children, hint }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
      {hint && <p className={styles.fieldHint}>{hint}</p>}
    </div>
  )
}
export function Input(props) { return <input className={styles.input} {...props}/> }
export function Textarea(props) { return <textarea className={styles.textarea} rows={3} {...props}/> }
export function Select({ children, ...props }) { return <select className={styles.select} {...props}>{children}</select> }

/* ── Table ── */
export function Table({ head, rows, onRow }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead><tr>{head.map((h,i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={onRow ? styles.trClick : ''} onClick={() => onRow?.(i)}>
              {row.map((cell,j) => <td key={j}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Empty ── */
export function Empty({ icon, title, desc, action }) {
  return (
    <div className={styles.empty}>
      {icon && <div className={styles.emptyIcon}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d={icon}/></svg></div>}
      <p className={styles.emptyTitle}>{title}</p>
      {desc && <p className={styles.emptyDesc}>{desc}</p>}
      {action}
    </div>
  )
}

/* ── Search input ── */
export function Search({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className={styles.search}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input value={value} onChange={onChange} placeholder={placeholder} className={styles.searchInput}/>
    </div>
  )
}