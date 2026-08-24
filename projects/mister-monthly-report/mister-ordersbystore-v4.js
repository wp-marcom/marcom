// build_report.js
//
// Reads a flat order/line-item export and produces a grouped report:
//   Purchaser   (N orders)
//     Order <Order Number> - <Order Date>
//       <line items for that order>
//     Order <next order>
//       ...
//   <next purchaser>
//
// Expected input headers (case-insensitive, order doesn't matter):
// Order Number, Order Date, Purchaser, Product Name, SKU, Cost Center,
// Qty Ordered, Status, Product Description, Ship Date, Qty Shipped

const primeDirectory = "C:\\projects\\";
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);
const path = require('path');

// ─── EDIT THESE ──────────────────────────────────────────────────────────
// Folder where the source export lives, and where the grouped report should be saved.
// Point both at the same folder, or split them out — whatever matches your setup.
const fullPathToInput = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\mister-monthly-report\\raw`;
const fullPathToOutput = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\mister-monthly-report\\output`;

// Report covers last month by default (matches the monthly export naming convention)
const currentDate = new Date();
currentDate.setMonth(currentDate.getMonth() - 1);
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentMonth = monthNames[currentDate.getMonth()];
const currentYear = currentDate.getFullYear();

// Adjust these filename patterns to match your actual export/report naming
const inputPath = path.join(fullPathToInput, `MCW_Monthly_Report_${currentMonth}_RAW.xlsx`);
const outputPath = path.join(fullPathToOutput, `MCW_Monthly_Report_${currentMonth}${currentYear}_grouped.xlsx`);
// ─────────────────────────────────────────────────────────────────────────

console.log(`Input:  ${inputPath}`);
console.log(`Output: ${outputPath}`);

const HEADER_MAP = {
  'order number': 'orderNumber',
  'order date': 'orderDate',
  'purchaser': 'purchaser',
  'product name': 'productName',
  'sku': 'sku',
  'ship date': 'shipDate',
  'qty ordered': 'qty',
};

function excelDateToString(val) {
  if (val instanceof Date) {
    const mm = val.getMonth() + 1;
    const dd = val.getDate();
    const yyyy = val.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }
  return val == null ? '' : String(val);
}

async function main() {
  const inWb = new ExcelJS.Workbook();
  await inWb.xlsx.readFile(inputPath);
  const inSheet = inWb.worksheets[0];

  // Map headers -> column index
  const headerRow = inSheet.getRow(1);
  const colMap = {};
  headerRow.eachCell((cell, colNumber) => {
    const key = String(cell.value || '').trim().toLowerCase();
    if (HEADER_MAP[key]) colMap[HEADER_MAP[key]] = colNumber;
  });

  const required = ['orderNumber', 'orderDate', 'purchaser', 'productName', 'sku', 'shipDate', 'qty'];
  const missing = required.filter((k) => !colMap[k]);
  if (missing.length) {
    console.error('Missing expected column(s):', missing.join(', '));
    process.exit(1);
  }

  // Read rows into plain objects
  const rows = [];
  inSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const get = (key) => row.getCell(colMap[key]).value;
    rows.push({
      orderNumber: get('orderNumber'),
      orderDate: get('orderDate'),
      purchaser: get('purchaser'),
      productName: get('productName'),
      sku: get('sku'),
      shipDate: get('shipDate'),
      qty: get('qty'),
    });
  });

  // Group: purchaser -> { purchaser, orders: Map(orderNumber -> {orderDate, items:[]}) }
  const purchasers = new Map();
  for (const r of rows) {
    const key = r.purchaser;
    if (!purchasers.has(key)) {
      purchasers.set(key, { purchaser: r.purchaser, orders: new Map() });
    }
    const p = purchasers.get(key);
    if (!p.orders.has(r.orderNumber)) {
      p.orders.set(r.orderNumber, { orderDate: r.orderDate, items: [] });
    }
    p.orders.get(r.orderNumber).items.push(r);
  }

  // Sort purchasers alphabetically, then orders by order date
  const sortedPurchasers = [...purchasers.values()].sort((a, b) =>
    String(a.purchaser).localeCompare(String(b.purchaser), undefined, { numeric: true })
  );

  // Build output workbook
  const outWb = new ExcelJS.Workbook();

  // ─── Summary tab ─────────────────────────────────────────────────────
  const summarySheet = outWb.addWorksheet('Summary');
  summarySheet.columns = [
    { key: 'purchaser', width: 30 },
    { key: 'orderCount', width: 14 },
  ];
  const summaryHeaderRow = summarySheet.addRow({
    purchaser: 'Purchaser',
    orderCount: 'Total Orders',
  });
  summaryHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  });

  const byOrderCountDesc = [...sortedPurchasers].sort((a, b) => b.orders.size - a.orders.size);
  for (const p of byOrderCountDesc) {
    const row = summarySheet.addRow({
      purchaser: p.purchaser,
      orderCount: p.orders.size,
    });
    row.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10 };
    });
  }
  summarySheet.getColumn('orderCount').alignment = { horizontal: 'center' };

  const sheet = outWb.addWorksheet('Orders by Purchaser', {
    views: [{ state: 'frozen', ySplit: 0 }],
  });

  sheet.columns = [
    { key: 'label', width: 55 },
    { key: 'sku', width: 12 },
    { key: 'shipDate', width: 12 },
    { key: 'qty', width: 8 },
  ];

  // Show the outline collapse/expand [+]/[-] buttons above each group (Excel default is below)
  sheet.properties.outlineProperties = { summaryBelow: false };

  const FONT = { name: 'Arial', size: 10 };
  const PURCHASER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  const ORDER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
  const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };

  for (const p of sortedPurchasers) {
    const orderCount = p.orders.size;

    // Purchaser header row (outline level 0 — always visible)
    const purchaserRow = sheet.addRow({
      label: `${p.purchaser}   (${orderCount} order${orderCount === 1 ? '' : 's'})`,
    });
    sheet.mergeCells(purchaserRow.number, 1, purchaserRow.number, 4);
    purchaserRow.height = 20;
    purchaserRow.getCell(1).font = { ...FONT, bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    purchaserRow.getCell(1).fill = PURCHASER_FILL;
    purchaserRow.getCell(1).alignment = { vertical: 'middle', indent: 0 };

    // Sort orders by date
    const sortedOrders = [...p.orders.entries()].sort((a, b) => {
      const da = a[1].orderDate instanceof Date ? a[1].orderDate : new Date(a[1].orderDate);
      const db = b[1].orderDate instanceof Date ? b[1].orderDate : new Date(b[1].orderDate);
      return da - db;
    });

    for (const [orderNumber, order] of sortedOrders) {
      // Order header row — collapses/expands the line items below it (outline level 1)
      const orderRow = sheet.addRow({
        label: `Order: ${orderNumber}   —   ${excelDateToString(order.orderDate)}`,
      });
      sheet.mergeCells(orderRow.number, 1, orderRow.number, 4);
      orderRow.getCell(1).font = { ...FONT, bold: true, italic: true };
      orderRow.getCell(1).fill = ORDER_FILL;
      orderRow.getCell(1).alignment = { indent: 1 };
      orderRow.outlineLevel = 1;

      // Column header row for line items under this order
      const colHeaderRow = sheet.addRow({
        label: 'Product',
        sku: 'SKU',
        shipDate: 'Ship Date',
        qty: 'Qty',
      });
      colHeaderRow.eachCell((cell) => {
        cell.font = { ...FONT, bold: true, size: 9, color: { argb: 'FF666666' } };
        cell.fill = HEADER_FILL;
      });
      colHeaderRow.getCell(1).alignment = { indent: 2 };
      colHeaderRow.outlineLevel = 2;

      for (const item of order.items) {
        const itemRow = sheet.addRow({
          label: item.productName,
          sku: item.sku,
          shipDate: excelDateToString(item.shipDate),
          qty: item.qty,
        });
        itemRow.getCell(1).font = FONT;
        itemRow.getCell(1).alignment = { indent: 3 };
        itemRow.getCell(2).font = FONT;
        itemRow.getCell(3).font = FONT;
        itemRow.getCell(4).font = FONT;
        itemRow.outlineLevel = 2;
      }
    }

    // Blank spacer row between purchasers
    sheet.addRow({});
  }

  // Collapse everything down to level 1 by default (purchasers expanded, orders collapsed to their header)
  sheet.eachRow((row) => {
    if (row.outlineLevel >= 2) row.hidden = true;
  });

  await outWb.xlsx.writeFile(outputPath);
  console.log(`Wrote ${outputPath}`);
  console.log(`Purchasers: ${sortedPurchasers.length}, Total rows read: ${rows.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
