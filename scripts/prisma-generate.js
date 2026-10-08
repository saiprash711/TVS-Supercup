/**
 * Prisma Generate Helper — picks the correct schema based on DATABASE_URL.
 * 
 * - PostgreSQL URL → uses prisma/schema.production.prisma
 * - SQLite / missing → uses prisma/schema.prisma (local dev default)
 * 
 * Called during `npm run build` to ensure the right Prisma client is generated.
 */

const { execSync } = require('child_process');

const dbUrl = (process.env.DATABASE_URL || '').trim();
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

const schemaPath = isPostgres
  ? 'prisma/schema.production.prisma'
  : 'prisma/schema.prisma';

console.log(`[prisma-generate] DATABASE_URL type: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);
console.log(`[prisma-generate] Using schema: ${schemaPath}`);

try {
  execSync(`npx prisma generate --schema=${schemaPath}`, {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('[prisma-generate] ✅ Prisma client generated successfully.');
} catch (err) {
  console.error('[prisma-generate] ❌ Failed to generate Prisma client:', err.message);
  process.exit(1);
}
