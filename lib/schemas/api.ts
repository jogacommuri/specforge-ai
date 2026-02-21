import { z } from "zod";

export const ApiSchema = z.object({
  endpoints: z.array(
    z.object({
      method: z.string(),
      path: z.string(),
      description: z.string(),
      requestBody: z.any().optional(),
      response: z.any().optional(),
    })
  ),
});

export type ApiType = z.infer<typeof ApiSchema>;