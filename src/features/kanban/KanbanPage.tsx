import { Plus, LayoutGrid, Wifi, WifiOff, RefreshCw, Database, HardDrive } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { KanbanBoard } from './KanbanBoard'
import { CreateTaskDialog } from './CreateTaskDialog'
import { LiveFeed } from './LiveFeed'
import { useTaskStore } from '@/stores/taskStore'
import { useAgentStore } from '@/stores/agentStore'
import { useExecutionStore } from '@/stores/executionStore'
import { useMissionControlStore } from '@/stores/missionControlStore'
import { workspaceApi } from '@/lib/api'
import { cn } from '@/lib/utils'

export function KanbanPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const tasks = useTaskStore(s => s.tasks)
  const syncing = useTaskStore(s => s._syncing)
  const syncError = useTaskStore(s => s._lastSyncError)
  const workspaceId = useTaskStore(s => s._workspaceId)
  const setWorkspaceId = useTaskStore(s => s.setWorkspaceId)
  const fetchFromBackend = useTaskStore(s => s.fetchFromBackend)
  const agents = useAgentStore(s => s.agents)
  const executions = useExecutionStore(s => s.executions)
  const isConnected = useExecutionStore(s => s.isConnected)
  const connectWebSocket = useExecutionStore(s => s.connectWebSocket)
  const fetchExecutions = useExecutionStore(s => s.fetchExecutions)

  // Fetch workspaces and auto-select first one
  const { workspaces, setWorkspaces, activeWorkspace, setActiveWorkspace } = useMissionControlStore()
  const [wsLoading, setWsLoading] = useState(false)

  useEffect(() => {
    connectWebSocket()
    fetchExecutions().catch(() => {})

    // Fetch workspaces if not loaded
    if (workspaces.length === 0) {
      setWsLoading(true)
      workspaceApi.getAll().then(data => {
        const wsList = data.workspaces || data || []
        setWorkspaces(wsList)
        // Auto-select first workspace if none selected
        if (wsList.length > 0 && !workspaceId) {
          const ws = wsList[0]
          setActiveWorkspace(ws)
          setWorkspaceId(ws._id)
        }
      }).catch(() => {}).finally(() => setWsLoading(false))
    } else if (workspaces.length > 0 && !workspaceId) {
      setActiveWorkspace(workspaces[0])
      setWorkspaceId(workspaces[0]._id)
    }
  }, [])

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter(t => t.status === 'done').length
    const active = total - done
    const running = executions.filter(e => e.status === 'running').length
    return { total, done, active, running }
  }, [tasks, executions])

  const isBackendConnected = !!workspaceId && !syncError

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
            <div className="flex items-center gap-2 mt-0.5">
              {/* Workspace selector */}
              {workspaces.length > 0 ? (
                <select
                  value={workspaceId || ''}
                  onChange={(e) => {
                    const ws = workspaces.find(w => w._id === e.target.value)
                    if (ws) {
                      setActiveWorkspace(ws)
                      setWorkspaceId(ws._id)
                    }
                  }}
                  className="text-[0.55rem] text-[#71695e] bg-transparent border-none p-0 font-medium cursor-pointer focus:outline-none"
                >
                  {workspaces.map(ws => (
                    <option key={ws._id} value={ws._id}>{ws.name}</option>
                  ))}
                </select>
              ) : (
                <span className="text-[0.55rem] text-[#a19a8f]">
                  {wsLoading ? 'Loading workspaces...' : 'No workspace'}
                </span>
              )}
              <span className="text-[0.5rem] text-[#a19a8f]">&middot; {stats.total} tasks</span>
              {/* Sync status */}
              <span className={cn(
                'text-[0.45rem] font-bold uppercase tracking-wider px-1 py-px rounded flex items-center gap-0.5',
                isBackendConnected ? 'bg-[#2d9a4e]/8 text-[#2d9a4e]' : 'bg-[#d4870b]/8 text-[#d4870b]'
              )}>
                {isBackendConnected ? <Database className="w-2 h-2" /> : <HardDrive className="w-2 h-2" />}
                {isBackendConnected ? 'Synced' : syncError ? 'Local' : 'Local'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats */}
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
            {stats.running > 0 && (
              <>
                <div className="w-px h-6 bg-[#e6e2da]" />
                <div className="text-center">
                  <span className="block text-lg font-extrabold text-[#3b7dd8] leading-none tabular-nums">{stats.running}</span>
                  <span className="text-[0.48rem] font-bold text-[#a19a8f] tracking-[0.08em] uppercase">Running</span>
                </div>
              </>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchFromBackend()}
            disabled={syncing}
            className="p-1.5 rounded-md text-[#a19a8f] hover:text-[#1a1a1a] hover:bg-[#f4f1eb] transition-all disabled:opacity-50"
            title="Refresh from backend"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
          </button>

          {/* WS status */}
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-[#2d9a4e]" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-[#a19a8f]" />
          )}

          <button
            onClick={() => setCreateOpen(true)}
            className="bg-[#1a1a1a] text-white text-[0.72rem] font-semibold px-4 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-[#333] active:scale-[0.97] transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            New Task
          </button>
        </div>
      </header>

      {/* Main */}
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
