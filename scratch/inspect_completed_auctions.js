const XLSX = require('xlsx');
const file = 'C:\\Users\\TC100\\Downloads\\Completed Auctions (1).xlsx';
const wb = XLSX.readFile(file);
console.log('Sheet names:', wb.SheetNames);
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);
console.log(`Total rows: ${data.length}`);
console.log('Sample row:', data[0]);

// Count vehicles with Winner Name or Winner Bid Value
const withWinner = data.filter(r => r['Winner Name'] && r['Winner Name'] !== 'null');
console.log(`Rows with Winner Name: ${withWinner.length}`);
