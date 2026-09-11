import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn'] : [],
  });

// Configure SQLite pragmas for high concurrency during live auctions
if (!globalForPrisma.prisma) {
  prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;')
    .then(() => prisma.$queryRawUnsafe('PRAGMA busy_timeout = 30000;'))
    .then(() => prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;'))
    .catch(() => {});
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

