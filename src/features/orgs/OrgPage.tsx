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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  owner: { icon: Crown, color: 'text-yellow-400', label: 'Owner' },
  admin: { icon: Shield, color: 'text-blue-400', label: 'Admin' },
  member: { icon: User, color: 'text-foreground', label: 'Member' },
  viewer: { icon: Eye, color: 'text-muted-foreground', label: 'Viewer' },
}

const planColors: Record<string, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-blue-500/20 text-blue-400',
  enterprise: 'bg-purple-500/20 text-purple-400',
}

export function OrgPage() {
  const { orgs, currentOrgId, members, setCurrentOrg, updateMemberRole, removeMember } = useOrgStore()
  const currentOrg = orgs.find((o) => o.id === currentOrgId)!

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Organization</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage workspaces, members, and billing
        </p>
      </div>

      {/* Org Switcher */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {orgs.map((org) => (
              <button
                key={org.id}
                onClick={() => setCurrentOrg(org.id)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors',
                  org.id === currentOrgId
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-muted/50 border border-transparent'
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
                  {org.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{org.name}</span>
                    <Badge variant="secondary" className={cn('text-[10px] capitalize', planColors[org.plan])}>
                      {org.plan}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {org.memberCount} members · /{org.slug}
                  </span>
                </div>
                {org.id === currentOrgId && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Org Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {currentOrg.name}
            </CardTitle>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="text-sm font-medium capitalize">{currentOrg.plan}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Slug</p>
              <p className="text-sm font-mono">/{currentOrg.slug}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm">{new Date(currentOrg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Members ({members.length})</CardTitle>
            <Button size="sm">Invite Member</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {members.map((member) => {
              const role = roleConfig[member.role]
              const RoleIcon = role.icon
              return (
                <div key={member.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/30 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {member.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <Badge variant="secondary" className="text-[11px] gap-1">
                    <RoleIcon className={cn('h-3 w-3', role.color)} />
                    {role.label}
                  </Badge>
                  {member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Change
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(['admin', 'member', 'viewer'] as const).map((r) => (
                          <DropdownMenuItem key={r} onClick={() => updateMemberRole(member.id, r)}>
                            {roleConfig[r].label}
                          </DropdownMenuItem>
                        ))}
                        <Separator className="my-1" />
                        <DropdownMenuItem className="text-destructive" onClick={() => removeMember(member.id)}>
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
        </CardContent>
      </Card>
    </div>
  )
}
