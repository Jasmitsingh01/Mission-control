import nodemailer from 'nodemailer';
import User from '../models/User';

/**
 * Email notification service.
 *
 * Uses SMTP credentials from env. Falls back to a logged-only
 * notification when SMTP is not configured.
 */

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

export interface MissionNotification {
  userId: string;
  missionName: string;
  status: 'completed' | 'partial' | 'failed';
  agentResults: { name: string; status: string; result: string }[];
  totalDurationMs: number;
}

/**
 * Send mission completion email to the user.
 */
export async function notifyMissionComplete(notification: MissionNotification): Promise<void> {
  const user = await User.findById(notification.userId).lean();
  if (!user) return;

  const statusEmoji = notification.status === 'completed' ? '✅' : notification.status === 'partial' ? '⚠️' : '❌';
  const statusLabel = notification.status === 'completed' ? 'Completed Successfully'
    : notification.status === 'partial' ? 'Partially Completed' : 'Failed';

  const durationSec = (notification.totalDurationMs / 1000).toFixed(1);

  const agentSummary = notification.agentResults.map((a) => {
    const icon = a.status === 'completed' ? '✅' : '❌';
    return `${icon} <b>${a.name}</b>: ${a.result.slice(0, 200)}${a.result.length > 200 ? '...' : ''}`;
  }).join('<br><br>');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6750A4, #9B8ACB); padding: 24px; border-radius: 16px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">${statusEmoji} Mission ${statusLabel}</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 18px;">${notification.missionName}</p>
      </div>

      <div style="background: #f8f8f8; padding: 20px; border-radius: 12px; margin-top: 16px;">
        <p style="margin: 0 0 4px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Duration</p>
        <p style="margin: 0; font-size: 16px; font-weight: bold;">${durationSec}s</p>
      </div>

      <div style="margin-top: 16px;">
        <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Agent Results</p>
        <div style="background: white; border: 1px solid #eee; border-radius: 12px; padding: 16px;">
          ${agentSummary}
        </div>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${process.env.APP_URL || 'http://localhost:5173'}/dashboard/executions"
           style="display: inline-block; background: #6750A4; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          View in Dashboard
        </a>
      </div>

      <p style="color: #999; font-size: 11px; text-align: center; margin-top: 24px;">
        Mission Control — AgentForge
      </p>
    </div>
  `;

  const subject = `${statusEmoji} Mission "${notification.missionName}" — ${statusLabel}`;

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject,
        html,
      });
      console.log(`[Notifier] Email sent to ${user.email} for mission "${notification.missionName}"`);
    } catch (err: any) {
      console.error(`[Notifier] Email failed:`, err.message);
    }
  } else {
    console.log(`[Notifier] SMTP not configured. Would have emailed ${user.email}: ${subject}`);
  }
}
