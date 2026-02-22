import { z } from "zod";

export const UiDesignSchema = z.object({
    overview: z.object({
        designPhilosophy: z.string(),
        targetUsers: z.array(z.string()),
        accessibilityConsiderations: z.string(),
    }),

    screens: z.array(
        z.object({
            name: z.string(),
            purpose: z.string(),
            userRoles: z.array(z.string()),
        })
    ),

    userFlows: z.array(
        z.object({
            name: z.string(),
            steps: z.array(z.string()),
        })
    ),

    components: z.array(
        z.object({
            name: z.string(),
            type: z.enum([
                "page",
                "container",
                "presentational",
                "form",
                "layout",
            ]),
            responsibility: z.string(),
            reusable: z.boolean(),
        })
    ),

    stateManagement: z.object({
        strategy: z.string(),
        globalState: z.array(z.string()).optional(),
        localState: z.array(z.string()).optional(),
    }),

    dataMapping: z.array(
        z.object({
            screen: z.string(),
            consumesEntities: z.array(z.string()),
        })
    ),

    routingStructure: z.array(
        z.object({
            route: z.string(),
            screen: z.string(),
            protected: z.boolean(),
        })
    ),
});

export type UiDesignArtifact = z.infer<typeof UiDesignSchema>;
