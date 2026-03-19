import { Activity } from 'lucide-react'

export function ActivityPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
      <Activity className="h-12 w-12 mb-4 text-primary/50" />
      <h2 className="text-xl font-semibold text-foreground">Activity Feed</h2>
      <p className="text-sm mt-1">Live activity feed coming in Phase 2</p>
    </div>
  )
}
