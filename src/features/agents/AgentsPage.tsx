import { useState, useMemo } from 'react'
import { Plus, Bot, Filter } from 'lucide-react'
import { useAgentStore } from '@/stores/agentStore'
import type { Agent, AgentStatus } from '@/stores/agentStore'
import { AgentCard } from './AgentCard'
import { SpawnAgentDialog } from './SpawnAgentDialog'
import { AgentDetailView } from './AgentDetailView'
import { cn } from '@/lib/utils'

export function AgentsPage() {
  const agents = useAgentStore((s) => s.agents)
  const [spawnOpen, setSpawnOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all')

  const filteredAgents = useMemo(
    () => statusFilter === 'all' ? agents : agents.filter((a) => a.status === statusFilter),
    [agents, statusFilter]
  )

  const stats = useMemo(() => ({
    total: agents.length,
    running: agents.filter((a) => a.status === 'running').length,
    idle: agents.filter((a) => a.status === 'idle').length,
    error: agents.filter((a) => a.status === 'error').length,
  }), [agents])

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Agents</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            Manage and monitor your AI agent fleet
          </p>
        </div>
        <button
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-on-primary font-mono text-[10px] uppercase tracking-widest font-bold transition-colors hover:bg-primary/90"
          onClick={() => setSpawnOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Spawn Agent
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Agents', value: stats.total, color: 'text-on-surface' },
          { label: 'Running', value: stats.running, color: 'text-secondary' },
          { label: 'Idle', value: stats.idle, color: 'text-on-surface-variant' },
          { label: 'Errors', value: stats.error, color: 'text-error' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold">{s.label}</p>
            <p className={cn('text-2xl font-bold mt-1 font-[\'JetBrains_Mono\']', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1.5">
        <Filter className="h-4 w-4 text-outline mr-1" />
        {(['all', 'running', 'idle', 'paused', 'stopped', 'error'] as const).map((s) => (
          <button
            key={s}
            className={cn(
              'h-7 px-3 rounded-full font-[\'JetBrains_Mono\'] text-[10px] uppercase tracking-widest font-bold capitalize transition-colors',
              statusFilter === s
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            )}
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Agent Grid */}
      {filteredAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => { setSelectedAgent(agent); setDetailOpen(true) }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
          <Bot className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">No agents match your filter</p>
        </div>
      )}

      <SpawnAgentDialog open={spawnOpen} onOpenChange={setSpawnOpen} />
      <AgentDetailView agent={selectedAgent} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  )
}
