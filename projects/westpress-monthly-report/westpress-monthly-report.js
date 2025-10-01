const primeDirectory = "C:\\projects\\";
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);
const path = require('path');

let fullPathtoRaw = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\westpress-monthly-report\\raw`;
console.log(fullPathtoRaw)
let fullPathtoOutput = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\westpress-monthly-report\\output`;
console.log(fullPathtoOutput)


const currentDate = new Date();
currentDate.setMonth(currentDate.getMonth() - 1); // Go back one month
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const currentMonth = monthNames[currentDate.getMonth()];
const currentYear = currentDate.getFullYear();

// Define the file paths
const inputFilePath = path.join(fullPathtoRaw, `AllPortalOrdersforKristy_${currentMonth}.xlsx`);
//const outputFilePath = path.join(fullPathtoOutput, 'MCW_Monthly_Report_Sept2025.xlsx');
const outputFilePath = path.join(fullPathtoOutput, `MarcomOrders_PortalData_${currentMonth}${currentYear}.xlsx`);

const summaryOutputFilePath = path.join(fullPathtoOutput, `MarcomOrders_PortalData_${currentMonth}${currentYear}-Summary.xlsx`);



// Define the conditions for each tab
const conditions = [
  { name: 'Mister', col: 'A', contains: 'MCW Online' },
  { name: 'YMCA', col: 'A', contains: 'PO-' },
  { name: 'Carondelet', col: 'A', contains: 'CHN Online' },
  { name: 'Tierra Antigua', col: 'A', contains: 'TA Online' },
  { name: 'Marana', col: 'A', contains: 'TOM Online' },
  { name: 'TMC', col: 'A', contains: 'TMC Online' },
  { name: 'Intermountain', col: 'A', contains: 'ICHD Online' },
  { name: 'City of Sierra Vista', col: 'A', contains: 'COSV Online' },
  { name: 'Safari Club', col: 'A', contains: 'SCI Online' },
  { name: 'Therapy Partners', col: 'A', contains: 'TP Online' },
  { name: 'Northwest Healthcare', col: 'A', contains: 'NWH Online' },
  { name: 'UofA', col: 'A', onlyDigits: true },
  { name: 'Vantage West', col: 'C', contains: 'Vantage West' },
  { name: 'Pima Federal', col: 'C', contains: 'Pima Federal' },
  { name: 'Sierra Tucson', col: 'C', contains: 'Sierra Tucson' },
  { name: 'Cochise College', col: 'C', contains: 'Cochise College' },
  { name: 'Cochise County', col: 'C', contains: 'Cochise County' },
  { name: 'Desert Toyota', col: 'C', contains: 'Desert Toyota' },
  { name: 'Intentional Life Media', col: 'C', contains: 'Intentional Life Media' },
  { name: 'OPPM', col: 'C', contains: 'OPPM' },
  { name: 'MCHC', col: 'C', contains: 'MCHC' },
  { name: 'United Way', col: 'C', contains: 'United Way' },
  { name: 'FWUSD', col: 'C', contains: 'FWUSD' },
  { name: 'Dependable Health', col: 'C', contains: 'Dependable Health Services' }
];

async function splitAndSummarizeExcel(inputFile, outputFile, summaryFile) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(inputFile);
  const worksheet = workbook.getWorksheet(1); // assuming data is in the first sheet
  
  const newWorkbook = new ExcelJS.Workbook();
  const summary = [];

  // Create a tab for each condition
  for (const condition of conditions) {
    const newSheet = newWorkbook.addWorksheet(condition.name);
    newSheet.addRow(worksheet.getRow(1).values); // Add header row

    const uniqueValuesA = new Set();
    const uniqueValuesC = new Set();
    const uniqueValuesK = new Set(); // For the 'OnlyDigits' condition

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const colA = row.getCell('A').value ? row.getCell('A').value.toString() : '';
      const colC = row.getCell('C').value ? row.getCell('C').value.toString() : '';
      const colK = row.getCell('K').value ? row.getCell('K').value.toString() : '';

      let match = false;
      if (condition.onlyDigits) {
        match = /^\d+$/.test(colA); // Check if only digits
      } else if (condition.contains) {
        match = row.getCell(condition.col).value && row.getCell(condition.col).value.includes(condition.contains);
      }

      if (match) {
        newSheet.addRow(row.values);

        // Collect unique values for summary
        uniqueValuesA.add(colA);
        if (condition.onlyDigits) {
          uniqueValuesK.add(colK);
        } else {
          uniqueValuesC.add(colC);
        }
      }
    });

    // Summary
    summary.push({
      tab: condition.name,
      uniqueA: uniqueValuesA.size,
      uniqueC: condition.onlyDigits ? uniqueValuesK.size : uniqueValuesC.size
    });
  }

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
