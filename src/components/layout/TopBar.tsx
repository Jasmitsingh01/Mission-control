import { Search, Bell, LogOut, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useActivityStore } from '@/stores/activityStore'
import { useAuthStore } from '@/stores/authStore'

export function TopBar() {
  const navigate = useNavigate()
  const events = useActivityStore((s) => s.events)
  const { user, logout } = useAuthStore()
  const errorCount = events.filter((e) => e.severity === 'error').length

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Simulated API usage percentage
  const apiUsage = 68

  return (
    <header className="flex h-14 items-center justify-between border-b border-outline-variant/20 bg-surface-dim/80 backdrop-blur-md px-8">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        <input
          type="text"
          placeholder="Search tasks, agents, missions..."
          className="w-full rounded-lg border-none bg-surface-container-lowest py-2.5 pl-10 pr-4 font-mono text-xs text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-1 focus:ring-primary-container"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* API Usage Meter */}
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
            API
          </span>
          <div className="w-32 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className="h-full rounded-full bg-secondary-container transition-all duration-500"
              style={{ width: `${apiUsage}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-secondary">
            {apiUsage}%
          </span>
        </div>

        <div className="h-6 w-px bg-outline-variant/20" />

        {/* Notification button */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/50">
          <Bell className="h-[18px] w-[18px]" />
          {events.length > 0 && (
            <Badge className={`absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] p-0 flex items-center justify-center text-[10px] font-mono ${errorCount > 0 ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}>
              {events.length > 99 ? '99+' : events.length}
            </Badge>
          )}
        </Button>

        {/* Analytics button */}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/50">
          <BarChart3 className="h-[18px] w-[18px]" />
        </Button>

        <div className="h-6 w-px bg-outline-variant/20" />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2.5 px-2 rounded-lg hover:bg-surface-container-low/50">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px] font-mono bg-primary-container text-on-primary-container">
                  {user?.avatar ?? 'MC'}
                </AvatarFallback>
              </Avatar>
              {user && (
                <span className="font-mono text-xs text-on-surface hidden lg:inline">
                  {user.name}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-surface-container border-outline-variant/20">
            {user && (
              <>
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium text-on-surface">{user.name}</p>
                  <p className="text-xs text-on-surface-variant">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-outline-variant/20" />
              </>
            )}
            <DropdownMenuItem className="text-on-surface-variant hover:text-on-surface">Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="text-on-surface-variant hover:text-on-surface">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-outline-variant/20" />
            <DropdownMenuItem onClick={handleLogout} className="text-error">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
