import { Project } from "@prisma/client";

interface ProjectHeaderProps {
    project: Project;
    totalVersions: number;
    avgConfidence: number;
}

export default function ProjectHeader({ project, totalVersions, avgConfidence }: ProjectHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4 border-b border-neutral-800 pb-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold">{project.name}</h1>
                {project.description && (
                    <p className="text-neutral-400 mt-2">{project.description}</p>
                )}

                <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Total Versions: {totalVersions}
                    </span>
                    <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${avgConfidence >= 85 ? "bg-green-500" : avgConfidence >= 70 ? "bg-yellow-500" : "bg-red-500"}`}></span>
                        Avg Confidence: {avgConfidence}%
                    </span>
                </div>
            </div>
        </div>
    );
}
