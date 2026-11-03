// fedex_report_parser.js
// Reads the daily FedEx "Courtesy Shipped to Detail" text report and groups
// tracking numbers by Marcom order number (the digits before "/W" in INV NUM).
//
//   node fedex_report_parser.js path\to\10_27_26a.txt
//
// Exported: parseFedexReport(text) -> { orders: Map<orderNum, {trackings[], recipients[]}>, skipped[] }

const fs = require('fs');

function parseFedexReport(text) {
    const orders = new Map();   // "92207" -> { trackings: [...], recipients: Set }
    const skipped = [];         // lines that look like packages but don't map to a Marcom order
    for (const raw of text.split(/\r?\n/)) {
        // A package row starts with an optional "*" then a 12-digit FedEx tracking number
        const m = raw.match(/^\s*\*?(\d{12})\s+/);
        if (!m) continue;
        const tracking = m[1];
        // INV NUM looks like "92207/W00" or "92177 /W0" (the column is truncated and
        // sometimes has a space before the slash). Non-Marcom rows ("B0027403", "688437") don't match.
        const inv = raw.match(/\s(\d{4,7})\s*\/\s*W\d*/);
        if (!inv) {
            skipped.push({ tracking, line: raw.trim().replace(/\s{2,}/g, '  ') });
            continue;
        }
        const orderNum = inv[1];
        if (!orders.has(orderNum)) orders.set(orderNum, { trackings: [], recipients: new Set() });
        const o = orders.get(orderNum);
        if (!o.trackings.includes(tracking)) o.trackings.push(tracking);
        const rec = raw.slice(m[0].length).split(/\s{2,}/)[1];
        if (rec) o.recipients.add(rec.trim());
    }
    return { orders, skipped };
}

module.exports = { parseFedexReport };

if (require.main === module) {
    const file = process.argv[2];
    if (!file) { console.error('Usage: node fedex_report_parser.js <report.txt>'); process.exit(1); }
    const { orders, skipped } = parseFedexReport(fs.readFileSync(file, 'utf8'));
    let pkgs = 0;
    for (const [num, o] of orders) {
        pkgs += o.trackings.length;
        console.log(`${num}  ${o.trackings.length} pkg  ${[...o.recipients].join(' / ')}  ->  ${o.trackings.join(', ')}`);
    }
    console.log(`\n${orders.size} orders, ${pkgs} packages mapped.`);
    if (skipped.length) {
        console.log(`${skipped.length} row(s) skipped (no "/W" order number):`);
        skipped.forEach((s) => console.log('  ' + s.line));
    }
}
