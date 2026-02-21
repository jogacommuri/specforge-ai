import { PipelineRun, PipelineAgent } from "@prisma/client";

export type PipelineRunWithAgents = PipelineRun & {
  agents: PipelineAgent[];
};

export type CreatePipelineRunInput = {
  userId: string;
  feature: string;
  status: "running" | "completed" | "error";
};

export type CreatePipelineAgentInput = {
  pipelineRunId: string;
  name: string;
  status: "idle" | "running" | "completed" | "error";
  duration?: number;
  confidence?: number;
  attempts?: number;
  tokens?: number;
  cost?: number;
  data?: any;
};
