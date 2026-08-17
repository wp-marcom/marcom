const ExcelJS = require('exceljs');

async function main() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Master');

  // Products: columns N..DA-ish, rows 2/3/4 = box/name/code
  const products = [
    { box: 1, name: 'Widget A', code: 'WA-100' },
    { box: 1, name: 'Widget B', code: 'WB-200' },
    { box: 2, name: 'Gadget C', code: 'GC-300' },
    { box: 2, name: 'Gadget D', code: 'GD-400' },
    { box: 3, name: 'Sprocket E', code: 'SE-500' },
    { box: 3, name: 'Sprocket F', code: 'SF-600' },
    { box: 4, name: 'Doohickey G', code: 'DG-700' },
  ];
  let col = 14; // N
  for (const p of products) {
    ws.getCell(2, col).value = p.box;
    ws.getCell(3, col).value = p.name;
    ws.getCell(4, col).value = p.code;
    col++;
  }

  // Stores: rows 5+
  const stores = [
    { num: '101', name: 'Downtown Tucson', state: 'AZ' },
    { num: '102', name: 'Foothills Mall', state: 'AZ' },
    { num: '201', name: 'Denver Central', state: 'CO' },
    { num: '301', name: 'Austin North', state: 'TX' },
    { num: '302', name: 'San Antonio East', state: 'TX' },
    { num: '9', name: 'Small Numbered Store', state: 'TX' }, // tests numeric sort
  ];
  let row = 5;
  for (const s of stores) {
    ws.getCell(row, 4).value = s.num;  // D
    ws.getCell(row, 5).value = s.name; // E
    ws.getCell(row, 9).value = s.state; // I

    // randomish quantities, leave some blank
    let c = 14;
    for (const p of products) {
      if (Math.random() > 0.4) {
        ws.getCell(row, c).value = Math.ceil(Math.random() * 20);
      }
      c++;
    }
    row++;
  }

  // one store with LOTS of products requested to test font shrink
  ws.getCell(row, 4).value = '999';
  ws.getCell(row, 5).value = 'Mega Requester';
  ws.getCell(row, 9).value = 'AZ';
  let c = 14;
  for (const p of products) {
    ws.getCell(row, c).value = 5;
    c++;
  }

  await wb.xlsx.writeFile('./sample.xlsx');
  console.log('sample.xlsx written');
}

main();
