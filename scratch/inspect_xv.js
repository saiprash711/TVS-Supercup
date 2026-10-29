async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tvscertified.in/apps/static/js/main.d1369698.js');
  const js = await res.text();

  const idx = js.indexOf('xv=');
  console.log('xv= at', idx);
  if (idx !== -1) {
    console.log(js.substring(Math.max(0, idx - 500), idx + 2000));
  }
}
test().catch(console.error);
