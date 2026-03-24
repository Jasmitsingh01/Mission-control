import { create } from 'zustand';

export interface MCUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  plan?: string;
  isVerified: boolean;
}

export interface MCTask {
  _id: string;
  title: string;
  desc: string;
  status: 'backlog' | 'todo' | 'inprogress' | 'review' | 'done';
  assignee: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  progress: number;
  created: number;
  tags: string[];
  subtasks: number[];
  comments: number;
  workspaceId: string;
  dueAt?: string;
  inProgressAt?: string;
  assignedAgentId?: string;
  dependsOnTaskIds?: string[];
  isBlocked?: boolean;
  customFieldValues?: Record<string, unknown>;
}

export interface MCAgent {
  _id?: string;
  name: string;
  status?: string;
  skills?: { name: string; file: string }[];
  workspaceId?: string;
  gatewayId?: string;
  openclawSessionId?: string;
  isBoardLead?: boolean;
  isGatewayMain?: boolean;
  lastSeenAt?: string;
  heartbeatConfig?: Record<string, unknown>;
  identityProfile?: Record<string, unknown>;
  createdAt?: string;
}

export interface MCGateway {
  _id: string;
  name: string;
  url: string;
  token?: string;
  disableDevicePairing?: boolean;
  workspaceRoot?: string;
  allowInsecureTls?: boolean;
  organizationId?: string;
  createdAt?: string;
}

export interface MCWorkspace {
  _id: string;
  name: string;
  members: string[];
  description?: string;
  avatar?: string;
  tasks: string[];
  agents: MCAgent[];
  createdby: string;
  slug?: string;
  boardType?: string;
  objective?: string;
  gatewayId?: string;
  boardGroupId?: string;
  organizationId?: string;
  requireApprovalForDone?: boolean;
  maxAgents?: number;
  openclawSession?: {
    sessionKey: string;
    sessionTitle: string;
    sessionId: string;
    createdAt: string;
  };
}

interface MissionControlState {
  workspaces: MCWorkspace[];
  setWorkspaces: (workspaces: MCWorkspace[]) => void;
  activeWorkspace: MCWorkspace | null;
  setActiveWorkspace: (ws: MCWorkspace | null) => void;

  tasks: MCTask[];
  setTasks: (tasks: MCTask[]) => void;
  updateTask: (id: string, updates: Partial<MCTask>) => void;
  addTask: (task: MCTask) => void;
  removeTask: (id: string) => void;

  gateways: MCGateway[];
  setGateways: (gateways: MCGateway[]) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useMissionControlStore = create<MissionControlState>((set) => ({
  workspaces: [],
  setWorkspaces: (workspaces) => set({ workspaces }),
  activeWorkspace: null,
  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),

  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((t) => t._id === id ? { ...t, ...updates } : t),
  })),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  removeTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t._id !== id) })),

  gateways: [],
  setGateways: (gateways) => set({ gateways }),

  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
