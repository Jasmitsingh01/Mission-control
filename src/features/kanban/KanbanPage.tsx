import { KanbanSquare } from 'lucide-react'

export function KanbanPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
      <KanbanSquare className="h-12 w-12 mb-4 text-primary/50" />
      <h2 className="text-xl font-semibold text-foreground">Task Board</h2>
      <p className="text-sm mt-1">Kanban board coming in Phase 1</p>
    </div>
  )
}
