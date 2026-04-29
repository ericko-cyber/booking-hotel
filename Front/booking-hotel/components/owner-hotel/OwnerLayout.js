import { useState } from 'react'
import styles from '../OwnerLayout.module.css'
import { CURRENT_OWNER } from './OwnerData'

const NAV = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/owner',
    icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  },
  {
    key: 'hotels',
    label: 'Hotels',
    href: '/owner/hotels',
    icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10 M19 3h-4v4',
  },
  {
    key: 'rooms',
    label: 'Rooms',
    href: '/owner/rooms',
    icon: 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3',
  },
  {
    key: 'bookings',
    label: 'Bookings',
    href: '/owner/bookings',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
  },
  {
    key: 'revenue',
    label: 'Revenue',
    href: '/owner/revenue',
    icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/owner/settings',
    icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  },
]

export default function OwnerLayout({ children, active }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    if (typeof window === 'undefined') return

    // Clear common frontend auth keys before moving to login page.
    localStorage.removeItem('token')
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')

    window.location.href = '/'
  }

  return (
    <div className={`${styles.shell} ${collapsed ? styles.collapsed : ''}`}>
      {/* Mobile overlay */}
      {mobileOpen && <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>SL</div>
          {!collapsed && (
            <div className={styles.brandText}>
              <span className={styles.brandName}>Sanctuary Luxe</span>
              <span className={styles.brandRole}>Owner Portal</span>
            </div>
          )}
          <button className={styles.collapseBtn} onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {collapsed
                ? <><polyline points="9 18 15 12 9 6"/></>
                : <><polyline points="15 18 9 12 15 6"/></>}
            </svg>
          </button>
        </div>

        {/* Owner info */}
        {!collapsed && (
          <div className={styles.ownerCard}>
            <div className={styles.ownerAvatar}>{CURRENT_OWNER.initials}</div>
            <div className={styles.ownerInfo}>
              <p className={styles.ownerName}>{CURRENT_OWNER.name}</p>
              <p className={styles.ownerEmail}>{CURRENT_OWNER.email}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className={styles.nav}>
          {NAV.map(item => (
            <a
              key={item.key}
              href={item.href}
              className={`${styles.navItem} ${active === item.key ? styles.navItemActive : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
              </span>
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              {!collapsed && active === item.key && <span className={styles.navDot} />}
            </a>
          ))}
        </nav>

        {/* Bottom: back to site */}
        <div className={styles.sidebarFooter}>
          <a href="/" className={styles.backLink} title={collapsed ? 'Back to site' : undefined}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {!collapsed && <span>Back to site</span>}
          </a>
          <button
            type="button"
            className={styles.logoutBtn}
            title={collapsed ? 'Log out' : undefined}
            onClick={handleLogout}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <button className={styles.mobileMenuBtn} onClick={() => setMobileOpen(o => !o)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className={styles.topbarTitle}>
            {NAV.find(n => n.key === active)?.label || 'Owner Portal'}
          </div>
          <div className={styles.topbarRight}>
            <button className={styles.topbarIcon} title="Notifications">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className={styles.notifDot} />
            </button>
            <button type="button" className={styles.topbarLogout} onClick={handleLogout}>Log out</button>
            <a href="/owner/settings" className={styles.topbarAvatar}>{CURRENT_OWNER.initials}</a>
          </div>
        </header>

        {/* Page content */}
        <div className={styles.pageContent}>
          {children}
        </div>
      </div>
    </div>
  )
}
