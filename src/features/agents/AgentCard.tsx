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
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

const statusConfig: Record<AgentStatus, { color: string; bg: string; label: string; dot: string }> = {
  running: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Running', dot: 'bg-green-400 animate-pulse' },
  idle: { color: 'text-muted-foreground', bg: 'bg-muted', label: 'Idle', dot: 'bg-muted-foreground' },
  paused: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Paused', dot: 'bg-yellow-400' },
  stopped: { color: 'text-muted-foreground', bg: 'bg-muted', label: 'Stopped', dot: 'bg-muted-foreground/50' },
  error: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Error', dot: 'bg-red-400' },
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
    <Card className="hover:border-primary/30 transition-colors cursor-pointer group" onClick={onClick}>
      <CardContent className="pt-4 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn('rounded-lg p-2', status.bg)}>
              <Bot className={cn('h-5 w-5', status.color)} />
            </div>
            <div>
              <h3 className="font-medium text-sm">{agent.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                <span className={cn('text-[11px]', status.color)}>{status.label}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <DropdownMenuItem className="text-destructive" onClick={() => deleteAgent(agent.id)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{agent.description}</p>

        {/* Model badge */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className={cn('text-[10px]', providerColors[agent.provider])}>
            {agent.provider}
          </Badge>
          <span className="text-[11px] text-muted-foreground font-mono">{agent.model}</span>
        </div>

        {/* Error message */}
        {agent.errorMessage && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 mb-3">
            <p className="text-[11px] text-red-400 line-clamp-2">{agent.errorMessage}</p>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {agent.tasksCompleted} completed
          </span>
          <span className="flex items-center gap-1">
            <ListTodo className="h-3 w-3" />
            {agent.tasksAssigned} assigned
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="h-3 w-3" />
            {formatUptime(agent.uptime)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
