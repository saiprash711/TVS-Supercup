async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tvscertified.in/apps/static/js/main.d1369698.js');
  const js = await res.text();

  // Search for routes matching auctions
  const regex = /path:\s*["']([^"']+)["']/g;
  let m;
  const routes = [];
  while ((m = regex.exec(js)) !== null) {
    if (m[1].toLowerCase().includes('auction') || m[1].toLowerCase().includes('list') || m[1].toLowerCase().includes('vehic')) {
      routes.push(m[1]);
    }
  }
  console.log('Routes with auction/list/vehic:', routes);

  // Search for "getListedVehicleAucData" or "vehiclelisting" or "selflisting"
  for (const term of ['getListedVehicleAucData', 'selflisting', 'vehiclelisting', 'alllisting', 'getAuctionvehicleList', 'getAuctionvehicles']) {
    let pos = 0;
    console.log(`\n--- Occurrences of ${term} ---`);
    let count = 0;
    while ((pos = js.indexOf(term, pos)) !== -1 && count < 3) {
      console.log(js.substring(Math.max(0, pos - 150), Math.min(js.length, pos + 200)));
      console.log('---------------------------------');
      pos += term.length;
      count++;
    }
  }
}
test().catch(console.error);
