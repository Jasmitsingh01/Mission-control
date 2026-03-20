# Architecture Overview — AgentForge SaaS

## Technology Stack (Confirmed)

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Routing**: react-router-dom v7
- **Styling**: TailwindCSS v4 (Material Design 3 token-based theme)
- **Animation**: Framer Motion
- **Drag & Drop**: @dnd-kit
- **State**: Zustand stores
- **Real-time**: Convex (optional; no-op fallbacks provided)
- **Icons**: Lucide React

### Backend (server/)
- **Runtime**: Node.js v22 + Express 5
- **Language**: TypeScript (commonjs module)
- **Database**: MongoDB via Mongoose 9
- **Auth**: JWT (jsonwebtoken) + bcryptjs password hashing
- **Billing**: Stripe SDK v20
- **Real-time**: WebSocket (ws library)
- **Dev server**: tsx watch

### Infrastructure
- **Frontend Docker**: nginx:alpine multi-stage build → port 3000
- **Compose**: docker-compose.yml (frontend only; server runs separately)
- **Git**: Active repo with conventional commits

## Project Structure

```
Mission-control/
├── src/                  # React frontend
│   ├── features/         # Feature-based pages
│   │   ├── landing/      # LandingPage, PricingPage, BlogPage ✅
│   │   ├── auth/         # Login, Signup, ForgotPassword, ResetPassword ✅
│   │   ├── dashboard/    # DashboardPage ✅
│   │   ├── admin/        # AdminPage ✅
│   │   ├── agents/       # AgentsPage ✅
│   │   ├── kanban/       # KanbanPage ✅
│   │   ├── mission/      # MissionLauncherPage ✅
│   │   ├── billing/      # (handled via settings)
│   │   └── ...           # More pages
│   ├── components/       # Layout shells, UI primitives
│   ├── stores/           # Zustand state stores
│   └── lib/              # API helpers, utils
├── server/               # Express backend
│   ├── src/
│   │   ├── routes/       # auth, billing, admin, missions, orgs, proxy, execute ✅
│   │   ├── models/       # User, Org, OrgMember, Subscription, Execution, etc. ✅
│   │   ├── middleware/   # auth (JWT), rbac ✅
│   │   ├── services/     # claudeExecutor, openclawClient, wsHandler ✅
│   │   └── __tests__/    # Jest unit tests (60 tests passing) ✅
│   └── package.json
├── convex/               # Convex real-time functions (optional)
├── Dockerfile            # Frontend production build
├── docker-compose.yml    # Compose config
└── nginx.conf            # Nginx serving config
```

## Subscription Plans

| Plan       | Price     | Agents | Tasks/mo | Workspaces | Jobs |
|------------|-----------|--------|----------|------------|------|
| Starter    | Free      | 3      | 50       | 1          | 5    |
| Pro        | $29/mo    | ∞      | ∞        | 5          | ∞    |
| Enterprise | $99/mo    | ∞      | ∞        | ∞          | ∞    |

## Key Env Variables Required

### Frontend (.env)
- VITE_API_URL=http://localhost:4000/api
- VITE_CONVEX_URL=...
- VITE_OPENROUTER_MODEL=...
- VITE_ADMIN_EMAILS=admin@example.com

### Server (server/.env)
- MONGODB_URI
- JWT_SECRET
- STRIPE_SECRET_KEY
- STRIPE_PRO_MONTHLY_PRICE_ID / STRIPE_PRO_ANNUAL_PRICE_ID
- STRIPE_ENTERPRISE_MONTHLY_PRICE_ID / STRIPE_ENTERPRISE_ANNUAL_PRICE_ID
- STRIPE_WEBHOOK_SECRET
- OPENCLAW_GATEWAY_URL / OPENCLAW_GATEWAY_TOKEN
- APP_URL
- CORS_ORIGINS
- OPENROUTER_API_KEY
