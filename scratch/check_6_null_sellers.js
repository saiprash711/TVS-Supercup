async function check() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const authRes = await fetch('https://tvscertified.in:8036/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
  });
  const token = (await authRes.json())?.data?.data?.[0]?.token;
  const headers = { 'Authorization': token, 'Content-Type': 'application/json' };

  const [vehRes, allRes] = await Promise.all([
    fetch('https://tvscertified.in:8036/getAuctionvehicleList?auction_id=2038', { headers }),
    fetch('https://tvscertified.in:8036/getauctionallData2?type=closed&auction_id=2038', { headers })
  ]);
  const vehs = (await vehRes.json())?.data || [];
  const alls = (await allRes.json())?.data || [];

  const regs = ['TN69AE3286', 'TN02BQ5717', 'TN85P7391', 'TN22CJ3173', 'TN74K8683', 'TN09BF7322'];
  for (const reg of regs) {
    const v = vehs.find(x => x.registration_number === reg);
    const a = alls.find(x => x.registration_number === reg);
    console.log(`\nReg: ${reg}`);
    console.log('getAuctionvehicleList:', {
      customer_name: v?.customer_name,
      owner_details: v?.owner_details,
      created_by: v?.created_by,
      user_id: v?.user_id
    });
    console.log('getauctionallData2:', {
      listed_by: a?.listed_by,
      listed_by_id: a?.listed_by_id,
      winner_name: a?.winner_name,
      winner_id: a?.winner_id
    });
  }
}
check().catch(console.error);
