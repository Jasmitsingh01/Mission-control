import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { orchestrator } from '../services/missionOrchestrator';

const router = Router();
router.use(authenticate);

// POST /launch - Launch a mission with full agent team
router.post('/launch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan } = req.body;

    if (!plan || !plan.agents || !plan.tasks) {
      res.status(400).json({ error: 'Mission plan with agents and tasks is required.' });
      return;
    }

    if (!req.orgId) {
      res.status(400).json({ error: 'Organization context required (X-Org-Id header).' });
      return;
    }

    const missionStatus = await orchestrator.launch({
      userId: req.userId!,
      orgId: req.orgId,
      plan,
    });

    res.status(201).json({ mission: missionStatus });
  } catch (err: any) {
    console.error('Mission launch error:', err);
    res.status(500).json({ error: err.message || 'Failed to launch mission.' });
  }
});

// GET /status/:missionId - Get mission status
router.get('/status/:missionId', async (req: Request, res: Response): Promise<void> => {
  const status = orchestrator.getMissionStatus(req.params.missionId as string);
  if (!status) {
    res.status(404).json({ error: 'Mission not found or already completed.' });
    return;
  }
  res.json({ mission: status });
});

// GET /active - Get all active missions
router.get('/active', async (_req: Request, res: Response): Promise<void> => {
  res.json({ missions: orchestrator.getActiveMissions() });
});

export default router;
