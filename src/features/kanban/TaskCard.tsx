import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { PRIORITY_COLORS, PRIORITY_SYMBOLS, AGENT_MAP, STATUS_DOT_COLORS } from '@/lib/constants'
import { useAgentStore } from '@/stores/agentStore'
import type { Task } from '@/stores/taskStore'

function relativeTime(ts: number) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 6e4)
  if (m < 60) return m < 1 ? 'just now' : `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface TaskCardProps {
  task: Task
  onClick: () => void
  index?: number
}

export function TaskCard({ task, onClick, index = 0 }: TaskCardProps) {
  const storeAgents = useAgentStore((s) => s.agents)
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id, data: { type: 'task', task } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    animationDelay: `${Math.min(index * 0.03, 0.25)}s`,
  }

  // Resolve assignee dynamically — check store agents first, fall back to static AGENT_MAP
  const storeAgent = task.assignedAgentId ? storeAgents.find(a => a.id === task.assignedAgentId) : null
  const constAgent = task.assignee ? AGENT_MAP[task.assignee] : null
  const agentName = storeAgent?.name || constAgent?.name || null
  const agentColor = constAgent?.color || '#71695e'
  const agentInitial = constAgent?.initial || (agentName ? agentName[0].toUpperCase() : '?')

  const prioColor = PRIORITY_COLORS[task.priority]
  const prioSymbol = PRIORITY_SYMBOLS[task.priority]
  const pct = task.progress || 0
  const sub = task.subtasks || [0, 0]
  const tags = task.tags?.length ? task.tags : task.labels
  const isDone = task.status === 'done'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group bg-white border border-[#eeebe4] rounded-[10px] p-3 cursor-grab animate-fade-in',
        'transition-all duration-150',
        'hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] hover:-translate-y-px',
        isDragging && 'opacity-30 rotate-[1.5deg] shadow-lg',
        isDone && 'opacity-60'
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {/* Priority + Title */}
      <div className="flex items-start gap-1.5 mb-1">
        <span className="text-[0.65rem] font-extrabold shrink-0 mt-px leading-none" style={{ color: prioColor }}>
          {prioSymbol}
        </span>
        <p className={cn('text-[0.75rem] font-semibold leading-snug flex-1 text-[#1a1a1a]', isDone && 'line-through text-[#a19a8f]')}>
          {task.title}
        </p>
        <span className="text-sm text-[#c5c0b8] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">›</span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-[0.64rem] text-[#71695e] leading-relaxed mb-2 line-clamp-2">{task.description}</p>
      )}

      {/* Progress Bar */}
      {sub[1] > 0 && (
        <div className="h-[3px] bg-[#f4f1eb] rounded-full mb-2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%`, background: prioColor }} />
        </div>
      )}

      {/* Assignee + Time */}
      <div className="flex items-center justify-between mb-1">
        {agentName ? (
          <div className="flex items-center gap-1.5">
            <div className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ background: agentColor }}>
              {agentInitial}
            </div>
            <span className="text-[0.6rem] text-[#71695e] font-medium">{agentName}</span>
          </div>
        ) : (
          <span className="text-[0.58rem] text-[#c5c0b8] italic">unassigned</span>
        )}
        <span className="text-[0.52rem] text-[#a19a8f] tabular-nums">{relativeTime(task.createdAt)}</span>
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-[2px] mb-1">
          {tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-[0.5rem] px-[5px] py-px bg-[#f0ece5] border border-[#eeebe4] rounded-[3px] text-[#6b6560] font-medium">
              {tag}
            </span>
          ))}
          {tags.length > 4 && <span className="text-[0.5rem] text-[#a19a8f] font-medium">+{tags.length - 4}</span>}
        </div>
      )}

      {/* Footer */}
      {(sub[1] > 0 || task.comments > 0 || task.commits > 0) && (
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[#f0ece5]">
          {sub[1] > 0 && (
            <span className="text-[0.5rem] text-[#a19a8f] font-medium tabular-nums">
              <strong className="text-[#71695e]">{sub[0]}/{sub[1]}</strong> sub
            </span>
          )}
          {task.comments > 0 && (
            <span className="text-[0.5rem] text-[#a19a8f] font-medium tabular-nums">
              <strong className="text-[#71695e]">{task.comments}</strong> msg
            </span>
          )}
          {task.commits > 0 && (
            <span className="text-[0.5rem] text-[#a19a8f] font-medium tabular-nums">
              <strong className="text-[#71695e]">{task.commits}</strong> commits
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function TaskCardOverlay({ task }: { task: Task }) {
  const prioColor = PRIORITY_COLORS[task.priority]
  const prioSymbol = PRIORITY_SYMBOLS[task.priority]

  return (
    <div className="w-60 bg-white border border-[#d4870b]/30 rounded-[10px] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.15)] rotate-[2deg]">
      <div className="flex items-start gap-1.5">
        <span className="text-[0.65rem] font-extrabold shrink-0 mt-px" style={{ color: prioColor }}>{prioSymbol}</span>
        <p className="text-[0.75rem] font-semibold leading-snug text-[#1a1a1a] line-clamp-2">{task.title}</p>
      </div>
    </div>
  )
}
