export interface WorkflowContext {
    projectId: string;
    runId: string;
    artifacts: Record<string, any>;
    metrics: {
        totalTokens: number;
        totalCost: number;
        stageMetrics: Record<string, any>;
    };
    streamCallback?: (event: any) => void;
}

export interface StageResult<T = any> {
    output: T;
    tokens: number;
    cost: number;
    confidence?: number;
    attempts?: number;
}

export interface Stage {
    id: string;
    dbType: "requirements" | "architecture" | "ui" | "api" | "tests";
    dependencies: string[];
    execute(context: WorkflowContext, feedback?: string[]): Promise<StageResult>;
    evaluate?: (context: WorkflowContext, output: any) => Promise<{ confidence: number; suggestions?: string[]; tokens?: number; cost?: number; }>;
}

export interface WorkflowDefinition {
    stages: Stage[];
}
