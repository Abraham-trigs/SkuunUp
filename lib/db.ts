// lib/db.ts
// Centralized Prisma Client (singleton-safe for dev + production)

import { PrismaClient } from "@prisma/client";

// Prevent multiple instances during Next.js hot reload
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"], // optional debugging logs
  });

// Cache client in dev environment only
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
