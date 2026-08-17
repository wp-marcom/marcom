#!/usr/bin/env node
// ============================================================
// PACKING SLIP GENERATOR
// Reads the master spreadsheet described in config.js and produces
// one PDF page per (store, box) combination, sorted by state then
// store number. See config.js to point this at a different layout.
//
// Usage:
//   node generate-packing-slips.js [inputFile] [outputFile]
// ============================================================
const primeDirectory = "C:\\projects\\";
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);
const path = require('path');
const fs = require('fs');
//const ExcelJS = require('exceljs');
const PDFDocument = require(`${primeDirectory}node_modules\\pdfkit`);
const config = require('./config');

// ---------- column letter helpers ----------
function colLetterToNumber(letters) {
  let n = 0;
  for (const ch of letters.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n;
}
function colNumberToLetter(num) {
  let letters = '';
  while (num > 0) {
    const rem = (num - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    num = Math.floor((num - 1) / 26);
  }
  return letters;
}

// ---------- load workbook ----------
async function loadWorksheet(inputFile) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(inputFile);
  const ws = config.sheetName
    ? workbook.getWorksheet(config.sheetName)
    : workbook.worksheets[0];
  if (!ws) {
    throw new Error(`Worksheet not found (sheetName: ${config.sheetName})`);
  }
  return ws;
}

// ---------- parse products (columns) ----------
function parseProducts(ws) {
  const { startCol, endCol, boxRow, nameRow, codeRow } = config.product;
  const startNum = colLetterToNumber(startCol);
  const endNum = endCol ? colLetterToNumber(endCol) : null;

  const products = [];
  let colNum = startNum;
  while (true) {
    if (endNum && colNum > endNum) break;

    const name = ws.getCell(nameRow, colNum).value;
    const nameStr = name != null ? String(name).trim() : '';

    if (!endNum && nameStr === '') break; // auto-detect end
    if (nameStr !== '') {
      const code = ws.getCell(codeRow, colNum).value;
      const box = ws.getCell(boxRow, colNum).value;
      products.push({
        colNum,
        colLetter: colNumberToLetter(colNum),
        name: nameStr,
        code: code != null ? String(code).trim() : '',
        box: box != null ? String(box).trim() : '(no box)',
      });
    }
    colNum++;

    // safety valve so a malformed sheet can't loop forever
    if (colNum - startNum > 2000) break;
  }
  return products;
}

// ---------- parse stores (rows) ----------
function parseStores(ws) {
  const { numberCol, nameCol, stateCol, dataStartRow, dataEndRow } = config.store;
  const numCol = colLetterToNumber(numberCol);
  const nmCol = colLetterToNumber(nameCol);
  const stCol = colLetterToNumber(stateCol);

  const stores = [];
  let row = dataStartRow;
  while (true) {
    if (dataEndRow && row > dataEndRow) break;

    const storeNumRaw = ws.getCell(row, numCol).value;
    const storeNumStr = storeNumRaw != null ? String(storeNumRaw).trim() : '';

    if (!dataEndRow && storeNumStr === '') break; // auto-detect end
    if (storeNumStr !== '') {
      const nameRaw = ws.getCell(row, nmCol).value;
      const stateRaw = ws.getCell(row, stCol).value;
      stores.push({
        row,
        storeNum: storeNumStr,
        storeName: nameRaw != null ? String(nameRaw).trim() : '',
        state: stateRaw != null ? String(stateRaw).trim().toUpperCase() : '',
      });
    }
    row++;

    if (row - dataStartRow > 20000) break; // safety valve
  }
  return stores;
}

// ---------- pull quantities for each store ----------
function attachItems(ws, stores, products) {
  for (const store of stores) {
    store.itemsByBox = new Map();
    for (const product of products) {
      const qtyRaw = ws.getCell(store.row, product.colNum).value;
      const qty = typeof qtyRaw === 'number' ? qtyRaw : parseFloat(qtyRaw);
      if (!qty || qty <= 0) continue;

      if (!store.itemsByBox.has(product.box)) {
        store.itemsByBox.set(product.box, []);
      }
      store.itemsByBox.get(product.box).push({
        name: product.name,
        code: product.code,
        qty,
      });
    }
  }
}

// ---------- sort helpers ----------
function sortStores(stores) {
  stores.sort((a, b) => {
    if (a.state !== b.state) return a.state.localeCompare(b.state);
    // numeric-aware compare so "9" sorts before "10"
    return a.storeNum.localeCompare(b.storeNum, undefined, { numeric: true });
  });
}
function sortedBoxKeys(itemsByBox) {
  return [...itemsByBox.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
}

// ---------- PDF rendering ----------
const PAGE = { width: 612, height: 792 }; // Letter, points
const MARGIN = 50;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;
const COL_WIDTHS = { name: CONTENT_WIDTH * 0.55, code: CONTENT_WIDTH * 0.2, qty: CONTENT_WIDTH * 0.25 };

function drawHeader(doc, store, boxLabel) {
  doc.font('Helvetica-Bold').fontSize(20).text(`Box: ${boxLabel}`, MARGIN, MARGIN);
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(14)
    .text(`Store #${store.storeNum} — ${store.storeName}`, { continued: false });
  doc.font('Helvetica').fontSize(11).fillColor('#444')
    .text(`State: ${store.state}`);
  doc.fillColor('black');
  doc.moveDown(0.8);
  return doc.y;
}

function tableHeight(items, fontSize, rowPad) {
  const rowH = fontSize + rowPad;
  return rowH * (items.length + 1); // +1 for header row
}

function drawTable(doc, items, startY, fontSize) {
  const rowPad = Math.max(4, Math.round(fontSize * 0.5));
  const rowH = fontSize + rowPad;
  let y = startY;

  const colX = { name: MARGIN, code: MARGIN + COL_WIDTHS.name, qty: MARGIN + COL_WIDTHS.name + COL_WIDTHS.code };

  // header row
  doc.font('Helvetica-Bold').fontSize(fontSize);
  doc.text('Product', colX.name, y, { width: COL_WIDTHS.name });
  doc.text('Code', colX.code, y, { width: COL_WIDTHS.code });
  doc.text('Qty', colX.qty, y, { width: COL_WIDTHS.qty, align: 'right' });
  y += rowH;
  doc.moveTo(MARGIN, y - rowPad / 2).lineTo(MARGIN + CONTENT_WIDTH, y - rowPad / 2).strokeColor('#999').stroke();

  doc.font('Helvetica').fontSize(fontSize);
  for (const item of items) {
    doc.text(item.name, colX.name, y, { width: COL_WIDTHS.name });
    doc.text(item.code, colX.code, y, { width: COL_WIDTHS.code });
    doc.text(String(item.qty), colX.qty, y, { width: COL_WIDTHS.qty, align: 'right' });
    y += rowH;
  }
}

// Pick the largest font size (from a descending list) that lets the
// table fit in the remaining space on the page; falls back to the
// smallest size (and lets it overflow) if nothing fits.
function fitFontSize(items, availableHeight) {
  const candidates = [11, 10, 9, 8, 7, 6];
  for (const size of candidates) {
    const rowPad = Math.max(4, Math.round(size * 0.5));
    if (tableHeight(items, size, rowPad) <= availableHeight) return size;
  }
  return candidates[candidates.length - 1];
}

function renderPdf(stores, outputPath) {
  const doc = new PDFDocument({ size: 'LETTER', margin: MARGIN, autoFirstPage: false });
  doc.pipe(fs.createWriteStream(outputPath));

  for (const store of stores) {
    const boxKeys = sortedBoxKeys(store.itemsByBox);
    if (boxKeys.length === 0) continue; // no products requested — skip (no page)

    for (const boxLabel of boxKeys) {
      const items = store.itemsByBox.get(boxLabel);
      doc.addPage();
      const startY = drawHeader(doc, store, boxLabel);
      const availableHeight = PAGE.height - MARGIN - startY;
      const fontSize = fitFontSize(items, availableHeight);
      drawTable(doc, items, startY, fontSize);
    }
  }

  doc.end();
}

// ---------- main ----------
async function main() {
  const inputFile = process.argv[2] || config.inputFile;
  const outputFile = process.argv[3] || path.join(config.output.dir, config.output.fileName);

  if (!fs.existsSync(config.output.dir)) fs.mkdirSync(config.output.dir, { recursive: true });

  console.log(`Reading: ${inputFile}`);
  const ws = await loadWorksheet(inputFile);

  const products = parseProducts(ws);
  console.log(`Found ${products.length} products (columns ${products[0]?.colLetter} - ${products[products.length - 1]?.colLetter})`);

  const stores = parseStores(ws);
  console.log(`Found ${stores.length} stores (rows ${stores[0]?.row} - ${stores[stores.length - 1]?.row})`);

  attachItems(ws, stores, products);
  sortStores(stores);

  const totalPages = stores.reduce((sum, s) => sum + s.itemsByBox.size, 0);
  console.log(`Generating ${totalPages} pages (one per store/box combo)...`);

  renderPdf(stores, outputFile);
  console.log(`Done: ${outputFile}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
