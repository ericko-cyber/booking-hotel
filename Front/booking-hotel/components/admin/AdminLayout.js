import { useState } from 'react'
import { useRouter } from 'next/router'
import styles from './Adminlayout.module.css'

const NAV = [
  { key: 'dashboard',   label: 'Dashboard',        href: '/admin',              icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { key: 'hotels',      label: 'Hotel Approvals',   href: '/admin/hotels',       icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10 M19 3h-4v4' },
  { key: 'users',       label: 'User Management',   href: '/admin/users',        icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
  { key: 'bookings',    label: 'Booking Monitor',   href: '/admin/bookings',     icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z' },
  { key: 'vouchers',    label: 'Vouchers',          href: '/admin/vouchers',     icon: 'M20 12V22H4V12 M22 7H2v5h20V7z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z' },
  { key: 'membership',  label: 'Membership',        href: '/admin/membership',   icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { key: 'analytics',  label: 'Analytics',         href: '/admin/analytics',    icon: 'M18 20V10 M12 20V4 M6 20v-6' },
]

const GROUPS = [
  { label: 'Overview', keys: ['dashboard'] },
  { label: 'Management', keys: ['hotels', 'users', 'bookings'] },
  { label: 'Platform', keys: ['vouchers', 'membership', 'analytics'] },
]

export default function AdminLayout({ children, active }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    // Clear auth from localStorage if exists
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userEmail')
    }
    // Redirect to login
    router.push('/login')
  }

  return (
    <div className={`${styles.shell} ${collapsed ? styles.collapsed : ''}`}>
      {mobileOpen && <div className={styles.overlay} onClick={() => setMobileOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ''}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          {!collapsed && (
            <div className={styles.brandText}>
              <span className={styles.brandName}>Sanctuary Luxe</span>
              <span className={styles.brandSub}>Admin Console</span>
            </div>
          )}
          <button className={styles.collapseBtn} onClick={() => setCollapsed(c => !c)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {collapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
            </svg>
          </button>
        </div>

        {/* Admin info */}
        {!collapsed && (
          <div className={styles.adminBadge}>
            <div className={styles.adminAvatar}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p className={styles.adminName}>System Administrator</p>
              <p className={styles.adminEmail}>admin@sanctuaryluxe.com</p>
            </div>
          </div>
        )}

        {/* Nav groups */}
        <nav className={styles.nav}>x
          {GROUPS.map(group => (
            <div key={group.label} className={styles.navGroup}>
              {!collapsed && <p className={styles.groupLabel}>{group.label}</p>}
              {group.keys.map(key => {
                const item = NAV.find(n => n.key === key)
                return (
                  <a key={key} href={item.href}
                    className={`${styles.navItem} ${active === key ? styles.navActive : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={styles.navIcon}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={item.icon}/>
                      </svg>
                    </span>
                    {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                    {!collapsed && active === key && <span className={styles.activeBar}/>}
                  </a>
                )
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <a href="/" className={styles.backLink} title={collapsed ? 'Back to site' : undefined}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            {!collapsed && <span>Back to site</span>}
          </a>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button className={styles.mobileBtn} onClick={() => setMobileOpen(o => !o)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className={styles.topbarBreadcrumb}>
            <span className={styles.topbarPortal}>Admin Console</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            <span className={styles.topbarPage}>{NAV.find(n => n.key === active)?.label || 'Dashboard'}</span>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.systemStatus}>
              <span className={styles.statusDot}/>
              System Online
            </div>
            <button className={styles.notifBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className={styles.notifBadge}>3</span>
            </button>
            <div className={styles.profileDropdown}>
              <button className={styles.adminAvtSmall} onClick={() => setProfileOpen(!profileOpen)}>A</button>
              {profileOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownAvatar}>A</div>
                    <div>
                      <p className={styles.dropdownName}>Admin</p>
                      <p className={styles.dropdownEmail}>admin@sanctuaryluxe.com</p>
                    </div>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <button className={styles.dropdownItem} onClick={handleLogout}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  )
}