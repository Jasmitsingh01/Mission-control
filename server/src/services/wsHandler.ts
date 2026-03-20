import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { executor, StreamEvent } from './claudeExecutor';

const JWT_SECRET = process.env.JWT_SECRET || 'agentforge_jwt_secret_change_in_production';

interface AuthenticatedWs extends WebSocket {
  userId?: string;
  orgId?: string;
  subscribedExecutions: Set<string>;
  isAlive: boolean;
}

// Track subscribers per execution
const executionSubscribers = new Map<string, Set<AuthenticatedWs>>();

// Global subscriber for org-wide events
const orgSubscribers = new Map<string, Set<AuthenticatedWs>>();

export function setupWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: '/ws/execute',
  });

  // Heartbeat to detect dead connections
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = ws as AuthenticatedWs;
      if (!client.isAlive) {
        cleanupClient(client);
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30_000);

  wss.on('close', () => clearInterval(heartbeat));

  wss.on('connection', (ws: WebSocket, req) => {
    const client = ws as AuthenticatedWs;
    client.subscribedExecutions = new Set();
    client.isAlive = true;

    client.on('pong', () => {
      client.isAlive = true;
    });

    // Authenticate via query param token
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      client.send(JSON.stringify({ type: 'error', message: 'Authentication required. Pass ?token=JWT' }));
      client.close(1008, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      client.userId = decoded.id;
    } catch {
      client.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
      client.close(1008, 'Invalid token');
      return;
    }

    // Set org context from query param
    const orgId = url.searchParams.get('orgId');
    if (orgId) {
      client.orgId = orgId;

      // Subscribe to org-wide events
      if (!orgSubscribers.has(orgId)) {
        orgSubscribers.set(orgId, new Set());
      }
      orgSubscribers.get(orgId)!.add(client);
    }

    client.send(JSON.stringify({ type: 'connected', userId: client.userId }));

    // Handle incoming messages (subscribe/unsubscribe to executions)
    client.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'subscribe' && msg.executionId) {
          client.subscribedExecutions.add(msg.executionId);
          if (!executionSubscribers.has(msg.executionId)) {
            executionSubscribers.set(msg.executionId, new Set());
          }
          executionSubscribers.get(msg.executionId)!.add(client);
          client.send(JSON.stringify({ type: 'subscribed', executionId: msg.executionId }));
        }

        if (msg.type === 'unsubscribe' && msg.executionId) {
          client.subscribedExecutions.delete(msg.executionId);
          executionSubscribers.get(msg.executionId)?.delete(client);
        }
      } catch {
        // Ignore invalid messages
      }
    });

    client.on('close', () => {
      cleanupClient(client);
    });
  });

  // Listen to executor stream events and broadcast to subscribers
  executor.on('stream', (event: StreamEvent) => {
    const subscribers = executionSubscribers.get(event.executionId);
    if (!subscribers || subscribers.size === 0) return;

    const payload = JSON.stringify(event);

    subscribers.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });

    // Clean up completed/failed execution subscribers after a delay
    if (event.type === 'complete' || event.type === 'error') {
      setTimeout(() => {
        executionSubscribers.delete(event.executionId);
      }, 60_000); // Keep for 1 min after completion
    }
  });

  console.log('WebSocket server ready on /ws/execute');

  return wss;
}

function cleanupClient(client: AuthenticatedWs): void {
  // Remove from execution subscribers
  for (const execId of client.subscribedExecutions) {
    executionSubscribers.get(execId)?.delete(client);
  }

  // Remove from org subscribers
  if (client.orgId) {
    orgSubscribers.get(client.orgId)?.delete(client);
  }
}
