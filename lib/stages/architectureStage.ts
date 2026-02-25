import { Stage } from "@/lib/workflow/types";
import { runArchitectureAgent } from "@/lib/agents/architecture";
import { runEvaluatorAgent } from "@/lib/agents/evaluator";

export const ArchitectureStage: Stage = {
    id: "Architecture",
    dbType: "architecture",
    dependencies: ["Requirements"],
    async execute(context, feedback) {
        const reqs = context.artifacts.Requirements;
        const existing = context.artifacts.Architecture;

        const res = await runArchitectureAgent(reqs, existing, feedback);

        return {
            output: res.data,
            tokens: res.usage?.total_tokens || 0,
            cost: ((res.usage?.total_tokens || 0) / 1000) * 0.001
        };
    },
    async evaluate(context, output) {
        const feature = context.artifacts.feature;
        const res = await runEvaluatorAgent(feature, output);

        return {
            confidence: res.data.confidence,
            suggestions: res.data.suggestions,
            tokens: res.usage?.total_tokens || 0,
            cost: ((res.usage?.total_tokens || 0) / 1000) * 0.001
        };
    }
};
