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

  console.log('Fetching vehicles for auction 2038 (Today TVSC Weekly Auction TN 15-Oct-2026)...');
  const vehRes = await fetch(`https://tvscertified.in:8036/getAuctionvehicleList?auction_id=2038`, { headers });
  const vehJson = await vehRes.json();
  const vehs = vehJson?.data || [];
  console.log(`Vehicles count: ${vehs.length}`);
  
  for (const v of vehs) {
    console.log({
      id: v.id,
      vehicle_id: v.vehicle_id,
      regNo: v.registration_number,
      customer_name: v.customer_name,
      owner_details: v.owner_details,
      created_by: v.created_by,
      winner_id: v.winner_id,
      winner_bid_value: v.winner_bid_value,
      stage: v.stage,
      vehicle_status: v.vehicle_status
    });
  }
}
test().catch(console.error);
