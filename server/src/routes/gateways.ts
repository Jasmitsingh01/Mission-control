import { Router, Request, Response } from 'express';
import WebSocket from 'ws';
import { authenticate } from '../middleware/auth';
import Gateway from '../models/Gateway';
import Activity from '../models/Activity';
import Agent from '../models/Agent';
import { openClawService } from '../services/openclawService';

const router = Router();
router.use(authenticate);

// GET / - List gateways
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0 } = req.query as { limit?: number; offset?: number };
    const gateways = await Gateway.find()
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));
    const total = await Gateway.countDocuments();
    res.json({ success: true, gateways, total, limit: Number(limit), offset: Number(offset) });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST / - Create gateway
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, url, token, workspaceRoot, disableDevicePairing, allowInsecureTls, organizationId } = req.body;

    let warning: string | undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(url, { handshakeTimeout: 3000 });
        const timer = setTimeout(() => { ws.close(); reject(new Error('Connection timed out')); }, 3000);
        ws.on('open', () => { clearTimeout(timer); ws.close(); resolve(); });
        ws.on('error', (err) => { clearTimeout(timer); reject(err); });
      });
    } catch {
      warning = `Gateway URL ${url} is not reachable. The gateway was created but may not be functional.`;
    }

    const gateway = new Gateway({ name, url, token, workspaceRoot, disableDevicePairing, allowInsecureTls, organizationId });
    await gateway.save();

    await new Activity({
      eventType: 'gateway.created',
      actorType: 'user',
      actorId: userId,
      targetType: 'gateway',
      targetId: gateway._id.toString(),
      metadata: { name, url },
    }).save();

    res.status(201).json({ success: true, message: 'Gateway created successfully', gateway, ...(warning ? { warning } : {}) });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /status - Check all gateway connection statuses
router.get('/status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const allGateways = await Gateway.find();
    const activeSessions = openClawService.getActiveSessions();

    const statuses = await Promise.all(
      allGateways.map(async (gw) => {
        let connected = false;
        let error: string | undefined;
        try {
          await new Promise<void>((resolve, reject) => {
            const ws = new WebSocket(gw.url, { handshakeTimeout: 3000 });
            const timer = setTimeout(() => { ws.close(); reject(new Error('Connection timed out')); }, 3000);
            ws.on('open', () => { clearTimeout(timer); ws.close(); connected = true; resolve(); });
            ws.on('error', (err) => { clearTimeout(timer); reject(err); });
          });
        } catch (err: any) {
          error = err.message;
        }
        const sessionCount = activeSessions.filter((s) => s.includes(gw._id.toString())).length;
        return { id: gw._id, name: gw.name, url: gw.url, connected, sessionCount, ...(error ? { error } : {}) };
      })
    );

    res.json({ success: true, gateways: statuses });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /sessions - List active sessions
router.get('/sessions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gatewayId } = req.query as { gatewayId?: string };
    const sessions = openClawService.getActiveSessions();
    const filtered = gatewayId ? sessions.filter((s) => s.includes(gatewayId)) : sessions;
    res.json({ success: true, sessions: filtered.map((sessionKey) => ({ sessionKey })) });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /sessions/:sessionId/message - Send message to session
router.post('/sessions/:sessionId/message', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ success: false, message: 'Message content is required' });
      return;
    }

    const sessionKey = `agent:main:${sessionId}`;
    const idempotencyKey = `msg-${sessionId}-${Date.now()}`;
    const responseChunks: string[] = [];

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => resolve(), 30000);
      openClawService.sendMessage({
        sessionKey,
        message: content,
        idempotencyKey,
        onDelta: (text) => responseChunks.push(text),
        onDone: () => { clearTimeout(timer); resolve(); },
        onError: (err) => { clearTimeout(timer); reject(new Error(err)); },
      });
    });

    res.json({ success: true, response: responseChunks.join('') });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /commands - List available RPC methods
router.get('/commands', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    commands: {
      rpcMethods: ['connect', 'sessions.patch', 'sessions.list', 'sessions.history', 'sessions.delete', 'chat.send', 'chat.cancel', 'tools.approve', 'tools.reject', 'agents.list', 'agents.status', 'skills.list', 'skills.sync', 'config.get', 'config.set'],
      events: ['connect.challenge', 'chat', 'chat.delta', 'chat.final', 'chat.done', 'chat.error', 'tool.request', 'tool.result', 'agent.status', 'session.updated', 'session.deleted'],
    },
  });
});

// GET /:id - Get single gateway
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const gateway = await Gateway.findById(req.params.id);
    if (!gateway) {
      res.status(404).json({ success: false, message: 'Gateway not found' });
      return;
    }
    res.json({ success: true, gateway });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PATCH /:id - Update gateway
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const updates = req.body;
    const gateway = await Gateway.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!gateway) {
      res.status(404).json({ success: false, message: 'Gateway not found' });
      return;
    }

    await new Activity({
      eventType: 'gateway.updated',
      actorType: 'user',
      actorId: userId,
      targetType: 'gateway',
      targetId: gateway._id.toString(),
      metadata: { updatedFields: Object.keys(updates) },
    }).save();

    res.json({ success: true, gateway });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /:id - Delete gateway
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const gateway = await Gateway.findByIdAndDelete(req.params.id);
    if (!gateway) {
      res.status(404).json({ success: false, message: 'Gateway not found' });
      return;
    }

    await Agent.deleteMany({ gatewayId: req.params.id });

    await new Activity({
      eventType: 'gateway.deleted',
      actorType: 'user',
      actorId: userId,
      targetType: 'gateway',
      targetId: req.params.id,
      metadata: { name: gateway.name },
    }).save();

    res.json({ success: true, message: 'Gateway and associated resources deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
