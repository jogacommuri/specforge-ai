import { Stage } from "@/lib/workflow/types";
import { runUiDesignAgent } from "@/lib/agents/ui";
import { runUiEvaluatorAgent } from "@/lib/agents/ui-evaluator";

export const UiStage: Stage = {
    id: "UI Design",
    dbType: "ui",
    dependencies: ["feature", "Requirements", "Architecture"],
    async execute(context, feedback) {
        const feature = context.artifacts.feature;
        const reqs = context.artifacts.Requirements;
        const arch = context.artifacts.Architecture;
        const existing = context.artifacts["UI Design"];

        const res = await runUiDesignAgent(feature, reqs, arch, existing, feedback);

        return {
            output: res.data,
            tokens: res.usage?.total_tokens || 0,
            cost: ((res.usage?.total_tokens || 0) / 1000) * 0.001
        };
    },
    async evaluate(context, output) {
        const feature = context.artifacts.feature;
        const reqs = context.artifacts.Requirements;
        const arch = context.artifacts.Architecture;

        const res = await runUiEvaluatorAgent(feature, reqs, arch, output);

        return {
            confidence: res.data.confidence,
            suggestions: res.data.suggestions,
            tokens: res.usage?.total_tokens || 0,
            cost: ((res.usage?.total_tokens || 0) / 1000) * 0.001
        };
    }
};
