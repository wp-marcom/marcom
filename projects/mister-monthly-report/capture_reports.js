// capture_reports.js
//
// Records the network traffic behind Reports/Edit so we can see how the
// "MCW Monthly Report" is actually run and exported, then replay it directly.
//
// Two things make this flow different from the earlier captures:
//   * Export opens a SMALLER WINDOW that does the processing in the background.
//     That's a separate browser window, so this script also attaches to any
//     window that opens while it's running. (A brand-new window can fire its
//     very first request before we attach; if so we'll still see everything
//     after it, including the download itself.)
//   * The Run result might come back as JSON, HTML, or something else, so
//     bodies are saved as text or binary depending on what they are.
//
// HOW TO USE
//   1. Run this script. It attaches to your marcomcentral tab.
//   2. Press M in this terminal. That drops a marker in the log ("phase 1").
//   3. In the browser, do the RUN path once:
//        Reports/Edit -> Saved tab -> MCW Monthly Report -> pick a SHORT date
//        range (2 or 3 days keeps the files small) -> leave the portal on
//        Mister Car Wash -> click Run -> wait for the data tab to appear.
//   4. Press M again ("phase 2").
//   5. Do the EXPORT path once, same short date range:
//        click Export -> choose the Excel format -> OK -> wait for the
//        download to finish / the file to open.
//   6. Press Ctrl+C.
//   7. Send me capture_reports.jsonl and the capture_reports_bodies folder.
//      Before sending, skim the .jsonl and replace any
//      __RequestVerificationToken values with REDACTED. The response bodies
//      will contain order details (names, products), so trim anything you'd
//      rather not share; a 2-3 day range keeps that small.
//
// It never logs cookies. Static files (scripts, styles, images, fonts) are
// skipped.

const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);
const fs = require('fs');
const os = require('os');

const userName = os.userInfo().username;
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

const OUT = `${__dirname}\\capture_reports.jsonl`;
const BODY_DIR = `${__dirname}\\capture_reports_bodies`;
fs.mkdirSync(BODY_DIR, { recursive: true });

const WANTED_TYPES = ['xhr', 'fetch', 'document', 'other'];
const SKIP_URL = /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|ico)(\?|$)/i;
const HOST_OK = /marcomcentral|pti\.com/i;                         // ignore analytics/marketing hosts
const NOISE = /jsResourceByControlGroup|combinedConfigs|ShowNotificationAsync/i; // seen in earlier captures, never useful
const HEADERS_WANTED = ['content-type', 'content-disposition', 'x-requested-with', 'accept', 'referer'];
const MAX_TEXT = 1000000; // characters saved per text body

let seq = 0;
let phase = 0;
let windowCount = 0;
const reqIds = new WeakMap();
const attached = new WeakSet();

const log = (obj) => fs.appendFileSync(OUT, JSON.stringify(obj) + '\n');

function looksBinary(contentType) {
    if (!contentType) return false;
    return /spreadsheet|excel|octet-stream|zip|application\/vnd\.|pdf/i.test(contentType);
}

function relevant(req) {
    const url = req.url();
    return WANTED_TYPES.includes(req.resourceType()) &&
        HOST_OK.test(url) && !SKIP_URL.test(url) && !NOISE.test(url);
}

function attach(page, label) {
    if (attached.has(page)) return;
    attached.add(page);
    console.log(`[attached to ${label}] ${page.url()}`);
    log({ kind: 'attached', t: new Date().toISOString(), window: label, url: page.url() });

    page.on('request', (req) => {
        if (!relevant(req)) return;
        const id = ++seq;
        reqIds.set(req, id);
        const headers = {};
        const all = req.headers();
        for (const h of HEADERS_WANTED) if (all[h]) headers[h] = all[h];
        log({
            seq: id, t: new Date().toISOString(), kind: 'request', window: label, phase,
            method: req.method(), url: req.url(), headers, postData: req.postData() || null,
        });
        console.log(`#${id} [${label}] ${req.method()} ${req.url().split('?')[0]}`);
    });

    page.on('response', async (res) => {
        const req = res.request();
        if (!relevant(req)) return;
        const id = reqIds.get(req) || 0;
        const contentType = res.headers()['content-type'] || null;
        const contentDisp = res.headers()['content-disposition'] || null;

        let bodyFile = null;
        try {
            const name = res.url().split('?')[0].split('/').slice(-2).join('_').replace(/[^\w.\-]/g, '_').slice(0, 80);
            const stem = `${String(id).padStart(3, '0')}_${label}_${req.method()}_${name}`;
            if (looksBinary(contentType) || /attachment/i.test(contentDisp || '')) {
                const buf = await res.buffer();
                bodyFile = `${stem}.bin`;
                fs.writeFileSync(`${BODY_DIR}\\${bodyFile}`, buf);
                console.log(`   -> saved binary response (${buf.length} bytes): ${bodyFile}`);
            } else {
                let text = await res.text();
                if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT) + '\n...[truncated]';
                bodyFile = `${stem}.txt`;
                fs.writeFileSync(`${BODY_DIR}\\${bodyFile}`, text);
            }
        } catch (e) {
            // Expected for real file downloads: Chrome's download manager takes the body.
            bodyFile = `(could not read body: ${e.message})`;
        }

        log({
            seq: id, t: new Date().toISOString(), kind: 'response', window: label, phase,
            status: res.status(), url: res.url(), contentType, contentDisposition: contentDisp, bodyFile,
        });
    });
}

(async () => {
    const browser = await puppeteer.connect({ browserWSEndpoint: keys.jsonURL, defaultViewport: null });

    const pages = await browser.pages();
    const main = pages.find((p) => p.url().includes('marcomcentral'));
    if (!main) {
        console.log('No marcomcentral tab found. Open the admin site in your Chrome first.');
        process.exit(1);
    }
    attach(main, 'main');

    // Any window/tab that opens while we're recording (the Export popup)
    browser.on('targetcreated', async (target) => {
        try {
            if (target.type() !== 'page') return;
            const p = await target.page();
            if (!p) return;
            windowCount++;
            attach(p, `win${windowCount}`);
        } catch (e) {
            console.log(`(could not attach to a new window: ${e.message})`);
        }
    });

    // Keypress markers: M = start next phase. Raw mode also means we handle Ctrl+C ourselves.
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', (chunk) => {
            const key = chunk.toString();
            if (key === '\u0003') { // Ctrl+C
                console.log('\nStopped. Send capture_reports.jsonl and the capture_reports_bodies folder.');
                process.exit(0);
            }
            if (key.toLowerCase() === 'm') {
                phase++;
                log({ kind: 'marker', t: new Date().toISOString(), phase });
                console.log(`\n===== MARKER: phase ${phase} starts here =====`);
            }
        });
    } else {
        console.log('(stdin is not a terminal, so the M marker key is unavailable; timestamps will still separate the steps.)');
    }

    console.log(`Logging to ${OUT} and ${BODY_DIR}.`);
    console.log('Press M, do the RUN path. Press M again, do the EXPORT path. Then Ctrl+C.');
    await new Promise(() => {});
})();
