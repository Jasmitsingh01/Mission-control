import { create } from 'zustand'
import { orgApi } from '@/lib/api'

export interface Org {
  id: string
  name: string
  slug: string
  plan: 'free' | 'pro' | 'enterprise'
  memberCount: number
  avatarUrl: string | null
  userRole: OrgRole
  createdAt: number
}

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface OrgMember {
  id: string
  memberId: string
  userId: string
  name: string
  email: string
  avatar: string
  role: OrgRole
  joinedAt: number
}

export interface OrgInvitation {
  id: string
  email: string
  role: OrgRole
  status: string
  expiresAt: number
  createdAt: number
}

interface OrgState {
  orgs: Org[]
  currentOrgId: string | null
  members: OrgMember[]
  invitations: OrgInvitation[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchOrgs: () => Promise<void>
  setCurrentOrg: (id: string) => Promise<void>
  createOrg: (name: string, slug: string) => Promise<Org>
  updateOrg: (orgId: string, data: { name?: string; slug?: string }) => Promise<void>
  deleteOrg: (orgId: string) => Promise<void>

  // Members
  fetchMembers: (orgId?: string) => Promise<void>
  updateMemberRole: (memberId: string, role: OrgRole) => Promise<void>
  removeMember: (memberId: string) => Promise<void>

  // Invitations
  fetchInvitations: (orgId?: string) => Promise<void>
  inviteMember: (email: string, role: OrgRole) => Promise<void>
  revokeInvitation: (invitationId: string) => Promise<void>
  acceptInvitation: (token: string) => Promise<void>

  // Init
  initFromAuth: (orgs: any[], currentOrgId: string | null) => void
  reset: () => void
}

const ORG_KEY = 'mc_current_org_id'

function loadStoredOrgId(): string | null {
  return localStorage.getItem(ORG_KEY)
}

function saveOrgId(id: string | null) {
  if (id) {
    localStorage.setItem(ORG_KEY, id)
  } else {
    localStorage.removeItem(ORG_KEY)
  }
}

function mapOrg(o: any): Org {
  return {
    id: o._id || o.id,
    name: o.name,
    slug: o.slug,
    plan: o.plan || 'free',
    memberCount: o.memberCount || 0,
    avatarUrl: o.avatarUrl || null,
    userRole: o.userRole || o.role || 'member',
    createdAt: o.createdAt ? new Date(o.createdAt).getTime() : Date.now(),
  }
}

function mapMember(m: any): OrgMember {
  return {
    id: m._id || m.id || m.memberId,
    memberId: m.memberId || m._id || m.id,
    userId: m.userId?._id || m.userId,
    name: m.name,
    email: m.email,
    avatar: m.avatar || m.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '',
    role: m.role,
    joinedAt: m.joinedAt ? new Date(m.joinedAt).getTime() : Date.now(),
  }
}

function mapInvitation(i: any): OrgInvitation {
  return {
    id: i._id || i.id,
    email: i.email,
    role: i.role,
    status: i.status,
    expiresAt: i.expiresAt ? new Date(i.expiresAt).getTime() : Date.now(),
    createdAt: i.createdAt ? new Date(i.createdAt).getTime() : Date.now(),
  }
}

export const useOrgStore = create<OrgState>((set, get) => ({
  orgs: [],
  currentOrgId: loadStoredOrgId(),
  members: [],
  invitations: [],
  isLoading: false,
  error: null,

  initFromAuth: (orgs, currentOrgId) => {
    const mapped = orgs.map(mapOrg)
    const orgId = currentOrgId || mapped[0]?.id || null
    saveOrgId(orgId)
    set({ orgs: mapped, currentOrgId: orgId })
  },

  reset: () => {
    saveOrgId(null)
    set({ orgs: [], currentOrgId: null, members: [], invitations: [], error: null })
  },

  fetchOrgs: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await orgApi.list()
      const orgs = (data.orgs || []).map(mapOrg)
      const state = get()
      // If current org no longer exists, switch to first
      const currentOrgId = orgs.find((o) => o.id === state.currentOrgId)
        ? state.currentOrgId
        : orgs[0]?.id || null
      saveOrgId(currentOrgId)
      set({ orgs, currentOrgId, isLoading: false })
    } catch (err: any) {
      set({ isLoading: false, error: err.message })
    }
  },

  setCurrentOrg: async (id) => {
    saveOrgId(id)
    set({ currentOrgId: id, members: [], invitations: [] })
    // Persist to server
    try {
      const { authApi } = await import('@/lib/api')
      await authApi.updateProfile({ currentOrgId: id })
    } catch {
      // Non-critical
    }
  },

  createOrg: async (name, slug) => {
    set({ isLoading: true, error: null })
    try {
      const data = await orgApi.create(name, slug)
      const org = mapOrg(data.org)
      set((state) => ({
        orgs: [...state.orgs, org],
        isLoading: false,
      }))
      return org
    } catch (err: any) {
      set({ isLoading: false, error: err.message })
      throw err
    }
  },

  updateOrg: async (orgId, data) => {
    try {
      const resp = await orgApi.update(orgId, data)
      const updated = mapOrg(resp.org)
      set((state) => ({
        orgs: state.orgs.map((o) => (o.id === orgId ? { ...o, ...updated } : o)),
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  deleteOrg: async (orgId) => {
    try {
      await orgApi.delete(orgId)
      set((state) => {
        const remaining = state.orgs.filter((o) => o.id !== orgId)
        const newCurrent = state.currentOrgId === orgId
          ? remaining[0]?.id || null
          : state.currentOrgId
        saveOrgId(newCurrent)
        return { orgs: remaining, currentOrgId: newCurrent }
      })
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  fetchMembers: async (orgId) => {
    const id = orgId || get().currentOrgId
    if (!id) return
    try {
      const data = await orgApi.listMembers(id)
      set({ members: (data.members || []).map(mapMember) })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  updateMemberRole: async (memberId, role) => {
    const orgId = get().currentOrgId
    if (!orgId) return
    try {
      await orgApi.updateMemberRole(orgId, memberId, role)
      set((state) => ({
        members: state.members.map((m) =>
          m.memberId === memberId ? { ...m, role } : m
        ),
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  removeMember: async (memberId) => {
    const orgId = get().currentOrgId
    if (!orgId) return
    try {
      await orgApi.removeMember(orgId, memberId)
      set((state) => ({
        members: state.members.filter((m) => m.memberId !== memberId),
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  fetchInvitations: async (orgId) => {
    const id = orgId || get().currentOrgId
    if (!id) return
    try {
      const data = await orgApi.listInvitations(id)
      set({ invitations: (data.invitations || []).map(mapInvitation) })
    } catch (err: any) {
      // Non-admin won't have access — silently ignore
    }
  },

  inviteMember: async (email, role) => {
    const orgId = get().currentOrgId
    if (!orgId) return
    try {
      const data = await orgApi.invite(orgId, email, role)
      const invitation = mapInvitation(data.invitation)
      set((state) => ({
        invitations: [invitation, ...state.invitations],
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  revokeInvitation: async (invitationId) => {
    const orgId = get().currentOrgId
    if (!orgId) return
    try {
      await orgApi.revokeInvitation(orgId, invitationId)
      set((state) => ({
        invitations: state.invitations.filter((i) => i.id !== invitationId),
      }))
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },

  acceptInvitation: async (token) => {
    try {
      const data = await orgApi.acceptInvitation(token)
      if (data.org) {
        const org = mapOrg(data.org)
        set((state) => ({
          orgs: [...state.orgs.filter((o) => o.id !== org.id), org],
        }))
      }
    } catch (err: any) {
      set({ error: err.message })
      throw err
    }
  },
}))
