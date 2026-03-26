import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'

// Layouts
import { PublicLayout } from '@/components/public/PublicLayout'
import { DashboardShell } from '@/components/layout/DashboardShell'

// Public pages
import { LandingPage } from '@/features/landing/LandingPage'
import { AboutPage } from '@/features/about/AboutPage'
import { ContactPage } from '@/features/contact/ContactPage'
import { PricingPage } from '@/features/landing/PricingPage'
import { BlogPage } from '@/features/landing/BlogPage'

// Auth pages
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'

// Dashboard pages
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { MissionLauncherPage } from '@/features/mission/MissionLauncherPage'
import { KanbanPage } from '@/features/kanban/KanbanPage'
import { ActivityPage } from '@/features/activity/ActivityPage'
import { AgentsPage } from '@/features/agents/AgentsPage'
import { JobsPage } from '@/features/jobs/JobsPage'
import { MemoryPage } from '@/features/memory/MemoryPage'
import { SkillsPage } from '@/features/skills/SkillsPage'
import { OrgPage } from '@/features/orgs/OrgPage'
import { AcceptInvitePage } from '@/features/orgs/AcceptInvitePage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { ExecutionsPage } from '@/features/executions/ExecutionsPage'
import { AdminPage } from '@/features/admin/AdminPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import MissionControlPage from '@/features/mission-control/MissionControlPage'

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          {/* Public pages */}
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="contact" element={<ContactPage />} />
          </Route>

          {/* Auth pages (no header/footer) */}
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />

          {/* Invitation accept */}
          <Route path="invite/:token" element={<AcceptInvitePage />} />

          {/* Protected dashboard */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="mission" element={<MissionLauncherPage />} />
            <Route path="board" element={<KanbanPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="memory" element={<MemoryPage />} />
            <Route path="skills" element={<SkillsPage />} />
            <Route path="org" element={<OrgPage />} />
            <Route path="executions" element={<ExecutionsPage />} />
            <Route path="mission-control" element={<MissionControlPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  )
}
