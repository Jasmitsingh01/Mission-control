import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TaskStatus, Priority } from '@/lib/constants'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  position: number
  assignee: string | null       // agent id
  assignedAgentId: string | null // keep for backward compat
  labels: string[]
  tags: string[]
  dueDate: number | null
  result: string | null
  executionId: string | null
  progress: number
  subtasks: [number, number]    // [completed, total]
  comments: number
  commits: number
  createdAt: number
  updatedAt: number
}

interface TaskState {
  tasks: Task[]
  _hydrated: boolean
  addTask: (task: Partial<Task> & { title: string }) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, newStatus: TaskStatus, newPosition: number) => void
  reorderTask: (id: string, newPosition: number) => void
  setTasks: (tasks: Task[]) => void
}

let nextId = Date.now()
function generateId() {
  return `task_${++nextId}`
}

function ago(d: number) { return Date.now() - d * 864e5 - Math.random() * 864e5 }

const DEFAULT_TASKS: Task[] = [
  { id: generateId(), title: 'Define Q3 product roadmap', description: 'Map out milestones, OKRs, and resource allocation for Q3. Align with board priorities.', assignee: 'alex', assignedAgentId: null, priority: 'high', status: 'done', tags: ['planning', 'roadmap', 'q3'], labels: [], createdAt: ago(3), updatedAt: Date.now(), progress: 100, subtasks: [3, 3], comments: 8, commits: 0, position: 0, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Set up CI/CD pipeline with GitHub Actions', description: 'Configure build, test, lint, and deploy stages. Add Slack notifications on failure.', assignee: 'sam', assignedAgentId: null, priority: 'high', status: 'inprogress', tags: ['devops', 'ci-cd', 'github'], labels: [], createdAt: ago(1), updatedAt: Date.now(), progress: 72, subtasks: [5, 7], comments: 12, commits: 23, position: 0, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Design landing page — hero + pricing', description: 'High-fidelity Figma mockup with dark/light variants. Responsive breakpoints for mobile.', assignee: 'maya', assignedAgentId: null, priority: 'high', status: 'inprogress', tags: ['design', 'figma', 'landing'], labels: [], createdAt: ago(1), updatedAt: Date.now(), progress: 65, subtasks: [4, 6], comments: 9, commits: 8, position: 1, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Write launch announcement blog post', description: '1,800-word SEO-optimized post covering product vision, key features, and customer stories.', assignee: 'riley', assignedAgentId: null, priority: 'medium', status: 'todo', tags: ['content', 'blog', 'launch'], labels: [], createdAt: ago(1), updatedAt: Date.now(), progress: 15, subtasks: [1, 5], comments: 3, commits: 2, position: 0, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Create social media launch kit', description: 'Design banners (Twitter, LinkedIn, Facebook), carousel assets, and story templates.', assignee: 'casey', assignedAgentId: null, priority: 'medium', status: 'todo', tags: ['design', 'social', 'branding'], labels: [], createdAt: ago(1), updatedAt: Date.now(), progress: 10, subtasks: [1, 8], comments: 4, commits: 1, position: 1, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Build JWT authentication + refresh tokens', description: 'Implement login/signup, password reset, email verification. Add rate limiting and brute-force protection.', assignee: 'sam', assignedAgentId: null, priority: 'critical', status: 'review', tags: ['backend', 'auth', 'security'], labels: [], createdAt: ago(4), updatedAt: Date.now(), progress: 92, subtasks: [11, 12], comments: 18, commits: 47, position: 0, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Plan multi-channel launch campaign', description: 'Define audience segments, channel mix (paid + organic), budget allocation, and KPI targets.', assignee: 'jordan', assignedAgentId: null, priority: 'high', status: 'inprogress', tags: ['marketing', 'launch', 'strategy'], labels: [], createdAt: ago(2), updatedAt: Date.now(), progress: 55, subtasks: [4, 7], comments: 7, commits: 3, position: 2, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Build design system component library', description: 'Reusable component kit with design tokens, variants, and accessibility annotations in Figma.', assignee: 'maya', assignedAgentId: null, priority: 'medium', status: 'backlog', tags: ['design', 'system', 'ui'], labels: [], createdAt: ago(3), updatedAt: Date.now(), progress: 0, subtasks: [0, 12], comments: 2, commits: 0, position: 0, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Write comprehensive API documentation', description: 'Document all 34 REST endpoints with request/response examples, error codes, and rate limits.', assignee: 'riley', assignedAgentId: null, priority: 'medium', status: 'backlog', tags: ['docs', 'api', 'developer'], labels: [], createdAt: ago(2), updatedAt: Date.now(), progress: 5, subtasks: [2, 34], comments: 5, commits: 3, position: 1, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Create logo — light, dark, monochrome', description: 'Final logo variants with usage guidelines. Export SVG, PNG @1x/@2x/@3x for all platforms.', assignee: 'casey', assignedAgentId: null, priority: 'low', status: 'done', tags: ['branding', 'logo', 'assets'], labels: [], createdAt: ago(6), updatedAt: Date.now(), progress: 100, subtasks: [6, 6], comments: 11, commits: 4, position: 1, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Write E2E test suite for critical paths', description: 'Cover signup → onboarding → first-value flows with Playwright. Include visual regression tests.', assignee: 'taylor', assignedAgentId: null, priority: 'high', status: 'todo', tags: ['testing', 'e2e', 'playwright'], labels: [], createdAt: ago(1), updatedAt: Date.now(), progress: 20, subtasks: [3, 15], comments: 6, commits: 12, position: 2, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Integrate Mixpanel analytics tracking', description: 'Add event tracking for signup, activation, feature usage, upgrade, and churn signals.', assignee: 'jordan', assignedAgentId: null, priority: 'medium', status: 'backlog', tags: ['analytics', 'mixpanel', 'tracking'], labels: [], createdAt: ago(3), updatedAt: Date.now(), progress: 0, subtasks: [0, 8], comments: 3, commits: 0, position: 2, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Build dashboard API — aggregation layer', description: 'REST endpoints for MRR, churn, active users, feature adoption. Cache with Redis, 5-min TTL.', assignee: 'sam', assignedAgentId: null, priority: 'medium', status: 'todo', tags: ['backend', 'api', 'dashboard', 'redis'], labels: [], createdAt: ago(1), updatedAt: Date.now(), progress: 8, subtasks: [1, 9], comments: 4, commits: 5, position: 3, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'WCAG 2.1 AA accessibility audit', description: 'Full audit with axe-core + manual testing. Fix all critical and major violations. Document exceptions.', assignee: 'taylor', assignedAgentId: null, priority: 'medium', status: 'backlog', tags: ['a11y', 'audit', 'compliance'], labels: [], createdAt: ago(3), updatedAt: Date.now(), progress: 0, subtasks: [0, 10], comments: 2, commits: 0, position: 3, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Sprint 12 retrospective + action items', description: 'Compile team feedback, identify blockers, celebrate wins. Track action items in next sprint.', assignee: 'alex', assignedAgentId: null, priority: 'low', status: 'done', tags: ['agile', 'retro', 'process'], labels: [], createdAt: ago(5), updatedAt: Date.now(), progress: 100, subtasks: [5, 5], comments: 7, commits: 0, position: 2, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Design transactional email templates', description: 'Responsive HTML emails: welcome, invoice, password reset, weekly digest. Dark mode support.', assignee: 'maya', assignedAgentId: null, priority: 'low', status: 'todo', tags: ['design', 'email', 'templates'], labels: [], createdAt: ago(2), updatedAt: Date.now(), progress: 5, subtasks: [0, 6], comments: 3, commits: 0, position: 4, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'SEO keyword research — 50 target terms', description: 'Identify high-intent keywords with Ahrefs. Map to content calendar. Competitor gap analysis.', assignee: 'jordan', assignedAgentId: null, priority: 'low', status: 'backlog', tags: ['seo', 'research', 'content'], labels: [], createdAt: ago(4), updatedAt: Date.now(), progress: 0, subtasks: [0, 5], comments: 1, commits: 0, position: 4, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Performance load test — 10k concurrency', description: 'Simulate 10,000 concurrent users with k6. Identify bottlenecks. Target p99 < 200ms.', assignee: 'taylor', assignedAgentId: null, priority: 'high', status: 'review', tags: ['performance', 'k6', 'load-test'], labels: [], createdAt: ago(1), updatedAt: Date.now(), progress: 88, subtasks: [7, 8], comments: 14, commits: 9, position: 1, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Write user onboarding guide', description: 'Step-by-step interactive guide with screenshots and GIFs. Cover first 5 minutes to first value.', assignee: 'riley', assignedAgentId: null, priority: 'low', status: 'inprogress', tags: ['content', 'onboarding', 'ux'], labels: [], createdAt: ago(1), updatedAt: Date.now(), progress: 40, subtasks: [3, 7], comments: 5, commits: 4, position: 3, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Record 2-min product demo video', description: 'Walkthrough of core features with voiceover. Professional editing, captions, and CTA overlay.', assignee: 'casey', assignedAgentId: null, priority: 'medium', status: 'review', tags: ['video', 'demo', 'marketing'], labels: [], createdAt: ago(1), updatedAt: Date.now(), progress: 85, subtasks: [5, 6], comments: 9, commits: 2, position: 2, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Implement Stripe webhook handler', description: 'Handle subscription events: created, updated, canceled, payment_failed. Idempotency + retry logic.', assignee: 'sam', assignedAgentId: null, priority: 'critical', status: 'inprogress', tags: ['backend', 'stripe', 'payments'], labels: [], createdAt: ago(0), updatedAt: Date.now(), progress: 35, subtasks: [2, 8], comments: 6, commits: 14, position: 4, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Optimize PostgreSQL query performance', description: 'Analyze slow query log. Add missing indexes. Refactor N+1 queries in dashboard endpoints.', assignee: 'sam', assignedAgentId: null, priority: 'high', status: 'backlog', tags: ['backend', 'postgres', 'performance'], labels: [], createdAt: ago(1), updatedAt: Date.now(), progress: 0, subtasks: [0, 6], comments: 3, commits: 0, position: 5, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Design customer success dashboard', description: 'Layout for health scores, NPS trends, churn prediction, and engagement heatmaps.', assignee: 'maya', assignedAgentId: null, priority: 'high', status: 'backlog', tags: ['design', 'dashboard', 'cs'], labels: [], createdAt: ago(1), updatedAt: Date.now(), progress: 0, subtasks: [0, 8], comments: 4, commits: 0, position: 6, dueDate: null, result: null, executionId: null },
  { id: generateId(), title: 'Build automated email drip sequence', description: '7-email onboarding sequence triggered by signup. Personalization tokens, A/B subject lines.', assignee: 'jordan', assignedAgentId: null, priority: 'medium', status: 'todo', tags: ['marketing', 'email', 'automation'], labels: [], createdAt: ago(2), updatedAt: Date.now(), progress: 12, subtasks: [1, 7], comments: 3, commits: 1, position: 5, dueDate: null, result: null, executionId: null },
]

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      _hydrated: false,

      addTask: (taskData) =>
        set((state) => {
          const status = taskData.status || 'backlog'
          const tasksInColumn = state.tasks.filter((t) => t.status === status)
          const maxPosition = tasksInColumn.length > 0
            ? Math.max(...tasksInColumn.map((t) => t.position))
            : -1
          const now = Date.now()
          const newTask: Task = {
            id: generateId(),
            title: taskData.title,
            description: taskData.description || '',
            status,
            priority: taskData.priority || 'medium',
            position: maxPosition + 1,
            assignee: taskData.assignee || null,
            assignedAgentId: taskData.assignedAgentId || null,
            labels: taskData.labels || [],
            tags: taskData.tags || [],
            dueDate: taskData.dueDate || null,
            result: taskData.result ?? null,
            executionId: taskData.executionId ?? null,
            progress: taskData.progress || 0,
            subtasks: taskData.subtasks || [0, 0],
            comments: taskData.comments || 0,
            commits: taskData.commits || 0,
            createdAt: now,
            updatedAt: now,
          }
          return { tasks: [...state.tasks, newTask] }
        }),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      moveTask: (id, newStatus, newPosition) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: newStatus, position: newPosition, updatedAt: Date.now() }
              : t
          ),
        })),

      reorderTask: (id, newPosition) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, position: newPosition, updatedAt: Date.now() } : t
          ),
        })),

      setTasks: (tasks) => set({ tasks }),
    }),
    {
      name: 'mc-tasks-v2',
      partialize: (state) => ({ tasks: state.tasks }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hydrated = true
          // Seed default tasks if empty
          if (state.tasks.length === 0) {
            state.tasks = DEFAULT_TASKS
          }
        }
      },
    }
  )
)
