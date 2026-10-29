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
  const vehList = (await vehRes.json())?.data || [];
  const allList = (await allDataRes.json())?.data || [];

  const allMap = new Map();
  for (const item of allList) {
    allMap.set(String(item.vehicle_id), item);
  }

  let matchCount = 0;
  let diffCount = 0;
  const diffs = [];

  for (const veh of vehList) {
    const allItem = allMap.get(String(veh.vehicle_id));
    const custName = (veh.customer_name || '').trim();
    const listedBy = (allItem?.listed_by || '').trim();
    const listedById = allItem?.listed_by_id;

    if (custName.toLowerCase() === listedBy.toLowerCase()) {
      matchCount++;
    } else {
      diffCount++;
      diffs.push({
        regNo: veh.registration_number,
        vehicle_id: veh.vehicle_id,
        veh_customer_name: custName,
        all_listed_by: listedBy,
        all_listed_by_id: listedById,
        veh_owner_details: veh.owner_details,
        veh_created_by: veh.created_by,
      });
    }
  }

  console.log(`Matched: ${matchCount}, Differed: ${diffCount}`);
  console.log('Sample differences (first 10):', diffs.slice(0, 10));
}
test().catch(console.error);
