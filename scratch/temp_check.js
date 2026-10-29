const fs = require('fs');
const content = fs.readFileSync('src/app/api/admin/route.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes("exportType") && (l.includes("dealers") || l.includes("fleet") || l.includes("==="))) {
    console.log((i + 1) + ': ' + l.trim());
  }
});
