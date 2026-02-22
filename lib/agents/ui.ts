import { openai } from "@/lib/ai/openai";
import { UiDesignSchema } from "@/lib/schemas/ui";
import { RequirementsType } from "@/lib/schemas/requirements";
import { ArchitectureArtifact } from "@/lib/schemas/architecture";

export async function runUiDesignAgent(
  feature: string,
  requirements: RequirementsType,
  architecture: ArchitectureArtifact,
  existingUi?: any,
  feedback?: string[]
) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior frontend architect designing scalable SaaS UI systems. Return strictly valid JSON.",
      },
      {
        role: "user",
        content: `
${existingUi ? `
Existing UI Design:
${JSON.stringify(existingUi, null, 2)}
` : ""}

System Requirements:
${JSON.stringify(requirements, null, 2)}

Architecture Context:
Components: ${JSON.stringify(architecture.components, null, 2)}
Database: ${JSON.stringify(architecture.database, null, 2)}

Feature:
${feature}

Design or update the frontend UI architecture based on these requirements and system context.
Ensure you cover the overview, screens, user flows, components, state management, data mapping, and routing structure. 
Maintain backward compatibility.
${feedback?.length
            ? `
Previous attempt had the following issues:
${feedback.join("\n")}

Regenerate the UI design fixing these issues.
`
            : ""
          }

Return JSON in this format:
{
  "overview": {
    "designPhilosophy": "",
    "targetUsers": [""],
    "accessibilityConsiderations": ""
  },
  "screens": [
    {
      "name": "",
      "purpose": "",
      "userRoles": [""]
    }
  ],
  "userFlows": [
    {
      "name": "",
      "steps": [""]
    }
  ],
  "components": [
    {
      "name": "",
      "type": "page | container | presentational | form | layout",
      "responsibility": "",
      "reusable": true
    }
  ],
  "stateManagement": {
    "strategy": "",
    "globalState": [""],
    "localState": [""]
  },
  "dataMapping": [
    {
      "screen": "",
      "consumesEntities": [""]
    }
  ],
  "routingStructure": [
    {
      "route": "",
      "screen": "",
      "protected": true
    }
  ]
}
`,
      },
    ],
  });

  const content = completion.choices[0].message.content;

  if (!content) throw new Error("No response from UI Agent");

  const parsed = JSON.parse(content);
  const validated = UiDesignSchema.parse(parsed);

  return {
    data: validated,
    usage: completion.usage,
  };
}
