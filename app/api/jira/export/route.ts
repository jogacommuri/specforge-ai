import { NextResponse } from "next/server";
import { addJiraComment } from "@/lib/integrations/jira";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { issueKey, baseUrl, email, apiToken, testCases } = body;

        if (!issueKey || !baseUrl || !email || !apiToken || !testCases) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        // Format the test cases artifact into a readable Jira comment string
        let report = `*SpecForge AI Generated Test Cases*\n\n`;

        if (testCases.happyPath && testCases.happyPath.length > 0) {
            report += `*Happy Path*\n`;
            testCases.happyPath.forEach((t: string) => report += `- ${t}\n`);
            report += `\n`;
        }

        if (testCases.edgeCases && testCases.edgeCases.length > 0) {
            report += `*Edge Cases*\n`;
            testCases.edgeCases.forEach((t: string) => report += `- ${t}\n`);
            report += `\n`;
        }

        if (testCases.securityTests && testCases.securityTests.length > 0) {
            report += `*Security*\n`;
            testCases.securityTests.forEach((t: string) => report += `- ${t}\n`);
            report += `\n`;
        }

        await addJiraComment({ baseUrl, email, apiToken, issueKey }, report.trim());

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Jira export error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
