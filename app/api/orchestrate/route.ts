import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createPipelineRun, updatePipelineRun } from "@/lib/db";
import { createArtifact, getLatestArtifact } from "@/lib/db/artifact";
import { getProject } from "@/lib/db";
import { executeWorkflow } from "@/lib/workflow/engine";
import { ProductLifecycle } from "@/lib/workflow/productLifecycle";
import { WorkflowContext } from "@/lib/workflow/types";

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

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let totalTokens = 0;
        let totalCost = 0;
        let totalDuration = 0;
        let highestConfidence = 0;

        const context: WorkflowContext = {
          projectId,
          runId: pipelineRun.id,
          artifacts: {
            feature,
            "Requirements": existingState.requirements,
            "Architecture": existingState.architecture,
            "UI Design": existingState.ui,
            "API Design": existingState.api,
            "Test Cases": existingState.tests,
          },
          metrics: {
            totalTokens: 0,
            totalCost: 0,
            stageMetrics: {},
          },
          streamCallback: (event) => {
            controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

            if (event.tokens) totalTokens += event.tokens;
            if (event.cost) totalCost += Number(event.cost);
            if (event.duration) totalDuration = Math.max(totalDuration, event.duration);
            if (event.confidence && event.confidence > highestConfidence) {
              highestConfidence = event.confidence;
            }
          },
        };

        try {
          await executeWorkflow(ProductLifecycle, context);

          let deltaSummary = undefined;

          // Optionally generate a Delta Summary
          if (existingState?.requirements && context.artifacts["Requirements"]) {
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
                      content: `Previous Requirements:\n${JSON.stringify(existingState.requirements)}\n\nNew Requirements:\n${JSON.stringify(context.artifacts["Requirements"])}\n\nWhat changed?`,
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
            confidence: highestConfidence,
            deltaSummary,
          });

          // Save artifacts generically
          for (const stage of ProductLifecycle.stages) {
            const artifact = context.artifacts[stage.id];
            // Only persist if the artifact exists and differs from the existing state
            // existing state mappings for diffs:
            let isNew = false;
            switch (stage.dbType) {
              case "requirements": isNew = artifact !== existingState.requirements; break;
              case "architecture": isNew = artifact !== existingState.architecture; break;
              case "ui": isNew = artifact !== existingState.ui; break;
              case "api": isNew = artifact !== existingState.api; break;
              case "tests": isNew = artifact !== existingState.tests; break;
            }
            if (artifact && isNew) {
              await createArtifact({
                projectId,
                type: stage.dbType,
                content: artifact,
              });
            }
          }
        } catch (error: any) {
          console.error("Workflow error:", error);
          controller.enqueue(encoder.encode(JSON.stringify({ error: error.message }) + "\n"));
        } finally {
          controller.close();
        }
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