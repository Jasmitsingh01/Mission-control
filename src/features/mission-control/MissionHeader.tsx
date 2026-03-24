import { motion } from "framer-motion";
import {
  Radar,
  ArrowLeft,
  Loader2,
  Satellite,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ConnectionStatus } from "@/hooks/useOpenClaw";

interface MissionHeaderProps {
  workspaceName: string;
  status: ConnectionStatus;
  isStreaming: boolean;
  taskCount: number;
  agentCount: number;
}

export default function MissionHeader({
  workspaceName,
  status,
  isStreaming,
  taskCount,
  agentCount,
}: MissionHeaderProps) {
  const isConnected = status === "connected";

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-slate-900/60 border-b border-slate-800 backdrop-blur-sm">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard"
          className="text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="flex items-center gap-3">
          {/* Animated radar */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <motion.div
              className={`absolute inset-0 rounded-full ${
                isConnected ? "bg-emerald-500/10" : "bg-slate-500/10"
              }`}
              animate={
                isConnected
                  ? {
                      scale: [1, 1.6, 1],
                      opacity: [0.3, 0, 0.3],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            <motion.div
              className={`absolute inset-1 rounded-full ${
                isConnected ? "bg-emerald-500/15" : "bg-slate-500/10"
              }`}
              animate={
                isConnected
                  ? {
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.3,
              }}
            />
            <Radar
              className={`w-5 h-5 relative z-10 ${
                isConnected ? "text-emerald-400" : "text-slate-500"
              }`}
            />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Mission Control
              {isStreaming && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-emerald-500/15 text-emerald-400 rounded-full"
                >
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  LIVE
                </motion.span>
              )}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Satellite className="w-3 h-3" />
              {workspaceName || "No workspace selected"}
            </p>
          </div>
        </div>
      </div>

      {/* Right side stats */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-lg font-bold text-slate-200">{taskCount}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">
            Tasks
          </div>
        </div>
        <div className="w-px h-8 bg-slate-800" />
        <div className="text-center">
          <div className="text-lg font-bold text-slate-200">{agentCount}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">
            Agents
          </div>
        </div>
        <div className="w-px h-8 bg-slate-800" />
        <div className="text-center">
          <motion.div
            className={`text-lg font-bold ${
              isConnected ? "text-emerald-400" : "text-slate-500"
            }`}
            animate={isConnected ? { opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isConnected ? "ON" : "OFF"}
          </motion.div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">
            Link
          </div>
        </div>
      </div>
    </div>
  );
}
