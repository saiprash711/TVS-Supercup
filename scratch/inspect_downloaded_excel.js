const XLSX = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\TC100\\Downloads\\Completed Auctions (1).xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  console.log('Sheet names:', workbook.SheetNames);

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n--- Sheet: ${sheetName} ---`);
    console.log(`Total rows: ${data.length}`);
    if (data.length > 0) {
      console.log('Header row:', data[0]);
      console.log('Sample row 1:', data[1]);
      if (data.length > 2) console.log('Sample row 2:', data[2]);
    }
  }
} catch (err) {
  console.error('Error reading excel file:', err);
}
