async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  // 1. Authenticate
  const authRes = await fetch('https://tvscertified.in:8036/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
  });
  const authJson = await authRes.json();
  const token = authJson?.data?.data?.[0]?.token;
  const headers = { 'Authorization': token, 'Content-Type': 'application/json' };

  // Fetch recent auctions
  const aucRes = await fetch('https://tvscertified.in:8036/auctions', { headers });
  const aucJson = await aucRes.json();
  const auctions = aucJson?.data || [];
  console.log(`Total auctions: ${auctions.length}`);
  const recentAuctions = auctions.slice(-10);
  console.log('Recent auctions:', recentAuctions.map(a => ({ id: a.id, title: a.title, stage: a.stage, date: a.scheduled_time })));

  // For the most recent auction or 1978, get vehicles
  const targetAuctionId = recentAuctions[recentAuctions.length - 1]?.id || '1978';
  console.log(`Fetching vehicles for auction ${targetAuctionId}...`);
  const vehRes = await fetch(`https://tvscertified.in:8036/getAuctionvehicleList?auction_id=${targetAuctionId}`, { headers });
  const vehJson = await vehRes.json();
  const vehs = vehJson?.data || [];
  console.log(`Vehicles in auction ${targetAuctionId}: ${vehs.length}`);
  if (vehs.length > 0) {
    console.log('Sample vehicle keys:', Object.keys(vehs[0]));
    console.log('Sample vehicle #0:', {
      id: vehs[0].id,
      vehicle_id: vehs[0].vehicle_id,
      registration_number: vehs[0].registration_number,
      customer_name: vehs[0].customer_name,
      owner_details: vehs[0].owner_details,
      customer_id: vehs[0].customer_id,
      seller_id: vehs[0].seller_id,
      user_id: vehs[0].user_id,
      created_by: vehs[0].created_by,
      listed_by: vehs[0].listed_by,
      dealer_name: vehs[0].dealer_name,
      winner_id: vehs[0].winner_id,
      stage: vehs[0].stage,
      status: vehs[0].status,
      vehicle_status: vehs[0].vehicle_status,
      auction_vehicles_stage: vehs[0].auction_vehicles_stage
    });
  }
}
test().catch(console.error);
