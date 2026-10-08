/**
 * TVS Super Cup — Production Database Setup (Neon PostgreSQL)
 * 
 * Pushes the schema and seeds all data (dealers, campaigns, matches, rules)
 * to the production PostgreSQL database.
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx ts-node scripts/setup_production_db.ts
 * 
 * Or set DATABASE_URL in your .env file and run:
 *   npm run db:production:setup
 */

const { execSync } = require('child_process');
const path = require('path');

const dbUrl = (process.env.DATABASE_URL || '').trim();

if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
  console.error('❌ DATABASE_URL must be a PostgreSQL connection string.');
  console.error('   Example: postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require');
  console.error('');
  console.error('   Get a free database at https://neon.tech');
  process.exit(1);
}

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.production.prisma');

console.log('================================================================');
console.log('  TVS SUPER CUP — PRODUCTION DATABASE SETUP (Neon PostgreSQL)  ');
console.log('================================================================\n');

// Step 1: Generate Prisma client for PostgreSQL
console.log('📦 Step 1/3: Generating Prisma client for PostgreSQL...');
try {
  execSync(`npx prisma generate --schema="${schemaPath}"`, { stdio: 'inherit', env: process.env });
} catch (err) {
  console.error('❌ Failed to generate Prisma client.');
  process.exit(1);
}

// Step 2: Push schema to Neon (create tables)
console.log('\n🗄️  Step 2/3: Pushing schema to production database...');
try {
  execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss`, { stdio: 'inherit', env: process.env });
} catch (err) {
  console.error('❌ Failed to push schema. Check your DATABASE_URL connection.');
  process.exit(1);
}

// Step 3: Seed data
console.log('\n🌱 Step 3/3: Seeding production database with dealers, campaigns, and rules...');
try {
  execSync(
    `npx ts-node -r tsconfig-paths/register --project tsconfig.seed.json prisma/seed.ts`,
    { stdio: 'inherit', env: process.env }
  );
} catch (err) {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
}

// Step 4: Set up pre-launch test campaign
console.log('\n🧪 Setting up pre-launch test campaign...');
try {
  execSync(
    `npx ts-node -r tsconfig-paths/register --project tsconfig.seed.json scripts/setup_prelaunch_test_campaign.ts`,
    { stdio: 'inherit', env: process.env }
  );
} catch (err) {
  console.warn('⚠️  Pre-launch test campaign setup skipped (may already exist).');
}

console.log('\n================================================================');
console.log('  ✅ PRODUCTION DATABASE READY!');
console.log('================================================================');
console.log('');
console.log('Next steps:');
console.log('  1. Set DATABASE_URL in Vercel Environment Variables');
console.log('     → Vercel Dashboard → Settings → Environment Variables');
console.log('  2. Redeploy on Vercel');
console.log('     → git push  OR  Vercel Dashboard → Deployments → Redeploy');
console.log('');
