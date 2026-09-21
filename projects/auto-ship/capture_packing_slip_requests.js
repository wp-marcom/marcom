// capture_packing_slip_requests.js
// Attaches to your already-open Chrome (same way your auto-ship script does)
// and records every XHR/fetch/document request the Marcom admin makes.
//
// HOW TO USE
//   1. Run this script. It attaches to your marcomcentral tab and starts logging.
//   2. In that tab, create ONE packing slip by hand (filter, select line items,
//      Create Packing Slip, fill in the modal, Save). Use a low-stakes order.
//   3. Press Ctrl+C in the terminal when done.
//   4. Open marcom_capture.jsonl, look at the POST entries near the end, and
//      paste them (with any tokens/cookies redacted) back into the chat.
//
// It logs method, URL, POST body and response status only. It does NOT log
// headers or cookies. Still, glance through the file before sharing it: form
// bodies can contain a __RequestVerificationToken or similar. Replace those
// values with "REDACTED".

const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);
const fs = require('fs');
const os = require('os');

const userName = os.userInfo().username;
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

const OUT = `${__dirname}\\marcom_capture.jsonl`;
const WANTED_TYPES = ['xhr', 'fetch', 'document'];

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
    console.log(`Logging to ${OUT}. Do one packing slip by hand, then press Ctrl+C.`);

    const log = (obj) => fs.appendFileSync(OUT, JSON.stringify(obj) + '\n');

    page.on('request', (req) => {
        if (!WANTED_TYPES.includes(req.resourceType())) return;
        if (!req.url().includes('marcomcentral')) return;
        log({
            t: new Date().toISOString(),
            kind: 'request',
            method: req.method(),
            url: req.url(),
            postData: req.postData() || null,
        });
        if (req.method() === 'POST') console.log(`POST ${req.url()}`);
    });

    page.on('response', (res) => {
        const req = res.request();
        if (!WANTED_TYPES.includes(req.resourceType())) return;
        if (!res.url().includes('marcomcentral')) return;
        log({
            t: new Date().toISOString(),
            kind: 'response',
            status: res.status(),
            url: res.url(),
        });
    });

    // Keep the process alive until Ctrl+C
    await new Promise(() => {});
})();
