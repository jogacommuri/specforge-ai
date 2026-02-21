import { openai } from "@/lib/ai/openai";
import { EvaluatorSchema } from "@/lib/schemas/evaluator";

export async function runEvaluatorAgent(
  feature: string,
  output: unknown
) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior software architect reviewing another engineer's work. Be strict and analytical.",
      },
      {
        role: "user",
        content: `
Feature:
${feature}

Generated Output:
${JSON.stringify(output, null, 2)}

Evaluate this output for:
- completeness
- clarity
- edge case coverage
- non-functional depth

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

  if (!content) throw new Error("No response from Evaluator");

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
    data: EvaluatorSchema.parse(parsed),
    usage: completion.usage,
  };
}
