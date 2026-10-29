async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tvscertified.in/apps/static/js/main.d1369698.js');
  const js = await res.text();

  // Find getAuctionallData2 definition
  let pos = 0;
  while ((pos = js.indexOf('getAuctionallData2', pos)) !== -1) {
    console.log('getAuctionallData2 at', pos);
    console.log(js.substring(Math.max(0, pos - 100), Math.min(js.length, pos + 300)));
    pos += 18;
  }
}
test().catch(console.error);
