import { z } from "zod";

export const TestSchema = z.object({
  happyPath: z.array(z.string()),
  edgeCases: z.array(z.string()),
  securityTests: z.array(z.string()),
});

export type TestType = z.infer<typeof TestSchema>;