import {
  Bot,
  Play,
  Pause,
  Square,
  RotateCcw,
  MoreVertical,
  Trash2,
  Settings,
  CheckCircle2,
  ListTodo,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Agent, AgentStatus } from '@/stores/agentStore'
import { useAgentStore } from '@/stores/agentStore'

const statusConfig: Record<AgentStatus, { color: string; bg: string; label: string; dot: string; border: string }> = {
  running: { color: 'text-secondary', bg: 'bg-secondary/10', label: 'Running', dot: 'bg-secondary', border: 'border-secondary/40' },
  idle: { color: 'text-on-surface-variant', bg: 'bg-surface-container-high', label: 'Idle', dot: 'bg-on-surface-variant', border: 'border-outline-variant/10' },
  paused: { color: 'text-tertiary', bg: 'bg-tertiary/10', label: 'Paused', dot: 'bg-tertiary', border: 'border-tertiary/30' },
  stopped: { color: 'text-outline', bg: 'bg-surface-container-high', label: 'Stopped', dot: 'bg-outline/50', border: 'border-outline-variant/10' },
  error: { color: 'text-error', bg: 'bg-error-container/20', label: 'Error', dot: 'bg-error', border: 'border-error/30' },
}

const providerColors: Record<string, string> = {
  anthropic: 'bg-orange-500/10 text-orange-400',
  openai: 'bg-emerald-500/10 text-emerald-400',
  google: 'bg-blue-500/10 text-blue-400',
  local: 'bg-purple-500/10 text-purple-400',
  custom: 'bg-pink-500/10 text-pink-400',
}

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
  return `${hours}h ${minutes}m`
}

interface AgentCardProps {
  agent: Agent
  onClick: () => void
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const { setAgentStatus, deleteAgent } = useAgentStore()
  const status = statusConfig[agent.status]

  return (
    <div
      className={cn(
        'bg-surface-container-low p-5 rounded-xl border transition-colors cursor-pointer group hover:border-primary/30',
        status.border
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-lg p-2', status.bg)}>
            <Bot className={cn('h-5 w-5', status.color)} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-on-surface">{agent.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
              <span className={cn("font-mono text-[10px] uppercase tracking-wider font-bold", status.color)}>{status.label}</span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-on-surface">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {agent.status !== 'running' && (
              <DropdownMenuItem onClick={() => setAgentStatus(agent.id, 'running')}>
                <Play className="h-4 w-4 mr-2" /> Start
              </DropdownMenuItem>
            )}
            {agent.status === 'running' && (
              <DropdownMenuItem onClick={() => setAgentStatus(agent.id, 'paused')}>
                <Pause className="h-4 w-4 mr-2" /> Pause
              </DropdownMenuItem>
            )}
            {agent.status !== 'stopped' && (
              <DropdownMenuItem onClick={() => setAgentStatus(agent.id, 'stopped')}>
                <Square className="h-4 w-4 mr-2" /> Stop
              </DropdownMenuItem>
            )}
            {agent.status === 'error' && (
              <DropdownMenuItem onClick={() => setAgentStatus(agent.id, 'running')}>
                <RotateCcw className="h-4 w-4 mr-2" /> Restart
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" /> Configure
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-error" onClick={() => deleteAgent(agent.id)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">{agent.description}</p>

      {/* Model badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("font-mono text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full", providerColors[agent.provider])}>
          {agent.provider}
        </span>
        <span className="font-mono text-[11px] text-outline">{agent.model}</span>
      </div>

      {/* Error message */}
      {agent.errorMessage && (
        <div className="rounded-lg bg-error-container/20 border border-error/20 px-2.5 py-1.5 mb-3">
          <p className="font-mono text-[11px] text-error line-clamp-2">{agent.errorMessage}</p>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 font-mono text-[11px] text-on-surface-variant">
        <span className="flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded-md">
          <CheckCircle2 className="h-3 w-3 text-secondary" />
          {agent.tasksCompleted}
        </span>
        <span className="flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded-md">
          <ListTodo className="h-3 w-3 text-primary" />
          {agent.tasksAssigned}
        </span>
        <span className="flex items-center gap-1 ml-auto text-outline">
          <Clock className="h-3 w-3" />
          {formatUptime(agent.uptime)}
        </span>
      </div>
    </div>
  )
}
