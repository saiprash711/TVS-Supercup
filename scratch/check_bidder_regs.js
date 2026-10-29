async function check() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const authRes = await fetch('https://tvscertified.in:8036/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
  });
  const token = (await authRes.json())?.data?.data?.[0]?.token;
  const headers = { 'Authorization': token, 'Content-Type': 'application/json' };

  const regRes = await fetch('https://tvscertified.in:8036/auctionbidderregistration?auction_id=2038', { headers });
  const regs = (await regRes.json())?.data || [];
  console.log('Registered bidders sample (first 3):', regs.slice(0, 3));
}
check().catch(console.error);
