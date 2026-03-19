import {
  KanbanSquare,
  Bot,
  Clock,
  Activity,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const stats = [
  {
    title: 'Active Tasks',
    value: '12',
    change: '+3 today',
    icon: KanbanSquare,
    color: 'text-blue-400',
    href: '/board',
  },
  {
    title: 'Running Agents',
    value: '4',
    change: '2 idle',
    icon: Bot,
    color: 'text-green-400',
    href: '/agents',
  },
  {
    title: 'Scheduled Jobs',
    value: '8',
    change: 'Next in 12m',
    icon: Clock,
    color: 'text-orange-400',
    href: '/jobs',
  },
  {
    title: 'Events Today',
    value: '147',
    change: '+23%',
    icon: Activity,
    color: 'text-purple-400',
    href: '/activity',
  },
]

const recentActivity = [
  { id: 1, message: 'Code Review Agent completed task "Fix auth middleware"', time: '2m ago', type: 'success' as const },
  { id: 2, message: 'Data Pipeline job started — fetching market data', time: '5m ago', type: 'info' as const },
  { id: 3, message: 'Research Agent moved "API Integration" to Testing', time: '12m ago', type: 'info' as const },
  { id: 4, message: 'Notification Agent encountered rate limit error', time: '18m ago', type: 'error' as const },
  { id: 5, message: 'New task "Optimize P2P matching" added to Inbox', time: '25m ago', type: 'info' as const },
]

const severityColors = {
  success: 'bg-green-500/20 text-green-400',
  info: 'bg-blue-500/20 text-blue-400',
  error: 'bg-red-500/20 text-red-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
}

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mission Control</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your AI agent orchestration command center
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} to={stat.href}>
            <Card className="hover:bg-card/80 transition-colors cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
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
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link
              to="/activity"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <Badge
                    variant="secondary"
                    className={`mt-0.5 shrink-0 ${severityColors[event.type]}`}
                  >
                    {event.type}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{event.message}</p>
                    <p className="text-xs text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agent Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Agent Status</CardTitle>
            <Link
              to="/agents"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Manage
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Code Review Agent', status: 'running', model: 'Claude Sonnet', tasks: 3 },
                { name: 'Research Agent', status: 'running', model: 'GPT-4o', tasks: 2 },
                { name: 'Data Pipeline Agent', status: 'running', model: 'Claude Haiku', tasks: 1 },
                { name: 'Notification Agent', status: 'error', model: 'Claude Haiku', tasks: 0 },
                { name: 'Testing Agent', status: 'idle', model: 'Claude Sonnet', tasks: 0 },
              ].map((agent) => (
                <div key={agent.name} className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      agent.status === 'running'
                        ? 'bg-green-400 animate-pulse'
                        : agent.status === 'error'
                          ? 'bg-red-400'
                          : 'bg-muted-foreground'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.model}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {agent.tasks > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {agent.tasks} tasks
                      </Badge>
                    )}
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
