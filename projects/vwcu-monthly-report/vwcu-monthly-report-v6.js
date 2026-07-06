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

//const summaryOutputFilePath = path.join(fullPathtoOutput, `MarcomOrders_PortalData_${currentMonth}${currentYear}-Summary.xlsx`);

// This list controls the column order and content of the Stationery output.
// - "header" = the column title you want in the output
// - "source" = which original spreadsheet column that data comes from
// - "transform" (optional) = a rule for cleaning up the value before writing it
const stationeryColumns = [
  { header: 'Order Number',  source: 'A' },
  { header: 'Order Date',    source: 'B', transform: v => {
    if (v instanceof Date) {
      return (v.getMonth() + 1) + '/' + v.getDate() + '/' + v.getFullYear();
    }
    return v ? v.toString() : '';
  }
},
  { header: 'Purchaser',     source: 'C' },
  { header: 'Product Name',  source: 'D' },
  { header: 'West Press SKU',source: 'E' },
  { header: 'Product Code',  source: 'N', transform: v => {
      const parts = v.split(',');
      return parts[1] ? parts[1].trim() : '';
    }
  },
  { header: 'Qty Ordered',   source: 'G' },
  { header: 'Unit Qty',      source: 'N', transform: v => {
      const parts = v.split(',');
      if (!parts[2]) return '';
      return parts[2].split('<')[0].trim();
    }
  },
  { header: 'Branch',        source: 'M' },
  { header: 'Ship Address',  source: 'L' },
];

// Define the conditions for each tab
const conditions = [
  { name: 'Promo', col: 'H', onlyDigits: true },
  { name: 'Stationery', col: 'N', contains: 'Stationery', columns: stationeryColumns }
];

// Turns a spreadsheet cell into a clean piece of text,
// even if it's a formula or special formatted cell.
function getCellText(cell) {
  let v = cell.value;
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && v !== null && 'result' in v) v = v.result;
  if (typeof v === 'object' && v !== null && Array.isArray(v.richText)) {
    v = v.richText.map(r => r.text).join('');
  }
  return v.toString();
}

// Like getCellText, but keeps Date values as real Dates instead of converting to text.
function getCellRaw(cell) {
  let v = cell.value;
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && v !== null && 'result' in v) v = v.result;
  if (typeof v === 'object' && v !== null && Array.isArray(v.richText)) {
    v = v.richText.map(r => r.text).join('');
  }
  return v;
}

// Builds one output row using your column list (order + optional cleanup).
function buildRow(row, columns) {
  return columns.map(colSpec => {
    const raw = getCellRaw(row.getCell(colSpec.source));
    if (colSpec.transform) return colSpec.transform(raw);
    return raw === null || raw === undefined ? '' : raw.toString();
  });
}

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

const matchedRowNumbers = new Set();
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
        } else if (condition.name === 'Stationery') {
  newSheet.addRow(condition.columns.map(c => c.header));
}else {
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
      //console.log(rowNumber, typeof row.getCell('H').value, row.getCell('H').value);
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
        matchedRowNumbers.add(rowNumber); // <-- remember this row was claimed
        // Special handling for Promo - exclude columns F, I, J, K, N, O
        if (condition.name === 'Promo') {
          const filteredValuesPromo = row.values.filter((value, index) => {
            // Column indices: F=6, I=9, J=10, K=11, N=14, O=15
            // (index is 0-based, so subtract 1 from letter position)
            const excludeColumns = [6, 9, 10, 11, 14, 15];
            return !excludeColumns.includes(index);
          });
          newSheet.addRow(filteredValuesPromo);
        } else if (condition.name === 'Stationery') {
  newSheet.addRow(buildRow(row, condition.columns));
}
        else {
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

     if (matchedRowNumbers.has(rowNumber)) return; // already in Promo or Stationery, skip it

  const colA = row.getCell('A').value ? row.getCell('A').value.toString() : '';
  const colC = row.getCell('C').value ? row.getCell('C').value.toString() : '';

  everythingElseSheet.addRow(row.values);
  uniqueValuesA.add(colA);
  uniqueValuesC.add(colC);
  });

  summary.push({
    tab: 'Everything Else',
    uniqueA: uniqueValuesA.size,
    uniqueC: uniqueValuesC.size
  });

  // Write new workbook to file
  await newWorkbook.xlsx.writeFile(outputFile);

  // Write summary to summary file
 // const summaryWorkbook = new ExcelJS.Workbook();
 // const summarySheet = summaryWorkbook.addWorksheet('Summary');
 // summarySheet.addRow(['Tab', 'Number of Orders', 'Number of Customers (Active Users)']);
 // summary.forEach(s => {
 //   summarySheet.addRow([s.tab, s.uniqueA, s.uniqueC]);
 // });
 // await summaryWorkbook.xlsx.writeFile(summaryFile);

  console.log('File created:', outputFile);
  //console.log('Summary created:', summaryFile);
}

// Example usage
//splitAndSummarizeExcel('AllPortalOrdersforKristy_AUG.xlsx', 'MarcomOrders_PortalData_AUG2025.xlsx', 'MarcomOrders_PortalData_AUG2025-Summary.xlsx');
splitAndSummarizeExcel(inputFilePath, outputFilePath);
