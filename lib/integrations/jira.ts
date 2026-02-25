/**
 * Basic Jira Integration API Client
 * Uses API Tokens for authentication.
 * 
 * Flow:
 * 1. Takes Jira Site URL, Email, and API Token
 * 2. Fetches the Issue via REST API v3
 * 3. Normalizes the output into a structured format
 */

export interface JiraIssueConfig {
    baseUrl: string; // e.g., https://your-domain.atlassian.net
    email: string;
    apiToken: string;
    issueKey: string; // e.g., PROJ-123
}

export interface NormalizedJiraIssue {
    key: string;
    title: string;
    description: string;
    acceptanceCriteria: string[];
    comments: string[];
    subtasks: { key: string; summary: string }[];
    status: string;
    type: string;
}

/**
 * Parses Atlassian Document Format (ADF) blocks into plain text recursively.
 */
function parseAdfToText(node: any): string {
    if (!node) return "";
    if (typeof node === "string") return node;

    let text = "";
    if (node.text) {
        text += node.text;
    }

    if (Array.isArray(node.content)) {
        for (const child of node.content) {
            const childText = parseAdfToText(child);
            if (childText) {
                text += childText + (child.type === "paragraph" || child.type === "heading" ? "\n" : " ");
            }
        }
    }

    return text.trim();
}

/**
 * Extracts acceptance criteria. 
 * First checks for a custom field (often customfield_10004 or similar, depending on Jira setup).
 * Fallback: Regex searches the description for "Acceptance Criteria" blocks.
 */
function extractAcceptanceCriteria(issueData: any, descriptionText: string): string[] {
    // 1. Look for common Custom Field conventions if ADF exposes it as a string
    for (const key of Object.keys(issueData.fields)) {
        if (key.startsWith("customfield_")) {
            const val = issueData.fields[key];
            // Sometimes AC is stored as a direct string array or ADF doc in a custom field
            if (typeof val === "string" && val.toLowerCase().includes("scenario")) {
                // Rough guess this is a Gherkin AC field
                return val.split("\n").filter(line => line.trim().length > 0);
            }
        }
    }

    // 2. Fallback: Parse description text for a typical AC header
    const criteria: string[] = [];
    const acMatch = descriptionText.match(/(?:Acceptance Criteria|AC)[s]?:?\s*\n([\s\S]*?)(?:\n\n[A-Z]|$)/i);

    if (acMatch && acMatch[1]) {
        const lines = acMatch[1].split("\n");
        for (const line of lines) {
            const cleaned = line.replace(/^[-*•\d.]+\s*/, "").trim();
            if (cleaned) criteria.push(cleaned);
        }
    }

    return criteria;
}

/**
 * Fetches and normalizes a Jira Issue.
 */
export async function getJiraIssue(config: JiraIssueConfig): Promise<NormalizedJiraIssue> {
    const { baseUrl, email, apiToken, issueKey } = config;

    // Basic Auth Base64 encoding
    const authHeader = `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`;

    // Fetch issue details (Fields to expand: renderedFields, transitions etc. can be added if needed)
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/rest/api/3/issue/${issueKey}`, {
        method: "GET",
        headers: {
            "Authorization": authHeader,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Jira Issue ${issueKey}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const fields = data.fields;

    // 1. Parse Description (Jira v3 uses Atlassian Document Format)
    const descriptionAdf = fields.description;
    const descriptionText = descriptionAdf ? parseAdfToText(descriptionAdf) : "";

    // 2. Extract Acceptance Criteria
    const acceptanceCriteria = extractAcceptanceCriteria(data, descriptionText);

    // 3. Extract Subtasks
    const subtasks = (fields.subtasks || []).map((st: any) => ({
        key: st.key,
        summary: st.fields.summary || ""
    }));

    // 4. Fetch Comments
    const comments: string[] = [];
    // Comments might be paginated, but for an MVP, top-level comments often suffice.
    if (fields.comment && Array.isArray(fields.comment.comments)) {
        for (const comment of fields.comment.comments) {
            if (comment.body) {
                comments.push(parseAdfToText(comment.body));
            }
        }
    }

    return {
        key: data.key,
        title: fields.summary || "",
        description: descriptionText,
        acceptanceCriteria,
        comments,
        subtasks,
        status: fields.status?.name || "Unknown",
        type: fields.issuetype?.name || "Task"
    };
}

/**
 * Transforms a Normalized Jira Issue into a structured requirement string
 * suitable for the Specification Engine `RequirementsStage` prompt.
 */
export function jiraToRequirementInput(issue: NormalizedJiraIssue): string {
    let prompt = `[Jira Integration: ${issue.key}]\n`;
    prompt += `Feature Title: ${issue.title}\n\n`;

    if (issue.description) {
        prompt += `Business Context & Description:\n${issue.description}\n\n`;
    }

    if (issue.acceptanceCriteria.length > 0) {
        prompt += `Acceptance Criteria:\n`;
        issue.acceptanceCriteria.forEach((ac, idx) => {
            prompt += `${idx + 1}. ${ac}\n`;
        });
        prompt += `\n`;
    }

    if (issue.subtasks.length > 0) {
        prompt += `Listed Subtasks/Implementation Steps:\n`;
        issue.subtasks.forEach(st => {
            prompt += `- [${st.key}] ${st.summary}\n`;
        });
        prompt += `\n`;
    }

    if (issue.comments.length > 0) {
        prompt += `Additional Context from Comments:\n`;
        // Cap to latest 3 comments to avoid prompt bloat
        const latestComments = issue.comments.slice(-3);
        latestComments.forEach(comment => {
            prompt += `> ${comment}\n`;
        });
    }

    return prompt.trim();
}

/**
 * Pushes a comment to a Jira Issue.
 * Formatting uses Atlassian Document Format (ADF) if sending complex data, 
 * but simple strings work via the REST API v3 if wrapped properly, 
 * or using v2 for simple text comments. We will use v2 for simple text delivery
 * as it natively accepts markdown-like text bodies.
 */
export async function addJiraComment(config: JiraIssueConfig, commentBody: string): Promise<boolean> {
    const { baseUrl, email, apiToken, issueKey } = config;
    const authHeader = `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`;

    // Using v2 for comments allows us to send raw strings more reliably than ADF v3
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/rest/api/2/issue/${issueKey}/comment`, {
        method: "POST",
        headers: {
            "Authorization": authHeader,
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            body: commentBody
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to push comment to Jira Issue ${issueKey}: ${response.status} ${response.statusText}`);
    }

    return true;
}
