import dotenv from 'dotenv';
dotenv.config({ override: true });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { createServer } from 'http';

import authRoutes from './routes/auth';
import proxyRoutes from './routes/proxy';
import missionRoutes from './routes/missions';
import orgRoutes from './routes/orgs';
import executeRoutes from './routes/execute';
import billingRoutes from './routes/billing';
import adminRoutes from './routes/admin';
import passwordResetRoutes from './routes/passwordReset';
import missionLaunchRoutes from './routes/missionLaunch';
import taskRoutes from './routes/tasks';
import taskStreamRoutes from './routes/taskStream';
import agentRoutes from './routes/agents';
import gatewayRoutes from './routes/gateways';
import workspaceRoutes from './routes/workspaces';
import telegramRoutes from './routes/telegram';
import { initTelegramBot } from './services/telegramBot';
import { setupWebSocket } from './services/wsHandler';
import { openClawService } from './services/openclawService';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agentforge';

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── Global Rate Limiter (100 requests / 15 min per IP) ───────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', globalLimiter);

// ── Auth Rate Limiter (stricter: 20 requests / 15 min per IP) ────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
    exposedHeaders: ['X-Org-Id'],
  })
);

// Stripe webhook needs raw body — mount before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// JSON parsing
app.use(express.json({ limit: '10mb' }));

// Routes — auth routes get stricter rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/auth', authLimiter, passwordResetRoutes);
app.use('/api/users', authRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/missions', missionLaunchRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/executions', executeRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/streams', taskStreamRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/gateways', gatewayRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/telegram', telegramRoutes);

// Initialize Telegram bot (only if token is configured)
if (process.env.TELEGRAM_BOT_TOKEN) {
  initTelegramBot();
}

// Health check
app.get('/api/health', async (_req, res) => {
  const { openclawHealthCheck } = await import('./services/openclawClient');
  const openclawUp = await openclawHealthCheck();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    openclaw: {
      connected: openclawUp,
      url: process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789',
    },
  });
});

// Create HTTP server (needed for WebSocket upgrade)
const server = createServer(app);

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');

    // Setup WebSocket after DB is ready
    setupWebSocket(server);

    // Setup OpenClaw WebSocket bridge
    const openclawWss = new WebSocketServer({ noServer: true });
    server.on('upgrade', (request, socket, head) => {
      const pathname = request.url?.split('?')[0] || '';

      if (pathname.startsWith('/ws/openclaw/')) {
        openclawWss.handleUpgrade(request, socket, head, (ws) => {
          const sessionKey = decodeURIComponent(pathname.replace('/ws/openclaw/', ''));
          console.log(`[WS] OpenClaw bridge connection for session: ${sessionKey}`);
          openClawService.bridgeSession(sessionKey, ws);
        });
      } else if (pathname === '/ws/execute') {
        // Let the existing wsHandler handle /ws/execute upgrades
        // The setupWebSocket already handles this
      } else {
        socket.destroy();
      }
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket available at ws://localhost:${PORT}/ws/execute`);
      console.log(`OpenClaw bridge at ws://localhost:${PORT}/ws/openclaw/:sessionKey`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
