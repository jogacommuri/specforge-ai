import { openai } from "@/lib/ai/openai";
import { EvaluatorSchema } from "@/lib/schemas/evaluator";
import { ApiType } from "@/lib/schemas/api";
import { RequirementsType } from "@/lib/schemas/requirements";

export async function runApiEvaluatorAgent(
  feature: string,
  requirements: RequirementsType,
  apiDesign: ApiType
) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior backend architect reviewing API designs. Be strict and analytical. Focus on REST API best practices, completeness, and alignment with requirements.",
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

Evaluate this API design for:
- RESTful design principles (proper HTTP methods, resource naming, status codes)
- Completeness (all required endpoints are present)
- Alignment with requirements (endpoints match functional requirements)
- Request/response structure clarity
- Edge case handling (error responses, validation)
- Security considerations (authentication, authorization if needed)

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

  if (!content) throw new Error("No response from API Evaluator");

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
