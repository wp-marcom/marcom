// capture_reports_v2.js
//
// Same purpose as capture_reports.js (record what Reports/Edit's Run and
// Export actually do), fixed for two problems the first version had:
//
//   1. TIMING: a fast popup can fire its one and only request before
//      Puppeteer finishes attaching to it. This version enables network
//      logging on a new window via a raw CDP session immediately on
//      "targetcreated" -- faster than the full page() wrapper the first
//      version waited for.
//   2. VISIBILITY: even with #1, if the popup's request happens to still be
//      missed, this version also hooks window.open() and <form>.submit() at
//      the JAVASCRIPT level on the main page, before the site's own scripts
//      run (page.evaluateOnNewDocument). That means we see the popup's
//      target URL, name, and (for a form) every field being submitted --
//      straight from the source, no network race possible. These show up in
//      the log as kind:"hook".
//
// HOW TO USE -- same as before, with one change: WAIT LONGER at the end.
//   1. Run this script. It attaches to your marcomcentral tab.
//   2. Press M ("phase 1").
//   3. RUN path: Reports/Edit -> Saved tab -> MCW Monthly Report -> a SHORT
//      date range (2-3 days) -> Mister Car Wash -> Run -> wait for the data
//      tab to appear.
//   4. Press M ("phase 2").
//   5. EXPORT path: Export -> Excel format -> OK -> a new window opens
//      (about:blank in the address bar) -> WAIT for the Save As dialog to
//      actually appear -- this can take a while for a real report, so give
//      it real time, don't rush it -- then click Save.
//   6. Only THEN press Ctrl+C.
//   7. Send me capture_reports_v2.jsonl, the capture_reports_v2_bodies
//      folder (zip is fine), and the saved .xlsx if you're willing to share
//      it -- a short date range keeps that light on real customer data.
//      Redact any __RequestVerificationToken / __VIEWSTATE-adjacent tokens
//      you're unsure about; __VIEWSTATE itself is safe to leave in, it's
//      opaque server state, not a credential.
//
// It never logs cookies. Static files (scripts, styles, images, fonts) are
// skipped.

const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);
const fs = require('fs');
const os = require('os');

const userName = os.userInfo().username;
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

const OUT = `${__dirname}\\capture_reports_v2.jsonl`;
const BODY_DIR = `${__dirname}\\capture_reports_v2_bodies`;
fs.mkdirSync(BODY_DIR, { recursive: true });

const SKIP_URL = /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|ico)(\?|$)/i;
const HOST_OK = /marcomcentral|pti\.com/i;
const NOISE = /jsResourceByControlGroup|combinedConfigs|ShowNotificationAsync|google(-analytics)?\.com|doubleclick/i;
const HEADERS_WANTED = ['content-type', 'content-disposition', 'x-requested-with', 'accept', 'referer'];
const MAX_TEXT = 1000000;

let seq = 0;
let phase = 0;
let windowCount = 0;
const bodyBySeq = new Map(); // requestId -> our seq, for raw-CDP windows

const log = (obj) => fs.appendFileSync(OUT, JSON.stringify(obj) + '\n');
const relevantUrl = (url) => HOST_OK.test(url) && !SKIP_URL.test(url) && !NOISE.test(url);
function looksBinary(contentType) {
    if (!contentType) return false;
    return /spreadsheet|excel|octet-stream|zip|application\/vnd\.|pdf/i.test(contentType);
}
function saveBody(label, id, method, url, buf, isText) {
    const name = url.split('?')[0].split('/').slice(-2).join('_').replace(/[^\w.\-]/g, '_').slice(0, 80);
    const stem = `${String(id).padStart(3, '0')}_${label}_${method}_${name}`;
    const file = `${stem}${isText ? '.txt' : '.bin'}`;
    fs.writeFileSync(`${BODY_DIR}\\${file}`, buf);
    return file;
}

// ---------- JS-level hooks injected into the main page, before any of the
// site's own scripts run. These can't be raced by timing -- they fire
// synchronously as part of the site's own window.open()/form.submit() calls.
const HOOK_SCRIPT = `
(() => {
    const origOpen = window.open;
    window.open = function(url, name, features) {
        console.log('CAPTURE_HOOK ' + JSON.stringify({ type: 'window.open', url, name, features }));
        return origOpen.apply(this, arguments);
    };
    const origSubmit = HTMLFormElement.prototype.submit;
    HTMLFormElement.prototype.submit = function() {
        try {
            const fields = [];
            for (const el of this.elements) {
                if (!el.name) continue;
                fields.push([el.name, el.type === 'checkbox' || el.type === 'radio' ? (el.checked ? el.value : null) : el.value]);
            }
            console.log('CAPTURE_HOOK ' + JSON.stringify({
                type: 'form.submit', action: this.action, method: this.method, target: this.target, fields,
            }));
        } catch (e) {
            console.log('CAPTURE_HOOK ' + JSON.stringify({ type: 'form.submit (error reading it)', error: String(e) }));
        }
        return origSubmit.apply(this, arguments);
    };
})();
`;

function attachPuppeteerPage(page, label) {
    console.log(`[attached ${label}] ${page.url()}`);
    log({ kind: 'attached', t: new Date().toISOString(), window: label, url: page.url() });

    page.on('console', (msg) => {
        const text = msg.text();
        if (!text.startsWith('CAPTURE_HOOK ')) return;
        try {
            const data = JSON.parse(text.slice('CAPTURE_HOOK '.length));
            log({ kind: 'hook', t: new Date().toISOString(), window: label, phase, ...data });
            console.log(`[hook ${label}] ${data.type}: ${data.url || data.action || ''}`);
        } catch (e) { /* ignore malformed */ }
    });

    page.on('request', (req) => {
        const url = req.url();
        if (!relevantUrl(url)) return;
        const id = ++seq;
        const headers = {};
        const all = req.headers();
        for (const h of HEADERS_WANTED) if (all[h]) headers[h] = all[h];
        log({
            seq: id, t: new Date().toISOString(), kind: 'request', window: label, phase,
            method: req.method(), url, headers, postData: req.postData() || null,
        });
        console.log(`#${id} [${label}] ${req.method()} ${url.split('?')[0]}`);
        req._captureSeq = id;
    });

    page.on('response', async (res) => {
        const req = res.request();
        const url = res.url();
        if (!relevantUrl(url)) return;
        const id = req._captureSeq || 0;
        const contentType = res.headers()['content-type'] || null;
        const contentDisp = res.headers()['content-disposition'] || null;
        let bodyFile = null;
        try {
            if (looksBinary(contentType) || /attachment/i.test(contentDisp || '')) {
                bodyFile = saveBody(label, id, req.method(), url, await res.buffer(), false);
                console.log(`   -> saved binary response: ${bodyFile}`);
            } else {
                let text = await res.text();
                if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT) + '\n...[truncated]';
                bodyFile = saveBody(label, id, req.method(), url, text, true);
            }
        } catch (e) {
            bodyFile = `(could not read body: ${e.message})`;
        }
        log({
            seq: id, t: new Date().toISOString(), kind: 'response', window: label, phase,
            status: res.status(), url, contentType, contentDisposition: contentDisp, bodyFile,
        });
    });
}

// Fast path for a brand-new window: talk to it via a raw CDP session
// immediately, before Puppeteer's heavier Page wrapper is ready. This is
// what actually closes the timing gap the first capture script had.
async function attachRawCdp(target, label) {
    const cdp = await target.createCDPSession();
    await cdp.send('Network.enable');
    console.log(`[attached ${label} via raw CDP] target type=${target.type()} url=${target.url()}`);
    log({ kind: 'attached', t: new Date().toISOString(), window: label, url: target.url(), via: 'raw-cdp' });

    const pending = new Map(); // requestId -> our seq

    cdp.on('Network.requestWillBeSent', (e) => {
        const url = e.request.url;
        if (!relevantUrl(url)) return;
        const id = ++seq;
        pending.set(e.requestId, id);
        const headers = {};
        for (const h of HEADERS_WANTED) if (e.request.headers[h] || e.request.headers[h.replace(/^./, (c) => c.toUpperCase())]) {
            headers[h] = e.request.headers[h] || e.request.headers[h.replace(/^./, (c) => c.toUpperCase())];
        }
        log({
            seq: id, t: new Date().toISOString(), kind: 'request', window: label, phase,
            method: e.request.method, url, headers, postData: e.request.postData || null,
        });
        console.log(`#${id} [${label}] ${e.request.method} ${url.split('?')[0]}`);
    });

    cdp.on('Network.responseReceived', async (e) => {
        const url = e.response.url;
        if (!relevantUrl(url)) return;
        const id = pending.get(e.requestId) || 0;
        const contentType = e.response.headers['content-type'] || e.response.headers['Content-Type'] || null;
        const contentDisp = e.response.headers['content-disposition'] || e.response.headers['Content-Disposition'] || null;
        let bodyFile = null;
        try {
            const body = await cdp.send('Network.getResponseBody', { requestId: e.requestId });
            const buf = body.base64Encoded ? Buffer.from(body.data, 'base64') : body.data;
            const isText = !body.base64Encoded && !looksBinary(contentType);
            bodyFile = saveBody(label, id, e.response.method || 'GET', url, buf, isText);
            console.log(`   -> saved ${label} response (${isText ? 'text' : 'binary'}): ${bodyFile}`);
        } catch (err) {
            // Very common for a real file download: Chrome's download manager
            // takes the body before DevTools can read it. That's fine -- the
            // request line above (URL, method, postData) is what we actually need.
            bodyFile = `(could not read body: ${err.message})`;
        }
        log({
            seq: id, t: new Date().toISOString(), kind: 'response', window: label, phase,
            status: e.response.status, url, contentType, contentDisposition: contentDisp, bodyFile,
        });
    });

    // A download often shows up as this event instead of a normal response.
    cdp.on('Network.responseReceivedExtraInfo', (e) => {
        log({ kind: 'responseExtraInfo', t: new Date().toISOString(), window: label, phase, headers: e.headers });
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
    await main.evaluateOnNewDocument(HOOK_SCRIPT);
    // The hook also needs to exist on the CURRENT document, not just future
    // navigations -- inject it once right now too.
    await main.evaluate(HOOK_SCRIPT).catch(() => {});
    attachPuppeteerPage(main, 'main');

    browser.on('targetcreated', async (target) => {
        try {
            windowCount++;
            const label = `win${windowCount}`;
            // Fire-and-forget: attach as fast as possible via raw CDP, don't
            // wait on anything else first.
            attachRawCdp(target, label);
        } catch (e) {
            console.log(`(could not attach to a new window: ${e.message})`);
        }
    });

    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', (chunk) => {
            const key = chunk.toString();
            if (key === '\u0003') {
                console.log('\nStopped. Send capture_reports_v2.jsonl, the bodies folder, and the saved .xlsx.');
                process.exit(0);
            }
            if (key.toLowerCase() === 'm') {
                phase++;
                log({ kind: 'marker', t: new Date().toISOString(), phase });
                console.log(`\n===== MARKER: phase ${phase} starts here =====`);
            }
        });
    }

    console.log(`Logging to ${OUT} and ${BODY_DIR}.`);
    console.log('Press M, do RUN. Press M, do EXPORT and WAIT for the real Save-As dialog. Then Ctrl+C.');
    await new Promise(() => {});
})();
