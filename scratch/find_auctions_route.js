async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tvscertified.in/apps/static/js/main.d1369698.js');
  const js = await res.text();

  // Find path: "/auctions"
  let pos = 0;
  while ((pos = js.indexOf('path:"/auctions"', pos)) !== -1) {
    console.log('Found path:"/auctions" at', pos);
    console.log(js.substring(Math.max(0, pos - 100), Math.min(js.length, pos + 250)));
    pos += 15;
  }
}
test().catch(console.error);
