import { Plus, Filter } from 'lucide-react'
import { useState } from 'react'
import { KanbanBoard } from './KanbanBoard'
import { CreateTaskDialog } from './CreateTaskDialog'

export function KanbanPage() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6 pb-4 bg-surface-dim min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-secondary mb-2">Workflow</p>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Task Board</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            Drag tasks between columns to update their status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-sm font-medium px-4 py-2 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-on-primary text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="overflow-x-auto overflow-y-hidden">
        <KanbanBoard />
      </div>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultStatus="inbox"
      />
    </div>
  )
}
