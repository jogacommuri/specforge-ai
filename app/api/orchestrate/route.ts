import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { orchestrateStream } from "@/lib/orchestrator/orchestrate";
import { createPipelineRun, updatePipelineRun } from "@/lib/db";
import { createArtifact } from "@/lib/db/artifact";
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

    // Create pipeline run
    const pipelineRun = await createPipelineRun({
      projectId,
      feature,
      status: "running",
    });

    const stream = await orchestrateStream(feature, projectId, pipelineRun.id);

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
            } else if (agentName === "API Design" && chunk.data) {
              artifacts.api = chunk.data;
            } else if (agentName === "Test Cases" && chunk.data) {
              artifacts.tests = chunk.data;
            }
          }
        }

        // Update pipeline run with final metrics
        await updatePipelineRun(pipelineRun.id, {
          status: "completed",
          totalTokens,
          totalCost,
          totalDuration,
          confidence,
        });

        // Save artifacts
        if (artifacts.requirements) {
          await createArtifact({
            projectId,
            type: "requirements",
            content: artifacts.requirements,
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