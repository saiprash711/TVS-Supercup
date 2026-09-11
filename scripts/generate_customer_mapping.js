async function main() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const fs = require('fs');
  const path = require('path');

  console.log('Authenticating with TVS Certified...');
  const authRes = await fetch('https://tvscertified.in:8036/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
  });
  const authJson = await authRes.json();
  const token = authJson?.data?.data?.[0]?.token;
  if (!token) throw new Error('Could not get token');

  console.log('Fetching all customers from https://tvscertified.in:8036/customers...');
  const cRes = await fetch('https://tvscertified.in:8036/customers', {
    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
  });
  const cJson = await cRes.json();
  const customers = cJson?.data || [];
  console.log(`Fetched ${customers.length} customers.`);

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

  const mapping = {};
  for (const c of customers) {
    const companyName = getCompanyName(c);
    const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
    mapping[String(c.id)] = {
      id: c.id,
      code: c.code || '',
      companyName: companyName || fullName || `Dealer ${c.id}`,
      firstName: (c.first_name || '').trim(),
      lastName: (c.last_name || '').trim(),
      phone: c.mobile_no ? String(c.mobile_no).trim() : '',
      city: c.city || 'Tamil Nadu',
      email: c.email || '',
    };
  }

  const outPath = path.join(__dirname, '..', 'src', 'lib', 'data', 'tvs-customer-mapping.json');
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2), 'utf-8');
  console.log(`Successfully saved ${Object.keys(mapping).length} customer profiles to ${outPath}`);
}

main().catch(console.error);
