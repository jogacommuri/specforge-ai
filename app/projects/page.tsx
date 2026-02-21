"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    if (!projectName.trim()) return;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription || null,
        }),
      });

      if (res.ok) {
        const newProject = await res.json();
        router.push(`/dashboard?projectId=${newProject.id}`);
      }
    } catch (error) {
      console.error("Error creating project:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-xl">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-6 lg:p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">Projects</h1>
      </div>

      {!showCreate ? (
        <>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl mb-6"
          >
            + Create New Project
          </button>

          {projects.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <p className="text-lg mb-4">No projects yet</p>
              <p>Create your first project to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/dashboard?projectId=${project.id}`)}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 cursor-pointer hover:border-blue-600 transition-colors"
                >
                  <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-neutral-400 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500">
                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Awesome Project"
                className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={4}
                className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={createProject}
                disabled={!projectName.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl"
              >
                Create Project
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setProjectName("");
                  setProjectDescription("");
                }}
                className="bg-neutral-800 hover:bg-neutral-700 px-6 py-3 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
