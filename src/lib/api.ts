const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function getToken(): string | null {
  return localStorage.getItem('mc_auth_token')
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'API error')
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
    apiFetch('/auth/me/api-key', { method: 'PUT', body: JSON.stringify({ openrouterApiKey: apiKey }) }),
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
