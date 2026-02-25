import { NextResponse } from "next/server";
import { getJiraIssue, jiraToRequirementInput } from "@/lib/integrations/jira";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { issueKey, baseUrl, email, apiToken } = body;

        if (!issueKey || !baseUrl || !email || !apiToken) {
            return NextResponse.json({ error: "Missing required fields (issueKey, baseUrl, email, apiToken)" }, { status: 400 });
        }

        const normalizedIssue = await getJiraIssue({ baseUrl, email, apiToken, issueKey });
        const featureString = jiraToRequirementInput(normalizedIssue);

        return NextResponse.json({
            featureString,
            issue: normalizedIssue
        });
    } catch (error: any) {
        console.error("Jira import error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
