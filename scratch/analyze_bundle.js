async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tvscertified.in/apps/static/js/main.d1369698.js');
  const js = await res.text();
  console.log('JS length:', js.length);

  // Look for API endpoints in the bundle
  const endpoints = new Set();
  const regex = /["'](\/[a-zA-Z0-9_\-\/]+)["']/g;
  let m;
  while ((m = regex.exec(js)) !== null) {
    const s = m[1];
    if (s.includes('auction') || s.includes('vehicle') || s.includes('customer') || s.includes('seller') || s.includes('list')) {
      endpoints.add(s);
    }
  }
  console.log('Endpoints found:', Array.from(endpoints));

  // Search for keywords around "auctions" route
  const auctionIdx = js.indexOf('/apps/auctions');
  console.log('/apps/auctions index in bundle:', auctionIdx);
  if (auctionIdx !== -1) {
    console.log('Context around /apps/auctions:', js.substring(Math.max(0, auctionIdx - 200), auctionIdx + 300));
  }
  
  // Search for getAuction or similar API calls
  const matches = js.match(/[a-zA-Z0-9_]+vehicle[a-zA-Z0-9_]*/gi) || [];
  console.log('Sample vehicle matches:', Array.from(new Set(matches)).slice(0, 30));
}
test().catch(console.error);
