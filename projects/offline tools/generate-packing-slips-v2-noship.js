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
const config = require('./config-v2');


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
  const { numberCol, nameCol, stateCol, shipDaysCol, dataStartRow, dataEndRow } = config.store;
  const numCol = colLetterToNumber(numberCol);
  const nmCol = colLetterToNumber(nameCol);
  const stCol = colLetterToNumber(stateCol);
  const shipCol = shipDaysCol ? colLetterToNumber(shipDaysCol) : null;

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
      let shipDays = null;
      if (shipCol) {
        const shipRaw = ws.getCell(row, shipCol).value;
        const parsed = typeof shipRaw === 'number' ? shipRaw : parseFloat(shipRaw);
        shipDays = Number.isFinite(parsed) ? parsed : null;
      }
      stores.push({
        row,
        storeNum: storeNumStr,
        storeName: nameRaw != null ? String(nameRaw).trim() : '',
        state: stateRaw != null ? String(stateRaw).trim().toUpperCase() : '',
        shipDays,
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
// Within a single box's PDF: higher ship-days first (pack the longest
// transit stores first), then state, then store number as tiebreakers.
function compareForBoxFile(a, b) {
  const aShip = a.shipDays;
  const bShip = b.shipDays;
  if (aShip == null && bShip != null) return 1;
  if (aShip != null && bShip == null) return -1;
  if (aShip != null && bShip != null && aShip !== bShip) return bShip - aShip;

  if (a.state !== b.state) return a.state.localeCompare(b.state);
  return a.storeNum.localeCompare(b.storeNum, undefined, { numeric: true });
}

function allBoxLabels(products) {
  const seen = new Set();
  const ordered = [];
  for (const p of products) {
    if (!seen.has(p.box)) {
      seen.add(p.box);
      ordered.push(p.box);
    }
  }
  return ordered.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

// ---------- PDF rendering ----------
const PAGE = { width: 612, height: 792 }; // Letter, points
const MARGIN = 50;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;
const CODE_WIDTH = config.table.codeColWidth;
const QTY_WIDTH = config.table.qtyColWidth;
const NAME_WIDTH = CONTENT_WIDTH - CODE_WIDTH - QTY_WIDTH; // long names get the rest of the width
const COL_X = { name: MARGIN, code: MARGIN + NAME_WIDTH, qty: MARGIN + NAME_WIDTH + CODE_WIDTH };

function drawHeader(doc, store, boxLabel) {
  doc.font('Helvetica-Bold').fontSize(20).text(`Box: ${boxLabel}`, MARGIN, MARGIN);
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(14)
    .text(`Store #${store.storeNum} — ${store.storeName}`, { continued: false });
  doc.font('Helvetica').fontSize(11).fillColor('#444');
  
  doc.text(`State: ${store.state}`);
  doc.fillColor('black');
  doc.moveDown(0.8);
  return doc.y;
}

// Real per-row height, accounting for product names that wrap onto
// multiple lines — this is what prevents rows from overlapping.
function rowHeight(doc, item, fontSize) {
  const rowPad = Math.max(4, Math.round(fontSize * 0.5));
  const nameH = doc.heightOfString(item.name, { width: NAME_WIDTH });
  const codeH = doc.heightOfString(item.code || '', { width: CODE_WIDTH });
  return Math.max(nameH, codeH, fontSize) + rowPad;
}

function tableHeight(doc, items, fontSize) {
  doc.font('Helvetica').fontSize(fontSize);
  const rowPad = Math.max(4, Math.round(fontSize * 0.5));
  let total = fontSize + rowPad; // header row
  for (const item of items) total += rowHeight(doc, item, fontSize);
  return total;
}

// Pick the largest font size (from a descending list) that lets the
// table fit in the remaining space on the page, measuring actual
// wrapped-text heights rather than assuming one line per item.
function fitFontSize(doc, items, availableHeight) {
  const candidates = [11, 10, 9, 8, 7, 6];
  for (const size of candidates) {
    if (tableHeight(doc, items, size) <= availableHeight) return size;
  }
  return candidates[candidates.length - 1];
}

function drawTable(doc, items, startY, fontSize) {
  const rowPad = Math.max(4, Math.round(fontSize * 0.5));
  let y = startY;

  // header row
  doc.font('Helvetica-Bold').fontSize(fontSize);
  doc.text('Product', COL_X.name, y, { width: NAME_WIDTH });
  doc.text('Code', COL_X.code, y, { width: CODE_WIDTH });
  doc.text('Qty', COL_X.qty, y, { width: QTY_WIDTH, align: 'right' });
  y += fontSize + rowPad;
  doc.moveTo(MARGIN, y - rowPad / 2).lineTo(MARGIN + CONTENT_WIDTH, y - rowPad / 2).strokeColor('#999').stroke();

  doc.font('Helvetica').fontSize(fontSize);
  for (const item of items) {
    const h = rowHeight(doc, item, fontSize);
    doc.text(item.name, COL_X.name, y, { width: NAME_WIDTH });
    doc.text(item.code, COL_X.code, y, { width: CODE_WIDTH });
    doc.text(String(item.qty), COL_X.qty, y, { width: QTY_WIDTH, align: 'right' });
    y += h;
  }
}

function drawStorePage(doc, store, boxLabel, items) {
  doc.addPage();
  const startY = drawHeader(doc, store, boxLabel);
  const availableHeight = PAGE.height - MARGIN - startY;
  const fontSize = fitFontSize(doc, items, availableHeight);
  drawTable(doc, items, startY, fontSize);
}

// One combined PDF: every store, every box that store needs, sorted by
// state then store number (old default behavior — kept for config.output.splitByBox: false)
function renderCombinedPdf(stores, products, outputPath) {
  const doc = new PDFDocument({ size: 'LETTER', margin: MARGIN, autoFirstPage: false });
  doc.pipe(fs.createWriteStream(outputPath));

  const sorted = [...stores].sort((a, b) => {
    if (a.state !== b.state) return a.state.localeCompare(b.state);
    return a.storeNum.localeCompare(b.storeNum, undefined, { numeric: true });
  });

  for (const store of sorted) {
    for (const boxLabel of allBoxLabels(products)) {
      const items = store.itemsByBox.get(boxLabel);
      if (!items || items.length === 0) continue;
      drawStorePage(doc, store, boxLabel, items);
    }
  }
  doc.end();
}

// One PDF per box number. Each file contains every store that needs that
// box, sorted by ship time descending (longest transit packed first).
function renderPerBoxPdfs(stores, products, outputDir, fileNamePattern) {
  const outputPaths = [];
  for (const boxLabel of allBoxLabels(products)) {
    const storesForBox = stores.filter((s) => s.itemsByBox.has(boxLabel));
    if (storesForBox.length === 0) continue; // nobody ordered from this box

    storesForBox.sort(compareForBoxFile);

    const fileName = fileNamePattern.replace('{box}', boxLabel);
    const outputPath = path.join(outputDir, fileName);
    const doc = new PDFDocument({ size: 'LETTER', margin: MARGIN, autoFirstPage: false });
    doc.pipe(fs.createWriteStream(outputPath));

    for (const store of storesForBox) {
      drawStorePage(doc, store, boxLabel, store.itemsByBox.get(boxLabel));
    }
    doc.end();
    outputPaths.push(outputPath);
  }
  return outputPaths;
}

// ---------- main ----------
async function main() {
  const inputFile = process.argv[2] || config.inputFile;

  if (!fs.existsSync(config.output.dir)) fs.mkdirSync(config.output.dir, { recursive: true });

  console.log(`Reading: ${inputFile}`);
  const ws = await loadWorksheet(inputFile);

  const products = parseProducts(ws);
  console.log(`Found ${products.length} products (columns ${products[0]?.colLetter} - ${products[products.length - 1]?.colLetter})`);

  const stores = parseStores(ws);
  console.log(`Found ${stores.length} stores (rows ${stores[0]?.row} - ${stores[stores.length - 1]?.row})`);

  attachItems(ws, stores, products);

  const totalPages = stores.reduce((sum, s) => sum + s.itemsByBox.size, 0);

  if (config.output.splitByBox) {
    console.log(`Generating ${totalPages} pages across per-box PDFs...`);
    const outputPaths = renderPerBoxPdfs(stores, products, config.output.dir, config.output.boxFileNamePattern);
    console.log(`Done. Wrote ${outputPaths.length} files:`);
    for (const p of outputPaths) console.log(`  ${p}`);
  } else {
    const outputFile = process.argv[3] || path.join(config.output.dir, config.output.combinedFileName);
    console.log(`Generating ${totalPages} pages (one combined PDF)...`);
    renderCombinedPdf(stores, products, outputFile);
    console.log(`Done: ${outputFile}`);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
