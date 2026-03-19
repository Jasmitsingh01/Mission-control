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
          <button className="font-mono uppercase tracking-widest text-[10px] font-bold px-4 py-2.5 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all flex items-center gap-2">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="synthetic-gradient text-white font-mono uppercase tracking-widest text-[10px] font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
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
