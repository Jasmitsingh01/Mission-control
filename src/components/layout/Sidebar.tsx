import {
  LayoutDashboard,
  KanbanSquare,
  Activity,
  Bot,
  Clock,
  Brain,
  Puzzle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Settings,
  Rocket,
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
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/mission', icon: Rocket, label: 'Launch Mission' },
  { to: '/board', icon: KanbanSquare, label: 'Task Board' },
  { to: '/activity', icon: Activity, label: 'Activity Feed' },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/jobs', icon: Clock, label: 'Scheduled Jobs' },
  { to: '/memory', icon: Brain, label: 'Memory' },
  { to: '/skills', icon: Puzzle, label: 'Skills' },
]

const bottomItems = [
  { to: '/org', icon: Building2, label: 'Organization' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-border bg-sidebar-background transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          MC
        </div>
        {!sidebarCollapsed && (
          <span className="font-semibold text-foreground whitespace-nowrap">
            Mission Control
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => (
          <SidebarLink key={item.to} {...item} collapsed={sidebarCollapsed} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-border p-2">
        {bottomItems.map((item) => (
          <SidebarLink key={item.to} {...item} collapsed={sidebarCollapsed} />
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center text-muted-foreground hover:text-foreground"
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
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-primary font-medium'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
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
