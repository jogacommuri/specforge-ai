import { prisma } from "./prisma";
import { CreateArtifactInput } from "./types";
import { Artifact } from "@prisma/client";

/**
 * Create a new artifact
 */
export async function createArtifact(
  input: CreateArtifactInput
): Promise<Artifact> {
  // Get the latest version for this artifact type
  const latest = await prisma.artifact.findFirst({
    where: {
      projectId: input.projectId,
      type: input.type,
    },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const nextVersion = latest ? latest.version + 1 : 1;

  return prisma.artifact.create({
    data: {
      projectId: input.projectId,
      type: input.type,
      content: input.content,
      version: input.version ?? nextVersion,
    },
  });
}

/**
 * Get artifact by ID
 */
export async function getArtifact(id: string): Promise<Artifact | null> {
  return prisma.artifact.findUnique({
    where: { id },
  });
}

/**
 * Get latest artifact of a type for a project
 */
export async function getLatestArtifact(
  projectId: string,
  type: "requirements" | "architecture" | "ui" | "api" | "tests"
): Promise<Artifact | null> {
  return prisma.artifact.findFirst({
    where: {
      projectId,
      type,
    },
    orderBy: { version: "desc" },
  });
}

/**
 * Get all artifacts for a project
 */
export async function getProjectArtifacts(
  projectId: string
): Promise<Artifact[]> {
  return prisma.artifact.findMany({
    where: { projectId },
    orderBy: [
      { type: "asc" },
      { version: "desc" },
    ],
  });
}

/**
 * Get artifact history (all versions of a type)
 */
export async function getArtifactHistory(
  projectId: string,
  type: "requirements" | "architecture" | "ui" | "api" | "tests"
): Promise<Artifact[]> {
  return prisma.artifact.findMany({
    where: {
      projectId,
      type,
    },
    orderBy: { version: "desc" },
  });
}
