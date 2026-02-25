import { Stage } from "@/lib/workflow/types";
import { runTestAgent } from "@/lib/agents/test";
import { runTestEvaluatorAgent } from "@/lib/agents/test-evaluator";

export const TestStage: Stage = {
    id: "Test Cases",
    dbType: "tests",
    dependencies: ["feature", "Requirements", "Architecture", "UI Design", "API Design"],
    async execute(context, feedback) {
        const feature = context.artifacts.feature;
        const reqs = context.artifacts.Requirements;
        const arch = context.artifacts.Architecture;
        const ui = context.artifacts["UI Design"];
        const api = context.artifacts["API Design"];
        const existing = context.artifacts["Test Cases"];

        const res = await runTestAgent(feature, reqs, arch, ui, api, existing, feedback);

        return {
            output: res.data,
            tokens: res.usage?.total_tokens || 0,
            cost: ((res.usage?.total_tokens || 0) / 1000) * 0.001
        };
    },
    async evaluate(context, output) {
        const feature = context.artifacts.feature;
        const reqs = context.artifacts.Requirements;
        const api = context.artifacts["API Design"];

        const res = await runTestEvaluatorAgent(feature, reqs, api, output);

        return {
            confidence: res.data.confidence,
            suggestions: res.data.suggestions,
            tokens: res.usage?.total_tokens || 0,
            cost: ((res.usage?.total_tokens || 0) / 1000) * 0.001
        };
    }
};
