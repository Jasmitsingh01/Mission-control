export const TASK_STATUSES = [
  'planning',
  'inbox',
  'assigned',
  'in_progress',
  'testing',
  'review',
  'done',
] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export const STATUS_LABELS: Record<TaskStatus, string> = {
  planning: 'Planning',
  inbox: 'Inbox',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  testing: 'Testing',
  review: 'Review',
  done: 'Done',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  planning: 'bg-purple-500/20 text-purple-400',
  inbox: 'bg-blue-500/20 text-blue-400',
  assigned: 'bg-cyan-500/20 text-cyan-400',
  in_progress: 'bg-yellow-500/20 text-yellow-400',
  testing: 'bg-orange-500/20 text-orange-400',
  review: 'bg-pink-500/20 text-pink-400',
  done: 'bg-green-500/20 text-green-400',
}

export const PRIORITY_LEVELS = ['critical', 'high', 'medium', 'low'] as const
export type Priority = (typeof PRIORITY_LEVELS)[number]

export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-muted-foreground',
}
