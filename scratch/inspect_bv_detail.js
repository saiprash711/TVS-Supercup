async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tvscertified.in/apps/static/js/main.d1369698.js');
  const js = await res.text();

  const bvIdx = 3237358;
  console.log('bv details:');
  console.log(js.substring(bvIdx, Math.min(js.length, bvIdx + 4000)));
}
test().catch(console.error);
