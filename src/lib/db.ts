import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn'] : [],
  });

const dbUrl = process.env.DATABASE_URL || '';
const isSqlite = dbUrl.includes('.db') || dbUrl.includes('sqlite') || dbUrl.startsWith('file:');

// Configure SQLite pragmas for high concurrency only if using SQLite
if (!globalForPrisma.prisma && isSqlite) {
  prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;')
    .then(() => prisma.$queryRawUnsafe('PRAGMA busy_timeout = 30000;'))
    .then(() => prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;'))
    .catch(() => {});
}

globalForPrisma.prisma = prisma;

