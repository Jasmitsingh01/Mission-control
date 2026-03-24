import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import Workspace from '../models/Workspace';
import { openClawService } from '../services/openclawService';

const router = Router();
router.use(authenticate);

// POST / - Create workspace
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const workspace = new Workspace({ ...req.body, createdby: userId, members: [userId] });
    await workspace.save();

    // Create OpenClaw session for workspace
    if (workspace.agents && workspace.agents.length > 0) {
      try {
        const sessionKey = `agent:main:${workspace._id}`;
        const sessionInfo = await openClawService.createSession({
          sessionKey,
          sessionTitle: workspace.name,
          userId,
          workspaceData: { name: workspace.name, description: workspace.description },
        });
        workspace.openclawSession = {
          sessionKey: sessionInfo.sessionKey,
          sessionTitle: sessionInfo.sessionTitle,
          sessionId: sessionInfo.sessionId || '',
          createdAt: new Date(),
        };
        await workspace.save();
      } catch (err) {
        console.error('[Workspace] OpenClaw session creation failed:', err);
      }
    }

    res.status(201).json({ success: true, message: 'Workspace created successfully', workspace });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET / - List workspaces
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const workspaces = await Workspace.find({ members: userId });
    res.json({ success: true, workspaces });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /:id - Get workspace
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found' });
      return;
    }
    res.json({ success: true, workspace });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /:id - Update workspace
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found' });
      return;
    }
    res.json({ success: true, workspace });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /:id - Delete workspace
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const workspace = await Workspace.findByIdAndDelete(req.params.id);
    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found' });
      return;
    }
    res.json({ success: true, message: 'Workspace deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /:id/execute-task - Execute task via AI
router.post('/:id/execute-task', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found' });
      return;
    }

    if (!workspace.openclawSession?.sessionKey) {
      res.status(400).json({ success: false, message: 'No OpenClaw session for this workspace' });
      return;
    }

    const responseChunks: string[] = [];
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => resolve(), 60000);
      openClawService.sendMessage({
        sessionKey: workspace.openclawSession!.sessionKey,
        message: prompt,
        idempotencyKey: `exec-${workspace._id}-${Date.now()}`,
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

// GET /sessions/active - Get active sessions
router.get('/sessions/active', async (_req: Request, res: Response): Promise<void> => {
  try {
    const sessions = openClawService.getActiveSessions();
    res.json({ success: true, sessions });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
