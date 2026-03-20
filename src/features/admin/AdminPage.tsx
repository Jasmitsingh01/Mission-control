import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Building2, TrendingUp, ShieldAlert, Search,
  ChevronLeft, ChevronRight, Loader2, Trash2, Crown
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase())

interface Stats {
  users: { total: number; new30d: number }
  orgs: { total: number; pro: number; enterprise: number; free: number }
  missions: { total: number }
}

interface AdminUser {
  _id: string; name: string; email: string; plan: string; createdAt: string
}

interface AdminOrg {
  _id: string; name: string; slug: string; plan: string; memberCount: number; createdAt: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.4 } }),
}

const planColors: Record<string, string> = {
  free: 'bg-surface-container text-outline border border-outline-variant/20',
  pro: 'bg-primary/10 text-primary border border-primary/20',
  enterprise: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
}

export function AdminPage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const [tab, setTab] = useState<'overview' | 'users' | 'orgs'>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [orgs, setOrgs] = useState<AdminOrg[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Guard: only allow admin emails
  useEffect(() => {
    if (user && !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (tab === 'users') loadUsers()
    if (tab === 'orgs') loadOrgs()
  }, [tab, page, search])

  async function loadStats() {
    try {
      const data = await apiFetch('/admin/stats')
      setStats(data)
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      const data = await apiFetch(`/admin/users?${params}`)
      setUsers(data.users)
      setTotalPages(data.pages)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadOrgs() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      const data = await apiFetch(`/admin/orgs?${params}`)
      setOrgs(data.orgs)
      setTotalPages(data.pages)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function upgradeUser(userId: string, plan: string) {
    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ plan }) })
      loadUsers()
    } catch (e: any) { setError(e.message) }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' })
      loadUsers()
    } catch (e: any) { setError(e.message) }
  }

  async function upgradeOrg(orgId: string, plan: string) {
    try {
      await apiFetch(`/admin/orgs/${orgId}`, { method: 'PATCH', body: JSON.stringify({ plan }) })
      loadOrgs()
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="pt-2 flex items-center gap-3">
        <ShieldAlert className="h-6 w-6 text-error" />
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-error mb-1">Restricted</p>
          <h1 className="text-3xl font-black text-on-surface tracking-tight">Admin Panel</h1>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 text-sm text-error">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline-variant/20 pb-0">
        {(['overview', 'users', 'orgs'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); setSearch('') }}
            className={cn(
              'px-4 py-2 text-sm font-medium font-mono capitalize border-b-2 -mb-px transition-colors',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {stats ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: stats.users.total, sub: `+${stats.users.new30d} last 30d`, icon: Users, color: 'text-primary' },
                  { label: 'Organizations', value: stats.orgs.total, sub: `${stats.orgs.free} free`, icon: Building2, color: 'text-secondary' },
                  { label: 'Pro Orgs', value: stats.orgs.pro, sub: `${stats.orgs.enterprise} enterprise`, icon: Crown, color: 'text-tertiary' },
                  { label: 'Missions Run', value: stats.missions.total, sub: 'all time', icon: TrendingUp, color: 'text-on-surface' },
                ].map((s, i) => (
                  <motion.div key={s.label} initial="hidden" animate="visible" variants={fadeUp} custom={i}>
                    <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">{s.label}</span>
                        <s.icon className={`h-5 w-5 ${s.color} opacity-70`} />
                      </div>
                      <p className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="font-mono text-[10px] text-outline mt-1">{s.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Plan breakdown */}
              <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6">
                <h3 className="font-semibold text-sm text-on-surface mb-4">Plan Distribution</h3>
                <div className="flex gap-4 flex-wrap">
                  {[
                    { label: 'Free', count: stats.orgs.free, color: 'bg-outline' },
                    { label: 'Pro', count: stats.orgs.pro, color: 'bg-primary' },
                    { label: 'Enterprise', count: stats.orgs.enterprise, color: 'bg-purple-400' },
                  ].map((p) => (
                    <div key={p.label} className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${p.color}`} />
                      <span className="text-sm text-on-surface-variant">{p.label}: <strong className="text-on-surface">{p.count}</strong></span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 h-3 bg-surface-container rounded-full overflow-hidden flex">
                  {[
                    { count: stats.orgs.free, color: 'bg-outline' },
                    { count: stats.orgs.pro, color: 'bg-primary' },
                    { count: stats.orgs.enterprise, color: 'bg-purple-400' },
                  ].map((p, i) => (
                    <div
                      key={i}
                      className={p.color}
                      style={{ width: `${stats.orgs.total > 0 ? (p.count / stats.orgs.total) * 100 : 0}%` }}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-outline" /></div>
          )}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
              <input
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-9 pr-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-outline" />}
          </div>

          <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-outline-variant/20">
                <tr>
                  {['Name', 'Email', 'Plan', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-outline-variant/10 hover:bg-surface-container transition-colors">
                    <td className="px-4 py-3 font-medium text-on-surface">{u.name}</td>
                    <td className="px-4 py-3 text-on-surface-variant font-mono text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-mono px-2 py-0.5 rounded-full', planColors[u.plan] || planColors.free)}>{u.plan}</span>
                    </td>
                    <td className="px-4 py-3 text-outline text-xs font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          className="text-xs bg-surface-container border border-outline-variant/30 rounded-lg px-2 py-1 text-on-surface"
                          value={u.plan}
                          onChange={(e) => upgradeUser(u._id, e.target.value)}
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                        <button
                          onClick={() => deleteUser(u._id)}
                          className="text-error hover:text-error/80 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr><td colSpan={5} className="text-center py-12 text-outline text-sm">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-outline font-mono">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant disabled:opacity-30 hover:bg-surface-container">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant disabled:opacity-30 hover:bg-surface-container">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orgs */}
      {tab === 'orgs' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
              <input
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-9 pr-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container"
                placeholder="Search orgs..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-outline" />}
          </div>

          <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-outline-variant/20">
                <tr>
                  {['Name', 'Slug', 'Plan', 'Members', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o._id} className="border-b border-outline-variant/10 hover:bg-surface-container transition-colors">
                    <td className="px-4 py-3 font-medium text-on-surface">{o.name}</td>
                    <td className="px-4 py-3 text-outline font-mono text-xs">{o.slug}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-mono px-2 py-0.5 rounded-full', planColors[o.plan] || planColors.free)}>{o.plan}</span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{o.memberCount}</td>
                    <td className="px-4 py-3 text-outline text-xs font-mono">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="text-xs bg-surface-container border border-outline-variant/30 rounded-lg px-2 py-1 text-on-surface"
                        value={o.plan}
                        onChange={(e) => upgradeOrg(o._id, e.target.value)}
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {orgs.length === 0 && !loading && (
                  <tr><td colSpan={6} className="text-center py-12 text-outline text-sm">No orgs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-outline font-mono">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant disabled:opacity-30 hover:bg-surface-container">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant disabled:opacity-30 hover:bg-surface-container">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
