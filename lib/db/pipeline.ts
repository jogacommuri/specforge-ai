import { prisma } from "./prisma";
import {
  CreatePipelineRunInput,
  CreatePipelineAgentInput,
  PipelineRunWithAgents,
} from "./types";

/**
 * Create a new pipeline run
 */
export async function createPipelineRun(
  input: CreatePipelineRunInput
): Promise<PipelineRunWithAgents> {
  return prisma.pipelineRun.create({
    data: {
      projectId: input.projectId,
      feature: input.feature,
      status: input.status,
    },
    include: {
      agents: true,
      project: true,
    },
  });
}

/**
 * Update pipeline run status and metrics
 */
export async function updatePipelineRun(
  id: string,
  data: {
    status?: "running" | "completed" | "error";
    totalDuration?: number;
    totalTokens?: number;
    totalCost?: number;
    confidence?: number;
  }
) {
  return prisma.pipelineRun.update({
    where: { id },
    data,
  });
}

/**
 * Create or update a pipeline agent
 */
export async function upsertPipelineAgent(
  input: CreatePipelineAgentInput
) {
  return prisma.pipelineAgent.upsert({
    where: {
      pipelineRunId_name: {
        pipelineRunId: input.pipelineRunId,
        name: input.name,
      },
    },
    create: input,
    update: {
      status: input.status,
      duration: input.duration,
      confidence: input.confidence,
      attempts: input.attempts,
      tokens: input.tokens,
      cost: input.cost,
      data: input.data,
    },
  });
}

/**
 * Create a pipeline agent (simple create)
 */
export async function createPipelineAgent(
  input: CreatePipelineAgentInput
) {
  return prisma.pipelineAgent.create({
    data: input,
  });
}

/**
 * Get pipeline run with agents
 */
export async function getPipelineRun(
  id: string
): Promise<PipelineRunWithAgents | null> {
  return prisma.pipelineRun.findUnique({
    where: { id },
    include: {
      agents: {
        orderBy: { createdAt: "asc" },
      },
      project: true,
    },
  });
}

/**
 * Get project's pipeline runs
 */
export async function getProjectPipelineRuns(
  projectId: string,
  limit: number = 20
): Promise<PipelineRunWithAgents[]> {
  return prisma.pipelineRun.findMany({
    where: { projectId },
    include: {
      agents: {
        orderBy: { createdAt: "asc" },
      },
      project: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
