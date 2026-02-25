import { prisma } from "../db";
import { WorkflowDefinition, WorkflowContext } from "./types";
import { runStageWithReliability } from "./stageRunner";

export async function executeWorkflow(
    definition: WorkflowDefinition,
    context: WorkflowContext
) {
    for (const stage of definition.stages) {
        // Ensure dependencies resolved
        for (const dep of stage.dependencies) {
            if (!context.artifacts[dep]) {
                throw new Error(`Missing dependency: ${dep}`);
            }
        }

        // Pre-run database state mapping
        await prisma.pipelineRun.update({
            where: { id: context.runId },
            data: { currentStage: stage.id }
        });

        await prisma.pipelineAgent.upsert({
            where: {
                pipelineRunId_name: { pipelineRunId: context.runId, name: stage.id }
            },
            update: { status: "running" },
            create: {
                pipelineRunId: context.runId,
                name: stage.id,
                status: "running"
            }
        });

        context.streamCallback?.({ agent: stage.id, status: "running" });

        const startTime = Date.now();
        let result;

        try {
            result = await runStageWithReliability(stage, context, true);
        } catch (error: any) {
            // Record failure trace globally
            await prisma.pipelineRun.update({
                where: { id: context.runId },
                data: { status: "error", error: error.message }
            });

            await prisma.pipelineAgent.update({
                where: { pipelineRunId_name: { pipelineRunId: context.runId, name: stage.id } },
                data: { status: "error", error: error.message }
            });

            throw error; // Bubble up to cancel pipeline
        }

        const duration = Date.now() - startTime;

        // Post-run success record
        await prisma.pipelineAgent.update({
            where: { pipelineRunId_name: { pipelineRunId: context.runId, name: stage.id } },
            data: {
                status: "completed",
                tokens: result.tokens,
                cost: result.cost,
                attempts: result.attempts,
                confidence: result.confidence,
                duration
            }
        });

        context.artifacts[stage.id] = result.output;

        context.metrics.totalTokens += result.tokens;
        context.metrics.totalCost += result.cost;
        context.metrics.stageMetrics[stage.id] = result;

        context.streamCallback?.({
            agent: stage.id,
            status: "completed",
            duration,
            ...result
        });
    }

    return context;
}
