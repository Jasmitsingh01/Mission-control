import TelegramBot from 'node-telegram-bot-api';
import User from '../models/User';
import Task from '../models/Task';
import Agent from '../models/Agent';

// In-memory store for link codes: code -> { userId, expiresAt }
const linkCodes = new Map<string, { userId: string; expiresAt: number }>();

let bot: TelegramBot | null = null;

/**
 * Generate a 6-digit link code for a user. Expires in 5 minutes.
 */
export function generateLinkCode(userId: string): string {
  // Remove any existing code for this user
  for (const [code, entry] of linkCodes) {
    if (entry.userId === userId) {
      linkCodes.delete(code);
    }
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  linkCodes.set(code, { userId, expiresAt: Date.now() + 5 * 60 * 1000 });
  return code;
}

/**
 * Check and consume a link code. Returns userId if valid, null otherwise.
 */
function consumeLinkCode(code: string): string | null {
  const entry = linkCodes.get(code);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    linkCodes.delete(code);
    return null;
  }
  linkCodes.delete(code);
  return entry.userId;
}

/**
 * Send a notification to a user via Telegram (if linked).
 */
export async function notifyTaskUpdate(userId: string, message: string): Promise<void> {
  if (!bot) return;
  try {
    const user = await User.findById(userId).lean();
    if (!user?.telegramChatId) return;
    await bot.sendMessage(user.telegramChatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[Telegram] Failed to send notification:', err);
  }
}

/**
 * Initialize the Telegram bot. Only call if TELEGRAM_BOT_TOKEN is set.
 */
export function initTelegramBot(): TelegramBot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN not set — Telegram bot disabled.');
    return null;
  }

  bot = new TelegramBot(token, { polling: true });
  console.log('[Telegram] Bot started with polling.');

  // /start
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot!.sendMessage(
      chatId,
      `*Welcome to Mission Control Bot!* \u{1F680}\n\n` +
        `To link your Telegram account:\n` +
        `1. Go to Mission Control settings\n` +
        `2. Click "Link Telegram"\n` +
        `3. Use the code here: \`/link <code>\`\n\n` +
        `Type /help for all commands.`,
      { parse_mode: 'Markdown' }
    );
  });

  // /help
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot!.sendMessage(
      chatId,
      `*Available Commands:*\n\n` +
        `/start — Welcome & setup\n` +
        `/link <code> — Link your Telegram account\n` +
        `/tasks — List all your tasks\n` +
        `/task <id> — View task details\n` +
        `/done <id> — Mark a task as done\n` +
        `/create <title> — Quick-create a task\n` +
        `/status — Mission status overview\n` +
        `/help — Show this help`,
      { parse_mode: 'Markdown' }
    );
  });

  // /link <code>
  bot.onText(/\/link\s+(\d{6})/, async (msg, match) => {
    const chatId = msg.chat.id;
    const code = match![1];

    const userId = consumeLinkCode(code);
    if (!userId) {
      bot!.sendMessage(chatId, 'Invalid or expired link code. Please generate a new one from Mission Control.');
      return;
    }

    try {
      // Check if this chat is already linked to another account
      const existing = await User.findOne({ telegramChatId: chatId });
      if (existing && existing._id.toString() !== userId) {
        bot!.sendMessage(chatId, 'This Telegram account is already linked to another Mission Control account. Unlink it first.');
        return;
      }

      await User.findByIdAndUpdate(userId, {
        telegramChatId: chatId,
        telegramLinkedAt: new Date(),
      });

      bot!.sendMessage(chatId, 'Account linked successfully! You will now receive task notifications here.\n\nType /tasks to see your tasks.');
    } catch (err) {
      console.error('[Telegram] Link error:', err);
      bot!.sendMessage(chatId, 'Failed to link account. Please try again.');
    }
  });

  // /tasks
  bot.onText(/\/tasks$/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await User.findOne({ telegramChatId: chatId });
    if (!user) {
      bot!.sendMessage(chatId, 'Your Telegram is not linked. Use /start for instructions.');
      return;
    }

    try {
      const tasks = await Task.find({
        createdByUserId: user._id,
        status: { $ne: 'done' },
      })
        .sort({ created: -1 })
        .limit(20)
        .lean();

      if (tasks.length === 0) {
        bot!.sendMessage(chatId, 'No open tasks found.');
        return;
      }

      const statusIcons: Record<string, string> = {
        backlog: '\u{1F4CB}',
        todo: '\u{1F4CC}',
        inprogress: '\u{1F3C3}',
        review: '\u{1F50D}',
        done: '\u2705',
      };

      const priorityIcons: Record<string, string> = {
        critical: '\u{1F534}',
        high: '\u{1F7E0}',
        medium: '\u{1F7E1}',
        low: '\u{1F7E2}',
      };

      let text = '*Your Tasks:*\n\n';
      for (const t of tasks) {
        const sIcon = statusIcons[t.status] || '';
        const pIcon = priorityIcons[t.priority] || '';
        const shortId = t._id.toString().slice(-6);
        text += `${sIcon} ${pIcon} *${t.title}*\n`;
        text += `   Status: \`${t.status}\` | Priority: \`${t.priority}\` | ID: \`${shortId}\`\n\n`;
      }

      const inlineKeyboard = tasks.slice(0, 5).map((t) => [
        { text: `View ${t.title.slice(0, 20)}`, callback_data: `view_${t._id}` },
        { text: 'Mark Done', callback_data: `done_${t._id}` },
      ]);

      bot!.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: inlineKeyboard },
      });
    } catch (err) {
      console.error('[Telegram] Tasks error:', err);
      bot!.sendMessage(chatId, 'Failed to fetch tasks.');
    }
  });

  // /task <id>
  bot.onText(/\/task\s+(\S+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const user = await User.findOne({ telegramChatId: chatId });
    if (!user) {
      bot!.sendMessage(chatId, 'Your Telegram is not linked. Use /start for instructions.');
      return;
    }

    const taskIdInput = match![1];
    try {
      // Support both full ID and short (last 6 chars) lookup
      let task;
      if (taskIdInput.length === 24) {
        task = await Task.findById(taskIdInput).lean();
      } else {
        const allTasks = await Task.find({ createdByUserId: user._id }).lean();
        task = allTasks.find((t) => t._id.toString().endsWith(taskIdInput));
      }

      if (!task) {
        bot!.sendMessage(chatId, 'Task not found.');
        return;
      }

      const text =
        `*${task.title}*\n\n` +
        `*Status:* \`${task.status}\`\n` +
        `*Priority:* \`${task.priority}\`\n` +
        `*Assignee:* ${task.assignee}\n` +
        `*Progress:* ${task.progress}%\n` +
        (task.tags?.length ? `*Tags:* ${task.tags.join(', ')}\n` : '') +
        (task.desc ? `\n_${task.desc.slice(0, 300)}_` : '');

      const inlineKeyboard = [
        [
          { text: 'Mark Done', callback_data: `done_${task._id}` },
          { text: 'Set High Priority', callback_data: `prio_high_${task._id}` },
          { text: 'Set Low Priority', callback_data: `prio_low_${task._id}` },
        ],
      ];

      bot!.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: inlineKeyboard },
      });
    } catch (err) {
      console.error('[Telegram] Task detail error:', err);
      bot!.sendMessage(chatId, 'Failed to fetch task details.');
    }
  });

  // /done <id>
  bot.onText(/\/done\s+(\S+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const user = await User.findOne({ telegramChatId: chatId });
    if (!user) {
      bot!.sendMessage(chatId, 'Your Telegram is not linked. Use /start for instructions.');
      return;
    }

    const taskIdInput = match![1];
    try {
      let task;
      if (taskIdInput.length === 24) {
        task = await Task.findById(taskIdInput);
      } else {
        const allTasks = await Task.find({ createdByUserId: user._id });
        task = allTasks.find((t) => t._id.toString().endsWith(taskIdInput));
      }

      if (!task) {
        bot!.sendMessage(chatId, 'Task not found.');
        return;
      }

      task.status = 'done';
      task.progress = 100;
      await task.save();

      bot!.sendMessage(chatId, `Task *${task.title}* marked as done!`, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[Telegram] Done error:', err);
      bot!.sendMessage(chatId, 'Failed to update task.');
    }
  });

  // /create <title>
  bot.onText(/\/create\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const user = await User.findOne({ telegramChatId: chatId });
    if (!user) {
      bot!.sendMessage(chatId, 'Your Telegram is not linked. Use /start for instructions.');
      return;
    }

    const title = match![1].trim();
    if (!title) {
      bot!.sendMessage(chatId, 'Please provide a task title: `/create My task title`', { parse_mode: 'Markdown' });
      return;
    }

    try {
      // Use the first workspace the user has access to
      const Workspace = (await import('../models/Workspace')).default;
      const workspace = await Workspace.findOne().lean();
      if (!workspace) {
        bot!.sendMessage(chatId, 'No workspace found. Create one in Mission Control first.');
        return;
      }

      const task = await Task.create({
        title,
        desc: 'Created via Telegram',
        status: 'todo',
        assignee: user.name,
        priority: 'medium',
        workspaceId: workspace._id,
        createdByUserId: user._id,
      });

      const shortId = task._id.toString().slice(-6);
      bot!.sendMessage(
        chatId,
        `Task created!\n\n*${title}*\nID: \`${shortId}\` | Status: \`todo\``,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('[Telegram] Create error:', err);
      bot!.sendMessage(chatId, 'Failed to create task.');
    }
  });

  // /status
  bot.onText(/\/status$/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await User.findOne({ telegramChatId: chatId });
    if (!user) {
      bot!.sendMessage(chatId, 'Your Telegram is not linked. Use /start for instructions.');
      return;
    }

    try {
      const [taskCounts, agentCount] = await Promise.all([
        Task.aggregate([
          { $match: { createdByUserId: user._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Agent.countDocuments(),
      ]);

      const counts: Record<string, number> = {};
      for (const tc of taskCounts) {
        counts[tc._id] = tc.count;
      }

      const total = Object.values(counts).reduce((a, b) => a + b, 0);

      const text =
        `*Mission Status*\n\n` +
        `*Tasks:* ${total} total\n` +
        `  Backlog: ${counts['backlog'] || 0}\n` +
        `  To Do: ${counts['todo'] || 0}\n` +
        `  In Progress: ${counts['inprogress'] || 0}\n` +
        `  Review: ${counts['review'] || 0}\n` +
        `  Done: ${counts['done'] || 0}\n\n` +
        `*Agents:* ${agentCount} registered`;

      bot!.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[Telegram] Status error:', err);
      bot!.sendMessage(chatId, 'Failed to fetch status.');
    }
  });

  // Callback query handler for inline keyboard buttons
  bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id;
    if (!chatId) return;

    const data = query.data || '';
    const user = await User.findOne({ telegramChatId: chatId });
    if (!user) {
      bot!.answerCallbackQuery(query.id, { text: 'Account not linked.' });
      return;
    }

    try {
      if (data.startsWith('view_')) {
        const taskId = data.replace('view_', '');
        const task = await Task.findById(taskId).lean();
        if (!task) {
          bot!.answerCallbackQuery(query.id, { text: 'Task not found.' });
          return;
        }

        const text =
          `*${task.title}*\n\n` +
          `*Status:* \`${task.status}\`\n` +
          `*Priority:* \`${task.priority}\`\n` +
          `*Assignee:* ${task.assignee}\n` +
          `*Progress:* ${task.progress}%\n` +
          (task.desc ? `\n_${task.desc.slice(0, 300)}_` : '');

        bot!.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        bot!.answerCallbackQuery(query.id);
      } else if (data.startsWith('done_')) {
        const taskId = data.replace('done_', '');
        const task = await Task.findById(taskId);
        if (!task) {
          bot!.answerCallbackQuery(query.id, { text: 'Task not found.' });
          return;
        }
        task.status = 'done';
        task.progress = 100;
        await task.save();
        bot!.answerCallbackQuery(query.id, { text: 'Task marked as done!' });
        bot!.sendMessage(chatId, `Task *${task.title}* marked as done!`, { parse_mode: 'Markdown' });
      } else if (data.startsWith('prio_')) {
        const parts = data.split('_');
        const priority = parts[1] as 'high' | 'low';
        const taskId = parts[2];
        const task = await Task.findById(taskId);
        if (!task) {
          bot!.answerCallbackQuery(query.id, { text: 'Task not found.' });
          return;
        }
        task.priority = priority;
        await task.save();
        bot!.answerCallbackQuery(query.id, { text: `Priority set to ${priority}!` });
        bot!.sendMessage(chatId, `Task *${task.title}* priority set to \`${priority}\`.`, { parse_mode: 'Markdown' });
      }
    } catch (err) {
      console.error('[Telegram] Callback error:', err);
      bot!.answerCallbackQuery(query.id, { text: 'An error occurred.' });
    }
  });

  return bot;
}

export { bot, linkCodes };
export default { initTelegramBot, generateLinkCode, notifyTaskUpdate, bot };
