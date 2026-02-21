import { openai } from "@/lib/ai/openai";
import { ApiSchema } from "@/lib/schemas/api";
import { RequirementsType } from "@/lib/schemas/requirements";

export async function runApiAgent(
  feature: string,
  requirements: RequirementsType,
  feedback?: string[]
) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior backend architect. Return strictly valid JSON.",
      },
      {
        role: "user",
        content: `
Feature:
${feature}

Requirements:
${JSON.stringify(requirements, null, 2)}

Design REST API endpoints for this system.

${
  feedback?.length
    ? `
Previous attempt had the following issues:
${feedback.join("\n")}

Regenerate the API design fixing these issues.
`
    : ""
}

Return JSON in this format:
{
  "endpoints": [
    {
      "method": "",
      "path": "",
      "description": "",
      "requestBody": {},
      "response": {}
    }
  ]
}
`,
      },
    ],
  });

  const content = completion.choices[0].message.content;

  if (!content) throw new Error("No response from API Agent");

  const parsed = JSON.parse(content);
  const validated = ApiSchema.parse(parsed);

  return {
    data: validated,
    usage: completion.usage,
  };
}