// mcw_monthly_report.js
//
// Standalone script for the "MCW Monthly Report" under Reports/Edit. Fetches
// the Excel export directly instead of clicking through Saved tab -> report
// -> dates -> Export -> format picker -> waiting on a Save As dialog.
//
// WHAT THIS PAGE ACTUALLY IS: Reports/Edit embeds an iframe on a totally
// different subdomain (global.marcomcentral.app.pti.com), running classic
// ASP.NET WebForms with VIEWSTATE-based AJAX postbacks -- a different,
// older technology than the admin.marcomcentral.app.pti.com pages the other
// scripts in this project talk to. Every step resends the page's full
// hidden-field state (a VIEWSTATE blob), and each response hands back an
// UPDATED VIEWSTATE that the next step must carry forward -- so unlike the
// SKUs/Products/packing-slip scripts, this can't collapse to one request.
// It's about 5 chained requests instead.
//
// KEY DETAIL: not every step is an AJAX postback. Typing into a date field
// is (the response is a "delta"), but Run, Close and Export are ordinary
// full-page form posts -- no __ASYNCPOST, no ctl00$ScriptManager -- and the
// server answers with a whole HTML page. Export's popup-opening script only
// exists in that full-page response, so sending Export as an AJAX postback
// quietly returns nothing useful. The script tries Export directly first
// and only falls back to Run -> Close -> re-enter dates -> Export if that
// produces no export URL, and logs which path worked.
//
// THE CHAIN (each one verified against two real captures before this was
// written, not guessed):
//   1. GET  Reports/Edit (admin site) -> its HTML contains the iframe's src,
//      which includes a fresh token minted for this admin session.
//   2. The iframe loads ReportMain.aspx at that URL. Its OWN rendered HTML
//      contains a DIFFERENT token, in a hidden "authenticationString" field
//      -- that's the one that matters for every step after this; the URL's
//      token is only used to get here.
//   3. POST ReportMain.aspx, __EVENTTARGET=...lnkSavedReports (open the
//      Saved tab)
//   4. POST ReportMain.aspx, __EVENTTARGET=...lboxSavedReports=25700
//      (select "MCW Monthly Report" -- 25700 is that report's fixed ID)
//   5. POST ReportMain.aspx, __EVENTTARGET=...dateTo$txtInput, with both
//      dateFrom and dateTo set to the range we want
//   6. POST ReportMain.aspx, __EVENTTARGET=...btnRun -- REQUIRED before
//      Export. Confirmed from a real capture: Export only works on a report
//      that has already been run. Skipping this produces no error -- Export
//      just silently re-renders the selection panel instead of exporting.
//   7. POST ReportMain.aspx, __EVENTTARGET=...btnExport -- the response
//      contains a plain embedded URL to ExportReport.aspx with a SECOND,
//      export-specific token
//   8. GET that ExportReport.aspx URL -> its own small VIEWSTATE (a
//      separate, independent one from steps 3-7 -- this is a different
//      page/form)
//   9. POST that same URL, __EVENTTARGET=...btnOk, format=rbExcel,
//      ddlExcelType=xlsx -- the response contains a plain embedded URL to
//      ExportOutput.aspx
//  10. GET that ExportOutput.aspx URL -> this IS the .xlsx file, as bytes.
//      Fetched via fetch() rather than a real navigation, so Chrome's
//      download manager never intercepts it (same trick used for the
//      BulkOps/SKUs export) -- no Save As dialog, no popup window, nothing
//      to wait on.
//
// Steps 3-6 all run inside the iframe's own JS context (same-origin fetches
// against global.marcomcentral.app.pti.com -- a fetch from the admin page
// itself would be cross-origin and likely blocked). loading.html, which you
// see between steps in the real browser, is just a decorative progress
// graphic for the UpdateProgress control -- the POST's response already IS
// the finished result, so this script never polls it.
//
// USAGE
//   node mcw_monthly_report.js --from 9/1/2026 --to 9/30/2026
//   node mcw_monthly_report.js --from 9/1/2026 --to 9/30/2026 --save-xlsx
//   node mcw_monthly_report.js --from 9/1/2026 --to 9/30/2026 --portal 14715
//
//   node mcw_monthly_report.js --rolling-year
//       Date range computed from today: "1 year ago from yesterday" through
//       "yesterday" (e.g. run on 10/27/2026 -> 10/26/2025 to 10/26/2026).
//       Can't be combined with --from/--to.
//   node mcw_monthly_report.js --rolling-year --push
//       Same, then writes the report's rows (header + data) to a Google Sheet
//       tab, replacing what was there. Without --push nothing is written to
//       Sheets. The tab must already exist: "MCW Order History" by default,
//       or pass --sheet-tab "Name". --spreadsheet-id overrides the
//       spreadsheet. Which columns are written, and which are treated as
//       dates, is set by SHEET_COLUMNS / DATE_COLUMNS near the top.
//   (A report with zero rows never overwrites the sheet.)
//
// Dates: M/D/YYYY, no leading zeros, matching the site's own format exactly
// (that's what was captured; leading zeros are untested).
// --portal: the store/portal dropdown's ID. Defaults to 14715 (Mister Car
// Wash), which is this report's own default. Pass a different numeric
// portal ID to run it for another portal later.
// --save-xlsx: also write the fetched file to ./raw-data/ -- off by
// default, same convention as the other scripts in this project.
//
// This script only fetches and saves the file -- it does not push to Google
// Sheets yet. Once there's a column spec for what should land in a sheet,
// that's a small addition, following the same EXPORTS-style pattern as
// sku_export_replay.js.
//
// LOGGING: every console line also goes to mcw_monthly_report_log.txt,
// timestamped, same convention as the other scripts in this project.

const path = require('path');
const fs = require('fs');

const PRIME = 'C:\\projects\\';
const ADMIN_BASE = 'https://admin.marcomcentral.app.pti.com';
//const REPORT_ID = '25700'; // "MCW Monthly Report" -- fixed, doesn't change with dates/portal
const REPORT_ID = '27381';
const TEXT_LOG_FILE = path.join(__dirname, 'mcw_monthly_report_log.txt');
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

// Always saves a response, labeled by step -- not just on failure -- so a
// future problem anywhere in the chain gives the full trail in one run
// instead of needing another round trip.
let DUMP_DIR = null;
function dumpResponse(label, text) {
    if (!DUMP_DIR) {
        DUMP_DIR = path.join(__dirname, `run_${Date.now()}`);
        fs.mkdirSync(DUMP_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(DUMP_DIR, `${label}.txt`), text);
}

// ---------- command line ----------
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const PORTAL_ID = val('--portal') || '14715'; // Mister Car Wash, this report's own default
const SAVE_XLSX = has('--save-xlsx');
const PUSH = has('--push');
const SHEET_TAB = val('--sheet-tab') || 'MCW Order History';
const SPREADSHEET_ID = val('--spreadsheet-id') || '1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU';
const ROLLING_YEAR = has('--rolling-year');

// Dates are M/D/YYYY with no leading zeros -- the site's own format.
const fmtDate = (d) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

// "1 year ago from yesterday" through "yesterday", based on this machine's
// local date. (A Feb 29 yesterday maps to Feb 28 of the previous year.)
function rollingYearRange() {
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    let start = new Date(yesterday.getFullYear() - 1, yesterday.getMonth(), yesterday.getDate());
    if (start.getMonth() !== yesterday.getMonth()) {
        start = new Date(yesterday.getFullYear() - 1, yesterday.getMonth() + 1, 0);
    }
    return [fmtDate(start), fmtDate(yesterday)];
}

let FROM_DATE = val('--from');
let TO_DATE = val('--to');
if (ROLLING_YEAR) {
    if (FROM_DATE || TO_DATE) {
        console.error('Use either --rolling-year or --from/--to, not both.');
        process.exit(1);
    }
    [FROM_DATE, TO_DATE] = rollingYearRange();
}

if (!FROM_DATE || !TO_DATE) {
    console.error('Usage: node mcw_monthly_report.js (--rolling-year | --from M/D/YYYY --to M/D/YYYY) [--portal ID] [--push] [--sheet-tab NAME] [--save-xlsx]');
    process.exit(1);
}

// What goes to the Google Sheet: these report columns, matched by their
// header text in row 1 of the downloaded file (so a reordered report can't
// silently shift data into the wrong column). Remove a name to drop that
// column. Columns in DATE_COLUMNS are written as plain dates (M/D/YYYY,
// time of day dropped) so sheet formulas can compare them to TODAY().
const SHEET_COLUMNS = ['Order Number', 'Order Date', 'Purchaser', 'Product Name', 'SKU', 'Cost Center',
    'Qty Ordered', 'Status', 'Product Description', 'Ship Date', 'Qty Shipped'];
const DATE_COLUMNS = new Set(['Order Date', 'Ship Date']);

// ---------- helpers that run INSIDE the iframe's JS context ----------
// (page.evaluate/frame.evaluate send these as source text -- each must be
// fully self-contained, no closures over outer variables)

async function fetchInFrame(method, url, body, accept) {
    const headers = { 'X-Requested-With': 'XMLHttpRequest', Accept: accept };
    if (body !== null) headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    const res = await fetch(url, { method, headers, body: body === null ? undefined : body, credentials: 'same-origin' });
    return { status: res.status, finalUrl: res.url, text: await res.text() };
}

// A plain, non-AJAX form post -- what the browser does for a normal
// <form> submit. Run, Close and Export are NOT async postbacks in the real
// page: they carry no __ASYNCPOST / ctl00$ScriptManager, send no
// X-Requested-With header, and the server answers with a whole HTML page
// (not the AJAX "delta" format the date fields get).
async function fullPostInFrame(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        body,
        credentials: 'same-origin',
    });
    return { status: res.status, finalUrl: res.url, text: await res.text() };
}

async function fetchBinaryInFrame(url) {
    const res = await fetch(url, { method: 'GET', credentials: 'same-origin' });
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return {
        status: res.status,
        contentType: res.headers.get('content-type'),
        contentDisposition: res.headers.get('content-disposition'),
        base64: btoa(binary),
    };
}

function readHiddenFieldsInFrame() {
    const get = (id) => { const el = document.getElementById(id); return el ? el.value : null; };
    return {
        viewstate: get('__VIEWSTATE'),
        viewstategenerator: get('__VIEWSTATEGENERATOR'),
        eventvalidation: get('__EVENTVALIDATION'),
        authenticationString: get('authenticationString'),
    };
}

// ---------- Node-side helpers ----------

// Extracts an updated hidden-field value from an ASP.NET AJAX partial-
// postback "delta" response. The wire format is length-prefixed segments
// like "N|hiddenField|__VIEWSTATE|<N-byte value>|", but __VIEWSTATE/
// __VIEWSTATEGENERATOR are plain base64 (no '|' possible in that alphabet),
// so a direct regex match is safe and was verified against real captures.
function extractDeltaField(text, name) {
    const m = text.match(new RegExp(`\\|hiddenField\\|${name}\\|([^|]*)\\|`));
    return m ? m[1] : null;
}

function mergeFieldUpdate(state, deltaText) {
    const vs = extractDeltaField(deltaText, '__VIEWSTATE');
    const vg = extractDeltaField(deltaText, '__VIEWSTATEGENERATOR');
    if (vs) state.viewstate = vs;
    if (vg) state.viewstategenerator = vg;
}

function buildReportMainBody(state, scriptManagerTarget, eventTarget, extra) {
    const p = new URLSearchParams();
    // Verified against real captures: panel-scoped postbacks (typing into a
    // date field) send ctl00$ScriptManager; button clicks (Run, Close,
    // Export) genuinely omit it entirely -- not just "a different value",
    // actually absent. Pass null for those. Sending it anyway on a button
    // click is what made Export silently no-op instead of erroring.
    if (scriptManagerTarget !== null) p.append('ctl00$ScriptManager', scriptManagerTarget);
    p.append('authenticationString', state.authenticationString);
    for (const [k, v] of Object.entries(extra)) p.append(k, v);
    p.append('__EVENTTARGET', eventTarget);
    p.append('__EVENTARGUMENT', '');
    p.append('__LASTFOCUS', '');
    p.append('__VIEWSTATE', state.viewstate);
    p.append('__VIEWSTATEGENERATOR', state.viewstategenerator);
    p.append('__ASYNCPOST', 'true');
    return p.toString();
}

// Body for a full (non-async) postback. No ScriptManager, no __ASYNCPOST.
// Close sends only the bare minimum (no __LASTFOCUS, no report fields);
// Run and Export send the full report field set plus __LASTFOCUS --
// both confirmed field-for-field against real captures.
function buildFullPostBody(state, eventTarget, extra, includeLastFocus) {
    const p = new URLSearchParams();
    p.append('authenticationString', state.authenticationString);
    for (const [k, v] of Object.entries(extra)) p.append(k, v);
    p.append('__EVENTTARGET', eventTarget);
    p.append('__EVENTARGUMENT', '');
    if (includeLastFocus) p.append('__LASTFOCUS', '');
    p.append('__VIEWSTATE', state.viewstate);
    p.append('__VIEWSTATEGENERATOR', state.viewstategenerator);
    return p.toString();
}

// A full-page response carries its state as ordinary hidden inputs (not the
// "|hiddenField|" delta segments the async responses use).
function mergeFullPageState(state, html) {
    const pick = (id) => {
        const m = html.match(new RegExp(`id="${id}"[^>]*value="([^"]*)"`));
        return m ? m[1] : null;
    };
    const vs = pick('__VIEWSTATE');
    const vg = pick('__VIEWSTATEGENERATOR');
    const auth = pick('authenticationString');
    if (vs) state.viewstate = vs;
    if (vg) state.viewstategenerator = vg;
    if (auth) state.authenticationString = auth.replace(/&amp;/g, '&');
    return Boolean(vs);
}

function guardSession(res, what) {
    if (/\/Account\/LogOn/i.test(res.finalUrl || '')) {
        throw new Error(`${what}: redirected to the login page. The session is not signed in.`);
    }
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
    const target = `${ADMIN_BASE}/Reports/Edit`;
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

async function findReportFrame(page) {
    for (let attempt = 0; attempt < 20; attempt++) {
        const frame = page.frames().find((f) => f.url().includes('ReportMain.aspx'));
        if (frame) return frame;
        await sleep(500);
    }
    throw new Error('The Reports iframe (ReportMain.aspx) never appeared on the page.');
}

// ---------- turning the report into sheet rows, and pushing them ----------

// Excel dates arrive as JS Dates holding the file's face value in UTC fields,
// so read them with the UTC getters (local getters could shift the day).
const fmtCellDate = (d) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;

function reportToSheetRows(ws) {
    const headerRow = ws.getRow(1).values; // 1-based sparse array
    const colIndex = {};
    SHEET_COLUMNS.forEach((name) => {
        const idx = headerRow.findIndex((h) => typeof h === 'string' && h.trim() === name);
        if (idx < 0) {
            throw new Error(`The report has no "${name}" column (found: ${headerRow.filter(Boolean).join(', ')}). The report layout may have changed.`);
        }
        colIndex[name] = idx;
    });

    const rows = [];
    let minOrder = null, maxOrder = null;
    for (let r = 2; r <= ws.rowCount; r++) {
        const vals = ws.getRow(r).values;
        if (!vals || !vals[colIndex['Order Number']]) continue; // blank/stray row
        rows.push(SHEET_COLUMNS.map((name) => {
            let v = vals[colIndex[name]];
            if (v === undefined || v === null) return '';
            if (v instanceof Date) {
                if (name === 'Order Date') {
                    if (!minOrder || v < minOrder) minOrder = v;
                    if (!maxOrder || v > maxOrder) maxOrder = v;
                }
                return DATE_COLUMNS.has(name) ? fmtCellDate(v) : v.toISOString();
            }
            if (typeof v === 'object') return v.text || v.result || String(v); // rich text / formula cells
            return v;
        }));
    }
    return { header: SHEET_COLUMNS.slice(), rows, minOrder, maxOrder };
}

async function pushToSheet(gsapi, header, rows) {
    // Make sure the tab exists first, with a clear message instead of an API error.
    const meta = await gsapi.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID, fields: 'sheets.properties.title' });
    const tabs = meta.data.sheets.map((sh) => sh.properties.title);
    if (!tabs.includes(SHEET_TAB)) {
        throw new Error(`The spreadsheet has no tab named "${SHEET_TAB}". Create it (or pass --sheet-tab "Existing Tab Name"). Tabs found: ${tabs.join(', ')}`);
    }

    //const values = [header, ...rows];
    const lastCol = colIndexToLetter(header.length);

    // Write the new data first, THEN clear whatever is left below it, so a
    // failure part-way never leaves the tab empty.
    // A year of orders can be tens of thousands of rows -- too much for one
    // API request -- so write in chunks.
    const values = rows;
const CHUNK = 2000;

for (let i = 0; i < values.length; i += CHUNK) {
    await gsapi.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${SHEET_TAB}'!A:Z`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: values.slice(i, i + CHUNK) },
    });
}

report(`Appended ${rows.length} data row(s) to "${SHEET_TAB}".`);
}

function colIndexToLetter(n) {
    let s = '';
    while (n > 0) { const rem = (n - 1) % 26; s = String.fromCharCode(65 + rem) + s; n = Math.floor((n - 1) / 26); }
    return s;
}

// ---------- main ----------

async function main() {
    const os = require('os');
    const puppeteer = require(`${PRIME}node_modules\\puppeteer`);
    const Excel = require(`${PRIME}node_modules\\exceljs`);

    const userName = os.userInfo().username;
    const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

    report('='.repeat(70));
    report(`RUN START  from=${FROM_DATE}  to=${TO_DATE}${ROLLING_YEAR ? ' (rolling year ending yesterday)' : ''}  portal=${PORTAL_ID}  push=${PUSH ? `yes -> "${SHEET_TAB}"` : 'no'}  saveXlsx=${SAVE_XLSX}`);

    const browser = await puppeteer.connect({ browserWSEndpoint: keys.jsonURL, defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find((p) => p.url().startsWith(ADMIN_BASE));
    if (!page) page = await browser.newPage();
    await page.bringToFront();
    page.setDefaultNavigationTimeout(0);

    await ensureSignedIn(page);
    const frame = await findReportFrame(page);
    report(`Found the report iframe: ${frame.url()}`);

    // Starting state, read straight from the iframe's own rendered DOM --
    // no extra GET needed, it's already loaded.
    const state = await frame.evaluate(readHiddenFieldsInFrame);
    if (!state.viewstate || !state.authenticationString) {
        throw new Error('Could not read the report iframe\'s starting VIEWSTATE/authenticationString. The page layout may have changed.');
    }
    report('Read starting session state from the iframe.');

    // Step 1: open the Saved tab. The date/portal fields already exist on the
    // page (with whatever defaults it loaded with) even before a report is
    // picked, and a real postback resends them -- confirmed against a real
    // capture, where omitting them was the one gap testing caught here.
    let res = await frame.evaluate(
        fetchInFrame, 'POST', frame.url(),
        buildReportMainBody(state, 'ctl00$content$UpdatePanelMain|ctl00$content$ReportCreator$ReportSelector1$lnkSavedReports',
            'ctl00$content$ReportCreator$ReportSelector1$lnkSavedReports', {
                saveRefresh: 'false',
                'ctl00$content$ReportCreator$CustomParameters1$dateFrom$txtInput': FROM_DATE,
                'ctl00$content$ReportCreator$CustomParameters1$dateTo$txtInput': TO_DATE,
                'ctl00$content$ReportCreator$CustomParameters1$ddlStore': '-1',
                'ctl00$content$ReportCreator$CustomParameters1$ddlSupplier': '-1',

                'ctl00$content$ReportCreator$CustomParameters1$chkShowInactive': 'checked',


            }),
        '*/*',
    );
    guardSession(res, 'Open Saved tab');
    dumpResponse('1_open_saved_tab', res.text);
    mergeFieldUpdate(state, res.text);
    report('Step 1/6: opened the Saved tab.');

    // Step 2: select "MCW Monthly Report"
    res = await frame.evaluate(
        fetchInFrame, 'POST', frame.url(),
        buildReportMainBody(state, 'ctl00$content$UpdatePanelMain|ctl00$content$ReportCreator$ReportSelector1$lboxSavedReports',
            'ctl00$content$ReportCreator$ReportSelector1$lboxSavedReports',
            {
                saveRefresh: 'false',
                'ctl00$content$ReportCreator$ReportSelector1$lboxSavedReports': REPORT_ID,
                'ctl00$content$ReportCreator$CustomParameters1$dateFrom$txtInput': FROM_DATE,
                'ctl00$content$ReportCreator$CustomParameters1$dateTo$txtInput': TO_DATE,
                'ctl00$content$ReportCreator$CustomParameters1$ddlStore': '-1',
                'ctl00$content$ReportCreator$CustomParameters1$ddlSupplier': '-1',
            }),
        '*/*',
    );
    guardSession(res, 'Select MCW Monthly Report');
    dumpResponse('2_select_report', res.text);
    mergeFieldUpdate(state, res.text);
    report('Step 2/6: selected "MCW Monthly Report".');

    // Step 3: set the date range + portal. These column checkboxes/sort
    // field are MCW Monthly Report's own defaults (confirmed from a real
    // session) -- a different saved report would need its own set.
    const reportFields = {
        saveRefresh: 'false',
        'ctl00$content$ReportCreator$ReportSelector1$lboxSavedReports': REPORT_ID,
        col__order_no_chk: 'on', col__order_date_chk: 'on', col__purchaser_user_name_chk: 'on',
        col__product_name_chk: 'on', col__sku_chk: 'on', col__cost_center_chk: 'on',
        col__qty_ordered_chk: 'on', col__status_chk: 'on', col__product_desc_chk: 'on',
        col__ship_date_chk: 'on', col__qty_shipped_chk: 'on',
        rdSortBy: 'col__product_id',
        'ctl00$content$ReportCreator$CustomParameters1$dateFrom$txtInput': FROM_DATE,
        'ctl00$content$ReportCreator$CustomParameters1$dateTo$txtInput': TO_DATE,
        'ctl00$content$ReportCreator$CustomParameters1$ddlStore': PORTAL_ID,
        'ctl00$content$ReportCreator$CustomParameters1$ddlSupplier': '-1',
    };
    // __EVENTTARGET determines which control's SERVER-SIDE event handler
    // actually runs in ASP.NET WebForms -- including dateFrom's value in a
    // postback targeted at dateTo does NOT fire dateFrom's own change
    // handler. The real session fired these as two separate, individually
    // targeted postbacks; a single combined one may silently skip whatever
    // dateFrom's handler does server-side (possibly the thing Export checks).
    res = await frame.evaluate(
        fetchInFrame, 'POST', frame.url(),
        buildReportMainBody(state, 'ctl00$content$ReportCreator$CustomParameters1$dateFrom$pnlContainer|ctl00$content$ReportCreator$CustomParameters1$dateFrom$txtInput',
            'ctl00$content$ReportCreator$CustomParameters1$dateFrom$txtInput', reportFields),
        '*/*',
    );
    guardSession(res, 'Set dateFrom');
    dumpResponse('3a_set_datefrom', res.text);
    mergeFieldUpdate(state, res.text);
    report(`Step 3a/6: set dateFrom = ${FROM_DATE}.`);

    res = await frame.evaluate(
        fetchInFrame, 'POST', frame.url(),
        buildReportMainBody(state, 'ctl00$content$ReportCreator$CustomParameters1$dateTo$pnlContainer|ctl00$content$ReportCreator$CustomParameters1$dateTo$txtInput',
            'ctl00$content$ReportCreator$CustomParameters1$dateTo$txtInput', reportFields),
        '*/*',
    );
    guardSession(res, 'Set dateTo');
    dumpResponse('3b_set_dateto', res.text);
    mergeFieldUpdate(state, res.text);
    report(`Step 3b/6: set dateTo = ${TO_DATE}, portal ${PORTAL_ID}.`);

    // Run, Close and Export are full-page postbacks (see fullPostInFrame).
    // Same report fields as the async steps, minus rdSortBy -- the real Run
    // and Export requests don't send it.
    const fullFields = { ...reportFields };
    delete fullFields.rdSortBy;

    const fullPost = async (label, dumpName, eventTarget, extra, includeLastFocus) => {
        const r = await frame.evaluate(fullPostInFrame, frame.url(),
            buildFullPostBody(state, eventTarget, extra, includeLastFocus));
        guardSession(r, label);
        dumpResponse(dumpName, r.text);
        if (!mergeFullPageState(state, r.text)) {
            report(`  (note: ${label} response had no VIEWSTATE field -- keeping the previous one)`);
        }
        return r;
    };

    // Clicks Export and looks for the ExportReport.aspx URL it embeds.
    const tryExport = async (dumpName) => {
        const r = await fullPost('Click Export', dumpName,
            'ctl00$content$ReportFooter$btnExport', fullFields, true);
        const m = r.text.match(/ExportReport\.aspx\?[^'"]+/);
        return m ? new URL(m[0], frame.url()).toString() : null;
    };

    // Step 4: try Export straight away, as you would in the UI (Run and
    // Export are separate buttons).
    let exportReportUrl = await tryExport('4_export_direct');
    if (exportReportUrl) {
        report('Step 4/6: Export worked directly, no Run needed.');
    } else {
        // Fallback: the sequence the one real working capture followed --
        // Run, close the Results tab, re-enter the dates, then Export.
        report('Step 4/6: direct Export gave no URL; falling back to Run -> Close -> re-enter dates -> Export.');
        await fullPost('Click Run', '4a_run',
            'ctl00$content$ReportFooter$btnRun', fullFields, true);
        report('Step 4a: ran the report.');

        await fullPost('Close Results tab', '4b_close',
            'ctl00$content$ReportsTab$rptTabLinks$ctl01$btnClose', {}, false);
        report('Step 4b: closed the Results tab.');

        for (const which of ['dateFrom', 'dateTo']) {
            const r = await frame.evaluate(
                fetchInFrame, 'POST', frame.url(),
                buildReportMainBody(state,
                    `ctl00$content$ReportCreator$CustomParameters1$${which}$pnlContainer|ctl00$content$ReportCreator$CustomParameters1$${which}$txtInput`,
                    `ctl00$content$ReportCreator$CustomParameters1$${which}$txtInput`, reportFields),
                '*/*',
            );
            guardSession(r, `Re-confirm ${which}`);
            dumpResponse(`4c_reconfirm_${which}`, r.text);
            mergeFieldUpdate(state, r.text);
            report(`Step 4c: re-confirmed ${which}.`);
        }

        exportReportUrl = await tryExport('4d_export_after_run');
        if (!exportReportUrl) {
            throw new Error(`Export did not reveal an ExportReport.aspx URL, even after Run. Every step's response is saved in ${DUMP_DIR} for diagnosis.`);
        }
    }
    report(`Step 5/6: Export clicked -> ${exportReportUrl}`);

    // Step 6a: load the export-format picker page (its own, separate VIEWSTATE)
    res = await frame.evaluate(fetchInFrame, 'GET', exportReportUrl, null, 'text/html');
    guardSession(res, 'GET ExportReport.aspx');
    dumpResponse('6a_export_format_page', res.text);
    const pick = (name) => { const m = res.text.match(new RegExp(`id="${name}"[^>]*value="([^"]*)"`)); return m ? m[1] : null; };
    const exportState = { viewstate: pick('__VIEWSTATE'), viewstategenerator: pick('__VIEWSTATEGENERATOR'), eventvalidation: pick('__EVENTVALIDATION') };
    if (!exportState.viewstate) throw new Error('Could not read VIEWSTATE from the export-format page.');

    // Step 6b: submit the format choice (Excel) -> response embeds the ExportOutput.aspx URL
    const formBody = new URLSearchParams({
        __EVENTTARGET: 'ctl00$content$btnOk',
        __EVENTARGUMENT: '',
        __VIEWSTATE: exportState.viewstate,
        __VIEWSTATEGENERATOR: exportState.viewstategenerator,
        __EVENTVALIDATION: exportState.eventvalidation || '',
        'ctl00$content$format': 'rbExcel',
        'ctl00$content$ddlExcelType': 'xlsx',
        'ctl00$content$ddlDelimiter': 'comma',
        __child: '1',
    }).toString();
    res = await frame.evaluate(fetchInFrame, 'POST', exportReportUrl, formBody, 'text/html');
    guardSession(res, 'Confirm Excel export format');
    dumpResponse('6b_confirm_format', res.text);
    const outputUrlMatch = res.text.match(/ExportOutput\.aspx\?[^'"]+/);
    if (!outputUrlMatch) throw new Error('Confirming the export format did not reveal an ExportOutput.aspx URL.');
    const exportOutputUrl = new URL(outputUrlMatch[0], exportReportUrl).toString();
    report(`Step 6/6: format confirmed -> ${exportOutputUrl}`);

    // Fetch the actual file
    const file = await frame.evaluate(fetchBinaryInFrame, exportOutputUrl);
    if (file.status !== 200) throw new Error(`Fetching the export file failed: HTTP ${file.status}`);
    const buf = Buffer.from(file.base64, 'base64');
    if (buf.length < 100) throw new Error(`Downloaded file is suspiciously small (${buf.length} bytes).`);
    report(`Fetched the report: ${buf.length} bytes (content-type: ${file.contentType}).`);

    if (SAVE_XLSX) {
        const dir = path.join(__dirname, 'raw-data');
        fs.mkdirSync(dir, { recursive: true });
        const fname = `MCW-Monthly-Report_${FROM_DATE.replace(/\//g, '-')}_to_${TO_DATE.replace(/\//g, '-')}.xlsx`;
        const outPath = path.join(dir, fname);
        fs.writeFileSync(outPath, buf);
        report(`Saved a copy to ${outPath}`);
    }

    const wb = new Excel.Workbook();
    await wb.xlsx.load(buf);
    report(`Worksheets: ${wb.worksheets.map((w) => `"${w.name}" (${w.rowCount} rows)`).join(', ')}`);

    const ws = wb.worksheets[0];
    const { header, rows, minOrder, maxOrder } = reportToSheetRows(ws);
    report(`Report has ${rows.length} data row(s)` +
        (minOrder ? `, Order Date from ${fmtCellDate(minOrder)} to ${fmtCellDate(maxOrder)}.` : '.'));

    if (PUSH) {
        // Never overwrite the sheet with nothing: an empty result for a
        // whole year almost certainly means something went wrong upstream.
        if (rows.length === 0) throw new Error('The report came back with zero data rows; not touching the Google Sheet.');

        const { google } = require(`${PRIME}node_modules\\googleapis`);
        const googleKeys = require(`${__dirname}\\..\\keys\\googleapi_keys_portalsync.json`);
        const client = new google.auth.JWT(googleKeys.client_email, null, googleKeys.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
        await new Promise((resolve, reject) => client.authorize((err) => (err ? reject(err) : resolve())));
        const gsapi = google.sheets({ version: 'v4', auth: client });
        await pushToSheet(gsapi, header, rows);
    } else {
        report('(No --push, so nothing was written to Google Sheets.)');
    }

    report('RUN END  result=OK');
    report('='.repeat(70));
    await browser.disconnect();
    process.exit(0);
}

main().catch((e) => {
    reportErr('STOPPED: ' + e.message);
    if (DUMP_DIR) report(`Every step's response up to the failure was saved in ${DUMP_DIR}`);
    report('RUN END  result=CRASHED');
    report('='.repeat(70));
    process.exit(1);
});
