import {
  LayoutDashboard,
  KanbanSquare,
  Bot,
  Clock,
  Brain,
  Puzzle,
  ChevronLeft,
  ChevronRight,
  Settings,
  Rocket,
  Plus,
  Store,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/mission', icon: Rocket, label: 'My Teams' },
  { to: '/dashboard/agents', icon: Bot, label: 'Active Agents' },
  { to: '/dashboard/board', icon: KanbanSquare, label: 'Task Queue' },
  { to: '/dashboard/skills', icon: Store, label: 'Skills Store' },
  { to: '/dashboard/memory', icon: Brain, label: 'Memory Browser' },
  { to: '/dashboard/jobs', icon: Clock, label: 'Schedules' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-outline-variant/20 bg-surface-dim transition-all duration-300',
        sidebarCollapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-outline-variant/20 px-5 py-5">
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
      </nav>

      {/* Bottom */}
      <div className="border-t border-outline-variant/20 px-3 py-4 space-y-2">
        {!sidebarCollapsed && (
          <button className="flex w-full items-center justify-center gap-2 rounded-lg synthetic-gradient px-4 py-2.5 text-white font-bold text-sm transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            New Team
          </button>
        )}
        {sidebarCollapsed && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button className="flex w-full items-center justify-center rounded-lg synthetic-gradient p-2.5 text-white font-bold transition-all hover:opacity-90">
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
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  collapsed: boolean
}) {
  const link = (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 transition-all duration-200',
          "font-mono text-xs uppercase tracking-widest",
          isActive
            ? 'text-secondary bg-surface-container-low border-r-2 border-secondary rounded-l-lg'
            : 'text-on-surface-variant hover:bg-surface-container-low/50 hover:translate-x-1 rounded-lg'
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
