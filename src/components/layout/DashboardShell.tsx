import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useConvexSync } from '@/hooks/useConvexSync'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

export function DashboardShell() {
  // Sync Convex real-time data into Zustand stores
  useConvexSync()
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)

  return (
    <div className="flex h-screen bg-surface-dim bg-dots">
      <Sidebar />
      <div className={cn('flex flex-1 flex-col min-w-0 transition-all duration-300 ease-out', sidebarCollapsed ? 'ml-[68px]' : 'ml-64')}>
        <TopBar />
        <main className="flex-1 overflow-y-auto px-8 py-7 pb-16">
          <div className="mx-auto max-w-[1600px] animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
