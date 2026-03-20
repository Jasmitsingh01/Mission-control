# AgentForge — Deployment Guide

## Quick Start (Docker Compose)

### 1. Clone & configure

```bash
git clone <your-repo-url>
cd Mission-control

# Frontend env
cp .env.example .env
# Edit .env: set VITE_API_URL, VITE_CONVEX_URL (optional), VITE_ADMIN_EMAILS

# Server env
cp server/.env.example server/.env
# Edit server/.env: set MONGODB_URI, JWT_SECRET, STRIPE_* keys, etc.
```

### 2. Launch with Docker Compose

```bash
docker compose up -d --build
```

Services:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api
- **MongoDB**: internal (port 27017)

### 3. Verify health

```bash
curl http://localhost:4000/api/health
```

---

## Production Deployment

### Environment Variables

#### Frontend (`.env`)
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_CONVEX_URL=https://your-project.convex.cloud   # optional
VITE_ADMIN_EMAILS=admin@yourdomain.com
VITE_OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

#### Server (`server/.env`)
```env
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/agentforge
JWT_SECRET=<strong-random-secret-min-32-chars>
APP_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_DEFAULT_MODEL=google/gemini-2.0-flash-001

# Stripe Billing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=price_...

# OpenClaw integration (optional)
OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=your-openclaw-token
```

---

## Subscription Plans Setup (Stripe)

1. Create products in Stripe Dashboard:
   - **Pro** → Monthly ($29) + Annual ($24/mo × 12 = $288)
   - **Enterprise** → Monthly ($99) + Annual ($84/mo × 12 = $1008)
2. Copy the Price IDs into `server/.env`
3. Configure Stripe webhook endpoint:
   - URL: `https://api.yourdomain.com/api/billing/webhook`
   - Events: `customer.subscription.*`, `invoice.payment_failed`
4. Copy webhook signing secret into `STRIPE_WEBHOOK_SECRET`

---

## Admin Panel Access

Set `VITE_ADMIN_EMAILS` in frontend `.env`:
```env
VITE_ADMIN_EMAILS=admin@yourdomain.com,another@yourdomain.com
```
Only these emails will see the `/dashboard/admin` route.

---

## Local Development

```bash
# Frontend (port 5173)
npm install
npm run dev

# Backend (port 4000)
cd server
npm install
npm run dev

# Run tests
cd server && npm test
```

---

## Monitoring

- Health check endpoint: `GET /api/health`
- Returns MongoDB + OpenClaw connectivity status
- Consider adding uptime monitoring (e.g. UptimeRobot) pointing to this endpoint

---

## Architecture Summary

| Layer      | Technology           | Status |
|------------|---------------------|--------|
| Frontend   | React 19 + Vite + TailwindCSS | ✅ Production build |
| Backend    | Express 5 + MongoDB  | ✅ All routes complete |
| Auth       | JWT + bcrypt          | ✅ Login/Signup/Reset |
| Billing    | Stripe Checkout + Webhooks | ✅ Implemented |
| Real-time  | WebSocket + Convex (optional) | ✅ |
| Admin      | RBAC-protected panel  | ✅ |
| Tests      | Jest (60 tests)       | ✅ All passing |
| Docker     | Multi-stage builds    | ✅ |
