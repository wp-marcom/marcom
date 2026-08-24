#!/usr/bin/env node
// ============================================================
// PACKING SLIP GENERATOR
// Reads the master spreadsheet described in config.js and produces
// packing-slip PDFs (default: one file per box + ship-days combo).
// See config.js to change layout, output mode, or file naming.
//
// Usage:
//   node generate-packing-slips.js [inputFile] [campaignName]
// ============================================================

const primeDirectory = "C:\\projects\\";
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);
const path = require('path');
const fs = require('fs');
//const ExcelJS = require('exceljs');
const PDFDocument = require(`${primeDirectory}node_modules\\pdfkit`);
const { PDFDocument: PDFLibDocument } = require(`${primeDirectory}node_modules\\pdf-lib`);
const config = require('./config-v2.0');

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
  const { numberCol, nameCol, stateCol, addressCol, shipDaysCol, dataStartRow, dataEndRow } = config.store;
  const numCol = colLetterToNumber(numberCol);
  const nmCol = colLetterToNumber(nameCol);
  const stCol = colLetterToNumber(stateCol);
  const addrCol = addressCol ? colLetterToNumber(addressCol) : null;
  // Legacy ship-days column is only read when the TransitTimes.xlsx lookup is off.
  const shipCol = !config.transitTimes.enabled && shipDaysCol ? colLetterToNumber(shipDaysCol) : null;

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
      const addressRaw = addrCol ? ws.getCell(row, addrCol).value : null;
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
        address: addressRaw != null ? String(addressRaw).trim() : null,
        shipDays,
        deliveryTicketNeeded: false, // filled in from TransitTimes.xlsx if enabled
      });
    }
    row++;

    if (row - dataStartRow > 20000) break; // safety valve
  }
  return stores;
}

// ---------- transit time / delivery ticket lookup ----------
function parseYesNo(value) {
  if (value == null) return false;
  const s = String(value).trim().toLowerCase();
  return s === 'yes' || s === 'y' || s === 'true' || s === '1';
}

async function loadTransitTimes() {
  const { file, sheetName, dataStartRow, storeNumberCol, transitDaysCol, deliveryTicketCol } = config.transitTimes;

  if (!fs.existsSync(file)) {
    throw new Error(
      `transitTimes.enabled is true but "${file}" was not found. ` +
      `Create it (columns: store number, transit days, optional Yes/No delivery-ticket flag) ` +
      `or set config.transitTimes.enabled to false to use the legacy shipDaysCol instead.`
    );
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const ws = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0];
  if (!ws) throw new Error(`Worksheet not found in ${file} (sheetName: ${sheetName})`);

  const numCol = colLetterToNumber(storeNumberCol);
  const daysCol = colLetterToNumber(transitDaysCol);
  const ticketCol = deliveryTicketCol ? colLetterToNumber(deliveryTicketCol) : null;

  const lookup = new Map(); // storeNumStr -> { shipDays, deliveryTicketNeeded }
  let row = dataStartRow;
  while (true) {
    const storeNumRaw = ws.getCell(row, numCol).value;
    const storeNumStr = storeNumRaw != null ? String(storeNumRaw).trim() : '';
    if (storeNumStr === '') break; // auto-detect end

    const daysRaw = ws.getCell(row, daysCol).value;
    const parsed = typeof daysRaw === 'number' ? daysRaw : parseFloat(daysRaw);
    const shipDays = Number.isFinite(parsed) ? parsed : null;

    const deliveryTicketNeeded = ticketCol ? parseYesNo(ws.getCell(row, ticketCol).value) : false;

    lookup.set(storeNumStr, { shipDays, deliveryTicketNeeded });
    row++;

    if (row - dataStartRow > 20000) break; // safety valve
  }
  return lookup;
}

// Applies the TransitTimes.xlsx lookup to already-parsed stores. Logs a
// warning (not a hard failure) for any store missing from the lookup file,
// since a silently-null ship time would otherwise be easy to miss.
function applyTransitTimes(stores, lookup) {
  const missing = [];
  for (const store of stores) {
    const entry = lookup.get(store.storeNum);
    if (!entry) {
      missing.push(store.storeNum);
      continue;
    }
    store.shipDays = entry.shipDays;
    store.deliveryTicketNeeded = entry.deliveryTicketNeeded;
  }
  if (missing.length > 0) {
    console.warn(`Warning: ${missing.length} store(s) not found in TransitTimes.xlsx (no ship time applied): ${missing.join(', ')}`);
  }
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
// Legacy 'perBox' mode: higher ship-days first (pack the longest transit
// stores first). Ties keep the order stores appear in the spreadsheet —
// Array.prototype.sort is stable, so returning 0 on a tie is enough.
function compareForBoxFile(a, b) {
  const aShip = a.shipDays;
  const bShip = b.shipDays;
  if (aShip == null && bShip != null) return 1;
  if (aShip != null && bShip == null) return -1;
  if (aShip != null && bShip != null && aShip !== bShip) return bShip - aShip;
  return 0;
}

function sanitizeForFileName(str) {
  return String(str).replace(/[\/\\:*?"<>|]/g, '-').trim();
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

// A store's "order fingerprint" for a box — same product codes + same
// quantities (regardless of row order) produce the same signature, so
// two stores ordering identical stuff always land in the same group.
function orderSignature(items) {
  return items
    .map((i) => `${i.code}::${i.qty}`)
    .sort()
    .join('|');
}

// Groups stores (already filtered to one box + one ship-days value) by
// identical order content. Groups are ordered largest-first (biggest
// batching opportunity at the top of the file); ties, and stores within
// a group, keep their original spreadsheet order.
// Returns [{ stores: [...], items: [...], firstIndex }, ...]
function computeOrderGroups(storesForGroup, boxLabel) {
  const bySig = new Map(); // signature -> { stores: [...], items, firstIndex }
  storesForGroup.forEach((store, idx) => {
    const items = store.itemsByBox.get(boxLabel);
    const sig = orderSignature(items);
    if (!bySig.has(sig)) bySig.set(sig, { stores: [], items, firstIndex: idx });
    bySig.get(sig).stores.push(store);
  });

  return [...bySig.values()].sort((a, b) => {
    if (b.stores.length !== a.stores.length) return b.stores.length - a.stores.length;
    return a.firstIndex - b.firstIndex;
  });
}

// Flattens computeOrderGroups() output into the page-draw order:
// [{ store, groupSize }, ...]
function flattenGroupsForDrawing(groups) {
  const ordered = [];
  for (const group of groups) {
    for (const store of group.stores) {
      ordered.push({ store, groupSize: group.stores.length });
    }
  }
  return ordered;
}

// ---------- PDF rendering ----------
const PAGE = { width: 612, height: 792 }; // Letter, points
const MARGIN = 50;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;
// Where content starts vertically. Normally same as MARGIN; if a header
// template is enabled, content is pushed down to clear the artwork.
const TOP_MARGIN = config.header.enabled ? config.header.contentTopMargin : MARGIN;
const CODE_WIDTH = config.table.codeColWidth;
const QTY_WIDTH = config.table.qtyColWidth;
const NAME_WIDTH = CONTENT_WIDTH - CODE_WIDTH - QTY_WIDTH; // long names get the rest of the width
const COL_X = { name: MARGIN, code: MARGIN + NAME_WIDTH, qty: MARGIN + NAME_WIDTH + CODE_WIDTH };

function drawHeader(doc, store, boxLabel, groupSize) {
  doc.font('Helvetica-Bold').fontSize(20).text(`Box: ${boxLabel}`, MARGIN, TOP_MARGIN);
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(14)
    .text(`Store #${store.storeNum} — ${store.storeName}`, { continued: false });

  if (store.address) {
    doc.font('Helvetica').fontSize(10).fillColor('#444').text(store.address, { width: CONTENT_WIDTH });
  }

  doc.font('Helvetica').fontSize(11).fillColor('#444');
  const shipLabel = store.shipDays != null ? `${store.shipDays} day(s)` : 'unknown';
  doc.text(`State: ${store.state}   |   Ship time: ${shipLabel}`);

  if (config.slip.groupIdenticalOrders.showBadge && groupSize > 1) {
    doc.moveDown(0.2);
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#b45309')
      .text(`IDENTICAL ORDER — ${groupSize} stores in this batch need the exact same items`);
  }

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
  return y;
}

// Reserved vertical space below the table for the "Packed By:" line,
// factored into fitFontSize so it never gets crowded out or overlapped.
const PACKED_BY_HEIGHT = 45;

function drawPackedByLine(doc, y) {
  if (!config.slip.packedByLine.enabled) return;
  const lineY = y + 30;
  const label = config.slip.packedByLine.label;
  doc.font('Helvetica').fontSize(11).fillColor('black').text(label, MARGIN, lineY);
  const labelWidth = doc.widthOfString(label + ' ');
  doc.moveTo(MARGIN + labelWidth, lineY + 10)
    .lineTo(MARGIN + 250, lineY + 10)
    .strokeColor('#000').stroke();
}

// Two-field signature line for LocalDeliveryTickets.pdf: a long blank for
// the name, a shorter blank for the date, on the same row.
function drawReceivedByLine(doc, y) {
  if (!config.slip.receivedByLine.enabled) return;
  const lineY = y + 30;
  const { label1, label2 } = config.slip.receivedByLine;

  doc.font('Helvetica').fontSize(11).fillColor('black').text(label1, MARGIN, lineY);
  const label1Width = doc.widthOfString(label1 + ' ');
  const blank1End = MARGIN + 300;
  doc.moveTo(MARGIN + label1Width, lineY + 10).lineTo(blank1End, lineY + 10).strokeColor('#000').stroke();

  const label2X = blank1End + 20;
  doc.text(label2, label2X, lineY);
  const label2Width = doc.widthOfString(label2 + ' ');
  doc.moveTo(label2X + label2Width, lineY + 10)
    .lineTo(MARGIN + CONTENT_WIDTH, lineY + 10)
    .strokeColor('#000').stroke();
}

function drawStorePage(doc, store, boxLabel, items, groupSize) {
  doc.addPage();
  const startY = drawHeader(doc, store, boxLabel, groupSize);
  const packedByReserve = config.slip.packedByLine.enabled ? PACKED_BY_HEIGHT : 0;
  const availableHeight = PAGE.height - MARGIN - startY - packedByReserve;
  const fontSize = fitFontSize(doc, items, availableHeight);
  const endY = drawTable(doc, items, startY, fontSize);
  drawPackedByLine(doc, endY);
}

const SUMMARY_FONT = 10;
const SUMMARY_HEADER_FONT = 12;

// Measures how tall one group's block will be in the summary, so we know
// whether it needs to spill onto a new summary page before drawing it.
function measureSummaryGroupHeight(doc, group) {
  doc.font('Helvetica-Bold').fontSize(SUMMARY_HEADER_FONT);
  const storeNums = group.stores.map((s) => s.storeNum).join(', ');
  let h = doc.heightOfString(`${group.stores.length}x identical order — Stores: ${storeNums}`, { width: CONTENT_WIDTH }) + 4;

  doc.font('Helvetica').fontSize(SUMMARY_FONT);
  for (const item of group.items) {
    const text = `\u2022 ${item.name} (${item.code}) — Qty ${item.qty}`;
    h += doc.heightOfString(text, { width: CONTENT_WIDTH - 12 }) + 2;
  }
  return h + 14; // gap after the group
}

// Draws the summary page(s) — one block per identical-order group, largest
// group first, so the team can see "make 15 of this exact list" at a glance.
// Always the first page(s) of the box/ship-time PDF; spills onto additional
// pages automatically if there are too many groups to fit on one.
function drawSummaryPage(doc, boxLabel, shipLabel, campaignName, groups) {
  doc.addPage();
  let y = TOP_MARGIN;

  doc.font('Helvetica-Bold').fontSize(20).fillColor('black').text('Summary', MARGIN, y);
  y = doc.y + 4;

  const subtitle = campaignName ? `${campaignName} — Box ${boxLabel} — Ship time: ${shipLabel}` : `Box ${boxLabel} — Ship time: ${shipLabel}`;
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#444').text(subtitle, MARGIN, y);
  y = doc.y + 8;

  const totalStores = groups.reduce((sum, g) => sum + g.stores.length, 0);
  doc.font('Helvetica').fontSize(10).fillColor('#666')
    .text(`${totalStores} store(s) across ${groups.length} unique order profile(s)`, MARGIN, y);
  y = doc.y + 16;
  doc.fillColor('black');

  for (const group of groups) {
    const blockHeight = measureSummaryGroupHeight(doc, group);
    if (y + blockHeight > PAGE.height - MARGIN) {
      doc.addPage();
      y = TOP_MARGIN;
    }

    const storeNums = group.stores.map((s) => s.storeNum).join(', ');
    const countLabel = group.stores.length > 1 ? `${group.stores.length}x identical order` : `1 store`;
    doc.font('Helvetica-Bold').fontSize(SUMMARY_HEADER_FONT)
      .fillColor(group.stores.length > 1 ? '#b45309' : 'black')
      .text(`${countLabel} — Stores: ${storeNums}`, MARGIN, y, { width: CONTENT_WIDTH });
    y = doc.y + 4;
    doc.fillColor('black');

    doc.font('Helvetica').fontSize(SUMMARY_FONT);
    for (const item of group.items) {
      const text = `\u2022 ${item.name} (${item.code}) — Qty ${item.qty}`;
      doc.text(text, MARGIN + 12, y, { width: CONTENT_WIDTH - 12 });
      y = doc.y + 2;
    }
    y += 14;
  }
}

// Measures one box's block on a delivery ticket (heading + its item lines).
function measureDeliveryBoxBlockHeight(doc, boxLabel, items) {
  doc.font('Helvetica-Bold').fontSize(SUMMARY_HEADER_FONT);
  let h = doc.heightOfString(`Box ${boxLabel}`, { width: CONTENT_WIDTH }) + 4;

  doc.font('Helvetica').fontSize(SUMMARY_FONT);
  for (const item of items) {
    const text = `\u2022 ${item.name} (${item.code}) — Qty ${item.qty}`;
    h += doc.heightOfString(text, { width: CONTENT_WIDTH - 12 }) + 2;
  }
  return h + 12;
}

// One page (or more, if it overflows) per store in LocalDeliveryTickets.pdf.
// Shows every box the store needs, all in one place, ending in a
// Received By / Date signature line instead of Packed By.
function drawLocalDeliveryTicketPage(doc, store, boxEntries) {
  doc.addPage();
  let y = TOP_MARGIN;

  doc.font('Helvetica-Bold').fontSize(20).fillColor('black').text('Local Delivery Ticket', MARGIN, y);
  y = doc.y + 4;

  doc.font('Helvetica-Bold').fontSize(14).text(`Store #${store.storeNum} — ${store.storeName}`, MARGIN, y);
  y = doc.y + 2;

  if (store.address) {
    doc.font('Helvetica').fontSize(10).fillColor('#444').text(store.address, MARGIN, y, { width: CONTENT_WIDTH });
    y = doc.y + 4;
  }
  doc.fillColor('black');
  y += 12;

  for (const { boxLabel, items } of boxEntries) {
    const blockHeight = measureDeliveryBoxBlockHeight(doc, boxLabel, items);
    const reserve = config.slip.receivedByLine.enabled ? PACKED_BY_HEIGHT : 0;
    if (y + blockHeight > PAGE.height - MARGIN - reserve) {
      doc.addPage();
      y = TOP_MARGIN;
    }

    doc.font('Helvetica-Bold').fontSize(SUMMARY_HEADER_FONT).fillColor('black')
      .text(`Box ${boxLabel}`, MARGIN, y, { width: CONTENT_WIDTH });
    y = doc.y + 4;

    doc.font('Helvetica').fontSize(SUMMARY_FONT);
    for (const item of items) {
      const text = `\u2022 ${item.name} (${item.code}) — Qty ${item.qty}`;
      doc.text(text, MARGIN + 12, y, { width: CONTENT_WIDTH - 12 });
      y = doc.y + 2;
    }
    y += 14;
  }

  drawReceivedByLine(doc, y);
}

// Wraps a pdfkit doc + its file stream so callers can await the file
// actually being fully written to disk (matters once we chain the
// header-template merge step right after rendering).
function finishPdf(doc, outputPath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(outputPath);
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
    doc.pipe(stream);
    doc.end();
  });
}

// One combined PDF: every store, every box that store needs, sorted by
// state then store number (old default behavior — kept for config.output.splitByBox: false)
async function renderCombinedPdf(stores, products, outputPath) {
  const doc = new PDFDocument({ size: 'LETTER', margin: MARGIN, autoFirstPage: false });

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
  await finishPdf(doc, outputPath);
  return outputPath;
}

// One PDF per box number. Each file contains every store that needs that
// box, sorted by ship time descending (longest transit packed first).
async function renderPerBoxPdfs(stores, products, outputDir, fileNamePattern) {
  const outputPaths = [];
  for (const boxLabel of allBoxLabels(products)) {
    const storesForBox = stores.filter((s) => s.itemsByBox.has(boxLabel));
    if (storesForBox.length === 0) continue; // nobody ordered from this box

    storesForBox.sort(compareForBoxFile);

    const fileName = fileNamePattern.replace('{box}', boxLabel);
    const outputPath = path.join(outputDir, fileName);
    const doc = new PDFDocument({ size: 'LETTER', margin: MARGIN, autoFirstPage: false });

    for (const store of storesForBox) {
      drawStorePage(doc, store, boxLabel, store.itemsByBox.get(boxLabel));
    }
    await finishPdf(doc, outputPath);
    outputPaths.push(outputPath);
  }
  return outputPaths;
}

// One PDF per (box, ship-days) combination. E.g. every store that needs
// Box 1 AND has a 4-day transit time goes in one file. Stores stay in the
// exact order they appear in the spreadsheet — no re-sorting within a file.
async function renderPerBoxAndLeadTimePdfs(stores, products, outputDir, fileNamePattern, campaignName) {
  const outputPaths = [];
  for (const boxLabel of allBoxLabels(products)) {
    const storesForBox = stores.filter((s) => s.itemsByBox.has(boxLabel)); // preserves spreadsheet order

    // group by ship-days value, preserving each store's original order within its group
    const shipGroups = new Map(); // key: number or 'unknown' -> stores[]
    for (const store of storesForBox) {
      const key = store.shipDays != null ? store.shipDays : 'unknown';
      if (!shipGroups.has(key)) shipGroups.set(key, []);
      shipGroups.get(key).push(store);
    }

    const shipKeys = [...shipGroups.keys()].sort((a, b) => {
      if (a === 'unknown' || b === 'unknown') return a === 'unknown' ? 1 : -1;
      return a - b;
    });

    for (const shipKey of shipKeys) {
      const groupStores = shipGroups.get(shipKey);
      const shipLabel = shipKey === 'unknown' ? 'unknown' : `${shipKey} day(s)`;
      const fileName = fileNamePattern
        .replace('{campaign}', sanitizeForFileName(campaignName))
        .replace('{shipDays}', String(shipKey))
        .replace('{box}', boxLabel);
      const outputPath = path.join(outputDir, fileName);
      const doc = new PDFDocument({ size: 'LETTER', margin: MARGIN, autoFirstPage: false });

      // Compute identical-order groups once — reused for the on-page badge
      // (via groupSize) and the summary page, so both stay in sync.
      const needsGrouping = config.slip.groupIdenticalOrders.enabled || config.slip.summaryPage.enabled;
      const orderGroups = needsGrouping ? computeOrderGroups(groupStores, boxLabel) : null;

      if (config.slip.summaryPage.enabled) {
        drawSummaryPage(doc, boxLabel, shipLabel, campaignName, orderGroups);
      }

      const drawOrder = config.slip.groupIdenticalOrders.enabled
        ? flattenGroupsForDrawing(orderGroups)
        : groupStores.map((store) => ({ store, groupSize: 1 }));

      for (const { store, groupSize } of drawOrder) {
        drawStorePage(doc, store, boxLabel, store.itemsByBox.get(boxLabel), groupSize);
      }
      await finishPdf(doc, outputPath);
      outputPaths.push(outputPath);
    }
  }
  return outputPaths;
}

// LocalDeliveryTickets.pdf — one page (or more, if it overflows) per store
// flagged deliveryTicketNeeded, showing every box that store needs in one
// place, in original spreadsheet order. Returns null if no store qualifies
// (so callers can skip it rather than write an empty file).
async function renderLocalDeliveryTickets(stores, outputDir, fileName) {
  const flagged = stores.filter((s) => s.deliveryTicketNeeded);
  if (flagged.length === 0) return null;

  const outputPath = path.join(outputDir, fileName);
  const doc = new PDFDocument({ size: 'LETTER', margin: MARGIN, autoFirstPage: false });

  for (const store of flagged) {
    const boxEntries = [...store.itemsByBox.keys()]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((boxLabel) => ({ boxLabel, items: store.itemsByBox.get(boxLabel) }));
    if (boxEntries.length === 0) continue; // flagged but ordered nothing this run

    drawLocalDeliveryTicketPage(doc, store, boxEntries);
  }

  await finishPdf(doc, outputPath);
  return outputPath;
}

// Stamps every page of a generated PDF on top of a header/letterhead
// template PDF (its first page is reused as the background for every page).
async function applyHeaderTemplate(contentPdfPath, headerPdfPath) {
  const contentBytes = fs.readFileSync(contentPdfPath);
  const headerBytes = fs.readFileSync(headerPdfPath);

  const contentDoc = await PDFLibDocument.load(contentBytes);
  const outDoc = await PDFLibDocument.create();

  const [headerPage] = await outDoc.embedPdf(headerBytes, [0]);
  const embeddedContentPages = await outDoc.embedPdf(contentBytes, contentDoc.getPageIndices());

  for (const contentPage of embeddedContentPages) {
    const { width, height } = contentPage;
    const page = outDoc.addPage([width, height]);
    page.drawPage(headerPage, { x: 0, y: 0, width, height });
    page.drawPage(contentPage, { x: 0, y: 0, width, height });
  }

  fs.writeFileSync(contentPdfPath, await outDoc.save()); // overwrite in place
}

// ---------- main ----------
async function main() {
  const inputFile = process.argv[2] || config.inputFile;
  const campaignName = process.argv[3] || config.campaign.name;

  if (!fs.existsSync(config.output.dir)) fs.mkdirSync(config.output.dir, { recursive: true });

  console.log(`Reading: ${inputFile}`);
  const ws = await loadWorksheet(inputFile);

  const products = parseProducts(ws);
  console.log(`Found ${products.length} products (columns ${products[0]?.colLetter} - ${products[products.length - 1]?.colLetter})`);

  const stores = parseStores(ws);
  console.log(`Found ${stores.length} stores (rows ${stores[0]?.row} - ${stores[stores.length - 1]?.row})`);

  if (config.transitTimes.enabled) {
    console.log(`Reading transit times: ${config.transitTimes.file}`);
    const lookup = await loadTransitTimes();
    applyTransitTimes(stores, lookup);
  }

  attachItems(ws, stores, products);

  const totalPages = stores.reduce((sum, s) => sum + s.itemsByBox.size, 0);
  let outputPaths;

  if (config.output.mode === 'perBoxAndLeadTime') {
    console.log(`Generating ${totalPages} pages across per-box-per-leadtime PDFs (campaign: "${campaignName}")...`);
    outputPaths = await renderPerBoxAndLeadTimePdfs(
      stores, products, config.output.dir, config.output.leadTimeFileNamePattern, campaignName
    );
  } else if (config.output.mode === 'perBox') {
    console.log(`Generating ${totalPages} pages across per-box PDFs...`);
    outputPaths = await renderPerBoxPdfs(stores, products, config.output.dir, config.output.boxFileNamePattern);
  } else {
    const outputFile = path.join(config.output.dir, config.output.combinedFileName);
    console.log(`Generating ${totalPages} pages (one combined PDF)...`);
    await renderCombinedPdf(stores, products, outputFile);
    outputPaths = [outputFile];
  }

  const localDeliveryPath = await renderLocalDeliveryTickets(stores, config.output.dir, config.output.localDeliveryTicketsFileName);
  if (localDeliveryPath) {
    console.log(`Generated local delivery tickets: ${localDeliveryPath}`);
    outputPaths.push(localDeliveryPath);
  }

  if (config.header.enabled) {
    console.log(`Applying header template (${config.header.file})...`);
    for (const p of outputPaths) await applyHeaderTemplate(p, config.header.file);
  }

  console.log(`Done. Wrote ${outputPaths.length} file(s):`);
  for (const p of outputPaths) console.log(`  ${p}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
