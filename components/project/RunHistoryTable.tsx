import { PipelineRunWithAgents } from "@/lib/db/types";

interface RunHistoryTableProps {
    runs: PipelineRunWithAgents[];
    activeVersion: number;
    onSelectVersion: (version: number) => void;
}

export default function RunHistoryTable({ runs, activeVersion, onSelectVersion }: RunHistoryTableProps) {
    if (!runs || runs.length === 0) return null;

    return (
        <div className="mt-8 mb-10">
            <h2 className="text-xl font-bold mb-4">Pipeline History</h2>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-neutral-950/50 border-b border-neutral-800 text-neutral-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Version / Feature</th>
                                <th className="px-6 py-4 font-medium">Confidence</th>
                                <th className="px-6 py-4 font-medium">Tokens</th>
                                <th className="px-6 py-4 font-medium">Cost</th>
                                <th className="px-6 py-4 font-medium">Duration</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {runs.map((run, i) => {
                                const versionNum = runs.length - i; // Naive version mapping assuming sequential
                                const isSelected = versionNum === activeVersion;

                                return (
                                    <tr
                                        key={run.id}
                                        onClick={() => {
                                            if (run.status === "completed") {
                                                onSelectVersion(versionNum);
                                            }
                                        }}
                                        className={`transition-colors ${run.status === "completed" ? "cursor-pointer hover:bg-neutral-800/50" : "opacity-50"
                                            } ${isSelected ? "bg-blue-500/5 border-l-2 border-l-blue-500" : "border-l-2 border-l-transparent"}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${isSelected ? "bg-blue-500 text-white" : "bg-neutral-800 text-neutral-300"
                                                    }`}>
                                                    v{versionNum}
                                                </span>
                                                <span className="font-medium truncate max-w-[200px] md:max-w-[300px]" title={run.feature}>
                                                    {run.feature}
                                                </span>
                                                {run.status === "error" && (
                                                    <span className="text-red-400 text-xs font-bold px-1.5 py-0.5 bg-red-500/10 rounded">ERROR</span>
                                                )}
                                                {run.status === "running" && (
                                                    <span className="text-blue-400 text-xs font-bold px-1.5 py-0.5 bg-blue-500/10 rounded animate-pulse">RUNNING</span>
                                                )}
                                            </div>
                                            {run.deltaSummary && (
                                                <p className="text-xs text-neutral-500 mt-2 truncate max-w-[300px] md:max-w-[400px]" title={run.deltaSummary}>
                                                    {run.deltaSummary}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {run.confidence ? (
                                                <span className={`${Number(run.confidence) >= 0.85 ? "text-green-400" :
                                                        Number(run.confidence) >= 0.70 ? "text-yellow-500" : "text-red-400"
                                                    }`}>
                                                    {(Number(run.confidence) * 100).toFixed(0)}%
                                                </span>
                                            ) : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-300">
                                            {run.totalTokens ? run.totalTokens.toLocaleString() : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-300">
                                            {run.totalCost ? `$${Number(run.totalCost).toFixed(4)}` : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-300">
                                            {run.totalDuration ? `${(run.totalDuration / 1000).toFixed(1)}s` : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-400">
                                            {new Date(run.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
