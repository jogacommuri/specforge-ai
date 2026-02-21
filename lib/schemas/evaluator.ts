import { z } from "zod";

export const EvaluatorSchema = z.object({
  confidence: z.number().min(0).max(1),
  issues: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export type EvaluatorType = z.infer<typeof EvaluatorSchema>;