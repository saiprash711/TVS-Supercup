async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tvscertified.in/apps/static/js/main.d1369698.js');
  const js = await res.text();

  let pos = 0;
  while ((pos = js.indexOf('auctionviewtab', pos)) !== -1) {
    console.log('auctionviewtab at', pos);
    console.log(js.substring(Math.max(0, pos - 100), Math.min(js.length, pos + 500)));
    pos += 14;
  }
}
test().catch(console.error);
