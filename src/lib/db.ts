import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import os from 'os';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

interface ResolvedDb {
  url: string;
  isSqlite: boolean;
  isServerless: boolean;
}

function resolveDatabase(): ResolvedDb {
  const envUrl = process.env.DATABASE_URL?.trim();

  // If a remote database (Postgres, MySQL, Turso, etc.) is configured, respect it
  if (envUrl && (envUrl.startsWith('postgres') || envUrl.startsWith('mysql') || envUrl.startsWith('libsql'))) {
    return { url: envUrl, isSqlite: false, isServerless: false };
  }

  // Detect serverless environment (Vercel, AWS Lambda)
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isServerless) {
    const tmpDir = os.tmpdir() || '/tmp';
    const tmpDbPath = path.join(tmpDir, 'supercup-serverless.db');

    // Candidate locations for bundled dev.db inside the serverless container
    const candidates = [
      path.join(process.cwd(), 'prisma', 'dev.db'),
      path.join(process.cwd(), 'dev.db'),
      path.resolve(__dirname, '..', '..', '..', 'prisma', 'dev.db'),
      path.resolve(__dirname, '..', '..', 'prisma', 'dev.db'),
      path.resolve(__dirname, '..', 'prisma', 'dev.db'),
      path.resolve(__dirname, 'dev.db'),
    ];

    const sourceFile = candidates.find(c => {
      try {
        return fs.existsSync(c) && fs.statSync(c).size > 0;
      } catch {
        return false;
      }
    });

    if (sourceFile) {
      try {
        const sourceStat = fs.statSync(sourceFile);
        const tmpExists = fs.existsSync(tmpDbPath);
        const tmpStat = tmpExists ? fs.statSync(tmpDbPath) : null;

        // Copy if missing in tmp or size differs (e.g. updated bundle)
        if (!tmpStat || tmpStat.size !== sourceStat.size) {
          fs.copyFileSync(sourceFile, tmpDbPath);
          console.log(`[DB] Initialized serverless SQLite db from ${sourceFile} (${sourceStat.size} bytes) to ${tmpDbPath}`);
        }
      } catch (err) {
        console.error('[DB] Failed to copy SQLite db to /tmp:', err);
      }
    } else {
      console.warn('[DB] Warning: Could not locate source dev.db in candidates:', candidates);
    }

    if (fs.existsSync(tmpDbPath)) {
      const url = `file:${tmpDbPath.replace(/\\/g, '/')}`;
      process.env.DATABASE_URL = url;
      return { url, isSqlite: true, isServerless: true };
    }
  }

  // Local development / fallback
  const localDb = path.join(process.cwd(), 'prisma', 'dev.db');
  if (fs.existsSync(localDb)) {
    const url = `file:${localDb.replace(/\\/g, '/')}`;
    process.env.DATABASE_URL = url;
    return { url, isSqlite: true, isServerless: false };
  }

  const fallback = process.env.DATABASE_URL || 'file:./dev.db';
  return { url: fallback, isSqlite: true, isServerless };
}

const { url: effectiveUrl, isSqlite, isServerless } = resolveDatabase();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: effectiveUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn'] : [],
  });

// Configure SQLite pragmas for high concurrency and serverless compatibility
if (!globalForPrisma.prisma && isSqlite) {
  // Use memory journal mode on serverless to prevent disk lock/shm issues on /tmp
  const journalPragma = isServerless ? 'PRAGMA journal_mode = MEMORY;' : 'PRAGMA journal_mode = WAL;';
  prisma.$queryRawUnsafe(journalPragma)
    .then(() => prisma.$queryRawUnsafe('PRAGMA busy_timeout = 30000;'))
    .then(() => prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;'))
    .catch((err) => {
      console.warn('[DB] SQLite pragma warning:', err?.message || err);
    });
}

globalForPrisma.prisma = prisma;
