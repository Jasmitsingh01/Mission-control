import {
  LayoutDashboard,
  KanbanSquare,
  Bot,
  Clock,
  Brain,
  ChevronLeft,
  ChevronRight,
  Settings,
  Rocket,
  Plus,
  Store,
  Terminal,
  ShieldAlert,
  Radar,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase())

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/mission', icon: Rocket, label: 'My Teams' },
  { to: '/dashboard/agents', icon: Bot, label: 'Active Agents' },
  { to: '/dashboard/board', icon: KanbanSquare, label: 'Task Queue' },
  { to: '/dashboard/executions', icon: Terminal, label: 'Executions' },
  { to: '/dashboard/mission-control', icon: Radar, label: 'Mission Control' },
  { to: '/dashboard/skills', icon: Store, label: 'Skills Store' },
  { to: '/dashboard/memory', icon: Brain, label: 'Memory Browser' },
  { to: '/dashboard/jobs', icon: Clock, label: 'Schedules' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user && ADMIN_EMAILS.includes(user.email.toLowerCase())

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-outline-variant/15 bg-surface transition-all duration-300 ease-out',
        sidebarCollapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 border-b border-outline-variant/15 py-5', sidebarCollapsed ? 'justify-center px-3' : 'px-5')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl synthetic-gradient text-white font-bold text-sm shadow-md shadow-primary/20">
          AF
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col">
            <span className="text-[17px] font-bold text-on-surface tracking-tight leading-tight font-[family-name:var(--font-headline)]">
              AgentForge
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary/70 leading-tight font-semibold">
              Mission Control
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2.5 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarLink key={item.to} {...item} collapsed={sidebarCollapsed} />
        ))}
        {isAdmin && (
          <SidebarLink
            to="/dashboard/admin"
            icon={ShieldAlert}
            label="Admin"
            collapsed={sidebarCollapsed}
            danger
          />
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-outline-variant/15 px-2.5 py-4 space-y-2">
        {!sidebarCollapsed && (
          <button className="flex w-full items-center justify-center gap-2 rounded-xl synthetic-gradient px-4 py-2.5 text-white font-semibold text-sm transition-all hover:opacity-90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            New Team
          </button>
        )}
        {sidebarCollapsed && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button className="flex w-full items-center justify-center rounded-xl synthetic-gradient p-2.5 text-white font-semibold transition-all hover:opacity-90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]">
                <Plus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-normal">
              New Team
            </TooltipContent>
          </Tooltip>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container mt-1"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  )
}

function SidebarLink({
  to,
  icon: Icon,
  label,
  collapsed,
  danger = false,
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  collapsed: boolean
  danger?: boolean
}) {
  const link = (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 py-2 transition-all duration-200 rounded-lg',
          collapsed ? 'px-3 justify-center' : 'px-3',
          danger
            ? isActive
              ? 'text-error bg-error/8 font-semibold'
              : 'text-error/60 hover:bg-error/6 hover:text-error/80'
            : isActive
            ? 'text-primary bg-primary/8 font-semibold glow-ring-primary'
            : 'text-on-surface-variant/80 hover:bg-surface-container hover:text-on-surface'
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="font-mono text-[11px] uppercase tracking-[0.15em] truncate">{label}</span>}
    </NavLink>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="font-normal text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return link
}
