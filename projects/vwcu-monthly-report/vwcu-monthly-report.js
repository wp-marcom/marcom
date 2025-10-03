const primeDirectory = "C:\\projects\\";
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);
const path = require('path');

let fullPathtoRaw = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\vwcu-monthly-report\\raw`;
console.log(fullPathtoRaw)
let fullPathtoOutput = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\vwcu-monthly-report\\output`;
console.log(fullPathtoOutput)


const currentDate = new Date();
currentDate.setMonth(currentDate.getMonth() - 1); // Go back one month
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const currentMonth = monthNames[currentDate.getMonth()];
const currentYear = currentDate.getFullYear();

// Define the file paths
const inputFilePath = path.join(fullPathtoRaw, `VantageWestMonthly_Data_${currentMonth}RAW.xlsx`);
//const outputFilePath = path.join(fullPathtoOutput, 'MCW_Monthly_Report_Sept2025.xlsx');
const outputFilePath = path.join(fullPathtoOutput, `VantageWestMonthly_Data_${currentMonth}${currentYear}-Filtered.xlsx`);

const summaryOutputFilePath = path.join(fullPathtoOutput, `MarcomOrders_PortalData_${currentMonth}${currentYear}-Summary.xlsx`);



// Define the conditions for each tab
const conditions = [
  { name: 'Promo', col: 'H', onlyDigits: true },
  { name: 'Stationery', col: 'N', contains: 'Stationery' }
];

async function splitAndSummarizeExcel(inputFile, outputFile, summaryFile) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(inputFile);
  let worksheet = workbook.getWorksheet(1); // assuming data is in the first sheet
  
  const newWorkbook = new ExcelJS.Workbook();
  const summary = [];

  // PRE-FILTER: Only keep rows with "Vantage West Credit Union" in column C
const filteredRows = [];
worksheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) {
    filteredRows.push(row.values); // Keep header
    return;
  }
  
  const colC = row.getCell('C').value ? row.getCell('C').value.toString() : '';
  if (colC.includes('Vantage West Credit Union')) {
    filteredRows.push(row.values);
  }
});

// Create a temporary worksheet with only filtered rows
const tempWorkbook = new ExcelJS.Workbook();
const tempWorksheet = tempWorkbook.addWorksheet('Filtered');
filteredRows.forEach(rowValues => {
  tempWorksheet.addRow(rowValues);
});

// Now use tempWorksheet instead of worksheet for the rest of the processing
worksheet = tempWorksheet; // Override the original worksheet variable

  // Create a tab for each condition
const createdSheets = new Set();
const sheetSummaries = {}; // Track summaries by sheet name

  // Create a tab for each condition
  for (const condition of conditions) {
    let newSheet;
    if (!createdSheets.has(condition.name)) {
        newSheet = newWorkbook.addWorksheet(condition.name);
        
        // Special handling for Promo - exclude header columns F, I, J, K, N, O
        if (condition.name === 'Promo') {
          const headerValues = worksheet.getRow(1).values.filter((value, index) => {
            const excludeColumns = [6, 9, 10, 11, 14, 15];
            return !excludeColumns.includes(index);
          });
          newSheet.addRow(headerValues);
        } else {
          newSheet.addRow(worksheet.getRow(1).values);
        }
      createdSheets.add(condition.name);
    // Initialize tracking for this sheet
    sheetSummaries[condition.name] = {
      uniqueValuesA: new Set(),
      uniqueValuesC: new Set(),
      uniqueValuesK: new Set(),
      isOnlyDigits: condition.onlyDigits || false
    };
  } else {
    newSheet = newWorkbook.getWorksheet(condition.name);
  }


  worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const colA = row.getCell('A').value ? row.getCell('A').value.toString() : '';
      const colC = row.getCell('C').value ? row.getCell('C').value.toString() : '';
      const colH = row.getCell('H').value ? row.getCell('H').value.toString() : '';
      const colK = row.getCell('K').value ? row.getCell('K').value.toString() : '';

      let match = false;
      if (condition.onlyDigits) {
        const numValue = parseFloat(colH); // Check column H instead
        match = colH && !isNaN(numValue) && numValue !== 0; // Not zero check
      } else if (condition.contains) {
        match = row.getCell(condition.col).value && row.getCell(condition.col).value.includes(condition.contains);
      }

      if (match) {
        // Special handling for Promo - exclude columns F, I, J, K, N, O
        if (condition.name === 'Promo') {
          const filteredValues = row.values.filter((value, index) => {
            // Column indices: F=6, I=9, J=10, K=11, N=14, O=15
            // (index is 0-based, so subtract 1 from letter position)
            const excludeColumns = [6, 9, 10, 11, 14, 15];
            return !excludeColumns.includes(index);
          });
          newSheet.addRow(filteredValues);
        } else {
          newSheet.addRow(row.values);
        }
// Collect unique values for summary at sheet level
sheetSummaries[condition.name].uniqueValuesA.add(colA);
if (condition.onlyDigits) {
  sheetSummaries[condition.name].uniqueValuesK.add(colK);
} else {
  sheetSummaries[condition.name].uniqueValuesC.add(colC);
}
      }
    });

    // Summary
// This section is now OUTSIDE the for loop, so delete the above and add this AFTER the for loop closes:
  }

  // Build summary from sheet-level data
Object.keys(sheetSummaries).forEach(sheetName => {
  const data = sheetSummaries[sheetName];
  summary.push({
    tab: sheetName,
    uniqueA: data.uniqueValuesA.size,
    uniqueC: data.isOnlyDigits ? data.uniqueValuesK.size : data.uniqueValuesC.size
  });
});

  // "Everything Else" tab
  const everythingElseSheet = newWorkbook.addWorksheet('Everything Else');
  everythingElseSheet.addRow(worksheet.getRow(1).values); // Add header row

  const uniqueValuesA = new Set();
  const uniqueValuesC = new Set();

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row

    const colA = row.getCell('A').value ? row.getCell('A').value.toString() : '';
    const colC = row.getCell('C').value ? row.getCell('C').value.toString() : '';

    let matched = false;
    for (const condition of conditions) {
      let match = false;
      if (condition.onlyDigits) {
        match = /^\d+$/.test(colA);
      } else if (condition.contains) {
        match = row.getCell(condition.col).value && row.getCell(condition.col).value.includes(condition.contains);
      }

      if (match) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      everythingElseSheet.addRow(row.values);
      uniqueValuesA.add(colA);
      uniqueValuesC.add(colC);
    }
  });

  summary.push({
    tab: 'Everything Else',
    uniqueA: uniqueValuesA.size,
    uniqueC: uniqueValuesC.size
  });

  // Write new workbook to file
  await newWorkbook.xlsx.writeFile(outputFile);

  // Write summary to summary file
  const summaryWorkbook = new ExcelJS.Workbook();
  const summarySheet = summaryWorkbook.addWorksheet('Summary');
  summarySheet.addRow(['Tab', 'Number of Orders', 'Number of Customers (Active Users)']);
  summary.forEach(s => {
    summarySheet.addRow([s.tab, s.uniqueA, s.uniqueC]);
  });
  await summaryWorkbook.xlsx.writeFile(summaryFile);

  console.log('File created:', outputFile);
  console.log('Summary created:', summaryFile);
}

// Example usage
//splitAndSummarizeExcel('AllPortalOrdersforKristy_AUG.xlsx', 'MarcomOrders_PortalData_AUG2025.xlsx', 'MarcomOrders_PortalData_AUG2025-Summary.xlsx');
splitAndSummarizeExcel(inputFilePath, outputFilePath, summaryOutputFilePath);
