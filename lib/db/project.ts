import { Project } from "@prisma/client";
import { prisma } from "./prisma";
import { CreateProjectInput, ProjectWithRelations } from "./types";

/**
 * Create a new project
 */
export async function createProject(
  input: CreateProjectInput
): Promise<Project> {
  return prisma.project.create({
    data: {
      userId: input.userId,
      name: input.name,
      description: input.description,
    },
  });
}

/**
 * Get project by ID with relations
 */
export async function getProject(
  id: string
): Promise<ProjectWithRelations | null> {
  return prisma.project.findUnique({
    where: { id },
    include: {
      artifacts: {
        orderBy: { createdAt: "desc" },
      },
      runs: {
        include: {
          agents: {
            orderBy: { createdAt: "asc" },
          },
          project: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Get user's projects
 */
export async function getUserProjects(
  userId: string,
  limit: number = 50
): Promise<Project[]> {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

/**
 * Update project
 */
export async function updateProject(
  id: string,
  data: {
    name?: string;
    description?: string;
  }
): Promise<Project> {
  return prisma.project.update({
    where: { id },
    data,
  });
}

/**
 * Delete project (cascades to artifacts and runs)
 */
export async function deleteProject(id: string): Promise<void> {
  await prisma.project.delete({
    where: { id },
  });
}
