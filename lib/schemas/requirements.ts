import { z } from "zod";

export const RequirementsSchema = z.object({
  functional: z.array(z.string()),
  nonFunctional: z.array(z.string()),
  assumptions: z.array(z.string()),
});

export type RequirementsType = z.infer<typeof RequirementsSchema>;