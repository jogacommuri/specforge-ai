import { openai } from "@/lib/ai/openai";
import { RequirementsSchema } from "@/lib/schemas/requirements";

export async function runRequirementsAgent(
  input: string,
  existingRequirements?: any,
  feedback?: string[]
) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior software architect. Return strictly valid JSON.",
      },
      {
        role: "user",
        content: `
      ${existingRequirements ? `
      Existing System Requirements:
      ${JSON.stringify(existingRequirements, null, 2)}
      ` : ""}

      New Feature:
      ${input}
      
      Update the requirements to incorporate the new feature into the existing system requirements (if any).
      Do not remove existing valid requirements.
      Preserve backward compatibility.
      Avoid duplication.
      
      Important:
      We are updating — not replacing. Break down the features into:
      - functional requirements
      - non-functional requirements
      - assumptions
      
      ${feedback
            ? `
      Previous attempt had the following issues:
      ${feedback.join("\n")}
      
      Regenerate requirements fixing these issues.
      `
            : ""
          }
      
      Return JSON in this format. Each array must contain strings only (not objects):
      {
        "functional": ["Requirement 1", "Requirement 2"],
        "nonFunctional": ["Requirement 1", "Requirement 2"],
        "assumptions": ["Assumption 1", "Assumption 2"]
      }
      
      IMPORTANT: Each requirement and assumption must be a plain string, not an object.
      `
      }
    ],
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("No response");

  const parsed = JSON.parse(content);

  // Normalize in case LLM returns objects instead of strings
  const normalized = {
    functional: Array.isArray(parsed.functional)
      ? parsed.functional.map((item: unknown) =>
        typeof item === "string" ? item : JSON.stringify(item)
      )
      : [],
    nonFunctional: Array.isArray(parsed.nonFunctional)
      ? parsed.nonFunctional.map((item: unknown) =>
        typeof item === "string" ? item : JSON.stringify(item)
      )
      : [],
    assumptions: Array.isArray(parsed.assumptions)
      ? parsed.assumptions.map((item: unknown) =>
        typeof item === "string" ? item : JSON.stringify(item)
      )
      : [],
  };

  const validated = RequirementsSchema.parse(normalized);

  return {
    data: validated,
    usage: completion.usage,
  }
}