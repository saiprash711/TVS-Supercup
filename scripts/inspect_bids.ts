import { RealTVSAuctionProvider } from '../src/lib/services/tvs-integration';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  const provider = new RealTVSAuctionProvider();
  const authRes = await provider.authenticateWithCredentials('bhavaniprasad999@gmail.com', 'KU9JhpWDCz');
  const token = authRes.token;
  const headers = { 'Authorization': token!, 'Content-Type': 'application/json' };

  // 1. Inspect auction 1978 vehicles and prebids
  const regRes = await fetch('https://tvscertified.in:8036/auctionbidderregistration?auction_id=1978', { headers });
  const regJson = await regRes.json();
  console.log('Auction 1978 registrations sample (first 3):');
  console.log(JSON.stringify(regJson?.data?.slice(0, 3), null, 2));

  // Check if any have pre_bid_value
  const preBids = (regJson?.data || []).filter((r: any) => Number(r.pre_bid_value || 0) > 0);
  console.log(`Pre-bids count in 1978: ${preBids.length}`);
  if (preBids.length > 0) {
    console.log('Sample pre-bid:', JSON.stringify(preBids[0], null, 2));
  }

  // 2. Check vehicles in 1978
  const vehRes = await fetch('https://tvscertified.in:8036/getAuctionvehicleList?auction_id=1978', { headers });
  const vehJson = await vehRes.json();
  const vehicles = vehJson?.data || [];
  console.log(`Vehicles count in 1978: ${vehicles.length}`);
  if (vehicles.length > 0) {
    console.log('Sample vehicle specs keys:', Object.keys(vehicles[0]));
    console.log('Sample vehicle details:', {
      id: vehicles[0].id,
      vehicle_id: vehicles[0].vehicle_id,
      title: vehicles[0].title,
      make_model: vehicles[0].make_model,
      registration_number: vehicles[0].registration_number,
      start_bid_value: vehicles[0].start_bid_value,
      reserve_price: vehicles[0].reserve_price,
      bid_increment: vehicles[0].bid_increment,
      fuel_type: vehicles[0].fuel_type,
      transmission: vehicles[0].transmission,
      speedometer: vehicles[0].speedometer,
      year_of_mfg: vehicles[0].year_of_mfg,
      current_bid: vehicles[0].current_bid,
      vehicle_status: vehicles[0].vehicle_status,
      sequence: vehicles[0].sequence,
    });
  }

  // 3. Inspect a past auction with real live bids (Auction #443)
  const pastVehRes = await fetch('https://tvscertified.in:8036/getAuctionvehicleList?auction_id=443', { headers });
  const pastVehJson = await pastVehRes.json();
  const pastVehicles = pastVehJson?.data || [];
  console.log(`Past Auction 443 vehicles: ${pastVehicles.length}`);
  for (const v of pastVehicles.slice(0, 10)) {
    const liveBidsRes = await fetch(`https://tvscertified.in:8036/getLiveBids?auction_id=443&auction_vehile_id=${v.id}`, { headers });
    if (liveBidsRes.ok) {
      const bJson = await liveBidsRes.json();
      if (bJson?.data && bJson.data.length > 0) {
        console.log(`Vehicle ${v.id} (${v.title}) has ${bJson.data.length} bids! Sample:`);
        console.log(JSON.stringify(bJson.data.slice(0, 2), null, 2));
        break;
      }
    }
  }
}

main().catch(console.error);
