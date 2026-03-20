import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
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
import { setupWebSocket } from './services/wsHandler';

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agentforge';

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

// JSON parsing
app.use(express.json({ limit: '10mb' }));

// Stripe webhook needs raw body — mount before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/users', authRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/executions', executeRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', async (_req, res) => {
  const { openclawHealthCheck } = await import('./services/openclawClient');
  const { executor } = await import('./services/claudeExecutor');
  const openclawUp = await openclawHealthCheck();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    openclaw: {
      connected: openclawUp,
      url: process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789',
      executionMode: executor.isUsingOpenClaw() ? 'openclaw' : 'claude-cli',
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

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket available at ws://localhost:${PORT}/ws/execute`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
