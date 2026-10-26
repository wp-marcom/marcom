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
const REPORT_ID = '25700'; // "MCW Monthly Report" -- fixed, doesn't change with dates/portal

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

// ---------- command line ----------
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const FROM_DATE = val('--from');
const TO_DATE = val('--to');
const PORTAL_ID = val('--portal') || '14715'; // Mister Car Wash, this report's own default
const SAVE_XLSX = has('--save-xlsx');

if (!FROM_DATE || !TO_DATE) {
    console.error('Usage: node mcw_monthly_report.js --from M/D/YYYY --to M/D/YYYY [--portal ID] [--save-xlsx]');
    process.exit(1);
}

// ---------- helpers that run INSIDE the iframe's JS context ----------
// (page.evaluate/frame.evaluate send these as source text -- each must be
// fully self-contained, no closures over outer variables)

async function fetchInFrame(method, url, body, accept) {
    const headers = { 'X-Requested-With': 'XMLHttpRequest', Accept: accept };
    if (body !== null) headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    const res = await fetch(url, { method, headers, body: body === null ? undefined : body, credentials: 'same-origin' });
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

// ---------- main ----------

async function main() {
    const os = require('os');
    const puppeteer = require(`${PRIME}node_modules\\puppeteer`);
    const Excel = require(`${PRIME}node_modules\\exceljs`);

    const userName = os.userInfo().username;
    const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

    report('='.repeat(70));
    report(`RUN START  from=${FROM_DATE}  to=${TO_DATE}  portal=${PORTAL_ID}  saveXlsx=${SAVE_XLSX}`);

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
            }),
        '*/*',
    );
    guardSession(res, 'Open Saved tab');
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
    res = await frame.evaluate(
        fetchInFrame, 'POST', frame.url(),
        buildReportMainBody(state, 'ctl00$content$ReportCreator$CustomParameters1$dateTo$pnlContainer|ctl00$content$ReportCreator$CustomParameters1$dateTo$txtInput',
            'ctl00$content$ReportCreator$CustomParameters1$dateTo$txtInput', reportFields),
        '*/*',
    );
    guardSession(res, 'Set date range');
    mergeFieldUpdate(state, res.text);
    report(`Step 3/6: set date range ${FROM_DATE} - ${TO_DATE}, portal ${PORTAL_ID}.`);

    // Step 4: click Run. REQUIRED before Export -- confirmed from a real
    // capture where Export only worked on a report that had already been
    // run; skipping straight to Export (the first live attempt) produced no
    // error, just silently re-rendered the selection panel instead of
    // exporting anything.
    res = await frame.evaluate(
        fetchInFrame, 'POST', frame.url(),
        buildReportMainBody(state, null,
            'ctl00$content$ReportFooter$btnRun', reportFields),
        '*/*',
    );
    guardSession(res, 'Click Run');
    mergeFieldUpdate(state, res.text);
    report('Step 4/6: ran the report.');

    // Close the Results tab Run just opened, then re-submit the dates once
    // more. Not confirmed to be strictly required, but it's exactly what the
    // one real session we have proof of doing a successful export did
    // between Run and Export -- matching it exactly rather than guessing at
    // a shortcut.
    res = await frame.evaluate(
        fetchInFrame, 'POST', frame.url(),
        buildReportMainBody(state, null,
            'ctl00$content$ReportsTab$rptTabLinks$ctl01$btnClose', reportFields),
        '*/*',
    );
    guardSession(res, 'Close Results tab');
    mergeFieldUpdate(state, res.text);
    report('Step 4b/6: closed the Results tab.');

    res = await frame.evaluate(
        fetchInFrame, 'POST', frame.url(),
        buildReportMainBody(state, 'ctl00$content$ReportCreator$CustomParameters1$dateTo$pnlContainer|ctl00$content$ReportCreator$CustomParameters1$dateTo$txtInput',
            'ctl00$content$ReportCreator$CustomParameters1$dateTo$txtInput', reportFields),
        '*/*',
    );
    guardSession(res, 'Re-confirm dates');
    mergeFieldUpdate(state, res.text);
    report('Step 4c/6: re-confirmed the date range.');

    // Step 5: click Export -> response embeds the ExportReport.aspx URL + its own token
    res = await frame.evaluate(
        fetchInFrame, 'POST', frame.url(),
        buildReportMainBody(state, null,
            'ctl00$content$ReportFooter$btnExport', reportFields),
        '*/*',
    );
    guardSession(res, 'Click Export');
    const exportUrlMatch = res.text.match(/ExportReport\.aspx\?[^'"]+/);
    if (!exportUrlMatch) {
        const dumpPath = path.join(__dirname, `export_click_response_${Date.now()}.txt`);
        fs.writeFileSync(dumpPath, res.text);
        throw new Error(`Clicking Export did not reveal an ExportReport.aspx URL. Saved the actual response to ${dumpPath} for diagnosis.`);
    }
    const exportReportUrl = new URL(exportUrlMatch[0], frame.url()).toString();
    report(`Step 5/6: Export clicked -> ${exportReportUrl}`);

    // Step 6a: load the export-format picker page (its own, separate VIEWSTATE)
    res = await frame.evaluate(fetchInFrame, 'GET', exportReportUrl, null, 'text/html');
    guardSession(res, 'GET ExportReport.aspx');
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
    report('(This script fetches and saves the report only -- no Google Sheets push yet. ' +
        'Once there\'s a column spec for what should land in a sheet, that\'s a small follow-up.)');

    report('RUN END  result=OK');
    report('='.repeat(70));
    await browser.disconnect();
    process.exit(0);
}

main().catch((e) => {
    reportErr('STOPPED: ' + e.message);
    report('RUN END  result=CRASHED');
    report('='.repeat(70));
    process.exit(1);
});
