import { useState, useEffect, useCallback } from 'react'
import AdminLayout from './AdminLayout'
import { PageHeader, Badge, Btn, Modal, Search } from './AdminUI'
import { userService } from '../../services/userService'
import styles from './Users.module.css'

const PAGE_SIZE = 20

// Helper: pastikan nilai selalu array
const toArray = (val) => (Array.isArray(val) ? val : [])

export default function AdminUsers() {
  const [users, setUsers]           = useState([])   // selalu array
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [detail, setDetail]         = useState(null)
  const [page, setPage]             = useState(1)
  const [togglingId, setTogglingId] = useState(null)

  // ── Fetch ──────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await userService.getUsers({ page, pageSize: PAGE_SIZE, role: roleFilter })

      // Uncomment baris ini untuk cek struktur response dari backend:
      // console.log('API response:', res)

      // Ambil array dari berbagai kemungkinan struktur response Go:
      // { data: [...], total: N }  atau  { users: [...], total: N }  atau  langsung [...]
      const list = toArray(res?.data ?? res?.users ?? res)
      const count = res?.total ?? res?.count ?? list.length

      setUsers(list)
      setTotal(count)
    } catch (err) {
      setError(err.message ?? 'Gagal memuat data')
      setUsers([])   // pastikan tetap array saat error
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter])

  useEffect(() => { loadUsers() }, [loadUsers])
  useEffect(() => { setPage(1)  }, [roleFilter])

  // ── Toggle status ──────────────────────────────────────────
  const toggleStatus = async (id) => {
    const user = users.find(u => u.id === id)
    if (!user) return
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    setTogglingId(id)
    try {
      await userService.updateUserStatus(id, newStatus)
      setUsers(us => us.map(u => u.id === id ? { ...u, status: newStatus } : u))
      setDetail(d => d?.id === id ? { ...d, status: newStatus } : d)
    } catch (err) {
      alert('Gagal update status: ' + (err.message ?? err))
    } finally {
      setTogglingId(null)
    }
  }

  // ── Derived ────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const matchRole   = roleFilter === 'all' || u.role === roleFilter
    const matchSearch = !search
      || u.name.toLowerCase().includes(search.toLowerCase())
      || u.email.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const totalPages  = Math.ceil(total / PAGE_SIZE)
  const activeCount = users.filter(u => u.status === 'active').length
  const formatDate  = (val) =>
    val ? new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
  const avatarBg    = (role) =>
    role === 'admin' ? '#0a1628' : role === 'owner' ? '#6a2aaa' : '#1b4d5c'

  // ── Render ─────────────────────────────────────────────────
  return (
    <AdminLayout active="users">
      <PageHeader
        eyebrow="Management"
        title="User Management"
        subtitle={`${total} total users · ${activeCount} active`}
      />

      <div className={styles.toolbar}>
        <div className={styles.roleTabs}>
          {['all', 'user', 'owner', 'admin'].map(r => (
            <button
              key={r}
              className={`${styles.rTab} ${roleFilter === r ? styles.rTabOn : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
              <span>{r === 'all' ? total : users.filter(u => u.role === r).length}</span>
            </button>
          ))}
        </div>
        <Search value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." />
      </div>

      {/* ── States ── */}
      {loading && (
        <div className={styles.stateBox}>Memuat data pengguna...</div>
      )}
      {!loading && error && (
        <div className={styles.stateBox}>
          ⚠ {error} — <button onClick={loadUsers}>Coba lagi</button>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className={styles.stateBox}>Tidak ada user ditemukan.</div>
      )}

      {/* ── Table ── */}
      {!loading && !error && filtered.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Email</th><th>Role</th>
                  <th>Joined</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className={styles.tr} onClick={() => setDetail(u)}>
                    <td className={styles.tdId}>{u.id}</td>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar} style={{ background: avatarBg(u.role) }}>
                          {u.name[0]}
                        </div>
                        <span className={styles.name}>{u.name}</span>
                      </div>
                    </td>
                    <td className={styles.tdEmail}>{u.email}</td>
                    <td><Badge status={u.role} /></td>
                    <td className={styles.tdMuted}>{formatDate(u.created_at)}</td>
                    <td><Badge status={u.status} /></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className={styles.actions}>
                        <Btn variant="ghost" small onClick={() => setDetail(u)}>View</Btn>
                        {u.role !== 'admin' && (
                          <Btn
                            variant={u.status === 'active' ? 'outline' : 'primary'}
                            small
                            disabled={togglingId === u.id}
                            onClick={() => toggleStatus(u.id)}
                          >
                            {togglingId === u.id ? '...' : u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <Btn variant="outline" small disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Btn>
              <span className={styles.pageInfo}>Halaman {page} / {totalPages}</span>
              <Btn variant="outline" small disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Btn>
            </div>
          )}
        </>
      )}

      {/* ── Modal ── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="User Details" width={440}>
        {detail && (
          <div className={styles.detailContent}>
            <div className={styles.detailTop}>
              <div className={styles.detailAvatar} style={{ background: avatarBg(detail.role) }}>
                {detail.name[0]}
              </div>
              <div>
                <h3 className={styles.detailName}>{detail.name}</h3>
                <p className={styles.detailEmail}>{detail.email}</p>
                <div className={styles.detailBadges}>
                  <Badge status={detail.role} /><Badge status={detail.status} />
                </div>
              </div>
            </div>

            {[
              ['User ID',    `#${detail.id}`],
              ['Telepon',    detail.phone           || '-'],
              ['Kota',       detail.city            || '-'],
              ['Membership', detail.membership_tier ?? '-'],
              ['Joined',     formatDate(detail.created_at)],
              ['Last Login', formatDate(detail.last_login)],
            ].map(([l, v]) => (
              <div key={l} className={styles.detailRow}><span>{l}</span><strong>{v}</strong></div>
            ))}

            {detail.role !== 'admin' && (
              <Btn
                variant={detail.status === 'active' ? 'outline' : 'primary'}
                disabled={togglingId === detail.id}
                onClick={() => toggleStatus(detail.id)}
              >
                {togglingId === detail.id
                  ? 'Memproses...'
                  : detail.status === 'active' ? 'Deactivate Account' : 'Reactivate Account'}
              </Btn>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  )
}