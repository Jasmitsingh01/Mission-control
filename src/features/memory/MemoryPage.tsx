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
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemoryStore } from '@/stores/memoryStore'
import type { MemoryType } from '@/stores/memoryStore'

const typeConfig: Record<MemoryType, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }> = {
  conversation: { icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10', label: 'Conversation' },
  fact: { icon: Lightbulb, color: 'text-tertiary', bg: 'bg-tertiary/10', label: 'Fact' },
  preference: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'Preference' },
  context: { icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Context' },
  tool_result: { icon: Wrench, color: 'text-secondary', bg: 'bg-secondary/10', label: 'Tool Result' },
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
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Memory Browser</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            Review what your agents have learned across sessions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Memories', value: stats.total, color: 'text-on-surface' },
          { label: 'Facts Stored', value: stats.facts, color: 'text-tertiary' },
          { label: 'Agents', value: stats.agents, color: 'text-primary' },
          { label: 'Expiring Soon', value: stats.expiring, color: 'text-error' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold">{s.label}</p>
            <p className={cn('text-2xl font-bold mt-1 font-[\'JetBrains_Mono\']', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
            <input
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-surface-container-lowest border-none text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="h-9 rounded-lg bg-surface-container-lowest border-none px-3 text-sm text-on-surface font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
          >
            <option value="all">All Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-outline mr-1" />
          <button
            className={cn(
              'h-7 px-3 rounded-full font-[\'JetBrains_Mono\'] text-[10px] uppercase tracking-widest font-bold transition-colors',
              typeFilter === 'all'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
            )}
            onClick={() => setTypeFilter('all')}
          >
            All
          </button>
          {(Object.keys(typeConfig) as MemoryType[]).map((t) => {
            const cfg = typeConfig[t]
            const Icon = cfg.icon
            return (
              <button
                key={t}
                className={cn(
                  'h-7 px-3 rounded-full font-[\'JetBrains_Mono\'] text-[10px] uppercase tracking-widest font-bold transition-colors flex items-center gap-1',
                  typeFilter === t
                    ? 'bg-primary text-on-primary'
                    : cn('bg-surface-container-high hover:text-on-surface', cfg.color)
                )}
                onClick={() => setTypeFilter(t)}
              >
                <Icon className="h-3 w-3" />
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Memory List */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/10">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-on-surface">Memories</span>
            <span className="font-mono text-[10px] bg-surface-container-highest text-primary px-2 py-0.5 rounded-full border border-primary/20">
              {filteredEntries.length}
            </span>
          </div>
        </div>
        <div className="divide-y divide-outline-variant/10">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => {
              const cfg = typeConfig[entry.type]
              const TypeIcon = cfg.icon
              const isExpanded = expandedId === entry.id
              return (
                <div
                  key={entry.id}
                  className="px-5 py-3 hover:bg-surface-container/50 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('rounded-full p-1.5 mt-0.5 shrink-0', cfg.bg)}>
                      <TypeIcon className={cn('h-3.5 w-3.5', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 text-outline shrink-0" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-outline shrink-0" />
                        )}
                        <p className={cn('text-sm text-on-surface leading-relaxed', !isExpanded && 'line-clamp-2')}>
                          {entry.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-2 font-mono text-[10px]">
                        <span className="flex items-center gap-1 text-on-surface-variant">
                          <Bot className="h-3 w-3" />
                          {entry.agentName}
                        </span>
                        <span className={cn('uppercase tracking-widest font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
                          {cfg.label}
                        </span>
                        <span className="text-outline">{entry.sessionId}</span>
                        <span className="flex items-center gap-1 text-outline">
                          <Clock className="h-3 w-3" />
                          {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {entry.expiresAt && (
                          <span className={cn(
                            'tracking-widest',
                            entry.expiresAt < Date.now() + 86400000 * 7 ? 'text-error' : 'text-outline'
                          )}>
                            Expires {new Date(entry.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {/* Expanded metadata */}
                      {isExpanded && entry.metadata && (
                        <div className="mt-3 rounded-lg bg-surface-container-lowest border border-outline-variant/10 p-3">
                          <p className="font-mono text-[10px] uppercase tracking-widest text-outline font-bold mb-2">Metadata</p>
                          <pre className="font-mono text-[11px] text-on-surface-variant overflow-x-auto">
                            {JSON.stringify(entry.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    <button
                      className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md opacity-0 hover:opacity-100 focus:opacity-100 hover:bg-error-container/20 transition-all"
                      onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id) }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-error" />
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <Brain className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No memories match your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
