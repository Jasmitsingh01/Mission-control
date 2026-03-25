import {
  KanbanSquare,
  Bot,
  Clock,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Rocket,
  Terminal,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTaskStore } from '@/stores/taskStore'
import { useAgentStore } from '@/stores/agentStore'
import { useJobStore } from '@/stores/jobStore'
import { useActivityStore } from '@/stores/activityStore'

const severityColors: Record<string, string> = {
  success: 'text-green-400',
  info: 'text-secondary',
  error: 'text-error',
  warning: 'text-tertiary',
}

const severityDotColors: Record<string, string> = {
  success: 'bg-green-400',
  info: 'bg-secondary',
  error: 'bg-error',
  warning: 'bg-tertiary',
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
    { title: 'Active Tasks', value: activeTasks, change: doneTasks > 0 ? `${doneTasks} done` : 'No tasks yet', icon: KanbanSquare, color: 'text-primary', href: '/dashboard/board' },
    { title: 'Running Agents', value: runningAgents, change: idleAgents > 0 ? `${idleAgents} idle` : agents.length > 0 ? `${agents.length} total` : 'No agents yet', icon: Bot, color: 'text-secondary', href: '/dashboard/agents' },
    { title: 'Scheduled Jobs', value: activeJobs, change: nextJob ? `Next in ${nextJobTime}m` : 'No jobs yet', icon: Clock, color: 'text-tertiary', href: '/dashboard/jobs' },
    { title: 'Events', value: events.length, change: errorEvents > 0 ? `${errorEvents} errors` : 'No events yet', icon: Activity, color: 'text-on-surface', href: '/dashboard/activity' },
  ]

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="pt-2">
        <p className="font-mono text-xs uppercase tracking-widest text-secondary mb-2">Command Center</p>
        <h1 className="text-4xl font-black text-on-surface tracking-tight">Mission Control</h1>
        <p className="text-sm text-on-surface-variant mt-2">Your AI agent orchestration command center</p>
      </div>

      {/* Empty state CTA */}
      {isEmpty && (
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-8">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-surface-container p-5 mb-5">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-on-surface mb-3">Launch Your First Mission</h2>
            <p className="text-sm text-on-surface-variant max-w-lg mb-8 leading-relaxed">
              Describe what you want to build and Mission Control will assemble the perfect AI agent team, break down tasks, and assign work automatically.
            </p>
            <Link to="/dashboard/mission">
              <button className="bg-primary text-on-primary text-sm font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors">
                Launch Mission
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} to={stat.href}>
            <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 p-6 hover:border-primary/30 hover:bg-surface-container transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs uppercase tracking-widest text-on-surface-variant">{stat.title}</span>
                <stat.icon className={`h-5 w-5 ${stat.color} opacity-70`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`font-mono text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-on-surface-variant">
                  {stat.change}
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Activity */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline-variant/10">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-secondary" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-on-surface-variant">Recent Activity</span>
            </div>
            <Link to="/dashboard/activity" className="font-mono text-[10px] uppercase tracking-widest text-outline hover:text-on-surface transition-colors">View all</Link>
          </div>
          <div className="px-6 py-4">
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-start gap-3 group">
                    <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${severityDotColors[event.severity] || 'bg-outline'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-on-surface leading-relaxed">{event.message}</p>
                      <p className="font-mono text-[10px] text-outline mt-0.5">{timeAgo(event.timestamp)}</p>
                    </div>
                    <span className={`font-mono text-[10px] font-bold uppercase ${severityColors[event.severity] || 'text-outline'}`}>
                      {event.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                <Activity className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">No activity yet</p>
                <p className="font-mono text-[10px] text-outline mt-1">Launch a mission to see events here</p>
              </div>
            )}
          </div>
        </div>

        {/* Agents */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline-variant/10">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-on-surface-variant">Agent Status</span>
            </div>
            <Link to="/dashboard/agents" className="font-mono text-[10px] uppercase tracking-widest text-outline hover:text-on-surface transition-colors">Manage</Link>
          </div>
          <div className="px-6 py-4">
            {agents.length > 0 ? (
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-3 bg-surface-container p-3 rounded-lg group hover:bg-surface-container-high transition-colors">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${
                      agent.status === 'running' ? 'bg-green-500'
                      : agent.status === 'error' ? 'bg-error'
                      : 'bg-outline'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-on-surface truncate">{agent.name}</p>
                      <p className="font-mono text-[10px] text-outline mt-0.5">{agent.model}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {agent.tasksAssigned > 0 && (
                        <span className="font-mono text-[10px] font-bold bg-surface-container-highest px-2 py-0.5 rounded text-on-surface-variant">
                          {agent.tasksAssigned} tasks
                        </span>
                      )}
                      <TrendingUp className="h-3.5 w-3.5 text-outline opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                <Bot className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">No agents deployed</p>
                <p className="font-mono text-[10px] text-outline mt-1">Spawn agents or launch a mission</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
