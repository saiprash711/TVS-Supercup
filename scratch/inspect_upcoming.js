async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tvscertified.in/apps/static/js/main.d1369698.js');
  const js = await res.text();

  // Find Upcoming Auctions component in xv:
  const idx = js.indexOf('{auction_type:"upcomming"}');
  console.log('Upcoming auctions at', idx);
  if (idx !== -1) {
    console.log(js.substring(Math.max(0, idx - 100), Math.min(js.length, idx + 100)));
  }
}
test().catch(console.error);
