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
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-outline-variant/20 bg-surface-dim transition-all duration-300',
        sidebarCollapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 border-b border-outline-variant/20 py-5', sidebarCollapsed ? 'justify-center px-3' : 'px-5')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container font-bold text-sm">
          AF
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary tracking-tight leading-tight">
              AgentForge
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary leading-tight">
              Mission Control
            </span>
            <span className="text-[10px] text-on-surface-variant/60 leading-tight mt-0.5">
              Precision AI Orchestration
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
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
      <div className="border-t border-outline-variant/20 px-3 py-4 space-y-2">
        {!sidebarCollapsed && (
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-on-primary font-semibold text-sm transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Team
          </button>
        )}
        {sidebarCollapsed && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button className="flex w-full items-center justify-center rounded-lg bg-primary p-2.5 text-on-primary font-semibold transition-colors hover:bg-primary/90">
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
          className="w-full justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/50 mt-1"
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
          'flex items-center gap-3 py-2.5 transition-all duration-200',
          'font-mono text-xs uppercase tracking-widest',
          collapsed ? 'px-3 justify-center' : 'px-3',
          danger
            ? isActive
              ? 'text-error bg-error/10 rounded-lg'
              : 'text-error/70 hover:bg-error/10 rounded-lg'
            : isActive
            ? 'text-secondary bg-surface-container-low rounded-lg'
            : 'text-on-surface-variant hover:bg-surface-container-low/50 rounded-lg'
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="font-normal">
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return link
}
