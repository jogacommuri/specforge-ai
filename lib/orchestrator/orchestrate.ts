import { runRequirementsAgent } from "@/lib/agents/requirements";
import { runApiAgent } from "@/lib/agents/api";
import { runTestAgent } from "@/lib/agents/test";
import { runEvaluatorAgent } from "@/lib/agents/evaluator";
import { runApiEvaluatorAgent } from "@/lib/agents/api-evaluator";
import { runTestEvaluatorAgent } from "@/lib/agents/test-evaluator";

export async function orchestrateStream(
  feature: string,
  projectId: string,
  pipelineRunId: string,
  existingState?: {
    requirements?: any;
    api?: any;
    tests?: any;
  }
) {
  async function* generator() {
    // REQUIREMENTS
    yield ({ agent: "Requirements", status: "running" });

    let attempts = 0;
    const maxAttempts = 2;
    const threshold = 0.75;
    let totalTokens = 0;

    let requirements;
    let evaluation;
    let feedback: string[] | undefined;

    const startTime = Date.now();

    while (attempts < maxAttempts) {
      const reqResponse = await runRequirementsAgent(
        feature,
        existingState?.requirements,
        feedback
      );

      requirements = reqResponse.data;
      totalTokens += reqResponse.usage?.total_tokens || 0;

      const evalResponse = await runEvaluatorAgent(feature, requirements);

      evaluation = evalResponse.data;
      totalTokens += evalResponse.usage?.total_tokens || 0;

      if (evaluation.confidence >= threshold) {
        break;
      }

      feedback = evaluation.suggestions;
      attempts++;
    }
    const estimatedCost = (totalTokens / 1000) * 0.001;
    const duration = Date.now() - startTime;

    yield ({
      agent: "Requirements",
      status: "completed",
      duration,
      confidence: evaluation?.confidence,
      attempts: attempts + 1,
      tokens: totalTokens,
      cost: estimatedCost.toFixed(3),
      data: requirements,
    });

    yield ({
      agent: "Requirements Evaluation",
      status: "completed",
      confidence: evaluation?.confidence,
      data: evaluation,
    });

    if (!requirements) throw new Error("Requirements not generated");

    // API DESIGN (with retry, confidence, tokens, cost)
    yield ({ agent: "API Design", status: "running" });
    let apiAttempts = 0;
    const apiMaxAttempts = 2;
    const apiThreshold = 0.75;
    let apiTotalTokens = 0;
    let apiDesign;
    let apiEvaluation;
    let apiFeedback: string[] | undefined;
    const apiStartTime = Date.now();

    while (apiAttempts < apiMaxAttempts) {
      const apiResponse = await runApiAgent(
        feature,
        requirements,
        existingState?.api,
        apiFeedback
      );
      apiDesign = apiResponse.data;
      apiTotalTokens += apiResponse.usage?.total_tokens || 0;

      const apiEvalResponse = await runApiEvaluatorAgent(feature, requirements, apiDesign);
      apiEvaluation = apiEvalResponse.data;
      apiTotalTokens += apiEvalResponse.usage?.total_tokens || 0;

      if (apiEvaluation.confidence >= apiThreshold) break;
      apiFeedback = apiEvaluation.suggestions;
      apiAttempts++;
    }
    const apiDuration = Date.now() - apiStartTime;
    const apiCost = (apiTotalTokens / 1000) * 0.001;

    yield ({
      agent: "API Design",
      status: "completed",
      duration: apiDuration,
      confidence: apiEvaluation?.confidence,
      attempts: apiAttempts + 1,
      tokens: apiTotalTokens,
      cost: apiCost.toFixed(3),
      data: apiDesign,
    });

    yield ({
      agent: "API Design Evaluation",
      status: "completed",
      confidence: apiEvaluation?.confidence,
      data: apiEvaluation,
    });

    if (!apiDesign) throw new Error("API design not generated");

    // TEST CASES (with retry, confidence, tokens, cost)
    yield ({ agent: "Test Cases", status: "running" });
    let testAttempts = 0;
    const testMaxAttempts = 2;
    const testThreshold = 0.75;
    let testTotalTokens = 0;
    let tests;
    let testEvaluation;
    let testFeedback: string[] | undefined;
    const testStartTime = Date.now();

    while (testAttempts < testMaxAttempts) {
      const testResponse = await runTestAgent(
        feature,
        requirements,
        apiDesign,
        existingState?.tests,
        testFeedback
      );
      tests = testResponse.data;
      testTotalTokens += testResponse.usage?.total_tokens || 0;

      const testEvalResponse = await runTestEvaluatorAgent(feature, requirements, apiDesign, tests);
      testEvaluation = testEvalResponse.data;
      testTotalTokens += testEvalResponse.usage?.total_tokens || 0;

      if (testEvaluation.confidence >= testThreshold) break;
      testFeedback = testEvaluation.suggestions;
      testAttempts++;
    }
    const testDuration = Date.now() - testStartTime;
    const testCost = (testTotalTokens / 1000) * 0.001;

    yield ({
      agent: "Test Cases",
      status: "completed",
      duration: testDuration,
      confidence: testEvaluation?.confidence,
      attempts: testAttempts + 1,
      tokens: testTotalTokens,
      cost: testCost.toFixed(3),
      data: tests,
    });

    yield ({
      agent: "Test Cases Evaluation",
      status: "completed",
      confidence: testEvaluation?.confidence,
      data: testEvaluation,
    });
  }

  return generator();
}