import { useState } from 'react'
import AdminLayout from './AdminLayout'
import { PageHeader, Badge, Btn, Modal, Search } from './AdminUI'
import { ALL_USERS as INIT } from './AdminData'
import styles from './Users.module.css'

export default function AdminUsers() {
  const [users, setUsers] = useState(INIT)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [detail, setDetail] = useState(null)

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const toggleStatus = (id) => {
    setUsers(us => us.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u))
  }

  return (
    <AdminLayout active="users">
      <PageHeader
        eyebrow="Management"
        title="User Management"
        subtitle={`${users.length} total users · ${users.filter(u => u.status === 'active').length} active`}
      />

      <div className={styles.toolbar}>
        <div className={styles.roleTabs}>
          {['all','user','owner','admin'].map(r => (
            <button key={r} className={`${styles.rTab} ${roleFilter === r ? styles.rTabOn : ''}`} onClick={() => setRoleFilter(r)}>
              {r === 'all' ? 'All' : r.charAt(0).toUpperCase()+r.slice(1)+'s'}
              <span>{users.filter(u => r === 'all' || u.role === r).length}</span>
            </button>
          ))}
        </div>
        <Search value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Bookings</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className={styles.tr} onClick={() => setDetail(u)}>
                <td className={styles.tdId}>{u.id}</td>
                <td>
                  <div className={styles.nameCell}>
                    <div className={styles.avatar} style={{ background: u.role === 'admin' ? '#0a1628' : u.role === 'owner' ? '#6a2aaa' : '#1b4d5c' }}>
                      {u.name[0]}
                    </div>
                    <span className={styles.name}>{u.name}</span>
                  </div>
                </td>
                <td className={styles.tdEmail}>{u.email}</td>
                <td><Badge status={u.role} /></td>
                <td className={styles.tdCenter}>{u.bookings}</td>
                <td className={styles.tdMuted}>{u.joined}</td>
                <td><Badge status={u.status} /></td>
                <td onClick={e => e.stopPropagation()}>
                  <div className={styles.actions}>
                    <Btn variant="ghost" small onClick={() => setDetail(u)}>View</Btn>
                    {u.role !== 'admin' && (
                      <Btn variant={u.status === 'active' ? 'outline' : 'primary'} small onClick={() => toggleStatus(u.id)}>
                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Btn>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="User Details" width={440}>
        {detail && (
          <div className={styles.detailContent}>
            <div className={styles.detailTop}>
              <div className={styles.detailAvatar} style={{ background: detail.role === 'admin' ? '#0a1628' : detail.role === 'owner' ? '#6a2aaa' : '#1b4d5c' }}>
                {detail.name[0]}
              </div>
              <div>
                <h3 className={styles.detailName}>{detail.name}</h3>
                <p className={styles.detailEmail}>{detail.email}</p>
                <div className={styles.detailBadges}><Badge status={detail.role}/><Badge status={detail.status}/></div>
              </div>
            </div>
            {[['User ID', `#${detail.id}`], ['Bookings', detail.bookings], ['Member Since', detail.joined]].map(([l,v]) => (
              <div key={l} className={styles.detailRow}><span>{l}</span><strong>{v}</strong></div>
            ))}
            {detail.role !== 'admin' && (
              <Btn variant={detail.status === 'active' ? 'outline' : 'primary'} onClick={() => { toggleStatus(detail.id); setDetail(d => ({...d, status: d.status === 'active' ? 'inactive' : 'active'})) }}>
                {detail.status === 'active' ? 'Deactivate Account' : 'Reactivate Account'}
              </Btn>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}