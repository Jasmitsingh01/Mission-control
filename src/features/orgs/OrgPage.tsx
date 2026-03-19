import { useEffect, useState } from 'react'
import {
  Building2,
  Crown,
  Shield,
  User,
  Eye,
  Trash2,
  Check,
  Settings,
  Plus,
  Mail,
  X,
  Loader2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useOrgStore } from '@/stores/orgStore'
import { useAuthStore } from '@/stores/authStore'
import type { OrgMember, OrgRole } from '@/stores/orgStore'

const roleConfig: Record<OrgRole, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  owner: { icon: Crown, color: 'text-tertiary', label: 'Owner' },
  admin: { icon: Shield, color: 'text-primary', label: 'Admin' },
  member: { icon: User, color: 'text-on-surface', label: 'Member' },
  viewer: { icon: Eye, color: 'text-outline', label: 'Viewer' },
}

const planColors: Record<string, string> = {
  free: 'bg-surface-container-highest text-outline',
  pro: 'bg-primary/10 text-primary border border-primary/20',
  enterprise: 'bg-purple-500/10 text-purple-400 border border-purple-400/20',
}

export function OrgPage() {
  const user = useAuthStore((s) => s.user)
  const {
    orgs, currentOrgId, members, invitations, isLoading, error,
    setCurrentOrg, fetchOrgs, fetchMembers, fetchInvitations,
    updateMemberRole, removeMember, createOrg, deleteOrg,
    inviteMember, revokeInvitation,
  } = useOrgStore()

  const currentOrg = orgs.find((o) => o.id === currentOrgId)
  const currentUserRole = currentOrg?.userRole

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createSlug, setCreateSlug] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OrgRole>('member')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchOrgs()
  }, [])

  useEffect(() => {
    if (currentOrgId) {
      fetchMembers(currentOrgId)
      fetchInvitations(currentOrgId)
    }
  }, [currentOrgId])

  const handleCreateOrg = async () => {
    setFormError('')
    if (!createName.trim() || !createSlug.trim()) {
      setFormError('Name and slug are required.')
      return
    }
    setFormLoading(true)
    try {
      const org = await createOrg(createName.trim(), createSlug.trim())
      setShowCreateDialog(false)
      setCreateName('')
      setCreateSlug('')
      setCurrentOrg(org.id)
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleInvite = async () => {
    setFormError('')
    if (!inviteEmail.trim()) {
      setFormError('Email is required.')
      return
    }
    setFormLoading(true)
    try {
      await inviteMember(inviteEmail.trim(), inviteRole)
      setShowInviteDialog(false)
      setInviteEmail('')
      setInviteRole('member')
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteOrg = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) return
    try {
      await deleteOrg(orgId)
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-6 pb-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Organization</h1>
        <p className="text-sm text-on-surface-variant mt-2">
          Manage workspaces, members, and collaboration
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 text-error text-sm border border-error/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Org Switcher */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold">Workspaces</span>
          <button
            onClick={() => { setShowCreateDialog(true); setFormError('') }}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-primary text-on-primary font-mono text-[10px] uppercase tracking-widest font-bold transition-colors hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        </div>
        <div className="space-y-2">
          {isLoading && orgs.length === 0 && (
            <div className="flex items-center gap-2 py-8 justify-center text-outline">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading workspaces...</span>
            </div>
          )}
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => setCurrentOrg(org.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
                org.id === currentOrgId
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-surface-container/50 border border-outline-variant/10'
              )}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
                {org.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-on-surface">{org.name}</span>
                  <span className={cn(
                    "font-mono text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full capitalize",
                    planColors[org.plan]
                  )}>
                    {org.plan}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-outline">
                  {org.memberCount} member{org.memberCount !== 1 ? 's' : ''} · /{org.slug} · {org.userRole}
                </span>
              </div>
              {org.id === currentOrgId && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current Org Details */}
      {currentOrg && (
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-on-surface">{currentOrg.name}</span>
            </div>
            {currentUserRole === 'owner' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteOrg(currentOrg.id)}
                  className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest font-bold px-3 py-2 rounded-lg text-error border border-error/20 hover:bg-error/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Plan', value: currentOrg.plan, capitalize: true },
              { label: 'Slug', value: `/${currentOrg.slug}`, mono: true },
              { label: 'Your Role', value: currentUserRole, capitalize: true },
              { label: 'Created', value: new Date(currentOrg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold">{item.label}</p>
                <p className={cn(
                  'text-sm text-on-surface mt-1',
                  item.mono && "font-mono",
                  item.capitalize && 'capitalize'
                )}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      {currentOrg && (
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-on-surface">Members</span>
              <span className="font-mono text-[10px] bg-surface-container-highest text-primary px-2 py-0.5 rounded-full border border-primary/20">
                {members.length}
              </span>
            </div>
            {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
              <button
                onClick={() => { setShowInviteDialog(true); setFormError('') }}
                className="flex items-center gap-2 h-8 px-4 rounded-lg bg-primary text-on-primary font-mono text-[10px] uppercase tracking-widest font-bold transition-colors hover:bg-primary/90"
              >
                <Mail className="h-3.5 w-3.5" />
                Invite Member
              </button>
            )}
          </div>
          <div className="space-y-1">
            {members.map((member) => {
              const role = roleConfig[member.role]
              const RoleIcon = role.icon
              const isMe = member.userId === user?.id
              return (
                <div key={member.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-container/50 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface">
                      {member.name}
                      {isMe && <span className="text-outline ml-1">(you)</span>}
                    </p>
                    <p className="font-mono text-[11px] text-outline">{member.email}</p>
                  </div>
                  <span className={cn(
                    "font-mono text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full flex items-center gap-1",
                    member.role === 'owner' && 'bg-tertiary/10 text-tertiary border border-tertiary/20',
                    member.role === 'admin' && 'bg-primary/10 text-primary border border-primary/20',
                    member.role === 'member' && 'bg-surface-container-highest text-on-surface-variant',
                    member.role === 'viewer' && 'bg-surface-container-highest text-outline',
                  )}>
                    <RoleIcon className={cn('h-3 w-3', role.color)} />
                    {role.label}
                  </span>
                  {member.role !== 'owner' && (currentUserRole === 'owner' || currentUserRole === 'admin') && !isMe && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-on-surface">
                          Change
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(['admin', 'member', 'viewer'] as const).map((r) => (
                          <DropdownMenuItem
                            key={r}
                            onClick={() => updateMemberRole(member.memberId, r)}
                            disabled={r === 'admin' && currentUserRole !== 'owner'}
                          >
                            {roleConfig[r].label}
                            {r === member.role && <Check className="h-3 w-3 ml-auto" />}
                          </DropdownMenuItem>
                        ))}
                        <Separator className="my-1 bg-outline-variant/10" />
                        <DropdownMenuItem className="text-error" onClick={() => removeMember(member.memberId)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {isMe && member.role !== 'owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 font-mono text-[10px] uppercase tracking-widest text-error hover:text-error"
                      onClick={() => removeMember(member.memberId)}
                    >
                      Leave
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pending Invitations */}
      {currentOrg && invitations.length > 0 && (currentUserRole === 'owner' || currentUserRole === 'admin') && (
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-outline" />
            <span className="font-semibold text-sm text-on-surface">Pending Invitations</span>
            <span className="font-mono text-[10px] bg-surface-container-highest text-outline px-2 py-0.5 rounded-full">
              {invitations.length}
            </span>
          </div>
          <div className="space-y-1">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-container/50 transition-colors">
                <Mail className="h-4 w-4 text-outline shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface">{inv.email}</p>
                  <p className="font-mono text-[11px] text-outline">
                    Invited as {inv.role} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => revokeInvitation(inv.id)}
                  className="flex items-center gap-1 h-7 px-2 rounded-lg font-mono text-[10px] uppercase tracking-widest text-error hover:bg-error/10 transition-colors"
                >
                  <X className="h-3 w-3" />
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Org Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateDialog(false)}>
          <div className="bg-surface-container-low rounded-2xl p-6 w-full max-w-md border border-outline-variant/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-on-surface mb-4">Create Workspace</h2>
            {formError && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-error/10 text-error text-xs mb-3">
                <AlertCircle className="h-3.5 w-3.5" />
                {formError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold">Name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => {
                    setCreateName(e.target.value)
                    setCreateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
                  }}
                  placeholder="My Team"
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm border border-outline-variant/20 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold">Slug</label>
                <input
                  type="text"
                  value={createSlug}
                  onChange={(e) => setCreateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="my-team"
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm border border-outline-variant/20 focus:border-primary focus:outline-none font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="h-9 px-4 rounded-lg font-mono text-[11px] uppercase tracking-widest text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrg}
                disabled={formLoading}
                className="h-9 px-4 rounded-lg bg-primary text-on-primary font-mono text-[11px] uppercase tracking-widest font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {formLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Dialog */}
      {showInviteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowInviteDialog(false)}>
          <div className="bg-surface-container-low rounded-2xl p-6 w-full max-w-md border border-outline-variant/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-on-surface mb-4">Invite Member</h2>
            {formError && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-error/10 text-error text-xs mb-3">
                <AlertCircle className="h-3.5 w-3.5" />
                {formError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm border border-outline-variant/20 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold">Role</label>
                <div className="flex gap-2 mt-1">
                  {(['member', 'admin', 'viewer'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setInviteRole(r)}
                      disabled={r === 'admin' && currentUserRole !== 'owner'}
                      className={cn(
                        'flex-1 h-9 rounded-lg font-mono text-[10px] uppercase tracking-widest font-bold transition-colors border',
                        inviteRole === r
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-surface-container text-on-surface-variant border-outline-variant/10 hover:bg-surface-container-highest',
                        r === 'admin' && currentUserRole !== 'owner' && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowInviteDialog(false)}
                className="h-9 px-4 rounded-lg font-mono text-[11px] uppercase tracking-widest text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={formLoading}
                className="h-9 px-4 rounded-lg bg-primary text-on-primary font-mono text-[11px] uppercase tracking-widest font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {formLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
