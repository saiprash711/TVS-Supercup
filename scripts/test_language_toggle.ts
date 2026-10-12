import { dealerTranslations, formatTranslation } from '../src/lib/translations/dealerTranslations';

console.log('--- TVS Super Cup Dealer Route Language Toggle Verification ---');
console.log('Total translation keys defined:', Object.keys(dealerTranslations).length);

const keysToVerify = [
  'navbar.brand',
  'navbar.leaderboard',
  'navbar.myDashboard',
  'navbar.pointRules',
  'navbar.termsRules',
  'navbar.logout',
  'ticker.champStatus',
  'ticker.nextAuction',
  'hero.welcomeArena',
  'hero.subtitle',
  'prize.title',
  'standings.buyerTitle',
  'standings.behind',
  'breakdown.title',
  'radar.title',
  'radar.deficit',
  'match.title',
  'telemetry.title',
  'protocol.title',
  'footer.network',
  'modal.howPointsCalculated',
  'termsModal.title'
];

let allValid = true;
for (const key of keysToVerify) {
  const trans = dealerTranslations[key];
  if (!trans || !trans.en || !trans.ta) {
    console.error(`FAIL: Key '${key}' is missing English or Tamil translation.`);
    allValid = false;
  } else {
    console.log(`[PASS] ${key}`);
    console.log(`       EN: ${trans.en}`);
    console.log(`       TA: ${trans.ta}`);
  }
}

// Test parameter interpolation
const testParamStr = formatTranslation(dealerTranslations['radar.deficit'].ta, { gap: 15 });
console.log('\n[PASS] Parameter interpolation test:');
console.log('       Raw: ', dealerTranslations['radar.deficit'].ta);
console.log('       Interpolated: ', testParamStr);

if (allValid && testParamStr.includes('15')) {
  console.log('\nSUCCESS: All translations and formatting verified successfully!');
} else {
  console.error('\nFAILED: Translation validation failed.');
  process.exit(1);
}
