import { z } from "zod";

export const ArchitectureSchema = z.object({
    overview: z.object({
        systemType: z.string(),
        architecturalStyle: z.string(),
        summary: z.string(),
    }),

    components: z.array(
        z.object({
            name: z.string(),
            responsibility: z.string(),
            technology: z.string().optional(),
        })
    ),

    dataFlow: z.array(
        z.object({
            from: z.string(),
            to: z.string(),
            description: z.string(),
        })
    ),

    database: z.object({
        type: z.string(),
        tables: z.array(
            z.object({
                name: z.string(),
                columns: z.array(
                    z.object({
                        name: z.string(),
                        type: z.string(),
                        required: z.boolean(),
                        unique: z.boolean().optional(),
                        primary: z.boolean().optional(),
                    })
                ),
                indexes: z.array(z.string()).optional(),
            })
        ),
        relationships: z.array(
            z.object({
                fromTable: z.string(),
                toTable: z.string(),
                type: z.enum(["one-to-one", "one-to-many", "many-to-many"]),
            })
        ),
    }),

    apiStyle: z.object({
        type: z.enum(["REST", "GraphQL", "Hybrid"]),
        versioningStrategy: z.string(),
    }),

    scalability: z.object({
        strategy: z.string(),
        horizontalScaling: z.boolean(),
        cachingStrategy: z.string().optional(),
    }),

    security: z.object({
        authMechanism: z.string(),
        dataProtection: z.string(),
        rateLimiting: z.string().optional(),
    }),

    observability: z.object({
        logging: z.string(),
        monitoring: z.string(),
        tracing: z.string().optional(),
    }),

    deployment: z.object({
        hosting: z.string(),
        ciCdStrategy: z.string(),
    }),
});

export type ArchitectureArtifact = z.infer<typeof ArchitectureSchema>;
