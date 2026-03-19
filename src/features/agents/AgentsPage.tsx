import { useState, useMemo } from 'react'
import { Plus, Bot, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAgentStore } from '@/stores/agentStore'
import type { Agent, AgentStatus } from '@/stores/agentStore'
import { AgentCard } from './AgentCard'
import { SpawnAgentDialog } from './SpawnAgentDialog'
import { AgentDetailView } from './AgentDetailView'

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and monitor your AI agent fleet
          </p>
        </div>
        <Button size="sm" onClick={() => setSpawnOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Spawn Agent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Agents', value: stats.total, color: '' },
          { label: 'Running', value: stats.running, color: 'text-green-400' },
          { label: 'Idle', value: stats.idle, color: 'text-muted-foreground' },
          { label: 'Errors', value: stats.error, color: 'text-red-400' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1.5">
        <Filter className="h-4 w-4 text-muted-foreground mr-1" />
        {(['all', 'running', 'idle', 'paused', 'stopped', 'error'] as const).map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'ghost'}
            size="sm"
            className="h-7 text-xs capitalize"
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </Button>
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
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Bot className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">No agents match your filter</p>
        </div>
      )}

      <SpawnAgentDialog open={spawnOpen} onOpenChange={setSpawnOpen} />
      <AgentDetailView agent={selectedAgent} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  )
}
