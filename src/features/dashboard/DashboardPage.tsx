import {
  KanbanSquare,
  Bot,
  Clock,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Rocket,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTaskStore } from '@/stores/taskStore'
import { useAgentStore } from '@/stores/agentStore'
import { useJobStore } from '@/stores/jobStore'
import { useActivityStore } from '@/stores/activityStore'

const severityColors: Record<string, string> = {
  success: 'bg-green-500/20 text-green-400',
  info: 'bg-blue-500/20 text-blue-400',
  error: 'bg-red-500/20 text-red-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function DashboardPage() {
  const tasks = useTaskStore((s) => s.tasks)
  const agents = useAgentStore((s) => s.agents)
  const jobs = useJobStore((s) => s.jobs)
  const events = useActivityStore((s) => s.events)

  const activeTasks = tasks.filter((t) => t.status !== 'done').length
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const runningAgents = agents.filter((a) => a.status === 'running').length
  const idleAgents = agents.filter((a) => a.status === 'idle').length
  const activeJobs = jobs.filter((j) => j.enabled).length
  const nextJob = jobs.filter((j) => j.enabled).sort((a, b) => a.nextRunAt - b.nextRunAt)[0]
  const nextJobTime = nextJob ? Math.max(0, Math.floor((nextJob.nextRunAt - Date.now()) / 60000)) : 0
  const errorEvents = events.filter((e) => e.severity === 'error').length

  const isEmpty = tasks.length === 0 && agents.length === 0

  const stats = [
    { title: 'Active Tasks', value: activeTasks, change: doneTasks > 0 ? `${doneTasks} done` : 'No tasks yet', icon: KanbanSquare, color: 'text-blue-400', href: '/board' },
    { title: 'Running Agents', value: runningAgents, change: idleAgents > 0 ? `${idleAgents} idle` : agents.length > 0 ? `${agents.length} total` : 'No agents yet', icon: Bot, color: 'text-green-400', href: '/agents' },
    { title: 'Scheduled Jobs', value: activeJobs, change: nextJob ? `Next in ${nextJobTime}m` : 'No jobs yet', icon: Clock, color: 'text-orange-400', href: '/jobs' },
    { title: 'Events', value: events.length, change: errorEvents > 0 ? `${errorEvents} errors` : 'No events yet', icon: Activity, color: 'text-purple-400', href: '/activity' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mission Control</h1>
        <p className="text-sm text-muted-foreground mt-1">Your AI agent orchestration command center</p>
      </div>

      {/* Empty state CTA */}
      {isEmpty && (
        <Card className="border-primary/30 bg-linear-to-r from-primary/5 to-primary/10">
          <CardContent className="py-10">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Launch Your First Mission</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Describe what you want to build and Mission Control will assemble the perfect AI agent team, break down tasks, and assign work automatically.
              </p>
              <Link to="/mission">
                <Button size="lg" className="gap-2">
                  <Rocket className="h-4 w-4" />
                  Launch Mission
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} to={stat.href}>
            <Card className="hover:bg-card/80 transition-colors cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {stat.change}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link to="/activity" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all</Link>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <Badge variant="secondary" className={`mt-0.5 shrink-0 ${severityColors[event.severity]}`}>
                      {event.severity}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{event.message}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(event.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No activity yet</p>
                <p className="text-xs mt-1">Launch a mission to see events here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Agent Status</CardTitle>
            <Link to="/agents" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Manage</Link>
          </CardHeader>
          <CardContent>
            {agents.length > 0 ? (
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${
                      agent.status === 'running' ? 'bg-green-400 animate-pulse'
                      : agent.status === 'error' ? 'bg-red-400'
                      : 'bg-muted-foreground'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.model}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {agent.tasksAssigned > 0 && (
                        <Badge variant="secondary" className="text-xs">{agent.tasksAssigned} tasks</Badge>
                      )}
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Bot className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No agents deployed</p>
                <p className="text-xs mt-1">Spawn agents or launch a mission</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
