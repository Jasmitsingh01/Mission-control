import { Plus, LayoutGrid } from 'lucide-react'
import { useState, useMemo } from 'react'
import { KanbanBoard } from './KanbanBoard'
import { CreateTaskDialog } from './CreateTaskDialog'
import { LiveFeed } from './LiveFeed'
import { useTaskStore } from '@/stores/taskStore'
import { useAgentStore } from '@/stores/agentStore'

export function KanbanPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const tasks = useTaskStore((s) => s.tasks)
  const agents = useAgentStore((s) => s.agents)

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter(t => t.status === 'done').length
    const active = total - done
    const activeAgents = agents.filter(a => a.status === 'running').length
    return { total, done, active, activeAgents }
  }, [tasks, agents])

  return (
    <div className="flex flex-col h-full min-h-full bg-[#faf8f3]">
      {/* Header bar */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-[#e6e2da] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4870b] to-[#b5720a] flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-[0.88rem] font-bold text-[#1a1a1a] tracking-tight leading-none">Task Board</h1>
            <p className="text-[0.6rem] text-[#a19a8f] mt-0.5">Mission Queue &middot; {stats.total} tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Dynamic stats */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <span className="block text-lg font-extrabold text-[#1a1a1a] leading-none tabular-nums">{stats.active}</span>
              <span className="text-[0.5rem] font-bold text-[#a19a8f] tracking-[0.08em] uppercase">Active</span>
            </div>
            <div className="w-px h-6 bg-[#e6e2da]" />
            <div className="text-center">
              <span className="block text-lg font-extrabold text-[#2d9a4e] leading-none tabular-nums">{stats.done}</span>
              <span className="text-[0.5rem] font-bold text-[#a19a8f] tracking-[0.08em] uppercase">Done</span>
            </div>
            <div className="w-px h-6 bg-[#e6e2da]" />
            <div className="text-center">
              <span className="block text-lg font-extrabold text-[#3b7dd8] leading-none tabular-nums">{stats.activeAgents}</span>
              <span className="text-[0.5rem] font-bold text-[#a19a8f] tracking-[0.08em] uppercase">Agents</span>
            </div>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-[#1a1a1a] text-white text-[0.72rem] font-semibold px-4 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-[#333] active:scale-[0.97] transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            New Task
          </button>
        </div>
      </header>

      {/* Main: Board + Live Feed */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        <div className="flex-1 overflow-hidden flex flex-col min-w-0">
          <KanbanBoard />
        </div>
        <LiveFeed />
      </div>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} defaultStatus="backlog" />
    </div>
  )
}
