import { create } from 'zustand'

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: number
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
}

const STORAGE_KEY = 'mc_auth_user'

function loadUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function saveUser(user: User | null) {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: loadUser(),
  isAuthenticated: !!loadUser(),
  isLoading: false,

  login: async (email, _password) => {
    set({ isLoading: true })
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 1000))
    const user: User = {
      id: `user_${Date.now()}`,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      avatar: email.slice(0, 2).toUpperCase(),
      plan: 'pro',
      createdAt: Date.now(),
    }
    saveUser(user)
    set({ user, isAuthenticated: true, isLoading: false })
    return true
  },

  signup: async (name, email, _password) => {
    set({ isLoading: true })
    await new Promise((r) => setTimeout(r, 1200))
    const user: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      avatar: name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2),
      plan: 'free',
      createdAt: Date.now(),
    }
    saveUser(user)
    set({ user, isAuthenticated: true, isLoading: false })
    return true
  },

  logout: () => {
    saveUser(null)
    set({ user: null, isAuthenticated: false })
  },
}))
