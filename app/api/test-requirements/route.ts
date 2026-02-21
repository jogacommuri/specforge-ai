import { NextResponse } from "next/server";
import { runRequirementsAgent } from "@/lib/agents/requirements";

export async function POST(req: Request) {
  try {
    const { feature } = await req.json();

    const result = await runRequirementsAgent(feature);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { 
        error: "Something went wrong",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}