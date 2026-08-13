import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

// ---------------------------------------------------------------------------
// Prisma v7 requires a Driver Adapter instead of a binary engine.
// We use @prisma/adapter-pg (the official PostgreSQL adapter).
//
// The DATABASE_URL is read directly from process.env so dotenv / Next.js
// env loading applies as normal.
//
// Singleton pattern prevents connection leaks during Next.js HMR in dev.
// See: https://pris.ly/d/help/next-js-best-practices
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const db: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}

export default db;
