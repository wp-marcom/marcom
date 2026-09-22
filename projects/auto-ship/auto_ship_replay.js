// auto_ship_replay.js
//
// Creates packing slips by replaying the requests the Marcom admin UI makes,
// instead of clicking through the page. It attaches to your Chrome the same way
// your existing script does, and sends every request from INSIDE the logged-in
// tab, so your session cookies are used automatically.
//
// SAFE BY DEFAULT: with no flags it is a DRY RUN. It reads the grid and opens
// the packing slip form (both read-only) and prints what it WOULD send.
//
//   node auto_ship_replay.js                        dry run, first order found
//   node auto_ship_replay.js --order 91330          dry run for one order number
//   node auto_ship_replay.js --order 91330 --send   REALLY create the packing slips
//   node auto_ship_replay.js --send --limit 5       really ship the 5 oldest orders
//
// Flags:
//   --send                 actually POST to /PackingSlip/Create (otherwise dry run)
//   --limit N              max number of orders to process (default 1)
//   --portal NAME          only this portal (Mister, WestPressInventory, TMC, NorthwestMedicalCenter)
//   --order TEXT           only orders whose order number contains TEXT (e.g. 91330)
//   --include-backorders   also ship line items marked Backorder (your old script
//                          only ships the ones marked Standard, so this is off)
//
// How one order is shipped (mirrors what the modal does):
//   1. GET  /PackingSlip/CreateByLineItem?idList=..&idList=..   -> modal HTML
//      The modal lists one "entry" per distinct ship-to (that's the Save and
//      Next screens). The form on the page is pre-filled for the first entry.
//   2. POST /PackingSlip/Create with the form's own values + the workflow JSON.
//   3. Repeat step 1 (the server drops line items that already have a packing
//      slip, so the next entry comes up first) until nothing is left.
// Any surprise stops the whole run. It never retries a Create automatically.

const path = require('path');
const fs = require('fs');

const PRIME = 'C:\\projects\\';
const BASE = 'https://admin.marcomcentral.app.pti.com';
const LOG_FILE = path.join(__dirname, 'auto_ship_replay_log.jsonl');

const PORTALS = [
    { portalName: 'Mister', orderSelector: 'MCW Online - ' },
    { portalName: 'WestPressInventory', orderSelector: 'WP Inventory - ' },
    { portalName: 'TMC', orderSelector: 'TMC Online - ' },
    { portalName: 'NorthwestMedicalCenter', orderSelector: 'NWH Online - ' },
];

// Column positions in the grid rows ("cell" arrays), read from a real capture.
const COL = { ORDER_DATE: 0, ORDER_NUMBER: 1, LINE_ITEM_ID: 2, PRODUCT: 3, QTY: 6, SHIP_TO: 11, PORTAL: 12, ORDER_TYPE: 13 };

const HTML_ACCEPT = 'text/html, */*; q=0.01';
const JSON_ACCEPT = 'application/json, text/javascript, */*; q=0.01';
const PAUSE_MS = 300;

// ---------- command line ----------
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const SEND = has('--send');
const LIMIT = parseInt(val('--limit') || '1', 10);
const ONLY_PORTAL = val('--portal');
const ONLY_ORDER = val('--order');
const INCLUDE_BACKORDERS = has('--include-backorders');

// ---------- helpers that run INSIDE the browser tab ----------
// (page.evaluate sends these as source text, so each must be fully self-contained)

async function httpInPage(method, url, body, accept) {
    const headers = { 'X-Requested-With': 'XMLHttpRequest', 'Accept': accept };
    if (body !== null) headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
    const res = await fetch(url, { method, headers, body: body === null ? undefined : body, credentials: 'same-origin' });
    return { status: res.status, finalUrl: res.url, text: await res.text() };
}

function parseModalInPage(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const holder = doc.querySelector('#packingslip-modal-data');
    const form = doc.querySelector('#PackingSlipModalForm');
    const workflowRaw = holder ? holder.getAttribute('data-workflow') : null;
    let fields = null;
    if (form) {
        fields = [];
        for (const [k, v] of new FormData(form).entries()) {
            if (typeof v === 'string') fields.push([k, v]);
        }
    }
    return { workflowRaw, fields };
}

// ---------- plain Node helpers ----------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (obj) => fs.appendFileSync(LOG_FILE, JSON.stringify({ t: new Date().toISOString(), ...obj }) + '\n');

// Entries in the workflow that still need a packing slip
function pendingEntries(wf) {
    return (wf && wf.Data ? wf.Data : []).filter((d) => d.Id === null && Array.isArray(d.Items) && d.Items.length > 0);
}

function buildBody(fields, workflowRaw) {
    const p = new URLSearchParams();
    for (const [k, v] of fields) p.append(k, v);
    p.append('workflowDTOstring', workflowRaw);
    return p.toString();
}

function orderNumberValue(orderNumber) {
    const m = String(orderNumber).match(/(\d+)\s*$/);
    return m ? parseInt(m[1], 10) : 0;
}

function guardSession(res, what) {
    if (/\/Account\/LogOn/i.test(res.finalUrl)) {
        throw new Error(`${what}: redirected to the login page. The session is not signed in.`);
    }
    if (res.status !== 200) {
        throw new Error(`${what}: HTTP ${res.status}`);
    }
}

function dumpError(name, text) {
    const file = path.join(__dirname, `auto_ship_replay_error_${name}_${Date.now()}.html`);
    fs.writeFileSync(file, text);
    console.log(`Saved the server's response to ${file} (contains ship-to details).`);
}

// ---------- talking to Marcom ----------

async function fetchGrid(page, portalName) {
    const rowsPerPage = 100;
    const all = [];
    let pageNo = 1;
    let totalPages = 1;
    let records = null;
    do {
        const nd = String(Date.now());
        const common = { _search: 'true', nd, rows: String(rowsPerPage), page: String(pageNo), sidx: 'OrderNumber', sord: 'asc' };
        const urlQs = new URLSearchParams({ ...common, PortalName: portalName });
        const body = new URLSearchParams({ ...common, sectionEnum: 'packingSlip', PortalName: portalName });
        const res = await page.evaluate(httpInPage, 'POST', `/LineItem/PackingSlipLineItemListDataRequested?${urlQs}`, body.toString(), JSON_ACCEPT);
        guardSession(res, 'Grid request');
        const data = JSON.parse(res.text);
        totalPages = data.total;
        records = data.records;
        all.push(...data.rows);
        pageNo++;
    } while (pageNo <= totalPages);
    if (records !== null && all.length !== records) {
        console.log(`Warning: grid said ${records} records but ${all.length} rows were read.`);
    }
    return all;
}

// Explains what is in the grid, so "0 eligible" is never a mystery
function describeGrid(rows, orderSelector) {
    const byType = {};
    let matchPrefix = 0;
    for (const r of rows) {
        const c = Array.isArray(r.cell) ? r.cell : [];
        const t = c[COL.ORDER_TYPE] === undefined ? '(missing)' : c[COL.ORDER_TYPE];
        byType[t] = (byType[t] || 0) + 1;
        if (String(c[COL.ORDER_NUMBER] || '').includes(orderSelector)) matchPrefix++;
    }
    const types = Object.entries(byType).map(([t, n]) => `${t}: ${n}`).join(', ') || 'none';
    return { byType, matchPrefix, text: `By order type -> ${types}. Order numbers containing "${orderSelector}": ${matchPrefix}.` };
}

function buildOrders(rows, orderSelector) {
    const map = new Map();
    for (const r of rows) {
        const c = r.cell;
        if (!Array.isArray(c) || c.length < 14) {
            throw new Error(`A grid row has ${c ? c.length : 0} columns, expected 14. The grid layout may have changed.`);
        }
        const type = c[COL.ORDER_TYPE];
        if (type !== 'Standard' && !(INCLUDE_BACKORDERS && type === 'Backorder')) continue;
        const orderNumber = c[COL.ORDER_NUMBER];
        if (!orderNumber.includes(orderSelector)) continue;
        if (ONLY_ORDER && !orderNumber.includes(ONLY_ORDER)) continue;
        if (!map.has(orderNumber)) map.set(orderNumber, { orderNumber, lines: [] });
        map.get(orderNumber).lines.push({ id: String(r.id), product: c[COL.PRODUCT], qty: c[COL.QTY], type, shipTo: c[COL.SHIP_TO] });
    }
    return [...map.values()].sort((a, b) => orderNumberValue(a.orderNumber) - orderNumberValue(b.orderNumber));
}

async function shipOrder(page, order) {
    const ids = order.lines.map((l) => l.id);
    const productById = new Map(order.lines.map((l) => [Number(l.id), l.product]));
    const slips = [];
    let firstPending = null;

    for (let loop = 0; loop <= ids.length; loop++) {
        const url = `/PackingSlip/CreateByLineItem?${ids.map((i) => 'idList=' + i).join('&')}&_=${Date.now()}`;
        const get = await page.evaluate(httpInPage, 'GET', url, null, HTML_ACCEPT);
        guardSession(get, 'Open packing slip form');
        const modal = await page.evaluate(parseModalInPage, get.text);

        const wf = modal.workflowRaw ? JSON.parse(modal.workflowRaw) : null;
        const pending = pendingEntries(wf);

        if (!modal.fields || !wf || pending.length === 0) {
            if (slips.length > 0) break; // nothing left: we're done
            dumpError('open_form', get.text);
            throw new Error(`Order ${order.orderNumber}: the packing slip form did not load as expected.`);
        }
        if (wf.Index !== 0 || wf.Data[0].Id !== null) {
            dumpError('workflow', get.text);
            throw new Error(`Order ${order.orderNumber}: unexpected workflow state (Index ${wf.Index}).`);
        }
        if (!modal.fields.some(([k]) => k === '__RequestVerificationToken')) {
            dumpError('token', get.text);
            throw new Error(`Order ${order.orderNumber}: form has no anti-forgery token.`);
        }
        if (firstPending === null) firstPending = pending.length;

        const field = (name) => (modal.fields.find(([k]) => k === name) || [null, ''])[1];
        const entryItems = wf.Data[0].Items;
        console.log(`  Packing slip ${slips.length + 1} of ${firstPending}: ` +
            `${field('ShipName')}${field('ShipAttn') ? ' / ' + field('ShipAttn') : ''}, ` +
            `${field('ShipAddr2') || field('ShipAddr1')}, ${field('ShipCity')} ${field('ShipState')}`);
        for (const id of entryItems) console.log(`     line item ${id}: ${productById.get(id) || '(not in grid list)'}`);
        console.log(`     ship date ${field('ShipDate')}, cost ${field('ShipCost')}, carrier "${field('ShipVia').trim()}"`);

        if (!SEND) {
            if (pending.length > 1) {
                console.log(`  (dry run) ${pending.length} packing slips would be made for this order; only the first is shown.`);
            }
            log({ event: 'dry_run', order: order.orderNumber, entries: pending.length });
            return { created: 0, planned: pending.length, dryRun: true };
        }

        const body = buildBody(modal.fields, modal.workflowRaw);
        const post = await page.evaluate(httpInPage, 'POST', '/PackingSlip/Create', body, HTML_ACCEPT);
        try {
            guardSession(post, 'Create packing slip');
        } catch (e) {
            log({ event: 'create_failed', order: order.orderNumber, ids: entryItems, error: e.message });
            dumpError('create', post.text);
            throw e;
        }

        // Success looks like: the first entry now has a packing slip Id
        const back = await page.evaluate(parseModalInPage, post.text);
        const wf2 = back.workflowRaw ? JSON.parse(back.workflowRaw) : null;
        const slipId = wf2 && wf2.Data && wf2.Data[0] ? wf2.Data[0].Id : null;
        if (!slipId) {
            log({ event: 'create_unconfirmed', order: order.orderNumber, ids: entryItems });
            dumpError('create_response', post.text);
            throw new Error(`Order ${order.orderNumber}: Create did not return a packing slip Id. Check this order in the admin before running again.`);
        }
        slips.push({ slipId, items: entryItems });
        console.log(`     -> created packing slip ${slipId}`);
        log({ event: 'created', order: order.orderNumber, slipId, items: entryItems });
        await sleep(PAUSE_MS);
    }
    return { created: slips.length, planned: firstPending, slips };
}

// ---------- signing in ----------

// page.goto that retries when a redirect or another navigation cancels it
async function gotoSafe(page, url) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await page.goto(url, { waitUntil: 'load', timeout: 60000 });
            return;
        } catch (e) {
            if (!/ERR_ABORTED/.test(e.message) || attempt === 3) throw e;
            console.log(`Navigation was interrupted (attempt ${attempt}); retrying...`);
            await sleep(2000);
        }
    }
}

// Go to the Distribution page. If we get bounced to the login page, click the
// sign-in button, WAIT for the login to finish, then go back to the page.
async function openDistribution(page) {
    const target = `${BASE}/Distribution/Index?section=4`;
    await gotoSafe(page, target);

    if (/\/Account\/LogOn/i.test(page.url())) {
        console.log('Signing in...');
        try {
            await page.waitForSelector('.primary-submit', { timeout: 10000 });
            await page.click('.primary-submit');
        } catch (e) {
            console.log('Could not find the sign-in button.');
        }
        // Wait (up to 45s) until the browser has left the login page
        const t0 = Date.now();
        while (Date.now() - t0 < 45000) {
            await sleep(500);
            if (!/\/Account\/LogOn/i.test(page.url())) break;
        }
        await sleep(2000); // let any redirects after login settle
        await gotoSafe(page, target);
    }

    if (/\/Account\/LogOn/i.test(page.url())) {
        throw new Error('Still on the login page after signing in. Sign in manually in that tab and run again.');
    }
    console.log(`On ${page.url()}`);
}

// ---------- main ----------

async function main() {
    const os = require('os');
    const puppeteer = require(`${PRIME}node_modules\\puppeteer`);
    const userName = os.userInfo().username;
    const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

    console.log(SEND ? 'MODE: SEND (real packing slips will be created)' : 'MODE: DRY RUN (nothing will be created)');
    if (SEND) {
        console.log(`Up to ${LIMIT} order(s). Press Ctrl+C in the next 5 seconds to cancel.`);
        await sleep(5000);
    }

    const browser = await puppeteer.connect({ browserWSEndpoint: keys.jsonURL, defaultViewport: null });
    const pages = await browser.pages();
    let page = pages.find((p) => p.url().startsWith(BASE));
    if (!page) page = await browser.newPage();
    await page.bringToFront();
    page.setDefaultNavigationTimeout(0);

    await openDistribution(page);

    let remaining = LIMIT;
    let totalSlips = 0;
    const portals = PORTALS.filter((p) => !ONLY_PORTAL || p.portalName === ONLY_PORTAL);

    for (const { portalName, orderSelector } of portals) {
        if (remaining <= 0) break;
        console.log(`\n=== ${portalName} ===`);
        const rows = await fetchGrid(page, portalName);
        const orders = buildOrders(rows, orderSelector);
        console.log(`${rows.length} line items in the grid, ${orders.length} order(s) eligible to ship.`);
        const info = describeGrid(rows, orderSelector);
        console.log(`  ${info.text}`);
        if (orders.length === 0 && rows.length > 0) {
            console.log('  Nothing is eligible. Sample of what the grid returned:');
            for (const r of rows.slice(0, 5)) {
                const c = r.cell;
                console.log(`    ${c[COL.ORDER_NUMBER]} | line item ${r.id} | ${c[COL.PRODUCT]} | ${c[COL.ORDER_TYPE]}`);
            }
            console.log('  (Only "Standard" lines ship unless you use --include-backorders.)');
        }

        const shippedIds = [];
        for (const order of orders) {
            if (remaining <= 0) break;
            console.log(`\nOrder ${order.orderNumber} (${order.lines.length} line item(s))`);
            const result = await shipOrder(page, order);
            remaining--;
            if (!result.dryRun) {
                totalSlips += result.created;
                shippedIds.push(...order.lines.map((l) => l.id));
            }
        }

        // Check that what we shipped is gone from the grid
        if (SEND && shippedIds.length) {
            const after = await fetchGrid(page, portalName);
            const stillThere = after.filter((r) => shippedIds.includes(String(r.id))).map((r) => r.id);
            if (stillThere.length) {
                console.log(`WARNING: these line items are still in the grid: ${stillThere.join(', ')}`);
                log({ event: 'still_in_grid', portalName, ids: stillThere });
            } else {
                console.log(`Verified: all shipped line items have left the ${portalName} grid.`);
            }
        }
    }

    console.log(`\nDone. ${SEND ? `${totalSlips} packing slip(s) created.` : 'Dry run only, nothing created.'}`);
    await browser.disconnect();
    process.exit(0);
}

if (require.main === module) {
    main().catch((e) => {
        console.error('\nSTOPPED:', e.message);
        process.exit(1);
    });
} else {
    module.exports = { parseModalInPage, buildBody, pendingEntries, buildOrders, describeGrid };
}
