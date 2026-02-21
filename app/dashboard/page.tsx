"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AgentCard from "@/components/AgentCard";
import PipelineGraph from "@/components/PipelineGraph";
import { AgentState } from "@/types/agent";

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface Artifact {
  id: string;
  type: string;
  version: number;
  content: any;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<Project | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      router.push("/projects");
      return;
    }
    loadProject();
  }, [projectId]);

  async function loadProject() {
    if (!projectId) return;
    try {
      const [projectRes, artifactsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/artifacts`),
      ]);

      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setProject(projectData);
      }

      if (artifactsRes.ok) {
        const artifactsData = await artifactsRes.json();
        setArtifacts(artifactsData);
      }
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
    }
  }

  async function runPipeline() {
    if (!projectId) return;
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
      body: JSON.stringify({ feature, projectId }),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-xl">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-6 lg:p-10">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push("/projects")}
              className="text-neutral-400 hover:text-white text-sm"
            >
              ← Projects
            </button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-neutral-400 mt-1">{project.description}</p>
          )}
        </div>
      </div>

      <textarea
        value={feature}
        onChange={(e) => setFeature(e.target.value)}
        placeholder="Describe your feature..."
        className="w-full p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl mb-4 md:mb-6"
      />

      <button
        onClick={runPipeline}
        className="bg-blue-600 px-4 md:px-6 py-2 rounded-xl mb-6 md:mb-8"
      >
        Run Agents
      </button>

      {agents.some((a) => a.status !== "idle") && (
        <>
          <div className="mb-6 md:mb-8 p-4 md:p-5 bg-neutral-900 border border-neutral-800 rounded-xl">
            <h2 className="text-xs md:text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Total pipeline execution summary
            </h2>
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
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

      <div className="overflow-x-auto mb-6 md:mb-10">
        <div className="flex items-center gap-2 md:gap-3 min-w-max">
          {agents.map((agent, index) => (
            <div key={index} className="flex items-center">
              <AgentCard agent={agent} />
              {index < agents.length - 1 && (
                <div className="mx-1 md:mx-2 text-blue-400 animate-pulse text-sm md:text-base">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {result && (
        <pre className="bg-neutral-900 p-6 rounded-xl overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

      {/* Show saved artifacts */}
      {artifacts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Saved Artifacts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {artifacts
              .filter((a, i, arr) => {
                // Show only latest version of each type
                return (
                  arr.findIndex((x) => x.type === a.type) === i
                );
              })
              .map((artifact) => (
                <div
                  key={artifact.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold capitalize">
                      {artifact.type}
                    </span>
                    <span className="text-xs text-neutral-500">
                      v{artifact.version}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {new Date(artifact.createdAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => {
                      setResult({ [artifact.type]: artifact.content });
                    }}
                    className="mt-3 text-xs text-blue-400 hover:text-blue-300"
                  >
                    View →
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}