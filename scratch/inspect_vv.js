async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tvscertified.in/apps/static/js/main.d1369698.js');
  const js = await res.text();

  const pos = js.indexOf('Vv=');
  console.log('Vv= at', pos);
  if (pos !== -1) {
    console.log(js.substring(pos, Math.min(js.length, pos + 2500)));
  }
}
test().catch(console.error);
