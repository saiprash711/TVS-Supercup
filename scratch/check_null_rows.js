const XLSX = require('xlsx');

const completedFile = 'C:\\Users\\TC100\\Downloads\\Completed Auctions (1).xlsx';
const wb = XLSX.readFile(completedFile);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

const nullRows = rows.filter(r => !r['Listed By'] || r['Listed By'] === 'null');
console.log('Null/empty Listed By rows:', nullRows.map(r => ({
  reg: r['Registration Number'],
  code: r['Auction Code'],
  name: r['Auction Name'],
  winner: r['Winner Name'],
  price: r['Winner Bid Value']
})));
