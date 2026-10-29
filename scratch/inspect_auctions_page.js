async function test() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const res = await fetch('https://tvscertified.in/apps/auctions');
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Length:', text.length);
  const scripts = text.match(/src="[^"]+"/g);
  console.log('Scripts:', scripts);
}
test().catch(console.error);
