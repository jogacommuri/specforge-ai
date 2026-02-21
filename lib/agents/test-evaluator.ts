import { openai } from "@/lib/ai/openai";
import { EvaluatorSchema } from "@/lib/schemas/evaluator";
import { TestType } from "@/lib/schemas/test";
import { RequirementsType } from "@/lib/schemas/requirements";
import { ApiType } from "@/lib/schemas/api";

export async function runTestEvaluatorAgent(
  feature: string,
  requirements: RequirementsType,
  apiDesign: ApiType,
  testCases: TestType
) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior QA engineer reviewing test cases. Be strict and analytical. Focus on test coverage, edge cases, and alignment with requirements and API design.",
      },
      {
        role: "user",
        content: `
Feature:
${feature}

Requirements:
${JSON.stringify(requirements, null, 2)}

API Design:
${JSON.stringify(apiDesign, null, 2)}

Test Cases:
${JSON.stringify(testCases, null, 2)}

Evaluate these test cases for:
- Coverage completeness (happy path, edge cases, security tests)
- Alignment with requirements (tests verify functional requirements)
- Alignment with API design (tests cover all endpoints)
- Edge case coverage (boundary conditions, error scenarios)
- Security test quality (authentication, authorization, input validation)
- Test case clarity and specificity

Return JSON in this format. confidence is a number 0-1. issues and suggestions must be arrays of strings only (not objects):
{
  "confidence": 0.85,
  "issues": ["Issue 1 description", "Issue 2 description"],
  "suggestions": ["Suggestion 1 description", "Suggestion 2 description"]
}
`,
      },
    ],
  });

  const content = completion.choices[0].message.content;

  if (!content) throw new Error("No response from Test Evaluator");

  const parsed = JSON.parse(content);

  // Normalize in case LLM returns objects instead of strings
  const normalized = {
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : Number(parsed.confidence) || 0,
    issues: Array.isArray(parsed.issues)
      ? parsed.issues.map((item: unknown) => typeof item === "string" ? item : JSON.stringify(item))
      : [],
    suggestions: Array.isArray(parsed.suggestions)
      ? parsed.suggestions.map((item: unknown) => typeof item === "string" ? item : JSON.stringify(item))
      : [],
  };

  return {
    data: EvaluatorSchema.parse(normalized),
    usage: completion.usage,
  };
}
