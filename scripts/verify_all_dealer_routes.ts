import { dealerTranslations, formatTranslation } from '../src/lib/translations/dealerTranslations';

async function run() {
  console.log('===============================================================');
  console.log('TVSCUP DEALER ROUTE LOCALIZATION & LANGUAGE TOGGLE VERIFICATION');
  console.log('===============================================================\n');

  // 1. Verify Translation Keys Dictionary
  const totalKeys = Object.keys(dealerTranslations).length;
  console.log(`[1] Translation Dictionary: ${totalKeys} keys loaded.`);

  const sampleKeys = [
    // Navbar
    'navbar.brand',
    'navbar.leaderboard',
    'navbar.myDashboard',
    // Leaderboard
    'leaderboard.brand',
    'leaderboard.heroTitle',
    'leaderboard.tabBuyer',
    'leaderboard.tabSeller',
    'leaderboard.topBuyer1',
    'leaderboard.thRank',
    'leaderboard.thCustomerId',
    // Login
    'login.badge',
    'login.titlePrefix',
    'login.cardHeading',
    'login.idLabel',
    'login.submitBtn',
    // Terms
    'terms.officialTermsBadge',
    'terms.heroTitle',
    'terms.sec1Title',
    'terms.sec4TieSplit',
  ];

  let missingKeys = 0;
  for (const key of sampleKeys) {
    const entry = dealerTranslations[key];
    if (!entry || !entry.en || !entry.ta) {
      console.error(`  ❌ Missing translation for key: ${key}`);
      missingKeys++;
    } else {
      console.log(`  ✓ Key "${key}" -> EN: "${entry.en}" | TA: "${entry.ta}"`);
    }
  }

  if (missingKeys > 0) {
    console.error(`\nFAILED: ${missingKeys} keys missing translation.`);
    process.exit(1);
  }

  // 2. HTTP Route Testing against running local Next.js server
  console.log('\n[2] Testing Public Routes on http://localhost:3000...');

  // 2a. Route: / (Login / Championship Portal)
  const loginRes = await fetch('http://localhost:3000/');
  console.log(`  / (Dealer Login) Status: ${loginRes.status}`);
  const loginHtml = await loginRes.text();
  const hasLoginToggle = loginHtml.includes('lang-toggle') || loginHtml.includes('தமிழ்');
  console.log(`  / Contains Language Toggle: ${hasLoginToggle ? '✓ YES' : '❌ NO'}`);

  // 2b. Route: /leaderboard
  const lbRes = await fetch('http://localhost:3000/leaderboard');
  console.log(`  /leaderboard Status: ${lbRes.status}`);
  const lbHtml = await lbRes.text();
  const hasLbToggle = lbHtml.includes('lang-toggle') || lbHtml.includes('தமிழ்');
  console.log(`  /leaderboard Contains Language Toggle: ${hasLbToggle ? '✓ YES' : '❌ NO'}`);

  // 2c. Route: /terms
  const termsRes = await fetch('http://localhost:3000/terms');
  console.log(`  /terms Status: ${termsRes.status}`);
  const termsHtml = await termsRes.text();
  const hasTermsToggle = termsHtml.includes('lang-toggle') || termsHtml.includes('தமிழ்');
  console.log(`  /terms Contains Language Toggle: ${hasTermsToggle ? '✓ YES' : '❌ NO'}`);

  // 2d. Authenticate Dealer (Identifier: 2402, Password: tvs123)
  console.log('\n[3] Authenticating Dealer (2402) to Test Protected Dealer Routes...');
  const authRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '2402', password: 'tvs123' }),
  });
  const authData = await authRes.json();
  console.log(`  Auth Response: success=${authData.success}, dealer=${authData.dealer?.dealerName}`);

  // Extract session cookie from Set-Cookie headers
  let sessionCookie = '';
  const setCookies = authRes.headers.getSetCookie ? authRes.headers.getSetCookie() : [authRes.headers.get('set-cookie') || ''];
  for (const c of setCookies) {
    if (c.includes('supercup_session=')) {
      sessionCookie = c.split(';')[0];
    }
  }
  console.log(`  Session Cookie captured: ${sessionCookie ? sessionCookie.substring(0, 30) + '...' : 'NONE'}`);

  // 2e. Route: /dashboard with session cookie
  const dashRes = await fetch('http://localhost:3000/dashboard', {
    headers: { Cookie: sessionCookie },
  });
  console.log(`  /dashboard Status: ${dashRes.status}`);
  const dashHtml = await dashRes.text();
  const hasDashToggle = dashHtml.includes('lang-toggle') || dashHtml.includes('தமிழ்');
  console.log(`  /dashboard Contains Language Toggle: ${hasDashToggle ? '✓ YES' : '❌ NO'}`);

  // 2f. Route: /dealer with session cookie
  const dealerRes = await fetch('http://localhost:3000/dealer', {
    headers: { Cookie: sessionCookie },
  });
  console.log(`  /dealer Status: ${dealerRes.status}`);
  const dealerHtml = await dealerRes.text();
  const hasDealerToggle = dealerHtml.includes('lang-toggle') || dealerHtml.includes('தமிழ்');
  console.log(`  /dealer Contains Language Toggle: ${hasDealerToggle ? '✓ YES' : '❌ NO'}`);

  // 2g. Route: /admin (Must NOT have language toggle)
  console.log('\n[4] Verifying Admin Route Isolation (Must NOT have Language Toggle)...');
  const adminRes = await fetch('http://localhost:3000/admin');
  console.log(`  /admin Status: ${adminRes.status}`);
  const adminHtml = await adminRes.text();
  const adminHasToggle = adminHtml.includes('lang-toggle-pill') || adminHtml.includes('lang-toggle-btn');
  console.log(`  /admin Has Language Toggle: ${adminHasToggle ? '❌ UNEXPECTED (SHOULD NOT BE PRESENT)' : '✓ NO (CORRECT - ADMIN ROUTE IS ISOLATED)'}`);

  console.log('\n===============================================================');
  if (hasLoginToggle && hasLbToggle && hasTermsToggle && hasDashToggle && hasDealerToggle && !adminHasToggle) {
    console.log('✅ ALL CHECKS PASSED: Language toggle and localization active everywhere in dealer routes!');
  } else {
    console.error('❌ SOME CHECKS FAILED');
    process.exit(1);
  }
  console.log('===============================================================\n');
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
