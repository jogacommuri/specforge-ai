import { Project, Artifact, PipelineRun, PipelineAgent } from "@prisma/client";

export type ProjectWithRelations = Project & {
  artifacts: Artifact[];
  runs: PipelineRunWithAgents[];
};

export type PipelineRunWithAgents = PipelineRun & {
  agents: PipelineAgent[];
  project: Project;
  deltaSummary?: string | null;
};

export type CreateProjectInput = {
  userId: string;
  name: string;
  description?: string;
};

export type CreateArtifactInput = {
  projectId: string;
  type: "requirements" | "architecture" | "ui" | "api" | "tests";
  content: any;
  version?: number;
};

export type CreatePipelineRunInput = {
  projectId: string;
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
