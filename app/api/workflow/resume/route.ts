import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getPipelineRun, updatePipelineRun } from "@/lib/db";
import { getProject } from "@/lib/db";
import { executeWorkflow } from "@/lib/workflow/engine";
import { ProductLifecycle } from "@/lib/workflow/productLifecycle";
import { WorkflowContext } from "@/lib/workflow/types";
import { createArtifact } from "@/lib/db/artifact";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { pipelineRunId } = body;

        if (!pipelineRunId) {
            return NextResponse.json(
                { error: "pipelineRunId is required" },
                { status: 400 }
            );
        }

        // 1. Load WorkflowRun structure
        const pipelineRun = await getPipelineRun(pipelineRunId);
        if (!pipelineRun) {
            return NextResponse.json({ error: "Pipeline Run not found" }, { status: 404 });
        }

        // Verify project ownership
        const projectId = pipelineRun.projectId;
        const project = await getProject(projectId);
        if (!project || project.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (pipelineRun.status !== "error") {
            return NextResponse.json(
                { error: "Can only resume a failed pipeline run" },
                { status: 400 }
            );
        }

        // 2. Reconstruct context from successful stages
        const contextArtifacts: Record<string, any> = {
            feature: pipelineRun.feature
        };

        // Populate the safe, successfully completed stages directly from the PipelineAgents DB payload 
        // This allows us to literally skip generation calls and hydrate the Context.
        for (const agent of pipelineRun.agents) {
            if (agent.status === "completed" && agent.data) {
                contextArtifacts[agent.name] = agent.data;
            }
        }

        // 3. Mark the pipeline run back to running
        await updatePipelineRun(pipelineRun.id, {
            status: "running",
            error: null
        });

        const encoder = new TextEncoder();

        const readable = new ReadableStream({
            async start(controller) {
                let totalTokens = pipelineRun.totalTokens || 0;
                let totalCost = pipelineRun.totalCost ? Number(pipelineRun.totalCost) : 0;
                let totalDuration = pipelineRun.totalDuration || 0;
                let highestConfidence = pipelineRun.confidence ? Number(pipelineRun.confidence) : 0;

                const context: WorkflowContext = {
                    projectId,
                    runId: pipelineRun.id,
                    artifacts: contextArtifacts,
                    metrics: {
                        totalTokens: 0,
                        totalCost: 0,
                        stageMetrics: {},
                    },
                    streamCallback: (event) => {
                        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

                        if (event.tokens) totalTokens += event.tokens;
                        if (event.cost) totalCost += Number(event.cost);
                        if (event.duration) totalDuration += event.duration;
                        if (event.confidence && event.confidence > highestConfidence) {
                            highestConfidence = event.confidence;
                        }
                    },
                };

                try {
                    // 4. Fast-forward by slicing the workflow lifecycle up to the failed `currentStage`
                    // Any dependencies required for the failed stage will be available in the context.artifacts we just hydrated.

                    let failedStageIndex = 0;
                    if (pipelineRun.currentStage) {
                        failedStageIndex = ProductLifecycle.stages.findIndex(
                            s => s.id === pipelineRun.currentStage
                        );
                        // Fallback to 0 if something is bizarrely wrong, otherwise jump directly to the index.
                        if (failedStageIndex === -1) failedStageIndex = 0;
                    }

                    const ResumedLifecycle = {
                        stages: ProductLifecycle.stages.slice(failedStageIndex)
                    };

                    // 5. Resume!
                    await executeWorkflow(ResumedLifecycle, context);

                    let deltaSummary = undefined;

                    // Note: Delta Summaries skipped slightly for strict Resume workflows since existing version diffs are harder to pull mid-stream, 
                    // but could be implemented. We will leave deltaSummary as undefined for a resume.

                    // Update pipeline run with final metrics
                    await updatePipelineRun(pipelineRun.id, {
                        status: "completed",
                        totalTokens,
                        totalCost,
                        totalDuration,
                        confidence: highestConfidence,
                        deltaSummary,
                    });

                    // Save artifacts generically for the stages that actually ran during this resume chunk
                    for (const stage of ResumedLifecycle.stages) {
                        const artifact = context.artifacts[stage.id];

                        if (artifact) {
                            await createArtifact({
                                projectId,
                                type: stage.dbType,
                                content: artifact,
                            });
                        }
                    }
                } catch (error: any) {
                    console.error("Workflow resume error:", error);
                    controller.enqueue(encoder.encode(JSON.stringify({ error: error.message }) + "\n"));
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(readable, {
            headers: {
                "Content-Type": "text/plain",
            },
        });
    } catch (error) {
        console.error("Error resuming pipeline:", error);
        return NextResponse.json(
            { error: "Failed to resume pipeline" },
            { status: 500 }
        );
    }
}
