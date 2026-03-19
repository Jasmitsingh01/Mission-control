import { create } from 'zustand'

export interface Org {
  id: string
  name: string
  slug: string
  plan: 'free' | 'pro' | 'enterprise'
  memberCount: number
  avatarUrl: string | null
  createdAt: number
}

export interface OrgMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  avatarInitials: string
  joinedAt: number
}

interface OrgState {
  orgs: Org[]
  currentOrgId: string
  members: OrgMember[]
  setCurrentOrg: (id: string) => void
  addOrg: (org: Omit<Org, 'id' | 'createdAt'>) => void
  updateMemberRole: (memberId: string, role: OrgMember['role']) => void
  removeMember: (memberId: string) => void
}

const seedOrgs: Org[] = [
  {
    id: 'org_1', name: 'Digital Guru Ji', slug: 'digital-guru-ji',
    plan: 'pro', memberCount: 5, avatarUrl: null,
    createdAt: Date.now() - 86400000 * 180,
  },
  {
    id: 'org_2', name: 'Trading Bot Labs', slug: 'trading-bot-labs',
    plan: 'enterprise', memberCount: 12, avatarUrl: null,
    createdAt: Date.now() - 86400000 * 90,
  },
  {
    id: 'org_3', name: 'Personal Projects', slug: 'personal',
    plan: 'free', memberCount: 1, avatarUrl: null,
    createdAt: Date.now() - 86400000 * 365,
  },
]

const seedMembers: OrgMember[] = [
  { id: 'mem_1', name: 'Digital Guru Ji', email: 'guru@example.com', role: 'owner', avatarInitials: 'DG', joinedAt: Date.now() - 86400000 * 180 },
  { id: 'mem_2', name: 'Ravi Kumar', email: 'ravi@example.com', role: 'admin', avatarInitials: 'RK', joinedAt: Date.now() - 86400000 * 120 },
  { id: 'mem_3', name: 'Priya Sharma', email: 'priya@example.com', role: 'member', avatarInitials: 'PS', joinedAt: Date.now() - 86400000 * 60 },
  { id: 'mem_4', name: 'Amit Patel', email: 'amit@example.com', role: 'member', avatarInitials: 'AP', joinedAt: Date.now() - 86400000 * 30 },
  { id: 'mem_5', name: 'Sara Khan', email: 'sara@example.com', role: 'viewer', avatarInitials: 'SK', joinedAt: Date.now() - 86400000 * 7 },
]

export const useOrgStore = create<OrgState>((set) => ({
  orgs: seedOrgs,
  currentOrgId: 'org_1',
  members: seedMembers,

  setCurrentOrg: (id) => set({ currentOrgId: id }),

  addOrg: (orgData) =>
    set((state) => ({
      orgs: [
        ...state.orgs,
        { ...orgData, id: `org_${Date.now()}`, createdAt: Date.now() },
      ],
    })),

  updateMemberRole: (memberId, role) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId ? { ...m, role } : m
      ),
    })),

  removeMember: (memberId) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== memberId),
    })),
}))
