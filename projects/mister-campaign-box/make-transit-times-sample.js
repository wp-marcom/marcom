// Reference/example only — shows the expected layout for TransitTimes.xlsx.
// Row 1 = header (skipped — dataStartRow is 2 in config.js).
// Column A = store number (must match the master sheet's store number column exactly)
// Column B = transit days
// Column C = "Yes"/"No" — whether that store needs a LocalDeliveryTickets.pdf page

const primeDirectory = "C:\\projects\\";
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);

async function main() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Transit');

  ws.getCell(1, 1).value = 'Store Number';
  ws.getCell(1, 2).value = 'Transit Days';
  ws.getCell(1, 3).value = 'DeliveryTicketNeeded';

  const rows = [
    { num: '101', days: 1, ticket: 'Yes' },
    { num: '102', days: 1, ticket: 'No' },
    { num: '201', days: 3, ticket: 'No' },
    { num: '301', days: 1, ticket: 'Yes' },
  ];

  let row = 2;
  for (const r of rows) {
    ws.getCell(row, 1).value = r.num;
    ws.getCell(row, 2).value = r.days;
    ws.getCell(row, 3).value = r.ticket;
    row++;
  }

  await wb.xlsx.writeFile('./TransitTimes.xlsx');
  console.log('TransitTimes.xlsx written');
}

main();
