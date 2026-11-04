const fs = require('fs');
const path = require('path');

const primeDirectory = "C:\\projects\\";
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const PRIME = 'C:\\projects\\';

const INPUT_DIR = "G:\\East Warehouse\\Fedex REPORTS";
const PROCESSED_MANIFEST = path.join(INPUT_DIR, '.fedex-processed.json');
const REPORT_DIR = path.join(__dirname, 'fedex-reports-output');

const REPORT_FILENAME_REGEX = /^\d+_\d+_\d+[a-z]\.txt$/i;

const BILL_ACCOUNT = '981091558';
const ORDER_PREFIX = 'MCW Online - ';

const SPREADSHEET_ID = '1lZuCrQ9vy64LEkHAwZe8W16__E-tFIKLxcxHITHA0EM';
const SHEET_TAB = 'MCWFedexTracking';

const GOOGLE_KEYS = path.join(
    __dirname,
    '..',
    'keys',
    'googleapi_keys_portalsync.json'
);

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

        if (billAccount !== BILL_ACCOUNT) continue;

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

    if (!fs.existsSync(REPORT_DIR)) {
        fs.mkdirSync(REPORT_DIR, { recursive: true });
    }

    const outputFile = path.join(
        REPORT_DIR,
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

    if (shipments.length === 0) {
        throw new Error('No matching shipments found. Google Sheet was not updated.');
    }

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
// PROCESSED FILE TRACKING
// --------------------------------------------------

function readProcessedManifest() {

    if (!fs.existsSync(PROCESSED_MANIFEST)) {
        return {};
    }

    try {
        const data = JSON.parse(
            fs.readFileSync(PROCESSED_MANIFEST, 'utf8')
        );

        return data && typeof data === 'object' && !Array.isArray(data)
            ? data
            : {};

    } catch (error) {
        throw new Error(
            `Could not read processed-file history (${PROCESSED_MANIFEST}): ${error.message}`
        );
    }
}

function getFileSignature(filePath) {

    const stats = fs.statSync(filePath);

    return {
        size: stats.size,
        modifiedTime: stats.mtimeMs
    };
}

function wasFileProcessed(file, signature, manifest) {

    const previous = manifest[file];

    return Boolean(
        previous &&
        previous.size === signature.size &&
        previous.modifiedTime === signature.modifiedTime
    );
}

function saveProcessedFiles(files, manifest) {

    for (const file of files) {
        const filePath = path.join(INPUT_DIR, file);
        manifest[file] = getFileSignature(filePath);
    }

    const tempFile = `${PROCESSED_MANIFEST}.tmp`;

    fs.writeFileSync(
        tempFile,
        JSON.stringify(manifest, null, 2),
        'utf8'
    );

    fs.renameSync(tempFile, PROCESSED_MANIFEST);

    console.log(`Recorded ${files.length} processed report(s).`);
}

// --------------------------------------------------
// MAIN
// --------------------------------------------------

async function main() {

    if (!fs.existsSync(INPUT_DIR)) {
        console.error(`Input directory not found: ${INPUT_DIR}`);
        process.exit(1);
    }

    const manifest = readProcessedManifest();

    // ONLY consider matching TXT files.
    const matchingFiles = fs.readdirSync(INPUT_DIR)
        .filter(file => REPORT_FILENAME_REGEX.test(file))
        .filter(file => fs.statSync(path.join(INPUT_DIR, file)).isFile());

    if (matchingFiles.length === 0) {
        console.log('No FedEx report files matching the required naming convention were found.');
        return;
    }

    // SKIP previously processed files.
    const files = matchingFiles.filter(file => {

        const signature = getFileSignature(
            path.join(INPUT_DIR, file)
        );

        if (wasFileProcessed(file, signature, manifest)) {
            console.log(`Skipping previously processed file: ${file}`);
            return false;
        }

        return true;
    });

    if (files.length === 0) {
        console.log('All matching FedEx reports have already been processed.');
        return;
    }

    console.log(`Found ${files.length} new or modified report(s).`);

    let allShipments = [];

    // READ AND PROCESS REPORTS

    for (const file of files) {

        console.log(`\nProcessing: ${file}`);

        const filePath = path.join(INPUT_DIR, file);
        const reportText = fs.readFileSync(filePath, 'utf8');

        const shipments = parseFedexReport(reportText, file);

        console.log(`  ${shipments.length} matching shipment(s)`);

        allShipments = allShipments.concat(shipments);
    }

    // NO MATCHING SHIPMENTS

    if (allShipments.length === 0) {

        console.log(
            `\nNo shipments found for billing account ${BILL_ACCOUNT}.`
        );

        console.log('No Excel file created. Google Sheet untouched.');

        saveProcessedFiles(files, manifest);

        return;
    }

    console.log(`\nTotal shipments: ${allShipments.length}`);

    // GENERATE EXCEL

    await generateExcel(allShipments);

    // CONNECT AND UPLOAD TO GOOGLE SHEETS

    console.log('\nConnecting to Google Sheets...');

    const gsapi = await connectGoogleSheets();

    await pushToSheet(gsapi, allShipments);

    // RECORD SUCCESSFUL PROCESSING

    console.log('\nGoogle Sheets upload successful.');

    saveProcessedFiles(files, manifest);

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
        '\nOriginal report files were left in place. Files are recorded as processed only after a successful upload.'
    );

    process.exit(1);
});