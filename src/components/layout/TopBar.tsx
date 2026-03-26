import { Search, Bell, LogOut, BarChart3, X, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
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

const severityDotColors: Record<string, string> = {
  success: 'bg-green-500',
  info: 'bg-secondary',
  error: 'bg-error',
  warning: 'bg-tertiary',
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function TopBar() {
  const navigate = useNavigate()
  const events = useActivityStore((s) => s.events)
  const clearEvents = useActivityStore((s) => s.clearEvents)
  const { user, logout } = useAuthStore()
  const errorCount = events.filter((e) => e.severity === 'error').length

  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // Close notification panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [notifOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-outline-variant/20 bg-surface-dim/80 backdrop-blur-md px-8">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        <input
          type="text"
          placeholder="Search tasks, agents, missions..."
          className="w-full rounded-lg border-none bg-surface-container-lowest py-2.5 pl-10 pr-4 font-mono text-xs text-on-surface placeholder:text-outline/60 focus:outline-none focus:ring-1 focus:ring-primary/20"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification button + panel */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/50"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <Bell className="h-[18px] w-[18px]" />
            {events.length > 0 && (
              <Badge className={`absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] p-0 flex items-center justify-center text-[10px] font-mono ${errorCount > 0 ? 'bg-error text-white' : 'bg-primary text-on-primary'}`}>
                {events.length > 99 ? '99+' : events.length}
              </Badge>
            )}
          </Button>

          {/* Notification dropdown panel */}
          {notifOpen && (
            <div className="absolute right-0 top-11 w-96 bg-card border border-outline-variant/30 rounded-xl shadow-lg z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                <h3 className="text-sm font-semibold text-on-surface">Notifications</h3>
                <div className="flex items-center gap-2">
                  {events.length > 0 && (
                    <button
                      onClick={() => { clearEvents(); setNotifOpen(false) }}
                      className="text-xs text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Events list */}
              <div className="max-h-80 overflow-y-auto">
                {events.length > 0 ? (
                  <div className="divide-y divide-outline-variant/10">
                    {events.slice(0, 20).map((event) => (
                      <div
                        key={event.id}
                        className="px-4 py-3 hover:bg-surface-container/50 transition-colors cursor-pointer"
                        onClick={() => { setNotifOpen(false); navigate('/dashboard/activity') }}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${severityDotColors[event.severity] || 'bg-outline'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-on-surface leading-snug">{event.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-outline font-mono">{timeAgo(event.timestamp)}</span>
                              <span className={`text-[10px] font-mono font-medium uppercase ${
                                event.severity === 'error' ? 'text-error' :
                                event.severity === 'warning' ? 'text-tertiary' :
                                event.severity === 'success' ? 'text-green-500' :
                                'text-outline'
                              }`}>
                                {event.severity}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant">
                    <Bell className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No notifications</p>
                    <p className="text-xs text-outline mt-1">Activity events will appear here</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {events.length > 0 && (
                <div className="border-t border-outline-variant/20 px-4 py-2.5">
                  <button
                    onClick={() => { setNotifOpen(false); navigate('/dashboard/activity') }}
                    className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    View all activity
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
          <DropdownMenuContent align="end" className="w-56 bg-card border-outline-variant/20">
            {user && (
              <>
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium text-on-surface">{user.name}</p>
                  <p className="text-xs text-on-surface-variant">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-outline-variant/20" />
              </>
            )}
            <DropdownMenuItem onClick={() => navigate('/dashboard/profile')} className="text-on-surface-variant hover:text-on-surface">Profile</DropdownMenuItem>
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
