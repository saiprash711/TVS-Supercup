async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tvscertified.in/apps/static/js/main.d1369698.js');
  const js = await res.text();

  const idx = 185534;
  console.log('ao.A methods:');
  console.log(js.substring(idx - 1000, idx + 1500));
}
test().catch(console.error);
