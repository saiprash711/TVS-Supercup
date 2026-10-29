async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tvscertified.in/apps/static/js/main.d1369698.js');
  const js = await res.text();

  const pos = 3190508;
  console.log('Cg full columns and actions:');
  console.log(js.substring(pos, pos + 3000));
}
test().catch(console.error);
