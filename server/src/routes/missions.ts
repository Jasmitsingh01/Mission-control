import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import MissionHistory from '../models/MissionHistory';

const router = Router();

// All mission routes require authentication
router.use(authenticate);

// GET / - list user's mission history (paginated, newest first)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [missions, total] = await Promise.all([
      MissionHistory.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MissionHistory.countDocuments({ userId: req.userId }),
    ]);

    res.json({
      missions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('List missions error:', err);
    res.status(500).json({ error: 'Failed to fetch mission history.' });
  }
});

// GET /:id - get single mission
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const mission = await MissionHistory.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).lean();

    if (!mission) {
      res.status(404).json({ error: 'Mission not found.' });
      return;
    }

    res.json({ mission });
  } catch (err: any) {
    console.error('Get mission error:', err);
    res.status(500).json({ error: 'Failed to fetch mission.' });
  }
});

// POST / - save a completed mission to history
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      missionName,
      description,
      summary,
      agents,
      tasks,
      estimatedPhases,
      status,
      completedAt,
    } = req.body;

    const mission = new MissionHistory({
      userId: req.userId,
      missionName,
      description,
      summary,
      agents: agents || [],
      tasks: tasks || [],
      estimatedPhases: estimatedPhases || [],
      status: status || 'completed',
      completedAt: completedAt || new Date(),
    });

    await mission.save();

    res.status(201).json({ mission: mission.toObject() });
  } catch (err: any) {
    console.error('Create mission error:', err);
    res.status(500).json({ error: 'Failed to save mission.' });
  }
});

// DELETE /:id - delete a mission from history
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const mission = await MissionHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!mission) {
      res.status(404).json({ error: 'Mission not found.' });
      return;
    }

    res.json({ message: 'Mission deleted successfully.' });
  } catch (err: any) {
    console.error('Delete mission error:', err);
    res.status(500).json({ error: 'Failed to delete mission.' });
  }
});

export default router;
