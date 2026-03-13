import { PrismaClient } from "@prisma/client";

const globalForAuthPrisma = globalThis as typeof globalThis & {
  authPrisma?: PrismaClient;
};

export function getAuthPrisma() {
  if (!globalForAuthPrisma.authPrisma) {
    globalForAuthPrisma.authPrisma = new PrismaClient();
  }

  return globalForAuthPrisma.authPrisma;
}
