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

  console.log('Testing getauctionallData2 with type=closed...');
  const res = await fetch('https://tvscertified.in:8036/getauctionallData2?type=closed&auction_id=2038', { headers });
  console.log('Status:', res.status);
  const json = await res.json();
  const data = json?.data || [];
  console.log('Count:', data.length);
  if (data.length > 0) {
    console.log('Keys of first item:', Object.keys(data[0]));
    console.log('First item sample:', {
      registration_number: data[0].registration_number,
      auction_title: data[0].auction_title,
      winner_name: data[0].winner_name,
      listed_by: data[0].listed_by,
      customer_name: data[0].customer_name,
      owner_details: data[0].owner_details,
      seller_name: data[0].seller_name
    });
  }
}
test().catch(console.error);
