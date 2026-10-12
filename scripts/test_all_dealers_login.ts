import { prisma } from '../src/lib/db';
import { loginDealer } from '../src/lib/auth';

async function main() {
  console.log('Testing loginDealer for all dealers in DB...\n');

  const dealers = await prisma.dealer.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { id: 'asc' }
  });

  console.log(`Found ${dealers.length} active dealers to test.`);

  let successById = 0;
  let failById = 0;
  let mismatchNameById = 0;

  let successByPhone = 0;
  let failByPhone = 0;
  let mismatchNameByPhone = 0;
  let skippedPhone = 0;

  const failedLogins: any[] = [];
  const nameMismatches: any[] = [];

  for (const d of dealers) {
    // 1. Test Login by externalDealerId
    const resId = await loginDealer(d.externalDealerId, d.password || 'tvs123');
    if (!resId.success || !resId.session) {
      failById++;
      failedLogins.push({ type: 'ID', id: d.id, extId: d.externalDealerId, error: resId.error });
    } else {
      successById++;
      if (resId.session.displayName !== d.displayName) {
        mismatchNameById++;
        nameMismatches.push({
          type: 'ID',
          extId: d.externalDealerId,
          expected: d.displayName,
          got: resId.session.displayName,
          sessionId: resId.session.dealerId,
          dbId: d.id
        });
      }
    }

    // 2. Test Login by Phone (if phone is 10 digits)
    const phone = d.phone ? d.phone.trim() : '';
    if (phone && /^\d{10}$/.test(phone)) {
      const resPhone = await loginDealer(phone, d.password || 'tvs123');
      if (!resPhone.success || !resPhone.session) {
        failByPhone++;
        failedLogins.push({ type: 'PHONE', id: d.id, extId: d.externalDealerId, phone, error: resPhone.error });
      } else {
        successByPhone++;
        if (resPhone.session.displayName !== d.displayName) {
          mismatchNameByPhone++;
          nameMismatches.push({
            type: 'PHONE',
            extId: d.externalDealerId,
            phone,
            expected: d.displayName,
            got: resPhone.session.displayName,
            sessionId: resPhone.session.dealerId,
            dbId: d.id
          });
        }
      }
    } else {
      skippedPhone++;
    }
  }

  console.log('\n--- RESULTS SUMMARY ---');
  console.log(`Login by externalDealerId:`);
  console.log(`  Success: ${successById}`);
  console.log(`  Failed: ${failById}`);
  console.log(`  Display Name Mismatch: ${mismatchNameById}`);

  console.log(`\nLogin by 10-digit Phone:`);
  console.log(`  Success: ${successByPhone}`);
  console.log(`  Failed: ${failByPhone}`);
  console.log(`  Display Name Mismatch: ${mismatchNameByPhone}`);
  console.log(`  Skipped (no valid 10-digit phone): ${skippedPhone}`);

  if (failedLogins.length > 0) {
    console.log('\n❌ Failed logins sample:');
    console.log(failedLogins.slice(0, 10));
  }

  if (nameMismatches.length > 0) {
    console.log('\n⚠️ Name mismatches sample:');
    console.log(nameMismatches.slice(0, 20));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
