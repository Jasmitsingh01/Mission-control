import { motion } from "framer-motion";
import {
  Wifi,
  WifiOff,
  Power,
  PowerOff,
  Copy,
  Check,
  Clock,
  Hash,
} from "lucide-react";
import { useState, useCallback } from "react";
import type { ConnectionStatus } from "@/hooks/useOpenClaw";
import type { MCWorkspace } from "@/stores/missionControlStore";

interface SessionPanelProps {
  workspace: MCWorkspace | null;
  status: ConnectionStatus;
  sessionKey: string | undefined;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function SessionPanel({
  workspace,
  status,
  sessionKey,
  onConnect,
  onDisconnect,
}: SessionPanelProps) {
  const [copied, setCopied] = useState(false);

  const copySession = useCallback(() => {
    if (!sessionKey) return;
    navigator.clipboard.writeText(sessionKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [sessionKey]);

  const session = workspace?.openclawSession;
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Hash className="w-4 h-4 text-indigo-400" />
          Session
        </h3>
        <div
          className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${
            isConnected
              ? "text-emerald-400 bg-emerald-500/15"
              : status === "error"
              ? "text-red-400 bg-red-500/15"
              : "text-slate-500 bg-slate-500/15"
          }`}
        >
          {isConnected ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          <span className="capitalize">{status}</span>
        </div>
      </div>

      {/* Session details */}
      {session ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Title</span>
            <span className="text-slate-300 truncate max-w-[160px]">
              {session.sessionTitle || "Untitled"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Key</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-mono truncate max-w-[120px]">
                {sessionKey?.slice(0, 12)}...
              </span>
              <button
                onClick={copySession}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Copy session key"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Created</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(session.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-600 text-center py-2">
          No session available. Create one from the workspace settings.
        </div>
      )}

      {/* Connect / Disconnect */}
      <div className="flex gap-2">
        {isConnected ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDisconnect}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <PowerOff className="w-3.5 h-3.5" />
            Disconnect
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConnect}
            disabled={!sessionKey || isConnecting}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Power className="w-3.5 h-3.5" />
            {isConnecting ? "Connecting..." : "Connect"}
          </motion.button>
        )}
      </div>
    </div>
  );
}
