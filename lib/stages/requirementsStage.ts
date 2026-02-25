import { Stage } from "@/lib/workflow/types";
import { runRequirementsAgent } from "@/lib/agents/requirements";
import { runEvaluatorAgent } from "@/lib/agents/evaluator";

export const RequirementsStage: Stage = {
    id: "Requirements",
    dbType: "requirements",
    dependencies: ["feature"],
    async execute(context, feedback) {
        const feature = context.artifacts.feature;
        const existing = context.artifacts.Requirements;

        const res = await runRequirementsAgent(feature, existing, feedback);

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
