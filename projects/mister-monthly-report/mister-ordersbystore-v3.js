// build_report.js
// Usage: node build_report.js <input.xlsx> [output.xlsx]
//
// Reads a flat order/line-item export and produces a grouped report:
//   Store #/User - Store Name   (N orders)
//     Order <Order Number> - <Order Date>
//       <line items for that order>
//     Order <next order>
//       ...
//   <next store>
//
// Expected input headers (case-insensitive, order doesn't matter):
// Order Number, Order Date, CC#, Store #/User, Store Name, Product Name,
// SKU, Ship Date, Qty, Price, Tax, Total

const primeDirectory = "C:\\projects\\";
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);
const path = require('path');

// ─── EDIT THESE ──────────────────────────────────────────────────────────
// Folder where the source export lives, and where the grouped report should be saved.
// Point both at the same folder, or split them out — whatever matches your setup.
const fullPathToInput = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\mister-monthly-report\\output`;
const fullPathToOutput = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\mister-monthly-report\\output`;

// Report covers last month by default (matches the monthly export naming convention)
const currentDate = new Date();
currentDate.setMonth(currentDate.getMonth() - 1);
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentMonth = monthNames[currentDate.getMonth()];
const currentYear = currentDate.getFullYear();

// Adjust these filename patterns to match your actual export/report naming
const inputPath = path.join(fullPathToInput, `MCW_Monthly_Report_${currentMonth}${currentYear}.xlsx`);
const outputPath = path.join(fullPathToOutput, `MCW_Monthly_Report_${currentMonth}${currentYear}_grouped.xlsx`);
// ─────────────────────────────────────────────────────────────────────────

console.log(`Input:  ${inputPath}`);
console.log(`Output: ${outputPath}`);

const HEADER_MAP = {
  'order number': 'orderNumber',
  'order date': 'orderDate',
  'cc#': 'cc',
  'store #/user': 'storeUser',
  'store name': 'storeName',
  'product name': 'productName',
  'sku': 'sku',
  'ship date': 'shipDate',
  'qty': 'qty',
  'price': 'price',
  'tax': 'tax',
  'total': 'total',
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

  const required = ['orderNumber', 'orderDate', 'storeUser', 'storeName', 'productName', 'sku', 'shipDate', 'qty', 'price', 'tax', 'total'];
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
      storeUser: get('storeUser'),
      storeName: get('storeName'),
      productName: get('productName'),
      sku: get('sku'),
      shipDate: get('shipDate'),
      qty: get('qty'),
      price: get('price'),
      tax: get('tax'),
      total: get('total'),
    });
  });

  // Group: storeKey -> { storeUser, storeName, orders: Map(orderNumber -> {orderDate, items:[]}) }
  const stores = new Map();
  for (const r of rows) {
    const storeKey = `${r.storeUser}||${r.storeName}`;
    if (!stores.has(storeKey)) {
      stores.set(storeKey, {
        storeUser: r.storeUser,
        storeName: r.storeName,
        orders: new Map(),
      });
    }
    const store = stores.get(storeKey);
    if (!store.orders.has(r.orderNumber)) {
      store.orders.set(r.orderNumber, { orderDate: r.orderDate, items: [] });
    }
    store.orders.get(r.orderNumber).items.push(r);
  }

  // Sort stores by storeUser, then orders by order date
  const sortedStores = [...stores.values()].sort((a, b) =>
    String(a.storeUser).localeCompare(String(b.storeUser), undefined, { numeric: true })
  );

  // Build output workbook
  const outWb = new ExcelJS.Workbook();

  // ─── Summary tab ─────────────────────────────────────────────────────
  const summarySheet = outWb.addWorksheet('Summary');
  summarySheet.columns = [
    { key: 'storeUser', width: 14 },
    { key: 'storeName', width: 30 },
    { key: 'orderCount', width: 14 },
  ];
  const summaryHeaderRow = summarySheet.addRow({
    storeUser: 'Store #/User',
    storeName: 'Store Name',
    orderCount: 'Total Orders',
  });
  summaryHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  });

  const byOrderCountDesc = [...sortedStores].sort((a, b) => b.orders.size - a.orders.size);
  for (const store of byOrderCountDesc) {
    const row = summarySheet.addRow({
      storeUser: store.storeUser,
      storeName: store.storeName,
      orderCount: store.orders.size,
    });
    row.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10 };
    });
  }
  summarySheet.getColumn('orderCount').alignment = { horizontal: 'center' };

  const sheet = outWb.addWorksheet('Orders by Store', {
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
  const STORE_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  const ORDER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
  const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };

  for (const store of sortedStores) {
    const orderCount = store.orders.size;

    // Store header row (outline level 0 — always visible)
    const storeRow = sheet.addRow({
      label: `${store.storeUser} - ${store.storeName}   (${orderCount} order${orderCount === 1 ? '' : 's'})`,
    });
    sheet.mergeCells(storeRow.number, 1, storeRow.number, 4);
    storeRow.height = 20;
    storeRow.getCell(1).font = { ...FONT, bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    storeRow.getCell(1).fill = STORE_FILL;
    storeRow.getCell(1).alignment = { vertical: 'middle', indent: 0 };

    // Sort orders by date
    const sortedOrders = [...store.orders.entries()].sort((a, b) => {
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

    // Blank spacer row between stores
    sheet.addRow({});
  }

  // Collapse everything down to level 1 by default (stores expanded, orders collapsed to their header)
  sheet.eachRow((row) => {
    if (row.outlineLevel >= 2) row.hidden = true;
  });

  await outWb.xlsx.writeFile(outputPath);
  console.log(`Wrote ${outputPath}`);
  console.log(`Stores: ${sortedStores.length}, Total rows read: ${rows.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
