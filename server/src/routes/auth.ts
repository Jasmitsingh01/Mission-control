import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authenticate } from '../middleware/auth';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'agentforge_jwt_secret_change_in_production';
const TOKEN_EXPIRY = '7d';

function generateToken(user: { _id: any; email: string }): string {
  return jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

// POST /register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered.' });
      return;
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: user.toJSON(),
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// POST /login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user);

    res.json({
      token,
      user: user.toJSON(),
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// GET /me (protected)
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ user: user.toJSON() });
  } catch (err: any) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// PUT /me (protected) - update profile/settings
router.put('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, currentOrgId, settings } = req.body;

    const updateFields: Record<string, any> = {};

    if (name !== undefined) updateFields.name = name;
    if (currentOrgId !== undefined) updateFields.currentOrgId = currentOrgId;

    if (settings) {
      if (settings.preferredModel !== undefined) {
        updateFields['settings.preferredModel'] = settings.preferredModel;
      }
      if (settings.maxTokens !== undefined) {
        updateFields['settings.maxTokens'] = settings.maxTokens;
      }
      if (settings.temperature !== undefined) {
        updateFields['settings.temperature'] = settings.temperature;
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, { $set: updateFields }, { new: true });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ user: user.toJSON() });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// PUT /me/api-key (protected) - update OpenRouter API key
router.put('/me/api-key', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiKey } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { 'settings.openrouterApiKey': apiKey || '' } },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ user: user.toJSON(), message: 'API key updated successfully.' });
  } catch (err: any) {
    console.error('Update API key error:', err);
    res.status(500).json({ error: 'Failed to update API key.' });
  }
});

export default router;
