async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const authRes = await fetch('https://tvscertified.in:8036/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
  });
  const authJson = await authRes.json();
  const token = authJson?.data?.data?.[0]?.token;
  const headers = { 'Authorization': token, 'Content-Type': 'application/json' };

  const res = await fetch('https://tvscertified.in:8036/getauctionallData2?type=closed&auction_id=2038', { headers });
  const json = await res.json();
  const data = json?.data || [];
  console.log(`Total in 2038 from getauctionallData2: ${data.length}`);

  const listedByCounts = {};
  for (const item of data) {
    const lb = `${item.listed_by} (id: ${item.listed_by_id})`;
    listedByCounts[lb] = (listedByCounts[lb] || 0) + 1;
  }
  console.log('Listed By breakdown in auction 2038:');
  console.log(listedByCounts);
}
test().catch(console.error);
