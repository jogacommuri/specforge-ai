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
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 md:p-6">
            <h2 className="text-lg font-bold mb-4 border-b border-neutral-800 pb-3">
                Add New Feature
            </h2>

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
