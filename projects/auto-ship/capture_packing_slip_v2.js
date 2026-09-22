// capture_packing_slip_v2.js
// Same idea as the first capture script, but ALSO saves the response bodies
// (and a few harmless request headers) for the packing slip endpoints, so we
// can see what the server sends back after Create.
//
// HOW TO USE
//   1. Run this script (attaches to your open marcomcentral tab).
//   2. In that tab, do ONE order EXACTLY the way your auto-ship script does:
//        select the order's line items -> Create Packing Slip -> Save
//        (or Save and Next until the last one, then Save) -> Close.
//      Do NOT press Save a second time after the first Save on a screen.
//      Ideal test: an order with more than one line item or more than one
//      ship-to address, so the Save and Next path gets recorded.
//   3. Press Ctrl+C.
//   4. Send me marcom_capture_v2.jsonl and the marcom_capture_bodies folder.
//      Skim them first and replace any __RequestVerificationToken values with
//      REDACTED. The response bodies contain the ship-to names and addresses
//      for that order, so blank those out too if you'd rather not share them.
//
// It never logs cookies.

const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);
const fs = require('fs');
const os = require('os');

const userName = os.userInfo().username;
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

const OUT = `${__dirname}\\marcom_capture_v2.jsonl`;
const BODY_DIR = `${__dirname}\\marcom_capture_bodies`;
fs.mkdirSync(BODY_DIR, { recursive: true });

const WANTED_TYPES = ['xhr', 'fetch', 'document'];
const SKIP_URL = /\/(Scripts|bundles|Content)\//i;                // static assets
const SAVE_BODY = /\/PackingSlip\/(CreateByLineItem|Create|Edit|LineItemListDataRequested)|\/LineItem\/PackingSlipLineItemListDataRequested/i;
const HEADERS_WANTED = ['content-type', 'x-requested-with', 'accept', 'referer'];
const MAX_BODY = 200000; // characters per saved body

let seq = 0;
const ids = new WeakMap();

(async () => {
    const browser = await puppeteer.connect({
        browserWSEndpoint: keys.jsonURL,
        defaultViewport: null,
    });

    const pages = await browser.pages();
    const page = pages.find(p => p.url().includes('marcomcentral'));
    if (!page) {
        console.log('No marcomcentral tab found. Open the admin site in your Chrome first.');
        process.exit(1);
    }
    console.log(`Attached to: ${page.url()}`);
    console.log(`Logging to ${OUT} and ${BODY_DIR}. Do one order by hand, then press Ctrl+C.`);

    const log = (obj) => fs.appendFileSync(OUT, JSON.stringify(obj) + '\n');
    const relevant = (req) =>
        WANTED_TYPES.includes(req.resourceType()) &&
        req.url().includes('marcomcentral') &&
        !SKIP_URL.test(req.url());

    page.on('request', (req) => {
        if (!relevant(req)) return;
        const id = ++seq;
        ids.set(req, id);

        const headers = {};
        const all = req.headers();
        for (const h of HEADERS_WANTED) if (all[h]) headers[h] = all[h];

        log({
            seq: id,
            t: new Date().toISOString(),
            kind: 'request',
            method: req.method(),
            url: req.url(),
            headers,
            postData: req.postData() || null,
        });
        if (req.method() === 'POST') console.log(`#${id} POST ${req.url().split('?')[0]}`);
    });

    page.on('response', async (res) => {
        const req = res.request();
        if (!relevant(req)) return;
        const id = ids.get(req) || 0;

        let bodyFile = null;
        if (SAVE_BODY.test(res.url())) {
            try {
                let text = await res.text();
                if (text.length > MAX_BODY) text = text.slice(0, MAX_BODY) + '\n...[truncated]';
                const name = res.url().split('?')[0].split('/').slice(-2).join('_');
                bodyFile = `${String(id).padStart(3, '0')}_${req.method()}_${name}.txt`;
                fs.writeFileSync(`${BODY_DIR}\\${bodyFile}`, text);
            } catch (e) {
                bodyFile = `(could not read body: ${e.message})`;
            }
        }

        log({
            seq: id,
            t: new Date().toISOString(),
            kind: 'response',
            status: res.status(),
            url: res.url(),
            contentType: res.headers()['content-type'] || null,
            bodyFile,
        });
    });

    // Keep the process alive until Ctrl+C
    await new Promise(() => {});
})();
