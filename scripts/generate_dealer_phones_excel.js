const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateExcel() {
  console.log('Fetching dealers from database...');
  const dbDealers = await prisma.dealer.findMany({
    where: { externalDealerId: { not: 'SELLER-null' } },
    orderBy: { displayName: 'asc' }
  });

  const custMapping = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../src/lib/data/tvs-customer-mapping.json'), 'utf8')
  );

  console.log(`Loaded ${dbDealers.length} database dealers.`);
  console.log(`Loaded ${Object.keys(custMapping).length} TVS customer directory entries.`);

  // 1. Build Deduplicated Sheet (1517 unique Name + Phone pairs)
  const uniqueSeen = new Set();
  const sheetDeduplicated = [
    ['Dealer Name', 'Phone Number']
  ];
  for (const d of dbDealers) {
    const name = (d.displayName || `Dealer ${d.externalDealerId}`).trim();
    const phone = d.phone ? String(d.phone).trim() : '';
    const key = `${name.toLowerCase()}||${phone}`;
    if (!uniqueSeen.has(key)) {
      uniqueSeen.add(key);
      sheetDeduplicated.push([name, phone]);
    }
  }

  // 2. Build All Accounts Sheet (All 1546 registered accounts)
  const sheetAllAccounts = [
    ['Dealer Name', 'Phone Number']
  ];
  for (const d of dbDealers) {
    sheetAllAccounts.push([
      (d.displayName || `Dealer ${d.externalDealerId}`).trim(),
      d.phone ? String(d.phone).trim() : ''
    ]);
  }

  // 3. Build Detailed SuperCup Dealers with City, ID, Category
  const sheetDetails = [
    ['Dealer Name', 'Phone Number', 'City', 'Dealer ID', 'Category', 'Status']
  ];
  for (const d of dbDealers) {
    sheetDetails.push([
      (d.displayName || `Dealer ${d.externalDealerId}`).trim(),
      d.phone ? String(d.phone).trim() : '',
      d.city || '',
      d.externalDealerId || '',
      d.category || '',
      d.status || 'ACTIVE'
    ]);
  }

  // 4. Build TVS Certified Directory (All 1598 Accounts)
  const sheetTVS = [
    ['Dealer Name', 'Phone Number', 'City', 'Customer Code', 'Role / Category', 'Email']
  ];
  const sortedCusts = Object.values(custMapping).sort((a, b) => {
    const nameA = (a.companyName || `${a.firstName || ''} ${a.lastName || ''}`).trim().toLowerCase();
    const nameB = (b.companyName || `${b.firstName || ''} ${b.lastName || ''}`).trim().toLowerCase();
    return nameA.localeCompare(nameB);
  });
  for (const c of sortedCusts) {
    const name = (c.companyName || `${c.firstName || ''} ${c.lastName || ''}`).trim();
    sheetTVS.push([
      name || `Dealer ${c.id}`,
      c.phone ? String(c.phone).trim() : '',
      c.city || '',
      c.code || String(c.id),
      c.category || c.role || 'Used Car Dealer',
      c.email || ''
    ]);
  }

  // Helper function to build formatted worksheet
  function createFormattedSheet(data, phoneColIndices = [1]) {
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Explicitly set text format (@) on phone columns so leading zeros & large integers stay intact
    for (let r = 1; r < data.length; r++) {
      for (const colIdx of phoneColIndices) {
        const cellRef = XLSX.utils.encode_cell({ r, c: colIdx });
        if (ws[cellRef]) {
          ws[cellRef].t = 's';
          ws[cellRef].z = '@';
        }
      }
    }

    // Auto-calculate column widths
    const colWidths = data[0].map((header, colIdx) => {
      let maxLen = header.length;
      for (let r = 1; r < Math.min(data.length, 300); r++) {
        const val = String(data[r][colIdx] || '');
        if (val.length > maxLen) maxLen = val.length;
      }
      return { wch: Math.min(Math.max(maxLen + 4, 16), 55) };
    });
    ws['!cols'] = colWidths;

    return ws;
  }

  // === PRIMARY WORKBOOK: Dealers_Phone_Numbers.xlsx ===
  const wbMain = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbMain, createFormattedSheet(sheetDeduplicated, [1]), 'Dealers Phone List');
  XLSX.utils.book_append_sheet(wbMain, createFormattedSheet(sheetAllAccounts, [1]), 'All Accounts (1546)');
  XLSX.utils.book_append_sheet(wbMain, createFormattedSheet(sheetDetails, [1]), 'SuperCup Dealers Details');
  XLSX.utils.book_append_sheet(wbMain, createFormattedSheet(sheetTVS, [1]), 'TVS Certified All Accounts');

  // Paths to save
  const targetPaths = [
    path.join(__dirname, '../Dealers_Phone_Numbers.xlsx'),
    path.join(__dirname, '../dealers.xlsx'),
    path.join(__dirname, '../Dealers.xlsx'),
    path.join(__dirname, '../TVS_Dealers_Phone_List.xlsx'),
    path.join(__dirname, '../SuperCup Results/Dealers_Phone_Numbers.xlsx'),
    path.join(__dirname, '../SuperCup Results/TVS_Dealers_Phone_List.xlsx'),
  ];

  for (const p of targetPaths) {
    XLSX.writeFile(wbMain, p);
    console.log(`✅ Saved Excel file to: ${p}`);
  }

  // === ALSO CREATE UTF-8 CSV: Dealers_Phone_Numbers.csv ===
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };
  const csvContent = '\uFEFF' + sheetDeduplicated.map(row => row.map(escapeCsv).join(',')).join('\r\n');
  const csvPath = path.join(__dirname, '../Dealers_Phone_Numbers.csv');
  const csvPathResults = path.join(__dirname, '../SuperCup Results/Dealers_Phone_Numbers.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf-8');
  fs.writeFileSync(csvPathResults, csvContent, 'utf-8');
  console.log(`✅ Saved CSV file to: ${csvPath}`);
}

generateExcel()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
