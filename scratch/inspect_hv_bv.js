async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tvscertified.in/apps/static/js/main.d1369698.js');
  const js = await res.text();

  // Find definitions of hv and bv
  const hvIdx = js.lastIndexOf('hv=', 3246653);
  console.log('hv= at', hvIdx);
  if (hvIdx !== -1) {
    console.log(js.substring(hvIdx, Math.min(js.length, hvIdx + 1200)));
  }

  const bvIdx = js.lastIndexOf('bv=', 3246653);
  console.log('bv= at', bvIdx);
  if (bvIdx !== -1) {
    console.log(js.substring(bvIdx, Math.min(js.length, bvIdx + 1200)));
  }
}
test().catch(console.error);
