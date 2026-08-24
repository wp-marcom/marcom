// build_report.js
// Usage: node build_report.js <MCW_Monthly_Report_Jul2026.xlsx> [output.xlsx]
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

const inputPath = process.argv[2];
const outputPath = process.argv[3] || path.join(
  path.dirname(inputPath || '.'),
  path.basename(inputPath || 'output', path.extname(inputPath || '')) + '_grouped.xlsx'
);

if (!inputPath) {
  console.error('Usage: node build_report.js <MCW_Monthly_Report_Jul2026.xlsx> [output.xlsx]');
  process.exit(1);
}

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
  const sheet = outWb.addWorksheet('Orders by Store', {
    views: [{ state: 'frozen', ySplit: 0 }],
  });

  sheet.columns = [
    { key: 'label', width: 55 },
    { key: 'sku', width: 12 },
    { key: 'shipDate', width: 12 },
    { key: 'qty', width: 8 },
    { key: 'price', width: 11 },
    { key: 'tax', width: 10 },
    { key: 'total', width: 11 },
  ];

  const FONT = { name: 'Arial', size: 10 };
  const STORE_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  const ORDER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } };
  const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
  const CURRENCY_FMT = '$#,##0.00';

  for (const store of sortedStores) {
    const orderCount = store.orders.size;

    // Store header row
    const storeRow = sheet.addRow({
      label: `${store.storeUser} - ${store.storeName}   (${orderCount} order${orderCount === 1 ? '' : 's'})`,
    });
    sheet.mergeCells(storeRow.number, 1, storeRow.number, 7);
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
      const orderRow = sheet.addRow({
        label: `Order: ${orderNumber}   —   ${excelDateToString(order.orderDate)}`,
      });
      sheet.mergeCells(orderRow.number, 1, orderRow.number, 7);
      orderRow.getCell(1).font = { ...FONT, bold: true, italic: true };
      orderRow.getCell(1).fill = ORDER_FILL;
      orderRow.getCell(1).alignment = { indent: 1 };

      // Column header row for line items under this order
      const colHeaderRow = sheet.addRow({
        label: 'Product',
        sku: 'SKU',
        shipDate: 'Ship Date',
        qty: 'Qty',
        price: 'Price',
        tax: 'Tax',
        total: 'Total',
      });
      colHeaderRow.eachCell((cell) => {
        cell.font = { ...FONT, bold: true, size: 9, color: { argb: 'FF666666' } };
        cell.fill = HEADER_FILL;
      });
      colHeaderRow.getCell(1).alignment = { indent: 2 };

      for (const item of order.items) {
        const itemRow = sheet.addRow({
          label: item.productName,
          sku: item.sku,
          shipDate: excelDateToString(item.shipDate),
          qty: item.qty,
          price: item.price,
          tax: item.tax,
          total: item.total,
        });
        itemRow.getCell(1).font = FONT;
        itemRow.getCell(1).alignment = { indent: 3 };
        itemRow.getCell(2).font = FONT;
        itemRow.getCell(3).font = FONT;
        itemRow.getCell(4).font = FONT;
        itemRow.getCell(5).font = FONT;
        itemRow.getCell(5).numFmt = CURRENCY_FMT;
        itemRow.getCell(6).font = FONT;
        itemRow.getCell(6).numFmt = CURRENCY_FMT;
        itemRow.getCell(7).font = FONT;
        itemRow.getCell(7).numFmt = CURRENCY_FMT;
      }
    }

    // Blank spacer row between stores
    sheet.addRow({});
  }

  await outWb.xlsx.writeFile(outputPath);
  console.log(`Wrote ${outputPath}`);
  console.log(`Stores: ${sortedStores.length}, Total rows read: ${rows.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
