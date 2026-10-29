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

  const [vehRes, allDataRes] = await Promise.all([
    fetch('https://tvscertified.in:8036/getAuctionvehicleList?auction_id=2038', { headers }),
    fetch('https://tvscertified.in:8036/getauctionallData2?type=closed&auction_id=2038', { headers })
  ]);
  const vehJson = await vehRes.json();
  const allJson = await allDataRes.json();

  const vehList = vehJson?.data || [];
  const allList = allJson?.data || [];

  console.log('getAuctionvehicleList length:', vehList.length);
  console.log('getauctionallData2 length:', allList.length);

  // Compare registration numbers or vehicle IDs
  const vehRegs = new Set(vehList.map(v => v.registration_number));
  const allRegs = new Set(allList.map(v => v.registration_number));

  console.log('In getAuctionvehicleList but not getauctionallData2:', vehList.filter(v => !allRegs.has(v.registration_number)).map(v => v.registration_number));
  console.log('In getauctionallData2 but not getAuctionvehicleList count:', allList.filter(v => !vehRegs.has(v.registration_number)).length);
}
test().catch(console.error);
