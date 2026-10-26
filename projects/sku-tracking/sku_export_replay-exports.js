// sku_export_replay.js
//
// Replaces the click-through-and-download part of all-skus-portalsync-v3.js.
// Instead of navigating PortalInformation/List -> BulkOps/Edit -> Download and
// waiting for a file to land on disk, this sends the same requests the admin
// UI sends (from inside your logged-in Chrome tab) and reads the .xlsx bytes
// straight into memory. The Google Sheets push at the end is line-for-line
// the same transform/upload logic as your original script, unchanged.
//
// WHY THIS WORKS: the "Download" button is actually a normal HTML form POST
// to /BulkOps/Edit that returns the .xlsx as a file attachment. Chrome's own
// download manager intercepts that when a real <form> submits, which is why
// the capture couldn't read the response body. But a fetch() call from
// inside the page is just JavaScript — it is NOT treated as a download, so
// we get the raw bytes back directly, no disk round-trip needed.
//
// FLOW PER PORTAL (mirrors the human steps exactly):
//   1. POST /PortalInformation/SetPortal/{portalId}   (sets the session's
//      current portal — same effect as searching + clicking the grid row,
//      just addressed by ID instead of by name+click)
//   2. GET  /BulkOps/Edit                              (page HTML; we pull
//      the __RequestVerificationToken out of it)
//   3. POST /BulkOps/Edit as multipart/form-data, with the exact same field
//      values a human's browser sends when: BulkOperations=SKUs,
//      DownloadOptions=5 ("inventory SKUs only"), all product types and
//      "AllProducts" checked, ExcelFileType=1 — i.e. never touching the
//      dropdown/checkboxes, replicating the defaults as captured.
//   -> response is the .xlsx bytes, loaded directly into ExcelJS.
//node sku_export_replay-exports.js --portal Mister --export Catalog
// USAGE
//   node sku_export_replay.js                 all 4 portals, push to Sheets
//   node sku_export_replay.js --portal Mister  just one portal
//   node sku_export_replay.js --dry-run        fetch + parse only, no Sheets push
//   node sku_export_replay.js --save-xlsx      also write each .xlsx to
//                                               <portal>\raw-data\ like the
//                                               old script did (off by default —
//                                               nothing touches disk unless asked)
//   node sku_export_replay.js --operation PortalProducts --portal Mister
//                                               PROBE an untested export type
//                                               (e.g. the "Products" list).
//                                               Any --operation besides SKUs
//                                               is automatically probe-only:
//                                               it fetches the file, prints
//                                               every worksheet's name and
//                                               its first 5 rows, saves a
//                                               copy to disk, and STOPS —
//                                               it never touches Google
//                                               Sheets and never even
//                                               attempts Google auth, no
//                                               matter what other flags are
//                                               passed. Use this to learn a
//                                               new export's shape before a
//                                               real transform gets built
//                                               for it.
//   node sku_export_replay.js --export Products
//                                               Run a REAL, configured export
//                                               from the EXPORTS registry
//                                               below (once you know its
//                                               shape — see the probe step
//                                               above). Add --dry-run to
//                                               fetch + report row counts
//                                               without writing to Sheets.
//                                               A new simple "pick these
//                                               columns" export needs only a
//                                               new EXPORTS entry, not new
//                                               code — see the comment next
//                                               to EXPORTS for how to add one.
//
// One portal failing (bad response, sheet push error) is logged and the
// script moves on to the next portal, same as auto_ship_replay.js.
//
// LOGGING: every console line also goes to sku_export_replay_log.txt
// (plain text, timestamped, RUN START/RUN END banners). Structured events
// (created/failed per portal) also go to sku_export_replay_log.jsonl.

const path = require('path');
const fs = require('fs');

const PRIME = 'C:\\projects\\';
const BASE = 'https://admin.marcomcentral.app.pti.com';
const SPREADSHEET_ID = '1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU';

// Portal IDs confirmed from a live GetPortalListAsync capture — addressing by
// ID skips the search-and-click step entirely.
const PORTALS = [
    { portalName: 'Mister', portalId: 14715 },
    { portalName: 'WestPressInventory', portalId: 5913 },
    { portalName: 'TMC', portalId: 23660 },
    { portalName: 'NorthwestMedicalCenter', portalId: 22321 },
];

// ---------- pluggable "simple column" exports ----------
// SKUs (above/below) needs hand-written logic: it parses a "Location:" string
// out of a description field and splits some portals into several sheet tabs
// by keyword. That stays as its own code. This EXPORTS registry is for
// everything simpler: "grab these columns by letter, skip N header rows,
// push to one range per portal." To add a new export once you know its
// shape (use --operation <BulkOperationsValue> to probe an unknown one
// first, per the header comment above), add ONE entry here — no other code
// changes needed. It becomes available immediately as --export <name>.
const EXPORTS = {
    Products: {
        bulkOperation: 'PortalProducts',      // value sent in the BulkOperations form field
        worksheetName: 'PortalProducts',      // worksheet name inside the downloaded .xlsx
        dataStartRow: 9,                      // row 7 = real headers, row 8 = Marcom's "do not
                                               // change or delete this row" template row, so
                                               // actual product rows start at row 9
        isPlaceholderRow: (row) => row[colLetterToIndex('A')] === -1, // belt-and-suspenders skip of that template row, by Product ID
        // DownloadOptions is a shared radio group across every BulkOperations
        // panel, so it's always submitted -- it's never actually omitted from
        // the real form. "5" ("Get Inventory SKUs") only makes sense for the
        // SKUs panel; a fresh, untouched page load has "0" ("Get Existing
        // Records") checked by default, confirmed straight from the page's
        // own HTML, and that's what Products (and anything else that isn't
        // SKUs) needs to send instead.
        fieldOverrides: { DownloadOptions: '0' },
        columns: [
            { letter: 'A', label: 'Product ID' },
            { letter: 'B', label: 'Product Name' },
            { letter: 'E', label: 'Product Type' },
            { letter: 'N', label: 'Product Created Date' },
            { letter: 'AX', label: 'Product Image' },
            { letter: 'CF', label: 'ExternalID' },
        ],
        // One Google Sheets range per portal you want this pushed to.
        // A portal with no entry here is simply skipped for this export.
        targets: {
            Mister: 'Mister Car Wash Products!A2',
        },
    },
    Catalog: {
        bulkOperation: 'Catalog',      // value sent in the BulkOperations form field
        worksheetName: 'Catalog',      // worksheet name inside the downloaded .xlsx
        dataStartRow: 8,                      // row 7 = real headers, row 8 = Marcom's "do not
                                               // change or delete this row" template row, so
                                               // actual product rows start at row 9
        //isPlaceholderRow: (row) => row[colLetterToIndex('A')] === -1, // belt-and-suspenders skip of that template row, by Product ID
        // DownloadOptions is a shared radio group across every BulkOperations
        // panel, so it's always submitted -- it's never actually omitted from
        // the real form. "5" ("Get Inventory SKUs") only makes sense for the
        // SKUs panel; a fresh, untouched page load has "0" ("Get Existing
        // Records") checked by default, confirmed straight from the page's
        // own HTML, and that's what Products (and anything else that isn't
        // SKUs) needs to send instead.
        fieldOverrides: { DownloadOptions: '0' },
        columns: [
            { letter: 'A', label: 'Folder ID' },
            { letter: 'B', label: 'Folder' },
            { letter: 'E', label: 'Product ID' },
            { letter: 'F', label: 'Product Name' },
            { letter: 'G', label: 'Group ID' },
            { letter: 'K', label: 'Node ID' },
        ],
        // One Google Sheets range per portal you want this pushed to.
        // A portal with no entry here is simply skipped for this export.
        targets: {
            Mister: 'Mister Car Wash Catalog!A2',
        },
    },
    
    // Next export goes here, e.g.:
    // Something: {
    //     bulkOperation: 'WhateverTheDropdownValueIs',
    //     worksheetName: 'NameInsideTheXlsx',
    //     dataStartRow: 2,
    //     fieldOverrides: {},  // { FieldName: 'value' } -- a radio/select field
    //                          // that's shared across every BulkOperations panel
    //                          // (like DownloadOptions) still gets submitted no
    //                          // matter which panel is showing, so it needs to
    //                          // be set to ITS OWN panel's real default, not left
    //                          // at whatever another operation's field list had.
    //                          // Find the true default by opening a fresh
    //                          // BulkOps/Edit page capture and looking for
    //                          // checked="checked" -- don't guess.
    //     omitFields: [],      // field names to leave out of the form entirely.
    //                          // Rarely needed -- only for a field that's truly
    //                          // specific to another panel and doesn't exist as
    //                          // a checked-by-default option here at all.
    //     columns: [ { letter: 'A', label: 'Foo' }, { letter: 'C', label: 'Bar' } ],
    //     targets: { Mister: 'Some Tab!A2' },
    // },
};

function colLetterToIndex(letter) {
    let n = 0;
    for (const ch of letter.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n;
}
function colIndexToLetter(n) {
    let s = '';
    while (n > 0) { const rem = (n - 1) % 26; s = String.fromCharCode(65 + rem) + s; n = Math.floor((n - 1) / 26); }
    return s;
}

const LOG_FILE = path.join(__dirname, 'sku_export_replay_log.jsonl');
const TEXT_LOG_FILE = path.join(__dirname, 'sku_export_replay_log.txt');

// ---------- command line ----------
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const DRY_RUN = has('--dry-run');
const SAVE_XLSX = has('--save-xlsx');
const ONLY_PORTAL = val('--portal');
const OPERATION = val('--operation') || 'SKUs';
const PROBE_MODE = OPERATION !== 'SKUs' && !val('--export'); // any --operation besides SKUs is unproven -> inspect only, never push
const EXPORT_NAME = val('--export'); // e.g. --export Products -- runs a configured EXPORTS entry for real

// ---------- logging ----------
const log = (obj) => fs.appendFileSync(LOG_FILE, JSON.stringify({ t: new Date().toISOString(), ...obj }) + '\n');
function report(msg) {
    console.log(msg);
    const stamped = String(msg).split('\n').map((l) => `[${new Date().toISOString()}] ${l}`).join('\n');
    fs.appendFileSync(TEXT_LOG_FILE, stamped + '\n');
}
function reportErr(msg) {
    console.error(msg);
    fs.appendFileSync(TEXT_LOG_FILE, `[${new Date().toISOString()}] ERROR: ${msg}\n`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- the exact form fields the browser sends (captured live) ----------
// One entry per field; duplicate names ARE duplicate multipart parts (that's
// how ASP.NET MVC receives a checkbox's hidden "false" + checked "true", and
// the multi-select ProductTypeId list). Order doesn't matter to the server,
// but is kept identical to the capture for safety.
function staticBulkOpsFields(bulkOperation, fieldOpts) {
    const { omit = [], overrides = {} } = fieldOpts || {};
    const skip = new Set(omit);
    const all = [
        ['EABetaF', ''],
        ['BulkOperations', bulkOperation],
        ['TextListId', ''],
        ['FieldType', ''],
        ['Options', 'download'],
        ['DownloadOptions', '5'],
        ['TextListName', ''],
        ['TextListNameVals', ''],
        ['TextListNameId', ''],
        ['AllProducts', 'true'],
        ['AllProducts', 'false'],
        ['ProductId4BulId', '0'],
        ['FilterById', '0'],
        ['CostCenterId', '0'],
        ['UserGroupId', '0'],
        ['ProductTypeId', 'IncludeStatic'],
        ['ProductTypeId', 'IncludePick'],
        ['ProductTypeId', 'IncludeVersioned'],
        ['ProductTypeId', 'IncludeVariable'],
        ['ProductTypeId', 'IncludeStaticWithAttribs'],
        ['ProductTypeId', 'IncludeStaticWithForm'],
        ['ProductTypeId', 'IncludePowerPoint'],
        ['ProductTypeId', 'IncludeHtml'],
        ['ProductTypeId', 'IncludeVideoBookEnd'],
        ['EntireCatalog', 'false'],
        ['CatalogFolderId', '0'],
        ['TopLevelOnly', 'false'],
        ['IncludeShippingMethods', 'false'],
        ['IncludeInactive', 'false'],
        ['AllTPAs', 'false'],
        ['TPAsId4get', ''],
        ['TPAsVals', ''],
        ['TPAsId', ''],
        ['AllImageCollections', 'false'],
        ['ImageCollectionId4get', ''],
        ['ImageCollectionsVals', ''],
        ['ImageCollectionsId', ''],
        ['LibraryImageSearchKeywords', 'false'],
        ['LibraryImageSearchKeywordsCollectionsVals', ''],
        ['LibraryImageSearchKeywordsCollectionsId', ''],
        ['AllLibraryTextListCollections', 'false'],
        ['LibraryTextListCollectionId4get', ''],
        ['LibraryTextListCollectionsVals', ''],
        ['LibraryTextListCollectionsId', ''],
        ['SortBy', '0'],
        ['ExcelFileType', '1'],
        ['section', '1'],
    ];
    const overridden = new Set();
    return all
        .filter(([name]) => !skip.has(name))
        .map(([name, value]) => {
            if (name in overrides && !overridden.has(name)) {
                overridden.add(name); // only replace the first occurrence -- fields like
                // AllProducts/ProductTypeId intentionally repeat and shouldn't all collapse to one value
                return [name, overrides[name]];
            }
            return [name, value];
        });
}

// ---------- helpers that run INSIDE the browser tab ----------

async function httpInPage(method, url, body, accept) {
    const headers = { 'X-Requested-With': 'XMLHttpRequest', 'Accept': accept };
    if (body !== null) headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    const res = await fetch(url, { method, headers, body: body === null ? undefined : body, credentials: 'same-origin' });
    return { status: res.status, finalUrl: res.url, text: await res.text() };
}

// Posts the SKU export form and returns the .xlsx bytes as base64 (fetch
// responses aren't directly JSON-serializable, so we base64 it here and
// decode back to a Buffer in Node).
async function postBulkOpsInPage(token, fields) {
    const fd = new FormData();
    fd.append('__RequestVerificationToken', token);
    for (const [name, value] of fields) fd.append(name, value);
    // Empty file inputs, exactly as the real form sends them
    fd.append('BulkOpUploadFile', new Blob([], { type: 'application/octet-stream' }), '');
    fd.append('fakeName_BulkOpUploadFile', '');
    fd.append('BulkOpZipFile', new Blob([], { type: 'application/octet-stream' }), '');
    fd.append('fakeName_BulkOpZipFile', '');

    const res = await fetch('/BulkOps/Edit', { method: 'POST', body: fd, credentials: 'same-origin' });
    const buf = await res.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return {
        status: res.status,
        finalUrl: res.url,
        contentType: res.headers.get('content-type'),
        contentDisposition: res.headers.get('content-disposition'),
        base64: btoa(binary),
    };
}

// ---------- Node-side helpers ----------

function guardSession(res, what) {
    if (/\/Account\/LogOn/i.test(res.finalUrl)) {
        throw new Error(`${what}: redirected to the login page. The session is not signed in.`);
    }
}

function extractToken(html) {
    const m = html.match(/name="__RequestVerificationToken"\s+type="hidden"\s+value="([^"]+)"/);
    if (!m) throw new Error('Could not find __RequestVerificationToken on the BulkOps/Edit page.');
    return m[1];
}

async function gotoSafe(page, url) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await page.goto(url, { waitUntil: 'load', timeout: 60000 });
            return;
        } catch (e) {
            if (!/ERR_ABORTED/.test(e.message) || attempt === 3) throw e;
            report(`Navigation was interrupted (attempt ${attempt}); retrying...`);
            await sleep(2000);
        }
    }
}

async function ensureSignedIn(page) {
    const target = `${BASE}/PortalInformation/List`;
    await gotoSafe(page, target);

    if (/\/Account\/LogOn/i.test(page.url())) {
        report('Signing in...');
        try {
            await page.waitForSelector('.primary-submit', { timeout: 10000 });
            await page.click('.primary-submit');
        } catch (e) {
            report('Could not find the sign-in button.');
        }
        const t0 = Date.now();
        while (Date.now() - t0 < 45000) {
            await sleep(500);
            if (!/\/Account\/LogOn/i.test(page.url())) break;
        }
        await sleep(2000);
        await gotoSafe(page, target);
    }
    if (/\/Account\/LogOn/i.test(page.url())) {
        throw new Error('Still on the login page after signing in. Sign in manually in that tab and run again.');
    }
    report(`On ${page.url()}`);
}

// Fetches one portal's export for the given BulkOperations value and returns
// an ExcelJS Workbook. `bulkOperation` is 'SKUs' for the proven path, or
// something else (e.g. 'PortalProducts') for an unproven, probe-only fetch.
async function fetchSkuWorkbook(page, Excel, portalId, bulkOperation, fieldOpts) {
    const setPortal = await page.evaluate(httpInPage, 'POST', `/PortalInformation/SetPortal/${portalId}`, null, '*/*');
    guardSession(setPortal, 'SetPortal');
    if (setPortal.status !== 200) throw new Error(`SetPortal/${portalId}: HTTP ${setPortal.status}`);

    const editPage = await page.evaluate(httpInPage, 'GET', '/BulkOps/Edit', null, 'text/html');
    guardSession(editPage, 'GET BulkOps/Edit');
    const token = extractToken(editPage.text);

    const result = await page.evaluate(postBulkOpsInPage, token, staticBulkOpsFields(bulkOperation, fieldOpts));
    guardSession(result, 'POST BulkOps/Edit (download)');
    if (result.status !== 200) throw new Error(`BulkOps/Edit download: HTTP ${result.status}`);
    if (!/attachment/i.test(result.contentDisposition || '') && !/xlsx|zip|spreadsheet/i.test(result.contentType || '')) {
        throw new Error(`BulkOps/Edit did not return a file. content-type=${result.contentType}, content-disposition=${result.contentDisposition}. ` +
            `This is expected if "${bulkOperation}" needs different form fields than SKUs does -- a real capture of that flow would be the next step.`);
    }

    const buf = Buffer.from(result.base64, 'base64');
    if (buf.length < 100) throw new Error(`Downloaded file is suspiciously small (${buf.length} bytes).`);

    const wb = new Excel.Workbook();
    await wb.xlsx.load(buf);
    return { wb, buf };
}

// ---------- transforms + Google Sheets push (unchanged from the original script) ----------

const clearSheet = async (gsapi, spreadsheetId, range) => {
    await gsapi.spreadsheets.values.clear({ spreadsheetId, range });
    report(`Cleared range ${range} in Google Sheet.`);
};

// Runs one EXPORTS registry entry for one portal: fetch, pick the configured
// columns by letter, push to the configured range. This is the whole engine
// behind --export <name> -- a new export needs a new EXPORTS entry, not new
// code here.
async function runGenericExport(gsapi, page, Excel, exportName, portalName, portalId, dryRun) {
    const def = EXPORTS[exportName];
    if (!def) throw new Error(`Unknown export "${exportName}". Known: ${Object.keys(EXPORTS).join(', ') || '(none configured yet)'}`);
    const target = def.targets[portalName];
    if (!target) {
        report(`  (no "${exportName}" target configured for ${portalName} -- skipping)`);
        return 0;
    }

    const { wb, buf } = await fetchSkuWorkbook(page, Excel, portalId, def.bulkOperation, { omit: def.omitFields, overrides: def.fieldOverrides });
    report(`Fetched "${exportName}" export for ${portalName}: ${buf.length} bytes.`);

    if (SAVE_XLSX) {
        const dir = path.join(__dirname, portalName, 'raw-data');
        fs.mkdirSync(dir, { recursive: true });
        const file = path.join(dir, `${portalName}-${exportName}.xlsx`);
        fs.writeFileSync(file, buf);
        report(`Saved a copy to ${file}`);
    }

    const ws = wb.getWorksheet(def.worksheetName);
    if (!ws) throw new Error(`Workbook has no "${def.worksheetName}" worksheet. Sheets found: ${wb.worksheets.map((w) => w.name).join(', ')}`);
    const raw = ws.getSheetValues(); // 1-based sparse array; raw[0] is unused
    report(`  Worksheet "${def.worksheetName}": ${raw.length - 1} total row(s) (incl. header/template rows), dataStartRow=${def.dataStartRow}.`);

    let rows = raw.slice(def.dataStartRow).filter((r) => r && r.length);
    report(`  After slicing from row ${def.dataStartRow}: ${rows.length} row(s).`);
    if (def.isPlaceholderRow) {
        rows = rows.filter((r) => !def.isPlaceholderRow(r));
        report(`  After placeholder filter: ${rows.length} row(s).`);
    }
    if (rows.length === 0 && raw.length - 1 >= def.dataStartRow) {
        report(`  NOTE: rows existed at/after row ${def.dataStartRow} but all were filtered out. If that's unexpected, ` +
            `the isPlaceholderRow rule or dataStartRow may not match this file -- worth saving a copy with --save-xlsx and opening it by hand.`);
    }

    const values = rows.map((row) => def.columns.map((c) => {
        const v = row[colLetterToIndex(c.letter)];
        return v === undefined || v === null ? '' : v;
    }));

    if (dryRun) {
        report(`(dry run) Would push ${values.length} row(s) to "${target}".`);
        return values.length;
    }

    const sheetName = target.split('!')[0];
    const lastCol = colIndexToLetter(def.columns.length);
    await clearSheet(gsapi, SPREADSHEET_ID, `${sheetName}!A2:${lastCol}`);
    await gsapi.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID, range: target, valueInputOption: 'USER_ENTERED', resource: { values },
    });
    report(`${exportName} / ${portalName}: pushed ${values.length} row(s) to "${target}".`);
    return values.length;
}

function extractLocation(fullSKUdescription) {
    let locationText = /Location:<\/b><\/span>(.*)/.exec(fullSKUdescription);
    if (!locationText) locationText = /Location:\s*(.*)/.exec(fullSKUdescription);
    return locationText ? locationText[1].trim() : '';
}
function extractLocationPipeVariant(fullSKUdescription) {
    let locationText = /Location:<\/b><\/span>(.*)/.exec(fullSKUdescription);
    if (!locationText) locationText = /\|\s*Location:\s*(.*)/.exec(fullSKUdescription);
    return locationText ? locationText[1].trim() : '';
}

async function pushMister(gsapi, rawData) {
    let data = rawData.map((r) => [r[2], r[3], extractLocation(r[4]), r[11], r[12], r[15], r[16], r[18]]);
    for (let i = 0; i < 8; i++) data.shift();

    await clearSheet(gsapi, SPREADSHEET_ID, 'Mister Car Wash!A2:H');
    await gsapi.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Mister Car Wash!A2',
        valueInputOption: 'USER_ENTERED',
        resource: { values: data },
    });
    report(`Mister: pushed ${data.length} row(s).`);
}

async function pushMisterproductID(gsapi, rawData) {
    let data = rawData.map((r) => [r[1], r[2], r[3], extractLocation(r[4]), r[11], r[12], r[15], r[16], r[18]]);
    for (let i = 0; i < 8; i++) data.shift();

    await clearSheet(gsapi, SPREADSHEET_ID, 'Mister Car Wash ProductID!A2:I');
    await gsapi.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Mister Car Wash ProductID!A2',
        valueInputOption: 'USER_ENTERED',
        resource: { values: data },
    });
    report(`Mister: pushed ${data.length} row(s).`);
}

async function pushWestPressInventory(gsapi, rawData) {
    let data = rawData.map((r) => {
        const fullSKUdescription = r[4];
        const locationInfo = extractLocationPipeVariant(fullSKUdescription);
        return [r[2], r[3], locationInfo, fullSKUdescription, r[11], r[12], r[15], r[16], r[18]];
    });
    for (let i = 0; i < 8; i++) data.shift();

    const pick = (row) => [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]];
    const groups = {
        'West Press Inventory': data.map(pick),
        'Sierra Tucson': data.filter((row) => row[1].includes('SIET')).map(pick),
        OPPM: data.filter((row) => row[1].includes('OPPM')).map(pick),
        PFCU: data.filter((row) => row[1].includes('PFCU')).map(pick),
        VWCU: data.filter((row) => row[1].includes('VW')).map(pick),
    };
    for (const range of Object.keys(groups)) await clearSheet(gsapi, SPREADSHEET_ID, `${range}!A2:H`);
    for (const [range, values] of Object.entries(groups)) {
        await gsapi.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID, range: `${range}!A2`, valueInputOption: 'USER_ENTERED', resource: { values },
        });
        report(`WestPressInventory / ${range}: pushed ${values.length} row(s).`);
    }
}

async function pushTMC(gsapi, rawData) {
    let data = rawData.map((r) => {
        const fullSKUdescription = r[4];
        const locationInfo = extractLocationPipeVariant(fullSKUdescription);
        return [r[2], r[3], locationInfo, fullSKUdescription, r[11], r[12], r[15], r[16], r[18]];
    });
    for (let i = 0; i < 8; i++) data.shift();

    const pick = (row) => [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]];
    const groups = {
        TMC: data.map(pick),
        'TMC Forms': data.filter((row) => row[3].includes('MISC TMC FORMS')).map(pick),
        'TMC Comm Outreach PRINT': data.filter((row) => row[3].includes('MISC TMC COMM OUT PRINT')).map(pick),
        'TMC Comm Outreach PROMO': data.filter((row) => row[3].includes('MISC TMC COMM OUT PROMOS')).map(pick),
        'TMC Communications': data.filter((row) => row[3].includes('TMC Communications')).map(pick),
        'TMC Foundation': data.filter((row) => row[3].includes('TMC Foundation')).map(pick),
        'TMC Seniors': data.filter((row) => row[3].includes('TMC Seniors')).map(pick),
        'TMC Wellness': data.filter((row) => row[3].includes('TMC Wellness')).map(pick),
        'TMC Women & Children': data.filter((row) => row[3].includes('TMC WOMEN & CHILDREN')).map(pick),
    };
    for (const range of Object.keys(groups)) await clearSheet(gsapi, SPREADSHEET_ID, `${range}!A2:H`);
    for (const [range, values] of Object.entries(groups)) {
        await gsapi.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID, range: `${range}!A2`, valueInputOption: 'USER_ENTERED', resource: { values },
        });
        report(`TMC / ${range}: pushed ${values.length} row(s).`);
    }
}

async function pushNorthwestMedicalCenter(gsapi, rawData) {
    let data = rawData.map((r) => [r[2], r[3], extractLocationPipeVariant(r[4]), r[11], r[12], r[15], r[16], r[18]]);
    for (let i = 0; i < 8; i++) data.shift();

    await clearSheet(gsapi, SPREADSHEET_ID, 'Northwest Medical Center!A2:H');
    await gsapi.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Northwest Medical Center!A2',
        valueInputOption: 'USER_ENTERED',
        resource: { values: data },
    });
    report(`NorthwestMedicalCenter: pushed ${data.length} row(s).`);
}

const PUSHERS = {
    Mister: pushMister,
    WestPressInventory: pushWestPressInventory,
    TMC: pushTMC,
    NorthwestMedicalCenter: pushNorthwestMedicalCenter,
};

// ---------- main ----------

async function main() {
    const os = require('os');
    const puppeteer = require(`${PRIME}node_modules\\puppeteer`);
    const { google } = require(`${PRIME}node_modules\\googleapis`);
    const Excel = require(`${PRIME}node_modules\\exceljs`);

    const userName = os.userInfo().username;
    const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);
    const googleKeys = require(`${__dirname}\\..\\keys\\googleapi_keys_portalsync.json`);

    if (EXPORT_NAME && !EXPORTS[EXPORT_NAME]) {
        reportErr(`Unknown --export "${EXPORT_NAME}". Known exports: ${Object.keys(EXPORTS).join(', ') || '(none configured yet)'}`);
        process.exit(1);
    }

    report('='.repeat(70));
    report(`RUN START  mode=${EXPORT_NAME ? `EXPORT ${EXPORT_NAME}` : (DRY_RUN ? 'DRY RUN (no Sheets push)' : 'PUSH TO SHEETS')}  portal=${ONLY_PORTAL || 'all'}  operation=${EXPORT_NAME ? EXPORTS[EXPORT_NAME].bulkOperation : OPERATION}  saveXlsx=${SAVE_XLSX}`);
    if (PROBE_MODE) {
        report(`PROBE MODE: operation "${OPERATION}" is unproven. This run will fetch and INSPECT ONLY.`);
        report(`No data will be pushed to Google Sheets, and no Google auth will even be attempted, regardless of other flags.`);
    }

    let gsapi = null;
    if (!DRY_RUN && !PROBE_MODE) {
        const client = new google.auth.JWT(googleKeys.client_email, null, googleKeys.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
        await new Promise((resolve, reject) => client.authorize((err) => (err ? reject(err) : resolve())));
        gsapi = google.sheets({ version: 'v4', auth: client });
        report('Connected to Google Sheets.');
    }

    const browser = await puppeteer.connect({ browserWSEndpoint: keys.jsonURL, defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find((p) => p.url().startsWith(BASE));
    if (!page) page = await browser.newPage();
    await page.bringToFront();
    page.setDefaultNavigationTimeout(0);

    await ensureSignedIn(page);

    const portals = PORTALS.filter((p) => {
        if (ONLY_PORTAL) return p.portalName === ONLY_PORTAL;
        if (EXPORT_NAME) return Boolean(EXPORTS[EXPORT_NAME].targets[p.portalName]);
        return true;
    });
    const failedPortals = [];

    for (const { portalName, portalId } of portals) {
        report(`\n=== ${portalName} (portal ${portalId}) ===`);
        try {
            if (EXPORT_NAME) {
                const rowCount = await runGenericExport(gsapi, page, Excel, EXPORT_NAME, portalName, portalId, DRY_RUN);
                log({ event: 'exported', export: EXPORT_NAME, portalName, rows: rowCount });
                continue;
            }

            const { wb, buf } = await fetchSkuWorkbook(page, Excel, portalId, OPERATION);
            report(`Fetched "${OPERATION}" export for ${portalName}: ${buf.length} bytes.`);

            // Always keep a copy in probe mode, even without --save-xlsx, since
            // this is the whole point of probing: go look at the real file.
            if (SAVE_XLSX || PROBE_MODE) {
                const dir = path.join(__dirname, portalName, 'raw-data');
                fs.mkdirSync(dir, { recursive: true });
                const suffix = PROBE_MODE ? `-${OPERATION}-PROBE` : '';
                const file = path.join(dir, `${portalName}-SKUs${suffix}.xlsx`);
                fs.writeFileSync(file, buf);
                report(`Saved a copy to ${file}`);
            }

            if (PROBE_MODE) {
                report(`Worksheets found: ${wb.worksheets.map((w) => `"${w.name}" (${w.rowCount} rows, ${w.columnCount} cols)`).join(', ')}`);
                for (const sheet of wb.worksheets) {
                    report(`--- First 5 rows of "${sheet.name}" ---`);
                    for (let r = 1; r <= Math.min(5, sheet.rowCount); r++) {
                        const values = sheet.getRow(r).values; // sparse array, index 0 unused
                        report(`  row ${r}: ${JSON.stringify(values)}`);
                    }
                }
                report(`(probe only -- nothing pushed to Sheets. Send this output back so the real transform can be built.)`);
                log({ event: 'probed', portalName, operation: OPERATION, worksheets: wb.worksheets.map((w) => w.name) });
                continue;
            }

            const ws = wb.getWorksheet('SKUs');
            if (!ws) throw new Error(`Workbook has no "SKUs" worksheet. Sheets found: ${wb.worksheets.map((w) => w.name).join(', ')}`);
            const rawData = ws.getSheetValues();
            report(`Worksheet "SKUs" has ${rawData.length - 1} data row(s) (before the header-strip your transform does).`);

            if (DRY_RUN) {
                report(`(dry run) Would push ${portalName} to its Google Sheet tab(s) now.`);
                log({ event: 'dry_run', portalName, rows: rawData.length });
            } else {
                await PUSHERS[portalName](gsapi, rawData);
                log({ event: 'pushed', portalName, rows: rawData.length });
            }
        } catch (e) {
            reportErr(`  ${portalName} FAILED: ${e.message}`);
            log({ event: 'portal_failed', portalName, error: e.message });
            failedPortals.push(portalName);
        }
    }

    report(`\nDone. ${failedPortals.length ? `Failed: ${failedPortals.join(', ')}` : 'All portals succeeded.'}`);
    report(`RUN END  result=${failedPortals.length ? 'PARTIAL FAILURE' : 'OK'}`);
    report('='.repeat(70));
    await browser.disconnect();
    process.exit(failedPortals.length ? 1 : 0);
}

if (require.main === module) {
    main().catch((e) => {
        reportErr('STOPPED: ' + e.message);
        report('RUN END  result=CRASHED');
        report('='.repeat(70));
        process.exit(1);
    });
} else {
    module.exports = { staticBulkOpsFields, extractToken, extractLocation, extractLocationPipeVariant, colLetterToIndex, colIndexToLetter, EXPORTS };
}
