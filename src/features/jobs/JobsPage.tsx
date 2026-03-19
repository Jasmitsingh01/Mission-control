import { Clock } from 'lucide-react'

export function JobsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
      <Clock className="h-12 w-12 mb-4 text-primary/50" />
      <h2 className="text-xl font-semibold text-foreground">Scheduled Jobs</h2>
      <p className="text-sm mt-1">Job scheduler coming in Phase 4</p>
    </div>
  )
}
