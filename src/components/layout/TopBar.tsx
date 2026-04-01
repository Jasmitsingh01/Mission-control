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
  success: 'bg-emerald-500',
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
    <header className="flex h-14 items-center justify-between border-b border-outline-variant/12 bg-surface/80 backdrop-blur-xl px-8">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-outline/50" />
        <input
          type="text"
          placeholder="Search tasks, agents, missions..."
          className="w-full rounded-xl border border-outline-variant/15 bg-surface-container-low/60 py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-outline/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30 transition-all"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notification button + panel */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-xl text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <Bell className="h-[18px] w-[18px]" />
            {events.length > 0 && (
              <Badge className={`absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] p-0 flex items-center justify-center text-[10px] font-mono border-2 border-surface ${errorCount > 0 ? 'bg-error text-white' : 'bg-primary text-on-primary'}`}>
                {events.length > 99 ? '99+' : events.length}
              </Badge>
            )}
          </Button>

          {/* Notification dropdown panel */}
          {notifOpen && (
            <div className="absolute right-0 top-12 w-[400px] bg-surface border border-outline-variant/20 rounded-2xl shadow-xl shadow-black/8 z-50 overflow-hidden animate-fade-in-scale">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline-variant/12">
                <h3 className="text-sm font-semibold text-on-surface font-[family-name:var(--font-headline)]">Notifications</h3>
                <div className="flex items-center gap-2">
                  {events.length > 0 && (
                    <button
                      onClick={() => { clearEvents(); setNotifOpen(false) }}
                      className="text-xs text-on-surface-variant hover:text-on-surface flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg hover:bg-surface-container"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="text-on-surface-variant/50 hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Events list */}
              <div className="max-h-80 overflow-y-auto">
                {events.length > 0 ? (
                  <div className="divide-y divide-outline-variant/8">
                    {events.slice(0, 20).map((event) => (
                      <div
                        key={event.id}
                        className="px-5 py-3.5 hover:bg-surface-container/50 transition-colors cursor-pointer"
                        onClick={() => { setNotifOpen(false); navigate('/dashboard/activity') }}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${severityDotColors[event.severity] || 'bg-outline'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-on-surface leading-snug">{event.message}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-outline/60 font-mono">{timeAgo(event.timestamp)}</span>
                              <span className={`text-[10px] font-mono font-semibold uppercase ${
                                event.severity === 'error' ? 'text-error' :
                                event.severity === 'warning' ? 'text-tertiary' :
                                event.severity === 'success' ? 'text-emerald-500' :
                                'text-outline/60'
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
                  <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                    <div className="rounded-2xl bg-surface-container p-4 mb-3">
                      <Bell className="h-6 w-6 opacity-30" />
                    </div>
                    <p className="text-sm font-medium">No notifications</p>
                    <p className="text-xs text-outline/60 mt-1">Activity events will appear here</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {events.length > 0 && (
                <div className="border-t border-outline-variant/12 px-5 py-3">
                  <button
                    onClick={() => { setNotifOpen(false); navigate('/dashboard/activity') }}
                    className="w-full text-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    View all activity
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analytics button */}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container">
          <BarChart3 className="h-[18px] w-[18px]" />
        </Button>

        <div className="h-6 w-px bg-outline-variant/15 mx-1" />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2.5 px-2 rounded-xl hover:bg-surface-container">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[10px] font-mono synthetic-gradient text-white font-bold">
                  {user?.avatar ?? 'MC'}
                </AvatarFallback>
              </Avatar>
              {user && (
                <span className="text-[13px] font-medium text-on-surface hidden lg:inline">
                  {user.name}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-surface border-outline-variant/15 rounded-xl shadow-xl shadow-black/8">
            {user && (
              <>
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold text-on-surface">{user.name}</p>
                  <p className="text-xs text-on-surface-variant">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-outline-variant/12" />
              </>
            )}
            <DropdownMenuItem onClick={() => navigate('/dashboard/profile')} className="text-on-surface-variant hover:text-on-surface rounded-lg">Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="text-on-surface-variant hover:text-on-surface rounded-lg">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-outline-variant/12" />
            <DropdownMenuItem onClick={handleLogout} className="text-error rounded-lg">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
