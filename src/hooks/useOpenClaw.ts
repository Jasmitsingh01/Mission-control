import { useCallback, useEffect, useRef, useState } from "react";

export interface GatewayRpcRequest {
  type: "req";
  id: string;
  method: string;
  params: Record<string, unknown>;
}

export interface GatewayEvent {
  type: "event";
  event: string;
  payload?: {
    type?: string;
    text?: string;
    name?: string;
    content?: unknown;
    [key: string]: unknown;
  };
}

export interface GatewayResponse {
  type: "res";
  id: string;
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: string;
}

export type GatewayMessage = GatewayEvent | GatewayResponse;

export type LogLevel =
  | "system"
  | "user"
  | "agent"
  | "delta"
  | "error"
  | "info"
  | "success"
  | "tool_use"
  | "tool_result";

export interface TerminalEntry {
  id: string;
  level: LogLevel;
  content: string;
  timestamp: number;
  streaming?: boolean;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export function useOpenClaw(sessionKey: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [logs, setLogs] = useState<TerminalEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamBufferRef = useRef("");
  const streamEntryIdRef = useRef<string | null>(null);
  const reqCounterRef = useRef(0);

  const pushLog = useCallback((level: LogLevel, content: string, streaming = false) => {
    const entry: TerminalEntry = {
      id: crypto.randomUUID(),
      level,
      content,
      timestamp: Date.now(),
      streaming,
    };
    setLogs((prev) => [...prev, entry]);
    return entry.id;
  }, []);

  const updateStreamEntry = useCallback((id: string, content: string) => {
    setLogs((prev) => prev.map((e) => (e.id === id ? { ...e, content } : e)));
  }, []);

  const finalizeStreamEntry = useCallback((id: string) => {
    setLogs((prev) => prev.map((e) => (e.id === id ? { ...e, streaming: false } : e)));
  }, []);

  const handleGatewayMessage = useCallback(
    (msg: GatewayMessage) => {
      if (msg.type === "event" && msg.event === "chat") {
        const payload = (msg as GatewayEvent).payload;
        if (!payload) return;

        if (payload.type === "chat.delta") {
          setIsStreaming(true);
          const text = (payload.text as string) || "";
          streamBufferRef.current += text;
          if (!streamEntryIdRef.current) {
            const id = pushLog("delta", streamBufferRef.current, true);
            streamEntryIdRef.current = id;
          } else {
            updateStreamEntry(streamEntryIdRef.current, streamBufferRef.current);
          }
          return;
        }

        if (payload.type === "chat.final" || payload.type === "chat.done") {
          setIsStreaming(false);
          if (streamEntryIdRef.current) {
            const finalContent =
              streamBufferRef.current || (payload.text as string) || "";
            updateStreamEntry(streamEntryIdRef.current, finalContent);
            finalizeStreamEntry(streamEntryIdRef.current);
            streamEntryIdRef.current = null;
            streamBufferRef.current = "";
          } else if (payload.text) {
            pushLog("agent", payload.text as string);
          }
          return;
        }

        if (payload.type === "tool_use") {
          pushLog("tool_use", `Tool: ${payload.name || "unknown"}`);
          return;
        }

        if (payload.type === "tool_result") {
          const result =
            typeof payload.content === "string"
              ? payload.content
              : JSON.stringify(payload.content || "");
          pushLog("tool_result", result.slice(0, 500));
          return;
        }

        if (payload.text) {
          pushLog("agent", payload.text as string);
        }
        return;
      }

      if (msg.type === "res") {
        const r = msg as GatewayResponse;
        if (r.ok === false) {
          pushLog("error", `Request ${r.id} failed: ${r.error || "Unknown error"}`);
        }
        return;
      }

      if (msg.type === "event") {
        const ev = msg as GatewayEvent;
        if (ev.event !== "chat") {
          pushLog("info", `Event: ${ev.event}`);
        }
      }
    },
    [pushLog, updateStreamEntry, finalizeStreamEntry]
  );

  const connect = useCallback(() => {
    if (!sessionKey) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    const wsBase = apiUrl.replace("/api", "").replace("http", "ws");
    const ws = new WebSocket(`${wsBase}/ws/openclaw/${sessionKey}`);

    ws.onopen = () => {
      setStatus("connected");
      pushLog("system", "Connected to OpenClaw gateway");
      pushLog("info", `Session: ${sessionKey}`);
    };

    ws.onclose = (ev) => {
      setStatus("disconnected");
      pushLog("system", `Disconnected (code ${ev.code})`);
      wsRef.current = null;
    };

    ws.onerror = () => {
      setStatus("error");
      pushLog("error", "WebSocket connection error");
    };

    ws.onmessage = (event) => {
      let msg: GatewayMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        pushLog("info", event.data);
        return;
      }
      handleGatewayMessage(msg);
    };

    wsRef.current = ws;
  }, [sessionKey, pushLog, handleGatewayMessage]);

  const sendMessage = useCallback(
    (message: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        pushLog("error", "Not connected to gateway");
        return;
      }
      if (!sessionKey) {
        pushLog("error", "No active session");
        return;
      }

      const reqId = `req-${++reqCounterRef.current}`;
      const rpc: GatewayRpcRequest = {
        type: "req",
        id: reqId,
        method: "chat.send",
        params: {
          sessionKey,
          message,
          idempotencyKey: `mc-${Date.now()}-${reqCounterRef.current}`,
        },
      };

      pushLog("user", message);
      wsRef.current.send(JSON.stringify(rpc));
      streamBufferRef.current = "";
      streamEntryIdRef.current = null;
    },
    [sessionKey, pushLog]
  );

  const sendRpc = useCallback(
    (method: string, params: Record<string, unknown>) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        pushLog("error", "Not connected");
        return;
      }
      const reqId = `rpc-${++reqCounterRef.current}`;
      const rpc: GatewayRpcRequest = { type: "req", id: reqId, method, params };
      pushLog("system", `RPC -> ${method}`);
      wsRef.current.send(JSON.stringify(rpc));
    },
    [pushLog]
  );

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    streamBufferRef.current = "";
    streamEntryIdRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    status,
    logs,
    isStreaming,
    connect,
    disconnect,
    sendMessage,
    sendRpc,
    clearLogs,
    pushLog,
    sessionKey,
  };
}
