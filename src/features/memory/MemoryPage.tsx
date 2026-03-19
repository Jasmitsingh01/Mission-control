import { useState, useMemo } from 'react'
import {
  Brain,
  Search,
  Trash2,
  Bot,
  MessageSquare,
  Lightbulb,
  Heart,
  FileText,
  Wrench,
  Clock,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useMemoryStore } from '@/stores/memoryStore'
import type { MemoryType } from '@/stores/memoryStore'

const typeConfig: Record<MemoryType, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }> = {
  conversation: { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Conversation' },
  fact: { icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Fact' },
  preference: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'Preference' },
  context: { icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Context' },
  tool_result: { icon: Wrench, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Tool Result' },
}

export function MemoryPage() {
  const { entries, deleteEntry } = useMemoryStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<MemoryType | 'all'>('all')
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const agents = useMemo(() => {
    const unique = new Map<string, string>()
    entries.forEach((e) => unique.set(e.agentId, e.agentName))
    return Array.from(unique, ([id, name]) => ({ id, name }))
  }, [entries])

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (typeFilter !== 'all' && e.type !== typeFilter) return false
      if (agentFilter !== 'all' && e.agentId !== agentFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return e.content.toLowerCase().includes(q) || e.agentName.toLowerCase().includes(q)
      }
      return true
    })
  }, [entries, typeFilter, agentFilter, searchQuery])

  const stats = useMemo(() => ({
    total: entries.length,
    facts: entries.filter((e) => e.type === 'fact').length,
    agents: new Set(entries.map((e) => e.agentId)).size,
    expiring: entries.filter((e) => e.expiresAt && e.expiresAt < Date.now() + 86400000 * 7).length,
  }), [entries])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Memory Browser</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review what your agents have learned across sessions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Memories', value: stats.total, color: '' },
          { label: 'Facts Stored', value: stats.facts, color: 'text-yellow-400' },
          { label: 'Agents', value: stats.agents, color: 'text-blue-400' },
          { label: 'Expiring Soon', value: stats.expiring, color: 'text-orange-400' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
            <Button
              variant={typeFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setTypeFilter('all')}
            >
              All
            </Button>
            {(Object.keys(typeConfig) as MemoryType[]).map((t) => {
              const cfg = typeConfig[t]
              const Icon = cfg.icon
              return (
                <Button
                  key={t}
                  variant={typeFilter === t ? 'default' : 'ghost'}
                  size="sm"
                  className={cn('h-7 text-xs gap-1', typeFilter !== t && cfg.color)}
                  onClick={() => setTypeFilter(t)}
                >
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Memory List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Memories
            <Badge variant="secondary" className="text-xs">{filteredEntries.length}</Badge>
          </CardTitle>
        </CardHeader>
        <Separator />
        <div>
          <div className="divide-y divide-border/50">
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => {
                const cfg = typeConfig[entry.type]
                const TypeIcon = cfg.icon
                const isExpanded = expandedId === entry.id
                return (
                  <div
                    key={entry.id}
                    className="px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('rounded-full p-1.5 mt-0.5 shrink-0', cfg.bg)}>
                        <TypeIcon className={cn('h-3.5 w-3.5', cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm leading-relaxed', !isExpanded && 'line-clamp-2')}>
                          {entry.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            {entry.agentName}
                          </span>
                          <Badge variant="secondary" className={cn('text-[10px]', cfg.bg, cfg.color)}>
                            {cfg.label}
                          </Badge>
                          <span className="font-mono text-muted-foreground/60">{entry.sessionId}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          {entry.expiresAt && (
                            <span className={cn(
                              'text-[10px]',
                              entry.expiresAt < Date.now() + 86400000 * 7 ? 'text-orange-400' : 'text-muted-foreground'
                            )}>
                              Expires {new Date(entry.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>

                        {/* Expanded metadata */}
                        {isExpanded && entry.metadata && (
                          <div className="mt-3 rounded-md bg-muted/30 border border-border p-2">
                            <p className="text-[11px] text-muted-foreground font-medium mb-1">Metadata</p>
                            <pre className="text-[11px] font-mono text-muted-foreground overflow-x-auto">
                              {JSON.stringify(entry.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 hover:opacity-100 focus:opacity-100"
                        onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id) }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Brain className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No memories match your search</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
