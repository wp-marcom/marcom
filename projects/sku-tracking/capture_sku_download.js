// capture_sku_download.js
//
// Same idea as the packing-slip capture scripts, but for the SKU/inventory
// export flow (PortalInformation/List -> BulkOps/Edit -> Download).
// That flow is a multi-step click sequence ending in an actual file download,
// so this captures EVERYTHING (not just a few known URLs) and saves response
// bodies as binary when they look like a file, and as text otherwise, so we
// can see exactly which request produces the .xlsx and what selects the
// portal along the way.
//
// HOW TO USE
//   1. Run this script. It attaches to your marcomcentral tab (same Chrome
//      connection your other scripts use) and starts logging.
//   2. In that tab, do ONE full cycle for ONE portal, exactly like you
//      normally would:
//        PortalInformation/List -> search "Mister" -> click the grid row
//        -> BulkOps/Edit -> select "SKUs" -> select the inventory-only
//        download option -> click Download -> wait for the file to land.
//      Pick whichever portal is quickest/smallest if you have a choice.
//   3. Press Ctrl+C once the file has downloaded.
//   4. Send me capture_sku.jsonl and the capture_sku_bodies folder.
//      Skim the .jsonl first — replace any __RequestVerificationToken
//      values with REDACTED. Response bodies for SKU lists will contain
//      your product names/quantities; only trim those if you'd rather not
//      share them (they're much less sensitive than customer addresses,
//      so probably fine to leave as-is, your call).
//
// It never logs cookies. Static assets (Scripts/bundles/Content/images/
// fonts) are skipped to keep the log readable.

const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);
const fs = require('fs');
const os = require('os');

const userName = os.userInfo().username;
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

const OUT = `${__dirname}\\capture_sku.jsonl`;
const BODY_DIR = `${__dirname}\\capture_sku_bodies`;
fs.mkdirSync(BODY_DIR, { recursive: true });

const WANTED_TYPES = ['xhr', 'fetch', 'document', 'other'];
const SKIP_URL = /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|ico)(\?|$)/i;
const MAX_BODY_TEXT = 200000; // characters, for text bodies
const HEADERS_WANTED = ['content-type', 'content-disposition', 'x-requested-with', 'accept', 'referer'];

let seq = 0;
const ids = new WeakMap();

function looksBinary(contentType) {
    if (!contentType) return false;
    return /spreadsheet|excel|octet-stream|application\/vnd\./i.test(contentType);
}

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
    console.log(`Logging to ${OUT} and ${BODY_DIR}.`);
    console.log('Now do ONE full SKU export cycle for ONE portal, then press Ctrl+C.');

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
        console.log(`#${id} ${req.method()} ${req.url().split('?')[0]}`);
    });

    page.on('response', async (res) => {
        const req = res.request();
        if (!relevant(req)) return;
        const id = ids.get(req) || 0;
        const contentType = res.headers()['content-type'] || null;
        const contentDisp = res.headers()['content-disposition'] || null;

        let bodyFile = null;
        try {
            const name = res.url().split('?')[0].split('/').slice(-2).join('_').slice(0, 80);
            if (looksBinary(contentType) || /attachment/i.test(contentDisp || '')) {
                const buf = await res.buffer();
                bodyFile = `${String(id).padStart(3, '0')}_${req.method()}_${name}.bin`;
                fs.writeFileSync(`${BODY_DIR}\\${bodyFile}`, buf);
                console.log(`   -> saved binary response (${buf.length} bytes): ${bodyFile}`);
            } else {
                let text = await res.text();
                if (text.length > MAX_BODY_TEXT) text = text.slice(0, MAX_BODY_TEXT) + '\n...[truncated]';
                bodyFile = `${String(id).padStart(3, '0')}_${req.method()}_${name}.txt`;
                fs.writeFileSync(`${BODY_DIR}\\${bodyFile}`, text);
            }
        } catch (e) {
            bodyFile = `(could not read body: ${e.message})`;
        }

        log({
            seq: id,
            t: new Date().toISOString(),
            kind: 'response',
            status: res.status(),
            url: res.url(),
            contentType,
            contentDisposition: contentDisp,
            bodyFile,
        });
    });

    await new Promise(() => {});
})();
