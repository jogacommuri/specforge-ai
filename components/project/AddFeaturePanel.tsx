"use client";

import { useState } from "react";

interface AddFeaturePanelProps {
    onGenerate: (featureText: string, tags: string[]) => void;
    isRunning?: boolean;
}

export default function AddFeaturePanel({ onGenerate, isRunning }: AddFeaturePanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [featureText, setFeatureText] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    // Jira Import State
    const [isJiraOpen, setIsJiraOpen] = useState(false);
    const [jiraBaseUrl, setJiraBaseUrl] = useState("");
    const [jiraEmail, setJiraEmail] = useState("");
    const [jiraToken, setJiraToken] = useState("");
    const [jiraIssueKey, setJiraIssueKey] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    const toggleTag = (tag: string) => {
        setTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const handleGenerate = () => {
        if (!featureText.trim()) return;
        onGenerate(featureText, tags);
        // don't collapse until they manually cancel later
    };

    const handleJiraImport = async () => {
        setImportError(null);
        if (!jiraBaseUrl || !jiraEmail || !jiraToken || !jiraIssueKey) {
            setImportError("All Jira configuration fields are required.");
            return;
        }

        setIsImporting(true);
        try {
            const res = await fetch("/api/jira/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    baseUrl: jiraBaseUrl.trim(),
                    email: jiraEmail.trim(),
                    apiToken: jiraToken.trim(),
                    issueKey: jiraIssueKey.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to import Jira issue");

            // Overwrite the feature text area
            setFeatureText(data.featureString);
            setIsJiraOpen(false); // Close the configuration modal

            // Optionally auto-append a tag identifying origin
            if (!tags.includes("Jira Import")) {
                setTags(prev => [...prev, "Jira Import"]);
            }
        } catch (e: any) {
            setImportError(e.message);
        } finally {
            setIsImporting(false);
        }
    };

    if (isRunning) {
        return (
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 md:p-6 rounded-xl flex items-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                <span>Generating Pipeline Evolution...</span>
            </div>
        );
    }

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="w-full md:w-auto bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium"
            >
                <span className="text-xl leading-none">+</span>
                Add Feature Evolution
            </button>
        );
    }

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 md:p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b border-neutral-800 pb-3 gap-3">
                <h2 className="text-lg font-bold">Add New Feature</h2>

                <button
                    onClick={() => setIsJiraOpen(!isJiraOpen)}
                    className="px-3 py-1.5 bg-[#0052CC]/10 hover:bg-[#0052CC]/20 text-[#2684FF] border border-[#0052CC]/30 rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                        <path d="M12.001 22.185c-5.617 0-10.18-4.563-10.18-10.185 0-5.621 4.563-10.185 10.18-10.185 5.621 0 10.185 4.564 10.185 10.185 0 5.622-4.564 10.185-10.185 10.185zm0-2.825c4.053 0 7.36-3.307 7.36-7.36 0-4.053-3.307-7.36-7.36-7.36-4.053 0-7.36 3.307-7.36 7.36 0 4.053 3.307 7.36 7.36 7.36z" />
                        <path d="M10.82 17.5l-5.4-5.4 1.99-1.99 3.41 3.41 7.4-7.4 1.99 1.99z" />
                    </svg>
                    Import from Jira
                </button>
            </div>

            {isJiraOpen && (
                <div className="mb-6 p-4 bg-neutral-950 border border-neutral-800 rounded-lg animate-in slide-in-from-top-2">
                    <h3 className="text-sm font-semibold text-neutral-300 mb-3">Jira Configuration (MVP)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-neutral-500 mb-1">Jira Workspace URL</label>
                            <input type="text" placeholder="https://company.atlassian.net" value={jiraBaseUrl} onChange={e => setJiraBaseUrl(e.target.value)} className="w-full text-sm p-2 bg-neutral-900 border border-neutral-800 rounded focus:border-[#2684FF] outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-500 mb-1">Email</label>
                            <input type="email" placeholder="you@company.com" value={jiraEmail} onChange={e => setJiraEmail(e.target.value)} className="w-full text-sm p-2 bg-neutral-900 border border-neutral-800 rounded focus:border-[#2684FF] outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-500 mb-1">API Token</label>
                            <input type="password" placeholder="Jira Profile -> Security -> Generate Token" value={jiraToken} onChange={e => setJiraToken(e.target.value)} className="w-full text-sm p-2 bg-neutral-900 border border-neutral-800 rounded focus:border-[#2684FF] outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-500 mb-1">Issue Key</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="PROJ-123" value={jiraIssueKey} onChange={e => setJiraIssueKey(e.target.value)} className="w-full text-sm p-2 bg-neutral-900 border border-neutral-800 rounded focus:border-[#2684FF] outline-none" />
                                <button onClick={handleJiraImport} disabled={isImporting} className="bg-[#0052CC] hover:bg-[#0052CC]/80 disabled:opacity-50 text-white px-4 rounded text-sm font-medium transition whitespace-nowrap">
                                    {isImporting ? "Fetching..." : "Pull"}
                                </button>
                            </div>
                        </div>
                    </div>
                    {importError && <p className="text-xs text-red-500 mt-2">{importError}</p>}
                </div>
            )}

            <p className="text-sm text-neutral-400 mb-2">Describe the new functionality:</p>
            <textarea
                value={featureText}
                onChange={(e) => setFeatureText(e.target.value)}
                placeholder="E.g. Add a password reset flow with email verification..."
                className="w-full p-4 bg-neutral-950 border border-neutral-800 rounded-lg min-h-[120px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-y mb-4"
                disabled={isRunning}
            />

            <div className="flex flex-wrap gap-2 md:gap-4 mb-6">
                {["Minor enhancement", "Breaking change", "Performance related", "Security related"].map((tag) => (
                    <label key={tag} className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={tags.includes(tag)}
                            onChange={() => toggleTag(tag)}
                            className="rounded bg-neutral-800 border-neutral-700 text-blue-500 focus:ring-blue-500/20 focus:ring-offset-neutral-900"
                        />
                        {tag}
                    </label>
                ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                    onClick={() => {
                        setIsExpanded(false);
                        setFeatureText("");
                        setTags([]);
                    }}
                    className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleGenerate}
                    disabled={!featureText.trim() || isRunning}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    Generate Evolution
                </button>
            </div>
        </div>
    );
}
