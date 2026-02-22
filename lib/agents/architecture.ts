import { openai } from "@/lib/ai/openai";
import { ArchitectureSchema } from "@/lib/schemas/architecture";
import { RequirementsType } from "@/lib/schemas/requirements";

export async function runArchitectureAgent(
    requirements: RequirementsType,
    existingArchitecture?: any,
    feedback?: string[]
) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content:
                    "You are a senior software architect designing production-grade distributed systems. Return strictly valid JSON.",
            },
            {
                role: "user",
                content: `
${existingArchitecture ? `
Existing Architecture:
${JSON.stringify(existingArchitecture, null, 2)}
` : ""}

System Requirements:
${JSON.stringify(requirements, null, 2)}

Design or update the system architecture based on these requirements.
Ensure you cover the overview, components, data flow, database schema, API style, scalability, security, observability, and deployment strategies.
${feedback?.length
                        ? `
Previous attempt had the following issues:
${feedback.join("\n")}

Regenerate the architecture fixing these issues.
`
                        : ""
                    }

Return JSON in this format:
{
  "overview": {
    "systemType": "",
    "architecturalStyle": "",
    "summary": ""
  },
  "components": [
    {
      "name": "",
      "responsibility": "",
      "technology": ""
    }
  ],
  "dataFlow": [
    {
      "from": "",
      "to": "",
      "description": ""
    }
  ],
  "database": {
    "type": "",
    "tables": [
      {
        "name": "",
        "columns": [
          {
            "name": "",
            "type": "",
            "required": true,
            "unique": false,
            "primary": false
          }
        ],
        "indexes": ["column_name"]
      }
    ],
    "relationships": [
      {
        "fromTable": "",
        "toTable": "",
        "type": "one-to-many"
      }
    ]
  },
  "apiStyle": {
    "type": "REST",
    "versioningStrategy": ""
  },
  "scalability": {
    "strategy": "",
    "horizontalScaling": true,
    "cachingStrategy": ""
  },
  "security": {
    "authMechanism": "",
    "dataProtection": "",
    "rateLimiting": ""
  },
  "observability": {
    "logging": "",
    "monitoring": "",
    "tracing": ""
  },
  "deployment": {
    "hosting": "",
    "ciCdStrategy": ""
  }
}
`,
            },
        ],
    });

    const content = completion.choices[0].message.content;

    if (!content) throw new Error("No response from API Agent");

    const parsed = JSON.parse(content);
    const validated = ArchitectureSchema.parse(parsed);

    return {
        data: validated,
        usage: completion.usage,
    };
}
