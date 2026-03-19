import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { KanbanPage } from '@/features/kanban/KanbanPage'
import { ActivityPage } from '@/features/activity/ActivityPage'
import { AgentsPage } from '@/features/agents/AgentsPage'
import { JobsPage } from '@/features/jobs/JobsPage'
import { MemoryPage } from '@/features/memory/MemoryPage'
import { SkillsPage } from '@/features/skills/SkillsPage'
import { OrgPage } from '@/features/orgs/OrgPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { MissionLauncherPage } from '@/features/mission/MissionLauncherPage'

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          <Route element={<DashboardShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="mission" element={<MissionLauncherPage />} />
            <Route path="board" element={<KanbanPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="memory" element={<MemoryPage />} />
            <Route path="skills" element={<SkillsPage />} />
            <Route path="org" element={<OrgPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  )
}
