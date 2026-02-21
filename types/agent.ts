export type AgentStatus = "idle" | "running" | "completed" | "error";

export interface AgentState {
    name: string;
    status: AgentStatus;
    duration?: number;
    confidence?: number;
    attempts?: number;
    tokens?: number;
    cost?: number;
  }