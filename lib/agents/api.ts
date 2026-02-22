import { openai } from "@/lib/ai/openai";
import { ApiSchema } from "@/lib/schemas/api";
import { RequirementsType } from "@/lib/schemas/requirements";

export async function runApiAgent(
  feature: string,
  requirements: RequirementsType,
  architecture: any,
  uiDesign: any,
  existingApi?: any,
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
${existingApi ? `
Existing API Design:
${JSON.stringify(existingApi, null, 2)}
` : ""}

Updated Requirements:
${JSON.stringify(requirements, null, 2)}

System Architecture Context:
Database: ${JSON.stringify(architecture?.database, null, 2)}
Components: ${JSON.stringify(architecture?.components, null, 2)}
API Style: ${JSON.stringify(architecture?.apiStyle, null, 2)}

UI Design Context:
Screens: ${JSON.stringify(uiDesign?.screens, null, 2)}
Data Mapping: ${JSON.stringify(uiDesign?.dataMapping, null, 2)}

New Feature Context:
${feature}

Modify or extend the API design to support the new requirements and architecture specifications.
Do not remove existing endpoints unless required.
Maintain backward compatibility.${feedback?.length
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