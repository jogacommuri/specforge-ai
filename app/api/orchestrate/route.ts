import { orchestrateStream } from "@/lib/orchestrator/orchestrate";

export async function POST(req: Request) {
  const { feature } = await req.json();

  const stream = await orchestrateStream(feature);

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(
          encoder.encode(JSON.stringify(chunk) + "\n")
        );
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}