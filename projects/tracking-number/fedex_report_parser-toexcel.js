
// fedex_report_parser.js
// Processes all FedEx text reports in ./fedex-reports-input
// Filters BILL ACCT 981091558
// Exports shipment details and order summary to Excel using ExcelJS.

const fs = require('fs');
const path = require('path');
//const ExcelJS = require('exceljs');

// Define the primeDirectory variable for file paths
const primeDirectory = "C:\\projects\\";

// Import ExcelJS module
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);

const INPUT_DIR = path.join(__dirname, 'fedex-reports-input');
const BILL_ACCOUNT = '981091558';

// Column positions based on the FedEx report layout.
// Each position marks the beginning of a column.
const COLUMNS = [
    0, 18, 23, 45, 63, 83,
    95, 99, 106, 117, 144, 155
];

function parseFedexReport(text, sourceFile) {
    const shipments = [];

    for (const raw of text.split(/\r?\n/)) {

        // A package row starts with an optional "*" and a 12-digit tracking number.
        if (!/^\s*\*?\d{12}\s+/.test(raw)) continue;

        // Extract the individual columns using the report's fixed-width layout.
        const values = COLUMNS.map((start, i) => {
            const end = i + 1 < COLUMNS.length
                ? COLUMNS[i + 1]
                : raw.length;

            return raw.slice(start, end).trim();
        });

        const [
            tracking,
            service,
            recipient,
            company,
            address,
            city,
            state,
            zip,
            billAccount,
            references,
            invoice,
            bill
        ] = values;

        // Only process the specified billing account.
        if (billAccount !== BILL_ACCOUNT) continue;

        // Remove the "/" and everything after it.
        //const orderNum = invoice.split('/')[0].trim();
        const orderNum = 'MCW Online - ' + invoice.split('/')[0].trim();

        shipments.push({
            sourceFile,
            tracking: tracking.replace(/^\*/, ''),
            service,
            recipient,
            company,
            address,
            city,
            state,
            zip,
            billAccount,
            references,
            orderNum,
            bill
        });
    }

    return shipments;
}

async function generateExcel(shipments) {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'FedEx Report Parser';
    workbook.created = new Date();

    // --------------------------------------------------
    // SHEET 1: SHIPMENTS
    // --------------------------------------------------

    const sheet = workbook.addWorksheet('Shipments');

    sheet.columns = [
        { header: 'Source File', key: 'sourceFile', width: 25 },
        { header: 'Tracking Number', key: 'tracking', width: 18 },
        { header: 'Service', key: 'service', width: 10 },
        { header: 'Recipient', key: 'recipient', width: 25 },
        { header: 'Company', key: 'company', width: 25 },
        { header: 'Address', key: 'address', width: 25 },
        { header: 'City', key: 'city', width: 18 },
        { header: 'State', key: 'state', width: 10 },
        { header: 'ZIP', key: 'zip', width: 12 },
        { header: 'BILL ACCT', key: 'billAccount', width: 15 },
        { header: 'References', key: 'references', width: 20 },
        { header: 'INV NUM', key: 'orderNum', width: 15 },
        { header: 'Bill', key: 'bill', width: 12 }
    ];

    shipments.forEach(shipment => {
        sheet.addRow(shipment);
    });

    // Format header row.
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: 'middle' };
    sheet.getRow(1).height = 22;

    sheet.autoFilter = {
        from: 'A1',
        to: 'M1'
    };

    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    // --------------------------------------------------
    // SHEET 2: ORDER SUMMARY
    // --------------------------------------------------

    const summary = new Map();

    shipments.forEach(shipment => {
        const orderNum = shipment.orderNum;

        if (!orderNum) return;

        if (!summary.has(orderNum)) {
            summary.set(orderNum, {
                orderNum,
                trackings: [],
                recipients: new Set(),
                packages: 0
            });
        }

        const order = summary.get(orderNum);

        if (!order.trackings.includes(shipment.tracking)) {
            order.trackings.push(shipment.tracking);
        }

        if (shipment.recipient) {
            order.recipients.add(shipment.recipient);
        }

        order.packages++;
    });

    const summarySheet = workbook.addWorksheet('Order Summary');

    summarySheet.columns = [
        { header: 'Order Number', key: 'orderNum', width: 18 },
        { header: 'Package Count', key: 'packages', width: 16 },
        { header: 'Recipients', key: 'recipients', width: 30 },
        { header: 'Tracking Numbers', key: 'trackings', width: 80 }
    ];

    for (const order of summary.values()) {
        summarySheet.addRow({
            orderNum: order.orderNum,
            packages: order.packages,
            recipients: [...order.recipients].join(' / '),
            trackings: order.trackings.join(', ')
        });
    }

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).height = 22;

    summarySheet.autoFilter = {
        from: 'A1',
        to: 'D1'
    };

    summarySheet.views = [{ state: 'frozen', ySplit: 1 }];

    // --------------------------------------------------
    // SAVE WORKBOOK
    // --------------------------------------------------

    const now = new Date();

    const timestamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        '_',
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0')
    ].join('');

    const outputFile = path.join(
        __dirname,
        `FedEx_Report_${timestamp}.xlsx`
    );

    await workbook.xlsx.writeFile(outputFile);

    console.log(`\nExcel file created: ${outputFile}`);
    console.log(`Total shipments: ${shipments.length}`);
    console.log(`Unique orders: ${summary.size}`);
}

// --------------------------------------------------
// MAIN
// --------------------------------------------------

async function main() {

    if (!fs.existsSync(INPUT_DIR)) {
        console.error(`Input directory not found: ${INPUT_DIR}`);
        process.exit(1);
    }

    const files = fs.readdirSync(INPUT_DIR)
        .filter(file => /\.txt$/i.test(file));

    if (files.length === 0) {
        console.log('No .txt files found in fedex-reports-input.');
        return;
    }

    console.log(`Found ${files.length} report(s).`);

    let allShipments = [];

    for (const file of files) {

        const filePath = path.join(INPUT_DIR, file);

        console.log(`Processing: ${file}`);

        const text = fs.readFileSync(filePath, 'utf8');

        const shipments = parseFedexReport(text, file);

        console.log(`  ${shipments.length} matching shipment(s)`);

        allShipments = allShipments.concat(shipments);
    }

    if (allShipments.length === 0) {
        console.log('\nNo shipments found for billing account ' + BILL_ACCOUNT);
        return;
    }

    await generateExcel(allShipments);
}

main().catch(error => {
    console.error('Error processing FedEx reports:', error);
    process.exit(1);
});
