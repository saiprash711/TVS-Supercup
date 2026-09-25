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

// Static AST hints for @vercel/nft to bundle prisma/dev.db in Next.js Serverless builds
try {
  const _hint = path.join(process.cwd(), 'prisma/dev.db');
  if (fs.existsSync(_hint)) {
    // Traced by NFT
  }
} catch {}

function findDatabaseSource(): string | null {
  const candidates = [
    path.join(process.cwd(), 'prisma/dev.db'),
    path.join(process.cwd(), 'dev.db'),
    path.resolve(__dirname, 'prisma/dev.db'),
    path.resolve(__dirname, '../prisma/dev.db'),
    path.resolve(__dirname, '../../prisma/dev.db'),
    path.resolve(__dirname, '../../../prisma/dev.db'),
    path.resolve(__dirname, '../../../../prisma/dev.db'),
    path.resolve(__dirname, '../../../../../prisma/dev.db'),
    '/var/task/prisma/dev.db',
    '/var/task/dev.db',
  ];

  for (const c of candidates) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).size > 0) {
        return c;
      }
    } catch {}
  }

  // Recursive search in Lambda root if not in standard locations
  const searchRoots = ['/var/task', process.cwd()];
  for (const root of searchRoots) {
    try {
      if (!fs.existsSync(root)) continue;
      const search = (dir: string, depth = 0): string | null => {
        if (depth > 3) return null;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (!entry.isDirectory() && entry.name === 'dev.db' && fs.statSync(full).size > 0) {
            return full;
          }
          if (entry.isDirectory() && !['node_modules', '.next', '.git'].includes(entry.name)) {
            const sub = search(full, depth + 1);
            if (sub) return sub;
          }
        }
        return null;
      };
      const found = search(root);
      if (found) return found;
    } catch {}
  }

  return null;
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
    const sourceFile = findDatabaseSource();

    if (sourceFile) {
      try {
        const sourceStat = fs.statSync(sourceFile);
        const tmpExists = fs.existsSync(tmpDbPath);
        const tmpStat = tmpExists ? fs.statSync(tmpDbPath) : null;

        // Copy if missing in tmp or size differs (e.g. updated build deployment)
        if (!tmpStat || tmpStat.size !== sourceStat.size) {
          fs.copyFileSync(sourceFile, tmpDbPath);
          console.log(`[DB] Successfully initialized serverless SQLite db from ${sourceFile} (${sourceStat.size} bytes) to ${tmpDbPath}`);
        }
      } catch (err) {
        console.error('[DB] Failed to copy SQLite db to /tmp:', err);
      }
    } else {
      console.warn('[DB] Warning: Could not locate source dev.db in serverless container.');
    }

    if (fs.existsSync(tmpDbPath)) {
      const url = `file:${tmpDbPath.replace(/\\/g, '/')}`;
      process.env.DATABASE_URL = url;
      return { url, isSqlite: true, isServerless: true };
    }
  }

  // Local development / fallback
  const localDb = path.join(process.cwd(), 'prisma/dev.db');
  if (fs.existsSync(localDb)) {
    const url = `file:${localDb.replace(/\\/g, '/')}`;
    process.env.DATABASE_URL = url;
    return { url, isSqlite: true, isServerless: false };
  }

  const fallback = process.env.DATABASE_URL || 'file:./prisma/dev.db';
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
