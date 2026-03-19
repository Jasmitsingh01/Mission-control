import { create } from 'zustand'
import { authApi } from '@/lib/api'
import { useOrgStore } from '@/stores/orgStore'

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  plan: 'free' | 'pro' | 'enterprise'
  currentOrgId?: string
  createdAt: number
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  loadUser: () => Promise<void>
}

const TOKEN_KEY = 'mc_auth_token'
const USER_KEY = 'mc_auth_user'

function loadStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveUser(user: User | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

function mapServerUser(data: any): User {
  return {
    id: data._id || data.id,
    name: data.name,
    email: data.email,
    avatar: data.avatar || data.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '',
    plan: data.plan || 'free',
    currentOrgId: data.currentOrgId,
    createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: loadStoredUser(),
  isAuthenticated: !!loadStoredUser() && !!localStorage.getItem(TOKEN_KEY),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const data = await authApi.login(email, password)
      const user = mapServerUser(data.user)
      localStorage.setItem(TOKEN_KEY, data.token)
      saveUser(user)
      set({ user, isAuthenticated: true, isLoading: false })

      // Initialize org context
      if (data.orgs) {
        useOrgStore.getState().initFromAuth(data.orgs, data.currentOrgId)
      }

      return true
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  signup: async (name, email, password) => {
    set({ isLoading: true })
    try {
      const data = await authApi.register(name, email, password)
      const user = mapServerUser(data.user)
      localStorage.setItem(TOKEN_KEY, data.token)
      saveUser(user)
      set({ user, isAuthenticated: true, isLoading: false })

      // Initialize org context (auto-created personal workspace)
      if (data.orgs) {
        useOrgStore.getState().initFromAuth(data.orgs, data.currentOrgId)
      }

      return true
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    saveUser(null)
    set({ user: null, isAuthenticated: false })
    useOrgStore.getState().reset()
  },

  loadUser: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      set({ user: null, isAuthenticated: false })
      return
    }
    set({ isLoading: true })
    try {
      const data = await authApi.me()
      const user = mapServerUser(data.user || data)
      saveUser(user)
      set({ user, isAuthenticated: true, isLoading: false })

      // Sync org context
      if (data.orgs) {
        useOrgStore.getState().initFromAuth(data.orgs, data.currentOrgId)
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      saveUser(null)
      set({ user: null, isAuthenticated: false, isLoading: false })
      useOrgStore.getState().reset()
    }
  },
}))
