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
