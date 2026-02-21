"use client";

import { AgentState } from "@/types/agent";

interface Props {
  agent: AgentState;
}

export default function AgentCard({ agent }: Props) {
  const statusColors = {
    idle: "bg-neutral-800",
    running: "bg-yellow-600 animate-pulse",
    completed: "bg-green-600",
    error: "bg-red-600",
  };

  return (
    <div className="border border-neutral-800 rounded-xl p-4 bg-neutral-900 min-w-[200px]">
        <h3 className="font-semibold mb-2">{agent.name}</h3>

        <div
            className={`text-sm px-3 py-1 rounded-md inline-block ${statusColors[agent.status]}`}
        >
            {agent.status.toUpperCase()}
        </div>

        {agent.duration != null && (
            <p className="text-xs text-neutral-400 mt-2">
            {(Number(agent.duration) / 1000).toFixed(2)}s
            </p>
        )}
        {agent.confidence !== undefined && agent.confidence !== null && (
            <p className="text-xs mt-1">
                Confidence: {(Number(agent.confidence) * 100).toFixed(0)}%
            </p>
        )}
        {agent.attempts && (
            <p className="text-xs text-neutral-400 mt-1">
                Attempts: {agent.attempts}
            </p>
        )}
        {agent.tokens !== undefined && (
            <p className="text-xs text-neutral-400 mt-1">
                Tokens: {agent.tokens}
            </p>
        )}

        {agent.cost !== undefined && agent.cost !== null && (
            <p className="text-xs text-neutral-400">
                Est. Cost: ${Number(agent.cost).toFixed(4)}
            </p>
        )}
    </div>
  );
}