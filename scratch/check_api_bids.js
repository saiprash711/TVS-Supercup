async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const authRes = await fetch('https://tvscertified.in:8036/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
  });
  const token = (await authRes.json())?.data?.data?.[0]?.token;
  const headers = { 'Authorization': token, 'Content-Type': 'application/json' };

  // 1. Check getLiveBids for vehicle 20364 (TN11AT2479)
  const bidsRes = await fetch('https://tvscertified.in:8036/getLiveBids?auction_id=2038&auction_vehile_id=20364', { headers });
  const bidsJson = await bidsRes.json();
  console.log('getLiveBids for vehicle 20364:');
  console.log(JSON.stringify(bidsJson, null, 2));

  // 2. Check getbuyerBiddingList for customer 1781 / 1159 / 484
  const bList1781 = await (await fetch('https://tvscertified.in:8036/getbuyerBiddingList?customer_id=1781', { headers })).json();
  console.log('\ngetbuyerBiddingList for customer 1781 length:', bList1781?.data?.length);
  if (bList1781?.data?.length > 0) {
    console.log('Sample bid from 1781:', bList1781.data[0]);
  }

  const bList1159 = await (await fetch('https://tvscertified.in:8036/getbuyerBiddingList?customer_id=1159', { headers })).json();
  console.log('\ngetbuyerBiddingList for customer 1159 length:', bList1159?.data?.length);
  if (bList1159?.data?.length > 0) {
    console.log('Sample bid from 1159:', bList1159.data[0]);
  }
}

test().catch(console.error);
