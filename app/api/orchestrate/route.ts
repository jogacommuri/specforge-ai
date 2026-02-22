import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { orchestrateStream } from "@/lib/orchestrator/orchestrate";
import { createPipelineRun, updatePipelineRun } from "@/lib/db";
import { createArtifact, getLatestArtifact } from "@/lib/db/artifact";
import { getProject } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { feature, projectId } = body;

    if (!feature || !projectId) {
      return NextResponse.json(
        { error: "Feature and projectId are required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get latest artifacts for incremental evolution
    const [latestRequirements, latestArchitecture, latestUi, latestApi, latestTests] = await Promise.all([
      getLatestArtifact(projectId, "requirements"),
      getLatestArtifact(projectId, "architecture"),
      getLatestArtifact(projectId, "ui"),
      getLatestArtifact(projectId, "api"),
      getLatestArtifact(projectId, "tests")
    ]);

    const existingState = {
      requirements: latestRequirements?.content,
      architecture: latestArchitecture?.content,
      ui: latestUi?.content,
      api: latestApi?.content,
      tests: latestTests?.content,
    };

    // Create pipeline run
    const pipelineRun = await createPipelineRun({
      projectId,
      feature,
      status: "running",
    });

    const stream = await orchestrateStream(feature, projectId, pipelineRun.id, existingState);

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let totalTokens = 0;
        let totalCost = 0;
        let totalDuration = 0;
        let confidence = 0;
        const artifacts: Record<string, any> = {};

        for await (const chunk of stream) {
          // Stream chunk to client
          controller.enqueue(
            encoder.encode(JSON.stringify(chunk) + "\n")
          );

          // Track metrics
          if (chunk.tokens) totalTokens += chunk.tokens;
          if (chunk.cost) totalCost += Number(chunk.cost);
          if (chunk.duration) totalDuration = Math.max(totalDuration, chunk.duration);
          if (chunk.confidence && chunk.confidence > confidence) {
            confidence = chunk.confidence;
          }

          // Save artifacts when agents complete
          if (chunk.status === "completed" && chunk.data) {
            const agentName = chunk.agent;
            if (agentName === "Requirements" && chunk.data) {
              artifacts.requirements = chunk.data;
            } else if (agentName === "Architecture" && chunk.data) {
              artifacts.architecture = chunk.data;
            } else if (agentName === "UI Design" && chunk.data) {
              artifacts.ui = chunk.data;
            } else if (agentName === "API Design" && chunk.data) {
              artifacts.api = chunk.data;
            } else if (agentName === "Test Cases" && chunk.data) {
              artifacts.tests = chunk.data;
            }
          }
        }

        let deltaSummary = undefined;

        // Optionally generate a Delta Summary
        if (existingState?.requirements && artifacts.requirements) {
          try {
            const deltaRes = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content: "You are a technical writer. Summarize what changed between these two architecture versions concisely in a few sentences.",
                  },
                  {
                    role: "user",
                    content: `Previous Requirements:\n${JSON.stringify(existingState.requirements)}\n\nNew Requirements:\n${JSON.stringify(artifacts.requirements)}\n\nWhat changed?`,
                  },
                ],
              }),
            });
            const deltaJson = await deltaRes.json();
            deltaSummary = deltaJson.choices?.[0]?.message?.content;
          } catch (e) {
            console.error("Delta summary generation failed:", e);
          }
        }

        // Update pipeline run with final metrics
        await updatePipelineRun(pipelineRun.id, {
          status: "completed",
          totalTokens,
          totalCost,
          totalDuration,
          confidence,
          deltaSummary,
        });

        // Save artifacts
        if (artifacts.requirements) {
          await createArtifact({
            projectId,
            type: "requirements",
            content: artifacts.requirements,
          });
        }
        if (artifacts.architecture) {
          await createArtifact({
            projectId,
            type: "architecture",
            content: artifacts.architecture,
          });
        }
        if (artifacts.ui) {
          await createArtifact({
            projectId,
            type: "ui",
            content: artifacts.ui,
          });
        }
        if (artifacts.api) {
          await createArtifact({
            projectId,
            type: "api",
            content: artifacts.api,
          });
        }
        if (artifacts.tests) {
          await createArtifact({
            projectId,
            type: "tests",
            content: artifacts.tests,
          });
        }

        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error orchestrating pipeline:", error);
    return NextResponse.json(
      { error: "Failed to run pipeline" },
      { status: 500 }
    );
  }
}