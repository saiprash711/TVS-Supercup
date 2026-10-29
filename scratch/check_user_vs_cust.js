async function check() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const authRes = await fetch('https://tvscertified.in:8036/authenticate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bhavaniprasad999@gmail.com', password: 'KU9JhpWDCz' }),
  });
  const token = (await authRes.json())?.data?.data?.[0]?.token;
  const headers = { 'Authorization': token, 'Content-Type': 'application/json' };

  // Fetch customer 1159
  const cRes = await fetch('https://tvscertified.in:8036/customers?id=1159', { headers });
  const cJson = await cRes.json();
  console.log('Customer with id=1159:', cJson?.data?.find?.(x => x.id === 1159) || cJson?.data?.[0]);

  // Fetch user 1159
  const uRes = await fetch('https://tvscertified.in:8036/users?id=1159', { headers });
  const uJson = await uRes.json();
  console.log('User with id=1159:', uJson?.data?.find?.(x => x.id === 1159) || uJson?.data?.[0]);

  // Fetch customer 1435
  const c1435Res = await fetch('https://tvscertified.in:8036/customers?id=1435', { headers });
  const c1435Json = await c1435Res.json();
  console.log('Customer with id=1435:', c1435Json?.data?.find?.(x => x.id === 1435) || c1435Json?.data?.[0]);

  // Fetch user 1435
  const u1435Res = await fetch('https://tvscertified.in:8036/users?id=1435', { headers });
  const u1435Json = await u1435Res.json();
  console.log('User with id=1435:', u1435Json?.data?.find?.(x => x.id === 1435) || u1435Json?.data?.[0]);
}

check().catch(console.error);
