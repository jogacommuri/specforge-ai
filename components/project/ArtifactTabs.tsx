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
    const [activeTab, setActiveTab] = useState<"requirements" | "architecture" | "ui" | "api" | "tests">("requirements");
    const [showRawJson, setShowRawJson] = useState(false);

    const latestOfActiveTab = artifacts
        .filter((a) => a.type === activeTab && a.version === activeVersion)[0];

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const renderContent = () => {
        if (!latestOfActiveTab) return <div className="text-neutral-500 p-6">No {activeTab} available for this version.</div>;

        const { content } = latestOfActiveTab;

        if (showRawJson) {
            return (
                <pre className="bg-neutral-900 p-6 rounded-xl overflow-x-auto text-sm text-neutral-300">
                    {JSON.stringify(content, null, 2)}
                </pre>
            );
        }

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

        if (activeTab === "architecture" && content.overview) {
            return (
                <div className="space-y-8">
                    {/* Overview */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Architecture Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <span className="text-sm text-neutral-500 block">System Type</span>
                                <span className="text-base text-neutral-300">{content.overview.systemType}</span>
                            </div>
                            <div>
                                <span className="text-sm text-neutral-500 block">Architectural Style</span>
                                <span className="text-base text-neutral-300">{content.overview.architecturalStyle}</span>
                            </div>
                        </div>
                        <p className="text-neutral-400 text-sm leading-relaxed">{content.overview.summary}</p>
                    </div>

                    {/* Components */}
                    {content.components && content.components.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 block">System Components</h3>
                            <div className="overflow-x-auto rounded-lg border border-neutral-800">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-neutral-900 border-b border-neutral-800">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-neutral-300">Name</th>
                                            <th className="px-4 py-3 font-semibold text-neutral-300 w-1/2">Responsibility</th>
                                            <th className="px-4 py-3 font-semibold text-neutral-300">Technology</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800/50">
                                        {content.components.map((c: any, i: number) => (
                                            <tr key={i} className="hover:bg-neutral-900/50">
                                                <td className="px-4 py-3 font-medium text-blue-400">{c.name}</td>
                                                <td className="px-4 py-3 text-neutral-400">{c.responsibility}</td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-neutral-800 px-2 py-1 rounded text-neutral-300 text-xs">{c.technology || "TBD"}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Database Tables */}
                    {content.database?.tables && content.database.tables.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 block">Database Model ({content.database.type})</h3>
                            <div className="space-y-4">
                                {content.database.tables.map((table: any, i: number) => (
                                    <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                                        <div className="bg-neutral-950 px-4 py-2 border-b border-neutral-800">
                                            <h4 className="font-mono text-purple-400 font-semibold">{table.name}</h4>
                                        </div>
                                        <div className="p-4 overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="text-neutral-500">
                                                        <th className="pb-2 font-medium">Column</th>
                                                        <th className="pb-2 font-medium">Type</th>
                                                        <th className="pb-2 font-medium">Constraints</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {table.columns.map((col: any, j: number) => (
                                                        <tr key={j}>
                                                            <td className="py-1 text-neutral-300">{col.name}</td>
                                                            <td className="py-1 text-yellow-400 font-mono text-xs">{col.type}</td>
                                                            <td className="py-1 flex gap-1">
                                                                {col.primary && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 rounded uppercase">PK</span>}
                                                                {col.required && <span className="bg-neutral-800 text-neutral-400 text-[10px] px-1.5 rounded uppercase">Req</span>}
                                                                {col.unique && <span className="bg-green-500/20 text-green-400 text-[10px] px-1.5 rounded uppercase">Unq</span>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Infrastructure Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.deployment && (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-white mb-3">Deployment</h3>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-neutral-500">Host:</span> <span className="text-neutral-300">{content.deployment.hosting}</span></p>
                                    <p><span className="text-neutral-500">CI/CD:</span> <span className="text-neutral-300">{content.deployment.ciCdStrategy}</span></p>
                                </div>
                            </div>
                        )}
                        {content.scalability && (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-white mb-3">Scalability</h3>
                                <div className="space-y-2 text-sm">
                                    <p><span className="text-neutral-500">Strategy:</span> <span className="text-neutral-300">{content.scalability.strategy}</span></p>
                                    <p><span className="text-neutral-500">Caching:</span> <span className="text-neutral-300">{content.scalability.cachingStrategy || "-"}</span></p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (activeTab === "ui" && content.screens) {
            return (
                <div className="space-y-8">
                    {/* Overview & State Strategy */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4">UI Overview</h3>
                            <div className="space-y-4 text-sm text-neutral-300">
                                <div><span className="text-neutral-500 font-semibold block mb-1">Design Philosophy</span>{content.overview.designPhilosophy}</div>
                                <div><span className="text-neutral-500 font-semibold block mb-1">Target Users</span>{content.overview.targetUsers.join(", ")}</div>
                                <div><span className="text-neutral-500 font-semibold block mb-1">Accessibility</span>{content.overview.accessibilityConsiderations}</div>
                            </div>
                        </div>

                        {content.stateManagement && (
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                                <h3 className="text-xl font-bold text-white mb-4">State Strategy</h3>
                                <div className="space-y-4 text-sm text-neutral-300">
                                    <div><span className="text-neutral-500 font-semibold block mb-1">Strategy</span>{content.stateManagement.strategy}</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><span className="text-neutral-500 font-semibold block mb-1">Global</span><ul className="list-disc pl-4">{content.stateManagement.globalState?.map((s: string, i: number) => <li key={i}>{s}</li>) || <li>None</li>}</ul></div>
                                        <div><span className="text-neutral-500 font-semibold block mb-1">Local</span><ul className="list-disc pl-4">{content.stateManagement.localState?.map((s: string, i: number) => <li key={i}>{s}</li>) || <li>None</li>}</ul></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Screens Table */}
                    {content.screens && content.screens.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 block">Screens</h3>
                            <div className="overflow-x-auto rounded-lg border border-neutral-800">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-neutral-900 border-b border-neutral-800">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-neutral-300">Screen</th>
                                            <th className="px-4 py-3 font-semibold text-neutral-300">Purpose</th>
                                            <th className="px-4 py-3 font-semibold text-neutral-300">Roles</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800/50">
                                        {content.screens.map((s: any, i: number) => (
                                            <tr key={i} className="hover:bg-neutral-900/50">
                                                <td className="px-4 py-3 font-medium text-blue-400">{s.name}</td>
                                                <td className="px-4 py-3 text-neutral-400">{s.purpose}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {s.userRoles.map((r: string, j: number) => <span key={j} className="bg-neutral-800 px-2 py-1 rounded text-neutral-300 text-xs">{r}</span>)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Components Table */}
                    {content.components && content.components.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 block">Components</h3>
                            <div className="overflow-x-auto rounded-lg border border-neutral-800">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-neutral-900 border-b border-neutral-800">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-neutral-300">Name</th>
                                            <th className="px-4 py-3 font-semibold text-neutral-300">Type</th>
                                            <th className="px-4 py-3 font-semibold text-neutral-300 w-1/2">Responsibility</th>
                                            <th className="px-4 py-3 font-semibold text-neutral-300 text-center">Reusable</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800/50">
                                        {content.components.map((c: any, i: number) => (
                                            <tr key={i} className="hover:bg-neutral-900/50">
                                                <td className="px-4 py-3 font-medium text-purple-400">{c.name}</td>
                                                <td className="px-4 py-3 text-neutral-400 capitalize">{c.type}</td>
                                                <td className="px-4 py-3 text-neutral-400">{c.responsibility}</td>
                                                <td className="px-4 py-3 text-center text-neutral-400">{c.reusable ? "✅" : "❌"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Routing Table */}
                    {content.routingStructure && content.routingStructure.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 block">Routing</h3>
                            <div className="overflow-x-auto rounded-lg border border-neutral-800">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-neutral-900 border-b border-neutral-800">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-neutral-300">Route</th>
                                            <th className="px-4 py-3 font-semibold text-neutral-300">Screen</th>
                                            <th className="px-4 py-3 font-semibold text-neutral-300 text-center">Protected</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-800/50">
                                        {content.routingStructure.map((r: any, i: number) => (
                                            <tr key={i} className="hover:bg-neutral-900/50">
                                                <td className="px-4 py-3 font-mono text-green-400">{r.route}</td>
                                                <td className="px-4 py-3 text-neutral-400">{r.screen}</td>
                                                <td className="px-4 py-3 text-center text-neutral-400">{r.protected ? "🔒" : "🔓"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* User Flows */}
                    {content.userFlows && content.userFlows.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 block">User Flows</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {content.userFlows.map((flow: any, i: number) => (
                                    <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                                        <h4 className="font-semibold text-blue-300 mb-3">{flow.name}</h4>
                                        <ol className="list-decimal pl-5 space-y-1.5 text-sm text-neutral-300">
                                            {flow.steps.map((step: string, j: number) => <li key={j}>{step}</li>)}
                                        </ol>
                                    </div>
                                ))}
                            </div>
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
                    {["requirements", "architecture", "ui", "api", "tests"].map((tab) => (
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
                    <button
                        onClick={() => setShowRawJson(!showRawJson)}
                        className={`text-xs px-2 py-1.5 rounded transition ${showRawJson ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'}`}
                    >
                        {showRawJson ? 'View Layout' : 'View JSON'}
                    </button>
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
