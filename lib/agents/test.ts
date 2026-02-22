import { openai } from "@/lib/ai/openai";
import { TestSchema } from "@/lib/schemas/test";
import { RequirementsType } from "@/lib/schemas/requirements";
import { ApiType } from "@/lib/schemas/api";

export async function runTestAgent(
  feature: string,
  requirements: RequirementsType,
  architecture: any,
  uiDesign: any,
  apiDesign: ApiType,
  existingTests?: any,
  feedback?: string[]
) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior QA engineer. Return strictly valid JSON.",
      },
      {
        role: "user",
        content: `
${existingTests ? `
Existing Tests:
${JSON.stringify(existingTests, null, 2)}
` : ""}

New Feature Context:
${feature}

Updated Requirements:
${JSON.stringify(requirements, null, 2)}

System Architecture:
${JSON.stringify(architecture, null, 2)}

UI Design Context:
${JSON.stringify(uiDesign, null, 2)}

Updated API Design:
${JSON.stringify(apiDesign, null, 2)}

Generate comprehensive test cases. Generate new tests for the added functionality while ensuring old tests still remain valid.
Each array should contain strings (not objects). Each string should be a clear description of the test case.
${feedback?.length
            ? `
Previous attempt had the following issues:
${feedback.join("\n")}

Regenerate the test cases fixing these issues.
`
            : ""
          }

Return JSON in this format:
{
  "happyPath": ["Test case 1 description", "Test case 2 description"],
  "edgeCases": ["Edge case 1 description", "Edge case 2 description"],
  "securityTests": ["Security test 1 description", "Security test 2 description"]
}

Each array should contain strings (not objects). Each string should be a clear description of the test case.
`,
      },
    ],
  });

  const content = completion.choices[0].message.content;

  if (!content) throw new Error("No response from Test Agent");

  const parsed = JSON.parse(content);
  const validated = TestSchema.parse(parsed);

  return {
    data: validated,
    usage: completion.usage,
  };
}