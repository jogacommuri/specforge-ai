import { useState } from "react";

interface Artifact {
    id: string;
    type: string;
    version: number;
    content: any;
    createdAt: string;
}

interface ArtifactTabsProps {
    artifacts: Artifact[];
    activeVersion: number;
    onChangeVersion: (version: number) => void;
    availableVersions: number[];
}

export default function ArtifactTabs({ artifacts, activeVersion, onChangeVersion, availableVersions }: ArtifactTabsProps) {
    const [activeTab, setActiveTab] = useState<"requirements" | "api" | "tests">("requirements");

    const latestOfActiveTab = artifacts
        .filter((a) => a.type === activeTab && a.version === activeVersion)[0];

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const renderContent = () => {
        if (!latestOfActiveTab) return <div className="text-neutral-500 p-6">No {activeTab} available for this version.</div>;

        const { content } = latestOfActiveTab;

        if (activeTab === "requirements") {
            return (
                <div className="space-y-6">
                    {content.functional && content.functional.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-blue-400 mb-3 block">Functional Requirements</h3>
                            <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                                {content.functional.map((req: string, i: number) => <li key={i}>{req}</li>)}
                            </ul>
                        </div>
                    )}
                    {content.nonFunctional && content.nonFunctional.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-purple-400 mb-3 block">Non-Functional</h3>
                            <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                                {content.nonFunctional.map((req: string, i: number) => <li key={i}>{req}</li>)}
                            </ul>
                        </div>
                    )}
                    {content.assumptions && content.assumptions.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-yellow-400 mb-3 block">Assumptions</h3>
                            <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                                {content.assumptions.map((req: string, i: number) => <li key={i}>{req}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }

        if (activeTab === "api" && content.endpoints) {
            return (
                <div className="overflow-x-auto rounded-lg border border-neutral-800">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-900 border-b border-neutral-800">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-neutral-300">Method</th>
                                <th className="px-4 py-3 font-semibold text-neutral-300">Route</th>
                                <th className="px-4 py-3 font-semibold text-neutral-300 w-1/2">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {content.endpoints.map((ep: any, i: number) => (
                                <tr key={i} className="hover:bg-neutral-900/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${ep.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                                                ep.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                                                    ep.method === 'PUT' || ep.method === 'PATCH' ? 'bg-yellow-500/20 text-yellow-500' :
                                                        'bg-red-500/20 text-red-400'
                                            }`}>
                                            {ep.method}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-neutral-300">{ep.path}</td>
                                    <td className="px-4 py-3 text-neutral-400">{ep.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (activeTab === "tests") {
            return (
                <div className="space-y-6">
                    {content.happyPath && content.happyPath.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                Happy Path
                            </h3>
                            <ul className="list-none space-y-3">
                                {content.happyPath.map((test: string, i: number) => (
                                    <li key={i} className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 text-sm">{test}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {content.edgeCases && content.edgeCases.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                Edge Cases
                            </h3>
                            <ul className="list-none space-y-3">
                                {content.edgeCases.map((test: string, i: number) => (
                                    <li key={i} className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 text-sm">{test}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {content.securityTests && content.securityTests.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                Security
                            </h3>
                            <ul className="list-none space-y-3">
                                {content.securityTests.map((test: string, i: number) => (
                                    <li key={i} className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 text-sm">{test}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }

        // fallback mapping 
        return (
            <pre className="bg-neutral-900 p-6 rounded-xl overflow-x-auto text-sm text-neutral-300">
                {JSON.stringify(content, null, 2)}
            </pre>
        );
    };

    return (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden mt-8">
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-neutral-800 bg-neutral-900/50 p-2 md:px-4">
                <div className="flex space-x-1 overflow-x-auto w-full sm:w-auto">
                    {["requirements", "api", "tests"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize whitespace-nowrap transition-colors ${activeTab === tab
                                    ? "bg-neutral-800 text-white"
                                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 px-2 sm:px-0 opacity-90">
                    <span className="text-xs text-neutral-500 uppercase font-semibold">Version</span>
                    <select
                        value={activeVersion}
                        onChange={(e) => onChangeVersion(Number(e.target.value))}
                        className="bg-neutral-800 text-sm text-white border border-neutral-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        {availableVersions.map(v => (
                            <option key={v} value={v}>v{v} {v === Math.max(...availableVersions) ? "(Current)" : ""}</option>
                        ))}
                    </select>
                    {latestOfActiveTab?.content && (
                        <button
                            onClick={() => handleCopy(JSON.stringify(latestOfActiveTab.content, null, 2))}
                            className="p-1.5 text-neutral-400 hover:text-white rounded bg-neutral-800 hover:bg-neutral-700 transition"
                            title="Copy JSON"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Content body */}
            <div className="p-4 md:p-6 min-h-[300px]">
                {renderContent()}
            </div>
        </div>
    );
}
