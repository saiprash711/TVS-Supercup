async function check() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const authRes = await fetch('https://tvscertified.in:8036/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
  });
  const token = (await authRes.json())?.data?.data?.[0]?.token;
  const headers = { 'Authorization': token, 'Content-Type': 'application/json' };

  const ids = [448, 459, 458, 451];
  for (const id of ids) {
    const res = await fetch(`https://tvscertified.in:8036/customers?id=${id}`, { headers });
    const json = await res.json();
    const c = json?.data?.find(x => x.id === id) || json?.data?.[0];
    console.log(`Customer id ${id}:`, {
      id: c?.id,
      code: c?.code,
      name: c?.name,
      legal_name: c?.legal_name,
      trade_name: c?.trade_name,
      first_name: c?.first_name,
      city: c?.city,
      mobile_no: c?.mobile_no
    });
  }
}
check().catch(console.error);
