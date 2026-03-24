import WebSocket from 'ws';

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL ?? 'ws://127.0.0.1:18789';

function buildConnectPayload(): object {
  return {
    type: 'req',
    id: 'conn-1',
    method: 'connect',
    params: {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: 'cli',
        version: '1.0.0',
        platform: 'linux',
        mode: 'cli',
      },
      role: 'operator',
      scopes: [
        'operator.read',
        'operator.write',
        'operator.admin',
        'operator.approvals',
        'operator.pairing',
      ],
      caps: [],
      commands: [],
      permissions: {},
      auth: {
        token: process.env.OPENCLAW_AUTH_TOKEN || '64bfdcc1ab6f995768d52c4a35cb8014818b006b17c6c255',
        deviceToken: process.env.OPENCLAW_DEVICE_TOKEN || 'iVn44bQ9C9_4NlZBb1csYc3QLOUf6yZe64c3KRNVnKo',
      },
      locale: 'en-US',
      userAgent: 'mission-control/1.0.0',
    },
  };
}

export type ChatMessageCallback = (text: string) => void;
export type ChatDoneCallback = () => void;
export type ErrorCallback = (error: string) => void;

export interface SendMessageOptions {
  sessionKey: string;
  sessionTitle?: string;
  message: string;
  idempotencyKey: string;
  onDelta?: ChatMessageCallback;
  onDone?: ChatDoneCallback;
  onError?: ErrorCallback;
}

export interface CreateSessionOptions {
  sessionKey: string;
  sessionTitle: string;
  userId?: string;
  workspaceData?: any;
}

export interface SessionInfo {
  sessionKey: string;
  sessionTitle: string;
  sessionId: string | null;
}

export class OpenClawService {
  private activeSessions = new Map<string, WebSocket>();

  createSession(options: CreateSessionOptions): Promise<SessionInfo> {
    return new Promise<SessionInfo>((resolve, reject) => {
      const { sessionKey, userId } = options;
      console.log(`[OpenClaw] Starting session creation for user: ${userId}, session: ${sessionKey}`);

      const socket = new WebSocket(GATEWAY_URL, {
        headers: { Origin: 'http://127.0.0.1:18789' },
      });

      let helloSent = false;
      let viewSent = false;
      let capturedSessionId: string | null = null;

      const cleanup = (err?: Error) => {
        socket.removeAllListeners();
        socket.close();
        if (err) reject(err);
      };

      socket.on('open', () => {
        console.log('[OpenClaw] createSession – connected, waiting for challenge...');
      });

      socket.on('message', (raw: WebSocket.RawData) => {
        let msg: any;
        try {
          msg = JSON.parse(raw.toString());
        } catch {
          cleanup(new Error('Failed to parse gateway message'));
          return;
        }

        console.log(`[OpenClaw] CREATE [${msg.type}]:`, JSON.stringify(msg).substring(0, 160));

        if (msg.type === 'event' && msg.event === 'connect.challenge') {
          socket.send(JSON.stringify(buildConnectPayload()));
          return;
        }

        const payload = msg.payload;
        if (msg.type === 'res' && payload?.type === 'hello-ok') {
          socket.send(JSON.stringify({
            type: 'req',
            id: 'req-create-session',
            method: 'sessions.patch',
            params: { key: sessionKey },
          }));
          return;
        }

        if (msg.type === 'res' && msg.id === 'req-create-session') {
          if (msg.ok === false) {
            cleanup(new Error(msg.error || 'sessions.patch failed'));
            return;
          }
          capturedSessionId = payload?.id || payload?.sessionId || null;
          console.log(`[OpenClaw] Session patched: ${capturedSessionId}. Sending Hello...`);

          socket.send(JSON.stringify({
            type: 'req',
            id: 'req-hello',
            method: 'chat.send',
            params: {
              sessionKey,
              message: 'Hello from Mission Control',
              idempotencyKey: `hello-${Date.now()}`
            },
          }));
          helloSent = true;
          return;
        }

        if (msg.type === 'res' && msg.ok === true) {
          if (msg.id === 'req-hello' && !viewSent) {
            console.log('[OpenClaw] Hello sent successfully, sending View...');
            socket.send(JSON.stringify({
              type: 'req',
              id: 'req-view',
              method: 'chat.send',
              params: {
                sessionKey,
                message: `View user: ${userId ?? 'unknown'}`,
                idempotencyKey: `view-${Date.now()}`
              },
            }));
            viewSent = true;
          } else if (msg.id === 'req-view') {
            console.log('[OpenClaw] Handshake complete.');
            resolve({ sessionKey, sessionTitle: options.sessionTitle, sessionId: capturedSessionId });
            cleanup();
          }
          return;
        }

        if (msg.type === 'event' && msg.event === 'chat' && (payload?.type === 'chat.final' || payload?.type === 'chat.done')) {
          if (helloSent && !viewSent) {
            socket.send(JSON.stringify({
              type: 'req',
              id: 'req-view',
              method: 'chat.send',
              params: {
                sessionKey,
                message: `View user: ${userId ?? 'unknown'}`,
                idempotencyKey: `view-${Date.now()}`
              },
            }));
            viewSent = true;
          }
        }

        if (msg.ok === false) {
          cleanup(new Error(msg.error || 'Gateway error'));
        }
      });

      socket.on('error', (err: Error) => cleanup(err));
      socket.on('close', (code: number) => {
        reject(new Error(`Socket closed (code ${code})`));
      });
    });
  }

  sendMessage(options: SendMessageOptions): void {
    const { sessionKey, message, idempotencyKey, onDelta, onDone, onError } = options;

    const socket = new WebSocket(GATEWAY_URL, {
      headers: { Origin: 'http://127.0.0.1:18789' },
    });

    socket.on('open', () => {
      console.log('[OpenClaw] sendMessage – connected.');
    });

    socket.on('message', (raw: WebSocket.RawData) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        console.error('[OpenClaw] Failed to parse message');
        return;
      }

      const payload = msg.payload;

      if (msg.type === 'event' && msg.event === 'connect.challenge') {
        socket.send(JSON.stringify(buildConnectPayload()));
        return;
      }

      if (msg.type === 'res' && msg.payload?.type === 'hello-ok') {
        socket.send(JSON.stringify({
          type: 'req',
          id: 'req-session',
          method: 'sessions.patch',
          params: { key: sessionKey },
        }));
        return;
      }

      if (msg.type === 'res' && msg.id === 'req-session' && msg.ok === true) {
        socket.send(JSON.stringify({
          type: 'req',
          id: 'req-chat',
          method: 'chat.send',
          params: { sessionKey, message, idempotencyKey },
        }));
        return;
      }

      if (msg.type === 'event' && msg.event === 'chat') {
        if (payload?.type === 'chat.delta') {
          onDelta?.(payload.text || '');
        }
        if (payload?.type === 'chat.final' || payload?.type === 'chat.done') {
          onDone?.();
          socket.close();
        }
        return;
      }

      if (msg.ok === false) {
        onError?.(msg.error || 'Gateway error');
      }
    });

    socket.on('error', (err: Error) => {
      onError?.(err.message);
    });

    socket.on('close', (code: number, reason: Buffer) => {
      console.log(`[OpenClaw] Disconnected. Code: ${code}, Reason: ${reason.toString() || '(none)'}`);
    });
  }

  getActiveSessions(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  async bridgeSession(sessionKey: string, localSocket: any): Promise<void> {
    if (!localSocket || typeof localSocket.on !== 'function') {
      console.error(`[OpenClaw] bridgeSession failed: localSocket is invalid for ${sessionKey}`);
      return;
    }
    console.log(`[OpenClaw] Bridging session: ${sessionKey}`);

    const gatewaySocket = new WebSocket(GATEWAY_URL, {
      headers: { Origin: 'http://127.0.0.1:18789' },
    });

    let bridgeReady = false;
    const buffer: string[] = [];

    gatewaySocket.on('message', (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        localSocket.send(raw.toString());
        return;
      }

      if (msg.type === 'event' && msg.event === 'connect.challenge') {
        gatewaySocket.send(JSON.stringify(buildConnectPayload()));
        return;
      }

      if (msg.type === 'res' && msg.payload?.type === 'hello-ok') {
        gatewaySocket.send(JSON.stringify({
          type: 'req',
          id: 'bridge-patch',
          method: 'sessions.patch',
          params: { key: sessionKey },
        }));
        return;
      }

      if (msg.type === 'res' && msg.id === 'bridge-patch') {
        console.log(`[OpenClaw] Bridge for ${sessionKey} is authenticated and patched.`);
        bridgeReady = true;
        while (buffer.length > 0) {
          const next = buffer.shift();
          if (next) gatewaySocket.send(next);
        }
        return;
      }

      localSocket.send(raw.toString());
    });

    localSocket.on('message', (data: any) => {
      const raw = data.toString();
      if (bridgeReady && gatewaySocket.readyState === WebSocket.OPEN) {
        gatewaySocket.send(raw);
      } else {
        buffer.push(raw);
      }
    });

    const cleanup = () => {
      this.activeSessions.delete(sessionKey);
      if (gatewaySocket.readyState === WebSocket.OPEN) gatewaySocket.close();
      if (localSocket.readyState === WebSocket.OPEN) localSocket.close();
    };

    gatewaySocket.on('close', cleanup);
    localSocket.on('close', cleanup);
    gatewaySocket.on('error', (err) => {
      console.error(`[OpenClaw] Gateway error:`, err);
      cleanup();
    });

    this.activeSessions.set(sessionKey, gatewaySocket);
  }
}

export const openClawService = new OpenClawService();
