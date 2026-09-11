async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  // 1. Authenticate
  console.log('Authenticating...');
  const authRes = await fetch('https://tvscertified.in:8036/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
  });
  const authJson = await authRes.json();
  const token = authJson?.data?.data?.[0]?.token;
  console.log('Got token:', token ? 'YES' : 'NO');

  if (!token) {
    console.error('Failed to get token:', authJson);
    return;
  }

  const headers = {
    'Authorization': token,
    'Content-Type': 'application/json',
  };

  const r = await fetch('https://tvscertified.in:8036/customers', { headers });
  const json = await r.json();
  const customers = json?.data || [];
  console.log('Total customers:', customers.length);
  
  const pageRes = await fetch('https://tvscertified.in/apps/customer', { headers });
  console.log('/apps/customer status:', pageRes.status);
  const html = await pageRes.text();
  console.log('HTML length:', html.length);
  const scriptMatches = html.match(/src="([^"]+)"/g) || [];
  console.log('Scripts found:', scriptMatches);

  const bRes = await fetch('https://tvscertified.in/apps/static/js/main.d1369698.js', { headers });
  const bJs = await bRes.text();
  
  function getCompanyName(cust) {
    if (!cust) return '';
    const clean = (s) => {
      if (!s || typeof s !== 'string') return '';
      const trimmed = s.trim();
      if (trimmed === 'null' || trimmed === 'undefined' || trimmed === '.') return '';
      return trimmed;
    };
    return clean(cust.legal_name) || clean(cust.trade_name) || clean(cust.name) || clean(cust.company_name) || '';
  }

  let withCompName = 0;
  let withoutCompName = 0;
  for (const c of customers) {
    const comp = getCompanyName(c);
    if (comp) withCompName++;
    else withoutCompName++;
  }
  console.log(`Company name extraction across ${customers.length} customers:`);
  console.log(`  Has company name: ${withCompName}`);
  console.log(`  Missing company name: ${withoutCompName}`);
  if (withoutCompName > 0) {
    const missing = customers.filter(c => !getCompanyName(c));
    console.log('Sample missing:', missing.slice(0, 3));
  }

  const custMap = new Map();
  for (const c of customers) {
    custMap.set(String(c.id), c);
    if (c.code) custMap.set(String(c.code), c);
    if (c.mobile_no) custMap.set(String(c.mobile_no).trim(), c);
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  // Create fast lookup maps
  const custById = new Map();
  const custByPhone = new Map();
  const custByEmail = new Map();
  for (const c of customers) {
    custById.set(String(c.id), c);
    if (c.mobile_no) custByPhone.set(String(c.mobile_no).trim(), c);
    if (c.email) custByEmail.set(String(c.email).trim().toLowerCase(), c);
  }

  const uRes = await fetch('https://tvscertified.in:8036/users', { headers });
  const uJson = await uRes.json();
  const allUsers = uJson?.data || [];

  // Also user-to-key mapping from /users
  const userToKey = new Map();
  for (const u of allUsers) {
    const uId = String(u.id);
    const keyId = u.key_id != null ? String(u.key_id) : uId;
    userToKey.set(uId, keyId);
  }

  const allDealers = await prisma.dealer.findMany();
  console.log(`Total dealers in local DB: ${allDealers.length}`);

  const dealersIn1978 = await prisma.dealerActivity.findMany({
    where: {
      OR: [
        { externalTransactionId: { contains: '1978' } },
        { match: { auctionId: '1978' } }
      ]
    },
    select: {
      dealer: {
        select: {
          id: true,
          externalDealerId: true,
          displayName: true,
          phone: true,
          city: true,
        }
      }
    },
    distinct: ['dealerId']
  });

  console.log(`\nTesting refined lookup on all ${dealersIn1978.length} Auction 1978 dealers:`);
  let unres1978 = 0;
  for (const d of dealersIn1978) {
    const rawExtId = d.dealer.externalDealerId;
    let cleanId = rawExtId.replace('USR-', '');
    
    // Priority 1: Direct match by customer id
    let c = custById.get(cleanId);

    // Priority 2: If starts with USR- or not found in customers, check if cleanId is a userId
    if (!c && userToKey.has(cleanId)) {
      c = custById.get(userToKey.get(cleanId));
    }

    // Priority 3: Phone number match
    if (!c && d.dealer.phone) {
      c = custByPhone.get(d.dealer.phone.trim());
    }

    const compName = getCompanyName(c);
    console.log(`Dealer ${d.dealer.id} (${rawExtId}) -> Current: "${d.dealer.displayName}" -> Company Name: "${compName || 'NOT FOUND'}", City: "${c?.city || d.dealer.city}"`);
    if (!compName) unres1978++;
  }
  console.log(`Unresolved in Auction 1978: ${unres1978}`);

  await prisma.$disconnect();
}

main().catch(console.error);
