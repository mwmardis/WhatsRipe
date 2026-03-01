import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDb(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const client = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

// Use a proxy so PrismaClient is only instantiated on first property access,
// not at module-import time. This prevents build-time errors when DATABASE_URL
// is only available at runtime (e.g. Vercel serverless).
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return getDb()[prop as keyof PrismaClient];
  },
});
