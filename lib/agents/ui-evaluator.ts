import { openai } from "@/lib/ai/openai";
import { EvaluatorSchema } from "@/lib/schemas/evaluator";
import { RequirementsType } from "@/lib/schemas/requirements";
import { ArchitectureArtifact } from "@/lib/schemas/architecture";
import { UiDesignArtifact } from "@/lib/schemas/ui";

export async function runUiEvaluatorAgent(
    feature: string,
    requirements: RequirementsType,
    architecture: ArchitectureArtifact,
    uiDesign: UiDesignArtifact
) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content:
                    "You are a senior frontend architect evaluating UI design completeness and quality. Be strict and analytical.",
            },
            {
                role: "user",
                content: `
Feature:
${feature}

Requirements:
${JSON.stringify(requirements, null, 2)}

Architecture Context:
${JSON.stringify({ components: architecture.components, database: architecture.database }, null, 2)}

Generated UI Design:
${JSON.stringify(uiDesign, null, 2)}

Evaluate this UI design checking the following criteria:
- Are all requirements represented in the screens and user flows?
- Are user roles respected and handled properly?
- Is the routing structure logical?
- Is component reuse considered and mapped well?
- Is state management appropriate for the functionality?

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

    if (!content) throw new Error("No response from UI Evaluator");

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
