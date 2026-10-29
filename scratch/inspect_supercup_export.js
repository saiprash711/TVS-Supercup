const XLSX = require('xlsx');

const file1 = 'C:\\Users\\TC100\\Downloads\\Completed Auctions (1).xlsx';
const file2 = 'C:\\Users\\TC100\\Downloads\\tvs-supercup-auction-2038-leaderboard-points-audit-2026-10-15.xlsx';

console.log('--- Inspecting Supercup Export File ---');
try {
  const wb2 = XLSX.readFile(file2);
  console.log('Sheets in Supercup export:', wb2.SheetNames);
  for (const sName of wb2.SheetNames) {
    const s = wb2.Sheets[sName];
    const data = XLSX.utils.sheet_to_json(s, { header: 1 });
    console.log(`\nSheet [${sName}]: ${data.length} rows`);
    if (data.length > 0) {
      console.log('Headers:', data[0]);
      console.log('Sample row 1:', data[1]);
      if (data.length > 2) console.log('Sample row 2:', data[2]);
    }
  }
} catch (err) {
  console.error('Error reading file2:', err);
}
