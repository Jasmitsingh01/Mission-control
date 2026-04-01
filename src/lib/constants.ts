export const TASK_STATUSES = [
  'backlog',
  'todo',
  'inprogress',
  'review',
  'done',
] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Inbox',
  todo: 'Assigned',
  inprogress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: 'bg-[#9e9a93]/20 text-[#9e9a93]',
  todo: 'bg-[#d4870b]/20 text-[#d4870b]',
  inprogress: 'bg-[#3b7dd8]/20 text-[#3b7dd8]',
  review: 'bg-[#7c5cbf]/20 text-[#7c5cbf]',
  done: 'bg-[#2d9a4e]/20 text-[#2d9a4e]',
}

export const STATUS_DOT_COLORS: Record<TaskStatus, string> = {
  backlog: '#9e9a93',
  todo: '#d4870b',
  inprogress: '#3b7dd8',
  review: '#7c5cbf',
  done: '#2d9a4e',
}

export const PRIORITY_LEVELS = ['critical', 'high', 'medium', 'low'] as const
export type Priority = (typeof PRIORITY_LEVELS)[number]

export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: '#cf4a3e',
  high: '#d4870b',
  medium: '#3b7dd8',
  low: '#2a9d8f',
}

export const PRIORITY_SYMBOLS: Record<Priority, string> = {
  critical: '!!',
  high: '↑',
  medium: '↗',
  low: '↓',
}

// Agent definitions matching the reference
export interface Agent {
  id: string
  name: string
  role: string
  color: string
  initial: string
  badge: 'lead' | 'int' | 'spc'
  isLeader: boolean
  tasksCompleted: number
  commits: number
  reviews: number
}

export const AGENTS: Agent[] = [
  { id: 'alex',   name: 'Alex',   role: 'Project Manager',  color: '#7c5cbf', initial: 'A', badge: 'lead', isLeader: true,  tasksCompleted: 34, commits: 0,   reviews: 12 },
  { id: 'sam',    name: 'Sam',    role: 'Developer',        color: '#3b7dd8', initial: 'S', badge: 'int',  isLeader: false, tasksCompleted: 47, commits: 312, reviews: 28 },
  { id: 'maya',   name: 'Maya',   role: 'UI Designer',      color: '#d45c8a', initial: 'M', badge: 'spc',  isLeader: false, tasksCompleted: 29, commits: 45,  reviews: 18 },
  { id: 'jordan', name: 'Jordan', role: 'Marketer',         color: '#d4870b', initial: 'J', badge: 'int',  isLeader: false, tasksCompleted: 22, commits: 8,   reviews: 6  },
  { id: 'riley',  name: 'Riley',  role: 'Content Writer',   color: '#2d9a4e', initial: 'R', badge: 'spc',  isLeader: false, tasksCompleted: 38, commits: 15,  reviews: 22 },
  { id: 'casey',  name: 'Casey',  role: 'Graphic Designer', color: '#cf4a3e', initial: 'C', badge: 'int',  isLeader: false, tasksCompleted: 31, commits: 22,  reviews: 14 },
  { id: 'taylor', name: 'Taylor', role: 'QA Tester',        color: '#2a9d8f', initial: 'T', badge: 'spc',  isLeader: false, tasksCompleted: 41, commits: 67,  reviews: 35 },
]

export const AGENT_MAP: Record<string, Agent> = Object.fromEntries(AGENTS.map(a => [a.id, a]))
