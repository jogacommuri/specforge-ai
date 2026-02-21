import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dns from "node:dns";

// Prefer IPv4 to avoid "Can't reach database server" when host resolves to IPv6 (e.g. Supabase)
dns.setDefaultResultOrder("ipv4first");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Supabase (and most cloud Postgres) require SSL. pg defaults to no SSL.
  const isSupabase = connectionString.includes("supabase.co") || connectionString.includes("supabase.com");
  const poolConfig = isSupabase
    ? {
        connectionString,
        ssl: { rejectUnauthorized: false } as const,
      }
    : { connectionString };

  const adapter = new PrismaPg(poolConfig);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
