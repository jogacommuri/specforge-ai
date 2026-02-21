"use client";

import { AgentState } from "@/types/agent";

interface Props {
  agents: AgentState[];
}

export default function PipelineGraph({ agents }: Props) {
  // Filter agents that have token data
  const agentsWithData = agents.filter(
    (a) => a.tokens !== undefined && a.tokens !== null && a.tokens > 0
  );

  if (agentsWithData.length === 0) {
    return null;
  }

  // Calculate max values for scaling
  const maxTokens = Math.max(...agentsWithData.map((a) => a.tokens || 0));
  const maxCost = Math.max(
    ...agentsWithData.map((a) => (a.cost ? Number(a.cost) : 0))
  );

  // Calculate totals
  const totalTokens = agentsWithData.reduce(
    (sum, a) => sum + (a.tokens || 0),
    0
  );
  const totalCost = agentsWithData.reduce(
    (sum, a) => sum + (Number(a.cost) || 0),
    0
  );

  return (
    <div className="mb-8 p-5 bg-neutral-900 border border-neutral-800 rounded-xl">
      <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
        Pipeline Visualization
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Usage Bar Chart */}
        <div>
          <h3 className="text-sm font-medium text-neutral-300 mb-3">
            Token Usage per Agent
          </h3>
          <div className="space-y-3">
            {agentsWithData.map((agent, index) => {
              const tokens = agent.tokens || 0;
              const percentage = maxTokens > 0 ? (tokens / maxTokens) * 100 : 0;
              const agentPercentage = totalTokens > 0 ? (tokens / totalTokens) * 100 : 0;

              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400 truncate max-w-[60%]">
                      {agent.name}
                    </span>
                    <span className="text-neutral-300 font-medium">
                      {tokens.toLocaleString()} ({agentPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-4 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost Bar Chart */}
        <div>
          <h3 className="text-sm font-medium text-neutral-300 mb-3">
            Cost per Agent
          </h3>
          <div className="space-y-3">
            {agentsWithData.map((agent, index) => {
              const cost = Number(agent.cost) || 0;
              const percentage = maxCost > 0 ? (cost / maxCost) * 100 : 0;
              const agentPercentage = totalCost > 0 ? (cost / totalCost) * 100 : 0;

              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400 truncate max-w-[60%]">
                      {agent.name}
                    </span>
                    <span className="text-neutral-300 font-medium">
                      ${cost.toFixed(4)} ({agentPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-4 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timeline/Flow Visualization */}
      <div className="mt-6 pt-6 border-t border-neutral-800">
        <h3 className="text-sm font-medium text-neutral-300 mb-4">
          Execution Timeline
        </h3>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-800" />
          
          <div className="space-y-4 pl-8">
            {agentsWithData.map((agent, index) => {
              const duration = agent.duration || 0;
              const durationSeconds = (duration / 1000).toFixed(2);
              const statusColor =
                agent.status === "completed"
                  ? "bg-green-600"
                  : agent.status === "running"
                  ? "bg-yellow-600"
                  : agent.status === "error"
                  ? "bg-red-600"
                  : "bg-neutral-700";

              return (
                <div key={index} className="relative flex items-center gap-4">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-7 w-3 h-3 rounded-full ${statusColor} border-2 border-neutral-900 z-10`}
                  />
                  
                  {/* Agent info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-neutral-300 font-medium truncate">
                        {agent.name}
                      </span>
                      <div className="flex items-center gap-4 text-xs text-neutral-400">
                        {duration > 0 && (
                          <span>{durationSeconds}s</span>
                        )}
                        {agent.confidence !== undefined && agent.confidence !== null && (
                          <span>
                            {(Number(agent.confidence) * 100).toFixed(0)}% conf
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
