const primeDirectory = "C:\\projects\\";
const fs = require('fs');
const path = require('path');
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);

const directory = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\printsmith-quote-scraper\\quotes`; // <-- change this

async function checkDuplicateQtys() {
  const files = fs.readdirSync(directory).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'));

  for (const file of files) {
    const filePath = path.join(directory, file);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    workbook.eachSheet((sheet, sheetId) => {
      const counts = {};

      sheet.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return; // skip header

        const qty = row.getCell(3).value; // column C
        if (qty === null || qty === undefined || qty === '') return;

        counts[qty] = (counts[qty] || 0) + 1;
      });

      const duplicates = Object.entries(counts).filter(([qty, count]) => count > 1);

      if (duplicates.length > 0) {
        console.log(`\nFile: ${file} | Sheet: ${sheet.name}`);
        duplicates.forEach(([qty, count]) => {
          console.log(`  Qty "${qty}" appears ${count} times`);
        });
      }
    });
  }

  console.log('\nDone.');
}

checkDuplicateQtys().catch(console.error);