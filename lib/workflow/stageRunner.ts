import { Stage, WorkflowContext, StageResult } from "./types";

export async function runStageWithReliability(
    stage: Stage,
    context: WorkflowContext,
    evaluator?: boolean,
    threshold = 0.75,
    maxAttempts = 2
): Promise<StageResult> {
    let attempts = 0;
    let lastResult: StageResult | null = null;
    let feedback: string[] | undefined;

    let totalEvalTokens = 0;
    let totalEvalCost = 0;

    while (attempts < maxAttempts) {
        const result = await stage.execute(context, feedback);
        lastResult = result;

        if (!evaluator || !stage.evaluate) {
            return {
                ...result,
                tokens: result.tokens + totalEvalTokens,
                cost: result.cost + totalEvalCost,
                attempts: attempts + 1
            };
        }

        const evaluation = await stage.evaluate(context, result.output);

        if (evaluation.tokens) totalEvalTokens += evaluation.tokens;
        if (evaluation.cost) totalEvalCost += evaluation.cost;

        lastResult.confidence = evaluation.confidence;

        context.streamCallback?.({
            agent: `${stage.id} Evaluation`,
            status: "completed",
            confidence: evaluation.confidence,
            data: evaluation
        });

        if (evaluation.confidence >= threshold) {
            return {
                ...result,
                confidence: evaluation.confidence,
                attempts: attempts + 1,
                tokens: result.tokens + totalEvalTokens,
                cost: result.cost + totalEvalCost
            };
        }

        feedback = evaluation.suggestions;
        attempts++;
    }

    return {
        ...lastResult!,
        attempts,
        tokens: (lastResult?.tokens || 0) + totalEvalTokens,
        cost: (lastResult?.cost || 0) + totalEvalCost
    };
}
