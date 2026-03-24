import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import Agent from '../models/Agent';
import Activity from '../models/Activity';
import Task from '../models/Task';

const router = Router();
router.use(authenticate);

// GET / - List agents
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, gatewayId, limit = 50, offset = 0 } = req.query as {
      workspaceId?: string;
      gatewayId?: string;
      limit?: number;
      offset?: number;
    };

    const filter: any = {};
    if (workspaceId) filter.workspaceId = workspaceId;
    if (gatewayId) filter.gatewayId = gatewayId;

    const agents = await Agent.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await Agent.countDocuments(filter);
    res.json({ success: true, agents, total });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST / - Create agent
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, workspaceId, gatewayId, heartbeatConfig, identityProfile, identityTemplate, soulTemplate } = req.body;

    const agent = new Agent({
      name,
      workspaceId,
      gatewayId,
      heartbeatConfig,
      identityProfile,
      identityTemplate,
      soulTemplate,
      status: 'provisioning',
      provisionRequestedAt: new Date(),
    });
    await agent.save();

    await Activity.create({
      eventType: 'agent.created',
      workspaceId: workspaceId || undefined,
      actorType: 'user',
      actorId: userId,
      targetType: 'agent',
      targetId: agent._id.toString(),
      metadata: { agentName: name },
    });

    res.status(201).json({ success: true, message: 'Agent created successfully', agent });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /stream - SSE stream for agent updates
router.get('/stream', async (req: Request, res: Response): Promise<void> => {
  const { workspaceId, since } = req.query as { workspaceId?: string; since?: string };

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  let lastCheck = since ? new Date(since) : new Date();
  const seenIds = new Set<string>();
  let closed = false;

  req.on('close', () => { closed = true; });

  const poll = async () => {
    if (closed) return;
    try {
      const filter: any = { updatedAt: { $gte: lastCheck } };
      if (workspaceId) filter.workspaceId = workspaceId;

      const agents = await Agent.find(filter).sort({ updatedAt: -1 });
      for (const agent of agents) {
        const idStr = agent._id.toString();
        const eventType = seenIds.has(idStr) ? 'agent.updated' : 'agent.new';
        seenIds.add(idStr);
        res.write(`event: ${eventType}\n`);
        res.write(`data: ${JSON.stringify(agent)}\n\n`);
      }
      if (agents.length > 0) lastCheck = new Date();
    } catch (err) {
      console.error('[SSE] Agent stream error:', err);
    }
    if (!closed) setTimeout(poll, 2000);
  };

  res.write(`:keepalive\n\n`);
  poll();
});

// POST /heartbeat - Create or update agent via heartbeat
router.post('/heartbeat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, workspaceId, status } = req.body;
    let agent = await Agent.findOne({ name, workspaceId });

    if (agent) {
      const update: any = { lastSeenAt: new Date() };
      if (status) update.status = status;
      agent = await Agent.findByIdAndUpdate(agent._id, update, { new: true });
    } else {
      agent = new Agent({
        name,
        workspaceId,
        status: status || 'active',
        lastSeenAt: new Date(),
      });
      await agent.save();
    }

    res.json({ success: true, agent });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /:id - Get single agent
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      res.status(404).json({ success: false, message: 'Agent not found' });
      return;
    }
    res.json({ success: true, agent });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PATCH /:id - Update agent
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const updateData = req.body;
    const oldAgent = await Agent.findById(req.params.id);
    if (!oldAgent) {
      res.status(404).json({ success: false, message: 'Agent not found' });
      return;
    }

    const agent = await Agent.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (updateData.status && oldAgent.status !== updateData.status) {
      await Activity.create({
        eventType: 'agent.updated',
        workspaceId: agent?.workspaceId?.toString() || undefined,
        actorType: 'user',
        actorId: userId,
        targetType: 'agent',
        targetId: req.params.id as string,
        metadata: { oldStatus: oldAgent.status, newStatus: updateData.status },
      });
    }

    res.json({ success: true, agent });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /:id - Delete agent
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      res.status(404).json({ success: false, message: 'Agent not found' });
      return;
    }

    await Task.updateMany({ assignedAgentId: req.params.id }, { $unset: { assignedAgentId: '' } });
    await Agent.findByIdAndDelete(req.params.id);

    await Activity.create({
      eventType: 'agent.deleted',
      workspaceId: agent.workspaceId?.toString() || undefined,
      actorType: 'user',
      actorId: userId,
      targetType: 'agent',
      targetId: req.params.id as string,
      metadata: { agentName: agent.name },
    });

    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /:id/heartbeat - Update agent heartbeat
router.post('/:id/heartbeat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const update: any = { lastSeenAt: new Date() };
    if (status) update.status = status;

    const agent = await Agent.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!agent) {
      res.status(404).json({ success: false, message: 'Agent not found' });
      return;
    }
    res.json({ success: true, agent });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
