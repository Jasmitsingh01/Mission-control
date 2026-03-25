import { Bot, Zap, Crown, Radio, Clock } from "lucide-react";
import type { MCAgent } from "@/stores/missionControlStore";

const AGENT_COLORS = [
  "bg-violet-600",
  "bg-cyan-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-indigo-600",
  "bg-lime-600",
  "bg-fuchsia-600",
];

function getColor(index: number) {
  return AGENT_COLORS[index % AGENT_COLORS.length];
}

function getStatusColor(status?: string) {
  switch (status) {
    case "online":
    case "active":
      return "bg-emerald-400";
    case "busy":
      return "bg-amber-400";
    case "offline":
      return "bg-slate-500";
    case "error":
      return "bg-red-400";
    default:
      return "bg-slate-500";
  }
}

interface AgentCardsProps {
  agents: MCAgent[];
}

export default function AgentCards({ agents }: AgentCardsProps) {
  if (agents.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-violet-400" />
          Agents
        </h3>
        <div className="text-xs text-slate-600 text-center py-4">
          No agents assigned to this workspace.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
        <Bot className="w-4 h-4 text-violet-400" />
        Agents
        <span className="text-xs text-slate-500 font-normal">
          ({agents.length})
        </span>
      </h3>

      <div className="space-y-2">
        {agents.map((agent, idx) => (
          <div
            key={agent._id || agent.name}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className={`w-8 h-8 rounded-lg ${getColor(idx)} flex items-center justify-center text-white text-xs font-semibold`}
              >
                {agent.name.charAt(0).toUpperCase()}
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${getStatusColor(agent.status)} ring-2 ring-slate-900`}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-200 truncate">
                  {agent.name}
                </span>
                {agent.isBoardLead && (
                  <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                )}
                {agent.isGatewayMain && (
                  <Radio className="w-3 h-3 text-cyan-400 shrink-0" />
                )}
              </div>

              {/* Skills */}
              {agent.skills && agent.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {agent.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill.name}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-700/50 text-slate-400"
                    >
                      <Zap className="w-2 h-2" />
                      {skill.name}
                    </span>
                  ))}
                  {agent.skills.length > 3 && (
                    <span className="text-[10px] text-slate-500">
                      +{agent.skills.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Last seen */}
            {agent.lastSeenAt && (
              <div className="text-[10px] text-slate-600 flex items-center gap-0.5 shrink-0">
                <Clock className="w-2.5 h-2.5" />
                {new Date(agent.lastSeenAt).toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
