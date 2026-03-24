const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function getToken(): string | null {
  return localStorage.getItem('mc_auth_token')
}

function getOrgId(): string | null {
  return localStorage.getItem('mc_current_org_id')
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const orgId = getOrgId()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(orgId ? { 'X-Org-Id': orgId } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || err.message || 'API error')
  }
  return res.json()
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  me: () => apiFetch('/auth/me'),
  updateProfile: (data: any) => apiFetch('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
  updateApiKey: (apiKey: string) =>
    apiFetch('/auth/me/api-key', { method: 'PUT', body: JSON.stringify({ apiKey }) }),
}

// AI Proxy
export const aiApi = {
  chat: (systemPrompt: string, userMessage: string, model?: string) =>
    apiFetch('/proxy/chat', { method: 'POST', body: JSON.stringify({ systemPrompt, userMessage, model }) }),
}

// Mission History
export const missionApi = {
  list: (page = 1) => apiFetch(`/missions?page=${page}`),
  get: (id: string) => apiFetch(`/missions/${id}`),
  save: (mission: any) => apiFetch('/missions', { method: 'POST', body: JSON.stringify(mission) }),
  delete: (id: string) => apiFetch(`/missions/${id}`, { method: 'DELETE' }),
  // Orchestrated launch — creates per-agent executions
  launch: (plan: any) => apiFetch('/missions/launch', { method: 'POST', body: JSON.stringify({ plan }) }),
  status: (missionId: string) => apiFetch(`/missions/status/${missionId}`),
  active: () => apiFetch('/missions/active'),
}

// Organizations
export const orgApi = {
  // CRUD
  list: () => apiFetch('/orgs'),
  get: (orgId: string) => apiFetch(`/orgs/${orgId}`),
  create: (name: string, slug: string) =>
    apiFetch('/orgs', { method: 'POST', body: JSON.stringify({ name, slug }) }),
  update: (orgId: string, data: { name?: string; slug?: string }) =>
    apiFetch(`/orgs/${orgId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (orgId: string) =>
    apiFetch(`/orgs/${orgId}`, { method: 'DELETE' }),

  // Members
  listMembers: (orgId: string) => apiFetch(`/orgs/${orgId}/members`),
  updateMemberRole: (orgId: string, memberId: string, role: string) =>
    apiFetch(`/orgs/${orgId}/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  removeMember: (orgId: string, memberId: string) =>
    apiFetch(`/orgs/${orgId}/members/${memberId}`, { method: 'DELETE' }),

  // Invitations
  invite: (orgId: string, email: string, role: string = 'member') =>
    apiFetch(`/orgs/${orgId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  listInvitations: (orgId: string) => apiFetch(`/orgs/${orgId}/invitations`),
  acceptInvitation: (token: string) =>
    apiFetch(`/orgs/invitations/${token}/accept`, { method: 'POST' }),
  revokeInvitation: (orgId: string, invitationId: string) =>
    apiFetch(`/orgs/${orgId}/invitations/${invitationId}`, { method: 'DELETE' }),

  // Ownership
  transferOwnership: (orgId: string, newOwnerId: string) =>
    apiFetch(`/orgs/${orgId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ newOwnerId }),
    }),
}

// Billing (Stripe)
export const billingApi = {
  status: () => apiFetch('/billing/status'),
  createCheckout: (plan: 'pro' | 'enterprise', interval: 'monthly' | 'annual' = 'monthly') =>
    apiFetch('/billing/checkout', { method: 'POST', body: JSON.stringify({ plan, interval }) }),
  createPortal: () => apiFetch('/billing/portal', { method: 'POST', body: JSON.stringify({}) }),
}

// Admin
export const adminApi = {
  stats: () => apiFetch('/admin/stats'),
  users: (params?: { page?: number; search?: string; plan?: string }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.search) q.set('search', params.search)
    if (params?.plan) q.set('plan', params.plan)
    return apiFetch(`/admin/users?${q}`)
  },
  getUser: (id: string) => apiFetch(`/admin/users/${id}`),
  patchUser: (id: string, data: { plan?: string }) =>
    apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id: string) => apiFetch(`/admin/users/${id}`, { method: 'DELETE' }),
  orgs: (params?: { page?: number; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.search) q.set('search', params.search)
    return apiFetch(`/admin/orgs?${q}`)
  },
  patchOrg: (id: string, data: { plan?: string }) =>
    apiFetch(`/admin/orgs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// Tasks (Kanban)
export const taskApi = {
  create: (data: {
    title: string
    desc: string
    status?: string
    assignee: string
    priority?: string
    tags?: string[]
    workspaceId: string
  }) => apiFetch('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  getAll: (workspaceId: string) => apiFetch(`/tasks?workspaceId=${workspaceId}`),
  get: (id: string) => apiFetch(`/tasks/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
}

// Workspaces
export const workspaceApi = {
  create: (data: Record<string, unknown>) =>
    apiFetch('/workspaces', { method: 'POST', body: JSON.stringify(data) }),
  getAll: () => apiFetch('/workspaces'),
  get: (id: string) => apiFetch(`/workspaces/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    apiFetch(`/workspaces/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/workspaces/${id}`, { method: 'DELETE' }),
  executeTask: (id: string, prompt: string) =>
    apiFetch(`/workspaces/${id}/execute-task`, { method: 'POST', body: JSON.stringify({ prompt }) }),
  getActiveSessions: () => apiFetch('/workspaces/sessions/active'),
}

// Gateways
export const gatewayApi = {
  getAll: (params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.offset) q.set('offset', String(params.offset))
    return apiFetch(`/gateways?${q}`)
  },
  create: (data: Record<string, unknown>) =>
    apiFetch('/gateways', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => apiFetch(`/gateways/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    apiFetch(`/gateways/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/gateways/${id}`, { method: 'DELETE' }),
  getStatus: () => apiFetch('/gateways/status'),
  getSessions: (gatewayId?: string) =>
    apiFetch(`/gateways/sessions${gatewayId ? `?gatewayId=${gatewayId}` : ''}`),
  sendSessionMessage: (sessionId: string, content: string) =>
    apiFetch(`/gateways/sessions/${sessionId}/message`, { method: 'POST', body: JSON.stringify({ content }) }),
  getCommands: () => apiFetch('/gateways/commands'),
}

// Agents (lifecycle)
export const agentApi = {
  getAll: (params?: { workspaceId?: string; gatewayId?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.workspaceId) q.set('workspaceId', params.workspaceId)
    if (params?.gatewayId) q.set('gatewayId', params.gatewayId)
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.offset) q.set('offset', String(params.offset))
    return apiFetch(`/agents?${q}`)
  },
  create: (data: Record<string, unknown>) =>
    apiFetch('/agents', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => apiFetch(`/agents/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    apiFetch(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/agents/${id}`, { method: 'DELETE' }),
  heartbeat: (id: string, data?: { status?: string }) =>
    apiFetch(`/agents/${id}/heartbeat`, { method: 'POST', body: JSON.stringify(data || {}) }),
}

// Executions (Claude Code)
export const executeApi = {
  start: (data: {
    taskTitle: string
    prompt: string
    model?: string
    allowedTools?: string[]
    workingDirectory?: string
    maxTurns?: number
    systemPrompt?: string
  }) => apiFetch('/executions', { method: 'POST', body: JSON.stringify(data) }),

  list: (page = 1, status?: string) =>
    apiFetch(`/executions?page=${page}${status ? `&status=${status}` : ''}`),

  get: (id: string) => apiFetch(`/executions/${id}`),

  abort: (id: string) => apiFetch(`/executions/${id}/abort`, { method: 'POST' }),

  activeCount: () => apiFetch('/executions/active/count'),
}
