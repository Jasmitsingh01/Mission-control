import { Plus, LayoutGrid, Wifi, WifiOff } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { KanbanBoard } from './KanbanBoard'
import { CreateTaskDialog } from './CreateTaskDialog'
import { LiveFeed } from './LiveFeed'
import { useTaskStore } from '@/stores/taskStore'
import { useAgentStore } from '@/stores/agentStore'
import { useExecutionStore } from '@/stores/executionStore'

export function KanbanPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const tasks = useTaskStore(s => s.tasks)
  const agents = useAgentStore(s => s.agents)
  const executions = useExecutionStore(s => s.executions)
  const isConnected = useExecutionStore(s => s.isConnected)
  const connectWebSocket = useExecutionStore(s => s.connectWebSocket)
  const fetchExecutions = useExecutionStore(s => s.fetchExecutions)

  // Auto-connect WebSocket and fetch executions on mount
  useEffect(() => {
    connectWebSocket()
    fetchExecutions().catch(() => {})
  }, [connectWebSocket, fetchExecutions])

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter(t => t.status === 'done').length
    const active = total - done
    const running = executions.filter(e => e.status === 'running').length
    const runningAgents = agents.filter(a => a.status === 'running').length
    return { total, done, active, running, runningAgents }
  }, [tasks, agents, executions])

  return (
    <div className="flex flex-col h-full min-h-full bg-[#faf8f3]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-[#e6e2da] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4870b] to-[#b5720a] flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-[0.88rem] font-bold text-[#1a1a1a] tracking-tight leading-none">Task Board</h1>
            <p className="text-[0.58rem] text-[#a19a8f] mt-0.5 flex items-center gap-1.5">
              Mission Queue &middot; {stats.total} tasks
              {stats.running > 0 && (
                <span className="text-[#3b7dd8] font-semibold">&middot; {stats.running} executing</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Live stats */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <span className="block text-lg font-extrabold text-[#1a1a1a] leading-none tabular-nums">{stats.active}</span>
              <span className="text-[0.48rem] font-bold text-[#a19a8f] tracking-[0.08em] uppercase">Active</span>
            </div>
            <div className="w-px h-6 bg-[#e6e2da]" />
            <div className="text-center">
              <span className="block text-lg font-extrabold text-[#2d9a4e] leading-none tabular-nums">{stats.done}</span>
              <span className="text-[0.48rem] font-bold text-[#a19a8f] tracking-[0.08em] uppercase">Done</span>
            </div>
            {(stats.running > 0 || stats.runningAgents > 0) && (
              <>
                <div className="w-px h-6 bg-[#e6e2da]" />
                <div className="text-center">
                  <span className="block text-lg font-extrabold text-[#3b7dd8] leading-none tabular-nums">
                    {stats.running || stats.runningAgents}
                  </span>
                  <span className="text-[0.48rem] font-bold text-[#a19a8f] tracking-[0.08em] uppercase">
                    {stats.running > 0 ? 'Running' : 'Agents'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Connection indicator */}
          <div className="flex items-center gap-1">
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5 text-[#2d9a4e]" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-[#a19a8f]" />
            )}
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
