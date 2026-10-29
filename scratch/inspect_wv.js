async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tvscertified.in/apps/static/js/main.d1369698.js');
  const js = await res.text();

  // Find wv definition: e.g. wv= or const wv= or function wv(
  const matches = [...js.matchAll(/(?:const|var|let)?\s*wv\s*=\s*(?:\([^)]*\)|function|\([^)]*\)\s*=>)/g)];
  console.log('Matches for wv definition:', matches.length);
  for (const m of matches) {
    const idx = m.index;
    console.log('wv definition at', idx);
    console.log(js.substring(idx, Math.min(js.length, idx + 1500)));
  }
}
test().catch(console.error);
