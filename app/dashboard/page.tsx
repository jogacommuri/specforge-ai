"use client";

import { useState } from "react";
import AgentCard from "@/components/AgentCard";
import PipelineGraph from "@/components/PipelineGraph";
import { AgentState } from "@/types/agent";

export default function Dashboard() {
  const [feature, setFeature] = useState("");
  const [agents, setAgents] = useState<AgentState[]>([
    { name: "Requirements", status: "idle" },
    { name: "Requirements Evaluation", status: "idle" },
    { name: "API Design", status: "idle" },
    { name: "API Design Evaluation", status: "idle" },
    { name: "Test Cases", status: "idle" },
    { name: "Test Cases Evaluation", status: "idle" },
  ]);
  const [result, setResult] = useState<any>(null);

  async function runPipeline() {
    setResult(null);
    // Reset all agents to idle state
    setAgents([
      { name: "Requirements", status: "idle" },
      { name: "Requirements Evaluation", status: "idle" },
      { name: "API Design", status: "idle" },
      { name: "API Design Evaluation", status: "idle" },
      { name: "Test Cases", status: "idle" },
      { name: "Test Cases Evaluation", status: "idle" },
    ]);
  
    const res = await fetch("/api/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature }),
    });
  
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
  
    if (!reader) return;
  
    let buffer = "";
  
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
  
      buffer += decoder.decode(value);
  
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
  
      for (const line of lines) {
        if (!line.trim()) continue;
      
        const parsed = JSON.parse(line);
      
        setAgents((prev) =>
          prev.map((a) =>
            a.name === parsed.agent
              ? {
                  ...a,
                  status: parsed.status,
                  ...(parsed.duration !== undefined && { duration: parsed.duration }),
                  ...(parsed.attempts !== undefined && { attempts: parsed.attempts }),
                  ...(parsed.confidence !== undefined && { confidence: parsed.confidence }),
                  ...(parsed.tokens !== undefined && { tokens: parsed.tokens }),
                  ...(parsed.cost !== undefined && { cost: parsed.cost }),
                }
              : a
          )
        );
      
        if (parsed.data) {
          setResult((prev: any) => ({
            ...prev,
            [parsed.agent]: parsed.data,
          }));
        }
      }
    }
  }

  function updateAgent(index: number, status: AgentState["status"]) {
    setAgents((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, status } : a
      )
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-10">
      <h1 className="text-4xl font-bold mb-6">SpecForge AI</h1>

      <textarea
        value={feature}
        onChange={(e) => setFeature(e.target.value)}
        placeholder="Describe your feature..."
        className="w-full p-4 bg-neutral-900 border border-neutral-800 rounded-xl mb-6"
      />

      <button
        onClick={runPipeline}
        className="bg-blue-600 px-6 py-2 rounded-xl mb-8"
      >
        Run Agents
      </button>

      {agents.some((a) => a.status !== "idle") && (
        <>
          <div className="mb-8 p-5 bg-neutral-900 border border-neutral-800 rounded-xl">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Total pipeline execution summary
            </h2>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-neutral-500 text-sm">Status</span>
                <p className="font-medium">
                  {agents.filter((a) => a.status === "completed").length}/{agents.length} completed
                  {agents.some((a) => a.status === "running") && " (running…)"}
                  {agents.some((a) => a.status === "error") && " • 1+ error"}
                </p>
              </div>
              {agents.some((a) => a.duration != null) && (
                <div>
                  <span className="text-neutral-500 text-sm">Total duration</span>
                  <p className="font-medium">
                    {(agents.reduce((sum, a) => sum + (a.duration ?? 0), 0) / 1000).toFixed(2)}s
                  </p>
                </div>
              )}
              {agents.some((a) => a.tokens != null) && (
                <div>
                  <span className="text-neutral-500 text-sm">Total tokens</span>
                  <p className="font-medium">
                    {agents.reduce((sum, a) => sum + (a.tokens ?? 0), 0).toLocaleString()}
                  </p>
                </div>
              )}
              {agents.some((a) => a.cost != null) && (
                <div>
                  <span className="text-neutral-500 text-sm">Total cost</span>
                  <p className="font-medium">
                    ${agents.reduce((sum, a) => sum + (Number(a.cost) || 0), 0).toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <PipelineGraph agents={agents} />
        </>
      )}

      <div className="flex items-center gap-6 mb-10">
        {agents.map((agent, index) => (
            <div key={index} className="flex items-center">
            <AgentCard agent={agent} />
            {index < agents.length - 1 && (
                <div className="mx-4 text-blue-400 animate-pulse">
                →
                </div>
            )}
            </div>
        ))}
      </div>

      {result && (
        <pre className="bg-neutral-900 p-6 rounded-xl overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}