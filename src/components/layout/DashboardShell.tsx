import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useConvexSync } from '@/hooks/useConvexSync'

export function DashboardShell() {
  // Sync Convex real-time data into Zustand stores
  useConvexSync()

  return (
    <div className="flex h-screen bg-surface-dim">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 ml-64">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-8 py-6 pb-16">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom Status Bar */}
      <div className="fixed bottom-0 left-64 right-0 z-30 flex h-8 items-center justify-between border-t border-outline-variant/20 bg-surface-container-lowest px-6">
        {/* Left: status indicators */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary-container animate-pulse" />
            <span className="font-mono text-[10px] text-on-surface-variant">
              3 agents active
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
            <span className="font-mono text-[10px] text-on-surface-variant">
              Queue: 12 tasks
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-mono text-[10px] text-on-surface-variant">
              Memory: 2.4 GB used
            </span>
          </div>
        </div>

        {/* Right: sync + version */}
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-outline">
            Last sync: 2 seconds ago
          </span>
          <span className="font-mono text-[10px] text-outline-variant">
            v1.2.4-PROD
          </span>
        </div>
      </div>
    </div>
  )
}
