"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AgentState } from "@/types/agent";
import ProjectHeader from "@/components/project/ProjectHeader";
import AddFeaturePanel from "@/components/project/AddFeaturePanel";
import ArtifactTabs from "@/components/project/ArtifactTabs";
import RunHistoryTable from "@/components/project/RunHistoryTable";
import PipelineGraph from "@/components/PipelineGraph";

export default function ProjectPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string;

    const [project, setProject] = useState<any>(null);
    const [artifacts, setArtifacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pipeline State
    const [isRunning, setIsRunning] = useState(false);
    const [agents, setAgents] = useState<AgentState[]>([
        { name: "Requirements", status: "idle" },
        { name: "Requirements Evaluation", status: "idle" },
        { name: "API Design", status: "idle" },
        { name: "API Design Evaluation", status: "idle" },
        { name: "Test Cases", status: "idle" },
        { name: "Test Cases Evaluation", status: "idle" },
    ]);

    // Version Control
    const [activeVersion, setActiveVersion] = useState<number>(1);
    const availableVersions = Array.from(new Set(artifacts.map(a => Number(a.version)))).sort((a, b) => b - a);

    useEffect(() => {
        if (projectId) {
            loadProject();
        }
    }, [projectId]);

    async function loadProject() {
        try {
            const [projectRes, artifactsRes] = await Promise.all([
                fetch(`/api/projects/${projectId}`),
                fetch(`/api/projects/${projectId}/artifacts`),
            ]);

            if (projectRes.ok) {
                setProject(await projectRes.json());
            }

            if (artifactsRes.ok) {
                const artifactsData = await artifactsRes.json();
                setArtifacts(artifactsData);
                // Default to latest version
                const versions = Array.from(new Set(artifactsData.map((a: any) => Number(a.version)))).sort((a: any, b: any) => b - a) as number[];
                if (versions.length > 0) setActiveVersion(versions[0]);
            }
        } catch (error) {
            console.error("Error loading project:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerate(feature: string, tags: string[]) {
        if (!projectId) return;

        setIsRunning(true);
        setAgents(agents.map(a => ({ ...a, status: "idle", tokens: undefined, cost: undefined, duration: undefined, confidence: undefined })));

        try {
            const res = await fetch("/api/orchestrate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    feature: `${tags.length > 0 ? `[${tags.join(", ")}] ` : ""}${feature}`,
                    projectId
                }),
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

                    try {
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
                    } catch (e) {
                        console.error("Stream parse error:", e);
                    }
                }
            }
        } finally {
            setIsRunning(false);
            await loadProject(); // Reload artifacts and runs
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
                <div className="text-neutral-400 flex items-center gap-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-500 border-t-transparent"></div>
                    Loading project...
                </div>
            </div>
        );
    }

    if (!project) return null;

    // Calculate Header Metrics
    const totalVersions = availableVersions.length > 0 ? availableVersions[0] : 0;
    const avgConfidence = project.runs?.length ?
        Math.round(project.runs.reduce((acc: number, run: any) => acc + (Number(run.confidence) || 0), 0) / project.runs.length * 100) : 0;

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-6 lg:p-10 max-w-7xl mx-auto">
            <button
                onClick={() => router.push("/projects")}
                className="text-neutral-400 hover:text-white text-sm mb-6 flex items-center gap-2 transition"
            >
                ← Back to Projects
            </button>

            <ProjectHeader
                project={project}
                totalVersions={totalVersions}
                avgConfidence={avgConfidence}
            />

            <AddFeaturePanel
                onGenerate={handleGenerate}
                isRunning={isRunning}
            />

            {(isRunning || agents.some(a => a.status === "completed")) && (
                <div className="mt-8">
                    <PipelineGraph agents={agents} />

                    {/* Summary Badge rendered when finished */}
                    {!isRunning && (
                        <div className="mt-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-wrap gap-6 items-center">
                            <span className="text-sm font-medium text-neutral-400">Last Run Summary</span>
                            {agents.some(a => a.confidence) && (
                                <span className="text-sm text-green-400">
                                    Confidence: {Math.round(Math.max(...agents.map(a => a.confidence || 0)) * 100)}%
                                </span>
                            )}
                            {agents.some(a => a.duration) && (
                                <span className="text-sm text-neutral-300">
                                    {(agents.reduce((sum, a) => sum + (a.duration ?? 0), 0) / 1000).toFixed(1)}s
                                </span>
                            )}
                            {agents.some(a => a.tokens) && (
                                <span className="text-sm text-neutral-300">
                                    {agents.reduce((sum, a) => sum + (a.tokens ?? 0), 0).toLocaleString()} tokens
                                </span>
                            )}
                            {agents.some(a => a.cost) && (
                                <span className="text-sm text-neutral-300">
                                    ${agents.reduce((sum, a) => sum + (Number(a.cost) || 0), 0).toFixed(4)}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {artifacts.length > 0 && (
                <ArtifactTabs
                    artifacts={artifacts}
                    availableVersions={availableVersions}
                    activeVersion={activeVersion}
                    onChangeVersion={setActiveVersion}
                />
            )}

            <RunHistoryTable
                runs={project.runs || []}
                activeVersion={activeVersion}
                onSelectVersion={setActiveVersion}
            />
        </div>
    );
}
