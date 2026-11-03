
const fs = require('fs');
const path = require('path');
//const ExcelJS = require('exceljs');

// Define the primeDirectory variable for file paths
const primeDirectory = "C:\\projects\\";

// Import ExcelJS module
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);


// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const PRIME = 'C:\\projects\\';

const INPUT_DIR = path.join(__dirname, 'fedex-reports-input');
const PROCESSED_DIR = path.join(INPUT_DIR, 'processed');

const BILL_ACCOUNT = '981091558';
const ORDER_PREFIX = 'MCW Online - ';

const SPREADSHEET_ID = '1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU';
const SHEET_TAB = 'MCWFedexTracking';

const GOOGLE_KEYS = path.join(
    __dirname,
    '..',
    'keys',
    'googleapi_keys_portalsync.json'
);

// FedEx fixed-width column positions.
const COLUMNS = [
    0, 18, 23, 45, 63, 83,
    95, 99, 106, 117, 144, 155
];

// --------------------------------------------------
// PARSE FEDEX REPORT
// --------------------------------------------------

function parseFedexReport(text, sourceFile) {

    const shipments = [];

    for (const raw of text.split(/\r?\n/)) {

        if (!/^\s*\*?\d{12}\s+/.test(raw)) continue;

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

        // Only include the specified billing account.
        if (billAccount !== BILL_ACCOUNT) continue;

        // Remove everything after "/" and add the order prefix.
        const orderNum = ORDER_PREFIX + invoice.split('/')[0].trim();

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

// --------------------------------------------------
// GENERATE EXCEL WORKBOOK
// --------------------------------------------------

async function generateExcel(shipments) {

    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'FedEx Report Parser';
    workbook.created = new Date();

    // SHIPMENTS SHEET

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
        { header: 'INV NUM', key: 'orderNum', width: 25 },
        { header: 'Bill', key: 'bill', width: 12 }
    ];

    shipments.forEach(shipment => {
        sheet.addRow(shipment);
    });

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).height = 22;

    sheet.autoFilter = { from: 'A1', to: 'M1' };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    // ORDER SUMMARY SHEET

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
        { header: 'Order Number', key: 'orderNum', width: 25 },
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

    summarySheet.autoFilter = { from: 'A1', to: 'D1' };
    summarySheet.views = [{ state: 'frozen', ySplit: 1 }];

    // SAVE WORKBOOK

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

    return outputFile;
}

// --------------------------------------------------
// CONNECT TO GOOGLE SHEETS
// --------------------------------------------------

async function connectGoogleSheets() {

    const { google } = require(
        path.join(PRIME, 'node_modules', 'googleapis')
    );

    const googleKeys = require(GOOGLE_KEYS);

    const client = new google.auth.JWT(
        googleKeys.client_email,
        null,
        googleKeys.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
    );

    await new Promise((resolve, reject) => {
        client.authorize(err => {
            if (err) reject(err);
            else resolve();
        });
    });

    return google.sheets({
        version: 'v4',
        auth: client
    });
}

// --------------------------------------------------
// PUSH SHIPMENTS TO GOOGLE SHEETS
// --------------------------------------------------

async function pushToSheet(gsapi, shipments) {

    // Never overwrite or append an empty result.
    if (shipments.length === 0) {
        throw new Error('No matching shipments found. Google Sheet was not updated.');
    }

    // Verify that the destination tab exists.
    const meta = await gsapi.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        fields: 'sheets.properties.title'
    });

    const tabs = meta.data.sheets.map(
        sh => sh.properties.title
    );

    if (!tabs.includes(SHEET_TAB)) {
        throw new Error(
            `Google Sheets tab "${SHEET_TAB}" was not found. Available tabs: ${tabs.join(', ')}`
        );
    }

    // Match the Google Sheet column order:
    // A Tracking Number
    // B INV NUM
    // C Recipient
    // D Company
    // E Address
    // F City
    // G State
    // H ZIP
    // I References
    // J BILL ACCT
    // K Source File

    const rows = shipments.map(s => [
        s.tracking,
        s.orderNum,
        s.recipient,
        s.company,
        s.address,
        s.city,
        s.state,
        s.zip,
        s.references,
        s.billAccount,
        s.sourceFile
    ]);

    const CHUNK = 2000;

    for (let i = 0; i < rows.length; i += CHUNK) {

        const batch = rows.slice(i, i + CHUNK);

        await gsapi.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${SHEET_TAB}'!A:K`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: batch
            }
        });

        console.log(
            `Uploaded ${Math.min(i + batch.length, rows.length)} of ${rows.length} shipments.`
        );
    }

    console.log(
        `Successfully appended ${rows.length} shipments to "${SHEET_TAB}".`
    );
}

// --------------------------------------------------
// MOVE COMPLETED REPORTS TO PROCESSED FOLDER
// --------------------------------------------------

function moveProcessedFiles(files) {

    if (!fs.existsSync(PROCESSED_DIR)) {
        fs.mkdirSync(PROCESSED_DIR, { recursive: true });
    }

    for (const file of files) {

        const source = path.join(INPUT_DIR, file);

        let destination = path.join(PROCESSED_DIR, file);

        // Avoid overwriting a previously processed report.
        if (fs.existsSync(destination)) {

            const ext = path.extname(file);
            const name = path.basename(file, ext);

            const timestamp = Date.now();

            destination = path.join(
                PROCESSED_DIR,
                `${name}_${timestamp}${ext}`
            );
        }

        fs.renameSync(source, destination);

        console.log(`Moved to processed: ${file}`);
    }

    console.log(`\nMoved ${files.length} report(s) to processed.`);
}

// --------------------------------------------------
// MAIN
// --------------------------------------------------

async function main() {

    if (!fs.existsSync(INPUT_DIR)) {
        console.error(`Input directory not found: ${INPUT_DIR}`);
        process.exit(1);
    }

    // Only process TXT files directly inside the input directory.
    // The processed subdirectory is automatically excluded.
    const files = fs.readdirSync(INPUT_DIR)
        .filter(file => /\.txt$/i.test(file))
        .filter(file => fs.statSync(path.join(INPUT_DIR, file)).isFile());

    if (files.length === 0) {
        console.log('No new FedEx reports found.');
        return;
    }

    console.log(`Found ${files.length} report(s).`);

    let allShipments = [];

    // READ AND PROCESS REPORTS

    for (const file of files) {

        console.log(`\nProcessing: ${file}`);

        const filePath = path.join(INPUT_DIR, file);

        const text = fs.readFileSync(filePath, 'utf8');

        const shipments = parseFedexReport(text, file);

        console.log(`  ${shipments.length} matching shipment(s)`);

        allShipments = allShipments.concat(shipments);
    }

    // SAFETY CHECK

    if (allShipments.length === 0) {
        console.log(
            `\nNo shipments found for billing account ${BILL_ACCOUNT}.`
        );

        console.log('No Excel file created. No files moved. Google Sheet untouched.');

        return;
    }

    console.log(`\nTotal shipments: ${allShipments.length}`);

    // GENERATE EXCEL

    await generateExcel(allShipments);

    // CONNECT AND UPLOAD TO GOOGLE SHEETS

    console.log('\nConnecting to Google Sheets...');

    const gsapi = await connectGoogleSheets();

    await pushToSheet(gsapi, allShipments);

    // ONLY MOVE FILES AFTER SUCCESSFUL GOOGLE SHEETS UPLOAD

    console.log('\nGoogle Sheets upload successful.');

    moveProcessedFiles(files);

    console.log('\n====================================');
    console.log('FEDEX REPORT PROCESSING COMPLETE');
    console.log(`Reports processed: ${files.length}`);
    console.log(`Shipments uploaded: ${allShipments.length}`);
    console.log('====================================');
}

// --------------------------------------------------
// RUN
// --------------------------------------------------

main().catch(error => {

    console.error('\nFEDEX REPORT PROCESSING FAILED:');
    console.error(error);

    console.error(
        '\nOriginal reports have NOT been intentionally moved to processed.'
    );

    process.exit(1);
});
