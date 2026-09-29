const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getCompanyName(c) {
  if (!c) return '';
  const clean = (s) => {
    if (!s || typeof s !== 'string') return '';
    const trimmed = s.trim();
    if (trimmed === 'null' || trimmed === 'undefined' || trimmed === '.') return '';
    return trimmed;
  };
  return clean(c.legal_name) || clean(c.trade_name) || clean(c.name) || clean(c.company_name) || '';
}

function resolveCategory(customerType) {
  if (!customerType) return 'Used Car Dealer';
  const clean = customerType.trim().toLowerCase();
  if (clean === 'oem_dealer') return 'OEM Dealer';
  if (clean === 'usedcardealer') return 'Used Car Dealer';
  return 'Corporate / Other';
}

async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('🏷️ Starting Dealer Tagging & Category Synchronization...\n');

  // 1. Authenticate with TVS Certified
  const authRes = await fetch('https://tvscertified.in:8036/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
  });
  const authJson = await authRes.json();
  const token = authJson?.data?.data?.[0]?.token;
  if (!token) throw new Error('Could not get TVS auth token');

  const headers = { 'Authorization': token, 'Content-Type': 'application/json' };

  // 2. Fetch customers and users from TVS Certified
  console.log('Fetching live customer directory and user identity keys...');
  const [cRes, uRes] = await Promise.all([
    fetch('https://tvscertified.in:8036/customers', { headers }),
    fetch('https://tvscertified.in:8036/users', { headers }),
  ]);
  const customers = (await cRes.json())?.data || [];
  const users = (await uRes.json())?.data || [];
  console.log(`Fetched ${customers.length} TVS customers and ${users.length} users.`);

  // 3. Build customer lookup maps
  const custById = new Map();
  const custByCode = new Map();
  const custByPhone = new Map();
  const custByName = new Map();

  for (const c of customers) {
    const compName = getCompanyName(c);
    const category = resolveCategory(c.customer_type);
    const enriched = {
      ...c,
      companyName: compName,
      category,
      role: category === 'OEM Dealer' ? 'Seller' : (category === 'Used Car Dealer' ? 'Buyer' : 'General'),
    };
    custById.set(String(c.id), enriched);
    if (c.code) custByCode.set(String(c.code).trim(), enriched);
    if (c.mobile_no) custByPhone.set(String(c.mobile_no).trim(), enriched);

    const names = [c.legal_name, c.trade_name, c.name, c.company_name].filter(Boolean);
    for (const n of names) {
      const clean = String(n).trim().toLowerCase();
      if (clean) custByName.set(clean, enriched);
    }
  }

  // Build user-to-key mapping
  const userToKey = new Map();
  for (const u of users) {
    if (u.key_id != null) {
      userToKey.set(String(u.id), String(u.key_id));
    }
  }

  // 4. Update src/lib/data/tvs-customer-mapping.json
  console.log('Updating static tvs-customer-mapping.json with categories and roles...');
  const mapping = {};
  for (const c of customers) {
    const compName = getCompanyName(c);
    const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
    const cat = resolveCategory(c.customer_type);
    mapping[String(c.id)] = {
      id: c.id,
      code: c.code || '',
      companyName: compName || fullName || `Dealer ${c.id}`,
      customerType: c.customer_type || '',
      category: cat,
      role: cat === 'OEM Dealer' ? 'Seller' : (cat === 'Used Car Dealer' ? 'Buyer' : 'General'),
      firstName: (c.first_name || '').trim(),
      lastName: (c.last_name || '').trim(),
      phone: c.mobile_no ? String(c.mobile_no).trim() : '',
      city: c.city || 'Tamil Nadu',
      email: c.email || '',
    };
  }
  const mappingPath = path.join(__dirname, '..', 'src', 'lib', 'data', 'tvs-customer-mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf-8');
  console.log(`✅ Saved ${Object.keys(mapping).length} enriched customer profiles to tvs-customer-mapping.json`);

  // 5. Update SQLite Database Dealers
  console.log('Updating dealer records in database...');
  const dealers = await prisma.dealer.findMany();
  console.log(`Found ${dealers.length} dealers in database.`);

  let updatedOem = 0;
  let updatedUsed = 0;
  let updatedOther = 0;

  for (const d of dealers) {
    const rawId = d.externalDealerId;
    let cleanId = rawId.replace('USR-', '').trim();

    // Priority 1: Direct customer ID
    let cust = custById.get(cleanId) || custByCode.get(cleanId);

    // Priority 2: User-to-key mapping
    if (!cust && userToKey.has(cleanId)) {
      cust = custById.get(userToKey.get(cleanId));
    }

    // Priority 3: Phone number lookup
    if (!cust && d.phone) {
      cust = custByPhone.get(d.phone.trim());
    }

    // Priority 4: Display name match
    if (!cust && d.displayName) {
      cust = custByName.get(d.displayName.trim().toLowerCase());
    }

    const category = cust ? resolveCategory(cust.customer_type) : 'Used Car Dealer';

    if (category === 'OEM Dealer') updatedOem++;
    else if (category === 'Used Car Dealer') updatedUsed++;
    else updatedOther++;

    await prisma.dealer.update({
      where: { id: d.id },
      data: {
        category,
      },
    });
  }

  console.log('\n📊 Dealer Tagging Summary in Database:');
  console.log(`  OEM Dealers (Sellers):     ${updatedOem}`);
  console.log(`  Used Car Dealers (Buyers): ${updatedUsed}`);
  console.log(`  Corporate / Other:         ${updatedOther}`);
  console.log(`  Total Dealers Tagged:      ${dealers.length}`);

  await prisma.$disconnect();
  console.log('\n✅ Dealer Tagging completed successfully!');
}

main().catch(console.error);
