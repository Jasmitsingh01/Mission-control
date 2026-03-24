/**
 * Password Reset Routes
 * POST /api/auth/forgot-password  - send reset email
 * POST /api/auth/reset-password   - apply new password using token
 */
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const router = Router();

// In-memory token store (use Redis in production)
const resetTokens = new Map<string, { userId: string; expiresAt: number }>();

// Cleanup expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of resetTokens) {
    if (now > data.expiresAt) resetTokens.delete(token);
  }
}, 5 * 60 * 1000);

// POST /forgot-password
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: 'Email is required.' }); return; }

    const user = await User.findOne({ email: email.toLowerCase() }).lean();

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ message: 'If that email is registered, a reset link has been sent.' });
      return;
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    resetTokens.set(token, { userId: user._id.toString(), expiresAt });

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    console.log(`[PASSWORD RESET] Email: ${email} | URL: ${resetUrl}`);

    // Send reset email via SMTP
    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: 'Reset your password — Mission Control',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6750A4, #9B8ACB); padding: 24px; border-radius: 16px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">Password Reset</h1>
                <p style="margin: 8px 0 0; opacity: 0.9;">Mission Control</p>
              </div>
              <div style="background: #f8f8f8; padding: 20px; border-radius: 12px; margin-top: 16px;">
                <p>You requested a password reset. Click the button below to set a new password. This link expires in 1 hour.</p>
                <div style="text-align: center; margin-top: 20px;">
                  <a href="${resetUrl}" style="display: inline-block; background: #6750A4; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
                </div>
                <p style="margin-top: 16px; font-size: 12px; color: #888;">If you didn't request this, you can safely ignore this email.</p>
              </div>
            </div>
          `,
        });
        console.log(`[PASSWORD RESET] Email sent to ${email}`);
      } catch (err: any) {
        console.error(`[PASSWORD RESET] Email failed:`, err.message);
      }
    } else {
      console.warn('[PASSWORD RESET] SMTP not configured — email not sent');
    }

    res.json({
      message: 'If that email is registered, a reset link has been sent.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// POST /reset-password
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    if (!token || !password) { res.status(400).json({ error: 'Token and password are required.' }); return; }
    if (password.length < 6) { res.status(400).json({ error: 'Password must be at least 6 characters.' }); return; }

    const record = resetTokens.get(token);
    if (!record || Date.now() > record.expiresAt) {
      res.status(400).json({ error: 'Invalid or expired reset token.' });
      return;
    }

    const user = await User.findById(record.userId);
    if (!user) { res.status(404).json({ error: 'User not found.' }); return; }

    user.password = password;
    await user.save(); // pre-save hook hashes the password

    resetTokens.delete(token);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

export default router;
