import { Stage } from "@/lib/workflow/types";
import { runApiAgent } from "@/lib/agents/api";
import { runApiEvaluatorAgent } from "@/lib/agents/api-evaluator";

export const ApiStage: Stage = {
    id: "API Design",
    dbType: "api",
    dependencies: ["feature", "Requirements", "Architecture", "UI Design"],
    async execute(context, feedback) {
        const feature = context.artifacts.feature;
        const reqs = context.artifacts.Requirements;
        const arch = context.artifacts.Architecture;
        const ui = context.artifacts["UI Design"];
        const existing = context.artifacts["API Design"];

        const res = await runApiAgent(feature, reqs, arch, ui, existing, feedback);

        return {
            output: res.data,
            tokens: res.usage?.total_tokens || 0,
            cost: ((res.usage?.total_tokens || 0) / 1000) * 0.001
        };
    },
    async evaluate(context, output) {
        const feature = context.artifacts.feature;
        const reqs = context.artifacts.Requirements;

        const res = await runApiEvaluatorAgent(feature, reqs, output);

        return {
            confidence: res.data.confidence,
            suggestions: res.data.suggestions,
            tokens: res.usage?.total_tokens || 0,
            cost: ((res.usage?.total_tokens || 0) / 1000) * 0.001
        };
    }
};
