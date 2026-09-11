process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const token = 'a72b042f8f3a5dd5ad4e2bfaf1a87603d354392e75c3c31845a6c40beb782fb285a21ce357fc6677293768283f3ea6d9adce154ad6977e7186fab27beb27be3a3f76326d0212571cc72e3c768748eda31b8e7836ce8ab2bbe1509b73846d9a02562ccc58702d7a5a71283bc53a05cc86069ad24d7d5401871151b27bdf65ba1712d4081bd5eff14684101eb7285e2e428fbe6d15a514235f0e2e3d4d9ecc5942c37352119455c97b740142c69990aa47';

async function main() {
  const vehRes = await fetch('https://tvscertified.in:8036/getAuctionVehicles?auction_id=1978', {
    headers: { 'Authorization': token, 'Content-Type': 'application/json' }
  });
  const vehJson = await vehRes.json();
  const vehicles = vehJson?.data || [];
  const v19479 = vehicles.find(v => v.id === 19479 || v.vehicle_id === 19479);
  console.log('Vehicle 19479:');
  console.log('  id:', v19479?.id);
  console.log('  modified:', v19479?.modified, typeof v19479?.modified);
  console.log('  created:', v19479?.created, typeof v19479?.created);

  // Check how parseTVSVehicleTimestamp parses it
  const { parseTVSVehicleTimestamp } = require('./src/lib/services/tvs-integration');
  console.log('  parseTVSVehicleTimestamp(v.modified):', parseTVSVehicleTimestamp(v19479?.modified)?.toISOString());
}

main().catch(console.error);
