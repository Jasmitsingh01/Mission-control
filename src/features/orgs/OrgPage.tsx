import {
  Building2,
  Crown,
  Shield,
  User,
  Eye,
  Trash2,
  Check,
  Settings,
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
import type { OrgMember } from '@/stores/orgStore'

const roleConfig: Record<OrgMember['role'], { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
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
  const { orgs, currentOrgId, members, setCurrentOrg, updateMemberRole, removeMember } = useOrgStore()
  const currentOrg = orgs.find((o) => o.id === currentOrgId)!

  return (
    <div className="space-y-6 pb-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Organization</h1>
        <p className="text-sm text-on-surface-variant mt-2">
          Manage workspaces, members, and billing
        </p>
      </div>

      {/* Org Switcher */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
        <span className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold">Workspaces</span>
        <div className="space-y-2 mt-4">
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
                  {org.memberCount} members · /{org.slug}
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
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-on-surface">{currentOrg.name}</span>
          </div>
          <button className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface-variant border border-outline-variant/10 hover:text-on-surface transition-colors">
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Plan', value: currentOrg.plan, capitalize: true },
            { label: 'Slug', value: `/${currentOrg.slug}`, mono: true },
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

      {/* Members */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-on-surface">Members</span>
            <span className="font-mono text-[10px] bg-surface-container-highest text-primary px-2 py-0.5 rounded-full border border-primary/20">
              {members.length}
            </span>
          </div>
          <button className="flex items-center gap-2 h-8 px-4 rounded-lg bg-primary text-on-primary font-mono text-[10px] uppercase tracking-widest font-bold transition-colors hover:bg-primary/90">
            Invite Member
          </button>
        </div>
        <div className="space-y-1">
          {members.map((member) => {
            const role = roleConfig[member.role]
            const RoleIcon = role.icon
            return (
              <div key={member.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-container/50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {member.avatarInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface">{member.name}</p>
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
                {member.role !== 'owner' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-on-surface">
                        Change
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(['admin', 'member', 'viewer'] as const).map((r) => (
                        <DropdownMenuItem key={r} onClick={() => updateMemberRole(member.id, r)}>
                          {roleConfig[r].label}
                        </DropdownMenuItem>
                      ))}
                      <Separator className="my-1 bg-outline-variant/10" />
                      <DropdownMenuItem className="text-error" onClick={() => removeMember(member.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
