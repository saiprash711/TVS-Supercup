const staticUserMapping = require('../src/lib/data/tvs-user-mapping.json');
const staticCustomerMapping = require('../src/lib/data/tvs-customer-mapping.json');

const testCodes = [
  'CUST10001781', // THANGAPANDIAN CARS
  'CUST10001269', // ESHWARI CAARS
  'CUST10002440', // Sri sai cars
  'CUST10001386', // SBK CARS
  'CUST10001488', // SIVA SAKTHI CARS
  'CUST10001251', // CAR HUB
  'CUST10001886', // ELITE CARS
  'CUST10001831', // Supreme cars
];

for (const code of testCodes) {
  // Find customer ID
  let custId = null;
  let cust = null;
  for (const [id, c] of Object.entries(staticCustomerMapping)) {
    if (c.code === code) {
      custId = id;
      cust = c;
      break;
    }
  }

  const mapped = staticUserMapping[custId];
  console.log(`Dealer: ${cust?.companyName} | Customer ID: ${custId} | UserMapping of custId: ${mapped ? mapped : 'NO COLLISION'}`);
}
