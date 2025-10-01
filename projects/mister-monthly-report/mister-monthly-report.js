const primeDirectory = "C:\\projects\\";
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);
const path = require('path');

let fullPathtoRaw = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\mister-monthly-report\\raw`;
console.log(fullPathtoRaw)
let fullPathtoOutput = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\mister-monthly-report\\output`;
console.log(fullPathtoOutput)

const currentDate = new Date();
currentDate.setMonth(currentDate.getMonth() - 1); // Go back one month
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const currentMonth = monthNames[currentDate.getMonth()];
const currentYear = currentDate.getFullYear();


// Define the file paths
const inputFilePath = path.join(fullPathtoRaw, `MCW_Monthly_Report_${currentMonth}_RAW.xlsx`);
//const outputFilePath = path.join(fullPathtoOutput, 'MCW_Monthly_Report_Sept2025.xlsx');
const outputFilePath = path.join(fullPathtoOutput, `MCW_Monthly_Report_${currentMonth}${currentYear}.xlsx`);

// Load the workbook
const workbook = new ExcelJS.Workbook();

async function processExcel() {
    await workbook.xlsx.readFile(inputFilePath);

    // Select the first worksheet
    const worksheet = workbook.getWorksheet(1);
    
    // Create a new workbook and worksheet for the output file
    const newWorkbook = new ExcelJS.Workbook();
    const newWorksheet = newWorkbook.addWorksheet('MCW Monthly Report');

    // Set the headers for the new file
    newWorksheet.columns = [
        { header: 'Order Number', key: 'orderNumber' },
        { header: 'Order Date', key: 'orderDate' },
        { header: 'CC#', key: 'costCenter' },
        { header: 'Store #/User', key: 'storeNumber' },
        { header: 'Store Name', key: 'purchaser' },
        { header: 'Product Name', key: 'productName' },
        { header: 'SKU', key: 'sku' },
        { header: 'Ship Date', key: 'shipDate' },
        { header: 'Qty', key: 'qty' },
        { header: 'Price', key: 'price' },
        { header: 'Tax', key: 'tax' },
        { header: 'Total', key: 'total' }
    ];

    // Style the header row
    newWorksheet.getRow(1).font = { name: 'Arial', size: 12, bold: true };
    newWorksheet.getRow(1).alignment = { horizontal: 'center' };
    newWorksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F1EFEE' }
    };
    newWorksheet.getRow(1).font.color = { argb: '153C63' };

    // Initialize sum variables
    let totalPriceSum = 0;
    let totalTaxSum = 0;
    let totalTotalSum = 0;
    let uniqueFulfillmentItems = 0;
    let lineItemTotal = 0;

    let previousOrderNumber = null;

    // Collect rows for sorting
    const rows = [];

    // Skip the header row (assumed to be the first row)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        let productName = row.getCell('D').value;
        let shipDate = row.getCell('J').value;

        if (typeof productName === 'string' && (productName.endsWith('LF') || productName.endsWith('DIG'))) {
            return;
        }

        if (!shipDate || (typeof shipDate === 'string' && !shipDate.includes('/'))) {
            return;
        }

        let storeNumber = row.getCell('C').value;
        let costCenter = row.getCell('F').value;
        let processedStoreNumber = processStoreNumber(storeNumber);
        let processedPurchaser = processPurchaser(storeNumber);
        let processedCostCenter = processCostCenter(costCenter);

        let orderNumber = row.getCell('A').value;
        let price = 0;
        let tax = 0;
        let total = 0;

        if (orderNumber !== previousOrderNumber) {
            price = 5.95;
            tax = 0.52;
            total = 6.47;

            totalPriceSum += price;
            totalTaxSum += tax;
            totalTotalSum += total;

            uniqueFulfillmentItems++;
        }

        previousOrderNumber = orderNumber;

        // Add row data to the collection
        rows.push({
            orderNumber: orderNumber,
            orderDate: row.getCell('B').value,
            costCenter: processedCostCenter,
            storeNumber: processedStoreNumber,
            purchaser: processedPurchaser,
            productName: productName,
            sku: row.getCell('E').value,
            shipDate: shipDate,
            qty: row.getCell('K').value,
            price: `$${price.toFixed(2)}`,
            tax: `$${tax.toFixed(2)}`,
            total: `$${total.toFixed(2)}`
        });

        lineItemTotal++;
    });

    // Sort rows by Store Number/User
    rows.sort((a, b) => a.storeNumber.localeCompare(b.storeNumber));

    // Write sorted rows to the new worksheet
    rows.forEach((data, index) => {
        const newRow = newWorksheet.addRow(data);

        // Set the font style for data rows
        newRow.font = { name: 'Arial', size: 11 };

        // Apply light grey fill for every other row
        if (index % 2 === 0) {
            newRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F1EFEE' } // Light grey
            };
        }

        // Set row height to 30 px (approx. 22.5 points in ExcelJS)
        newRow.height = 22.5; // 30 pixels is roughly 22.5 points
    });

    // Add 2 blank rows between data and summary rows
    newWorksheet.addRow({});
    newWorksheet.addRow({});

    // Add Fulfillment Total row
    const fulfillmentTotalRow = newWorksheet.addRow({
        price: `$${totalPriceSum.toFixed(2)}`,
        tax: `$${totalTaxSum.toFixed(2)}`,
        total: `$${totalTotalSum.toFixed(2)}`
    });
    fulfillmentTotalRow.getCell('I').value = 'Fulfillment Total:';
    fulfillmentTotalRow.font = { name: 'Arial Narrow', size: 11, bold: true, color: { argb: '000000' } }; // Style summary row

    // Add Line Item Total row
    const lineItemTotalRow = newWorksheet.addRow({
        price: `${lineItemTotal}`
    });
    lineItemTotalRow.getCell('I').value = 'Line Item Total:';
    lineItemTotalRow.font = { name: 'Arial Narrow', size: 11, bold: true, color: { argb: '000000' } }; // Style summary row

    // Add Unique Fulfillment Items row
    const uniqueFulfillmentItemsRow = newWorksheet.addRow({
        price: `${uniqueFulfillmentItems}`
    });
    uniqueFulfillmentItemsRow.getCell('I').value = 'Unique Fulfillment Items:';
    uniqueFulfillmentItemsRow.font = { name: 'Arial Narrow', size: 11, bold: true, color: { argb: '000000' } }; // Style summary row

    // Set specific column widths
    const columnWidths = [160, 97, 70, 142, 133, 572, 117, 97, 185, 107, 107, 107];
    newWorksheet.columns.forEach((col, index) => {
        if (index < columnWidths.length) {
            col.width = columnWidths[index] / 8; // ExcelJS uses character width, not pixels
        }
    });

    // Save the new file
    await newWorkbook.xlsx.writeFile(outputFilePath);
    console.log(`New Excel file created at: ${outputFilePath}`);

    // Output the sum variables for later use
    console.log(`Total Price Sum: $${totalPriceSum.toFixed(2)}`);
    console.log(`Total Tax Sum: $${totalTaxSum.toFixed(2)}`);
    console.log(`Total Total Sum: $${totalTotalSum.toFixed(2)}`);
    console.log(`Unique Fulfillment Items: ${uniqueFulfillmentItems}`);
    console.log(`Line Item Total: ${lineItemTotal}`);
}

// Function to process Store Number based on provided logic
function processStoreNumber(value) {
    if (typeof value === 'string') {
        const firstPart = value.split(" ", 2)[0].trim();
        return /\d/.test(firstPart) ? firstPart : value.trim();
    }
    return value;
}

// Function to process Purchaser based on provided logic
function processPurchaser(value) {
    if (typeof value === 'string') {
        const parts = value.split(" ", 2);
        const firstPart = parts[0].trim();
        
        // Check if the first part contains a digit
        if (/\d/.test(firstPart)) {
            // Return the entire rest of the string after the first space
            return value.substring(value.indexOf(" ") + 1).trim();
        }
    }
    // Return an empty string if the first part does not contain a digit or if value is not a string
    return '';
}


// Function to process Cost Center based on provided logic
function processCostCenter(value) {
    if (typeof value === 'string') {
        const parts = value.split("-");
        return parts[0].trim();
    }
    return value;
}

// Define SKU sets with group names
const skuSets = [
    {
        groupName: "OLPKits_Items",
        skus: ["11050", "11052", "11053"]
    },
    {
        groupName: "RFID",
        skus: ["1010", "1010-BULK", "111470", "111471", "111470-BULK", "111475"]
    }
    // Add more sets as needed
];

// Process individual SKU set reports
async function processSets() {
    await workbook.xlsx.readFile(inputFilePath);
    
    // Process each SKU set
    for (const skuSet of skuSets) {
        await processSkuSet(skuSet.groupName, skuSet.skus);
    }
}

async function processSkuSet(groupName, allowedSkus) {
    // Read the workbook fresh for each set
    await workbook.xlsx.readFile(inputFilePath);
    
    // Create output file path with group name
    const outputFilePathSet = path.join(
        fullPathtoOutput, 
        `MCW_Monthly_Report_${currentMonth}${currentYear}_${groupName}.xlsx`
    );
    
    // Select the first worksheet
    const worksheet = workbook.getWorksheet(1);
    
    // Create a new workbook for this SKU set
    const newWorkbook = new ExcelJS.Workbook();

    // Initialize an object to keep track of rows by SKU
    const skuGroups = {};

    // Initialize sum variables
    const skuTotals = {};

    // Skip the header row (assumed to be the first row)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row

        let orderNumber = row.getCell('A').value;
        let productName = row.getCell('D').value;
        let shipDate = row.getCell('J').value;
        let sku = row.getCell('E').value;
        let qty = row.getCell('K').value;

        // Check if SKU is in this set's allowed SKUs
        if (!sku || !allowedSkus.includes(sku)) {
            return;
        }

        if (typeof productName === 'string' && (productName.endsWith('LF') || productName.endsWith('DIG'))) {
            return;
        }

        if (!shipDate || (typeof shipDate === 'string' && !shipDate.includes('/'))) {
            return;
        }

        // Initialize the group for this SKU if it doesn't exist
        if (!skuGroups[sku]) {
            skuGroups[sku] = [];
            skuTotals[sku] = 0;
        }

        // Update the total quantity for this SKU
        skuTotals[sku] += (parseFloat(qty) || 0);

        let storeNumber = row.getCell('C').value;
        let costCenter = row.getCell('F').value;

        let processedStoreNumber = processStoreNumber(storeNumber);
        let processedPurchaser = processPurchaser(storeNumber);
        let processedCostCenter = processCostCenter(costCenter);

        // Add row data to the group for the current SKU
        skuGroups[sku].push({
            orderNumber: orderNumber,
            orderDate: row.getCell('B').value,
            costCenter: processedCostCenter,
            storeNumber: processedStoreNumber,
            purchaser: processedPurchaser,
            productName: productName,
            sku: sku,
            shipDate: shipDate,
            qty: qty
        });
    });

    // Only create file if we found matching SKUs
    if (Object.keys(skuGroups).length === 0) {
        console.log(`No data found for ${groupName} SKU set. Skipping file creation.`);
        return;
    }

    // Iterate over the SKU groups and create a worksheet for each SKU
    Object.keys(skuGroups).forEach(sku => {
        const newWorksheet = newWorkbook.addWorksheet(sku);

        // Set the headers for the new worksheet
        newWorksheet.columns = [
            { header: 'Order Number', key: 'orderNumber' },
            { header: 'Order Date', key: 'orderDate' },
            { header: 'CC#', key: 'costCenter' },
            { header: 'Store #/User', key: 'storeNumber' },
            { header: 'Store Name', key: 'purchaser' },
            { header: 'Product Name', key: 'productName' },
            { header: 'SKU', key: 'sku' },
            { header: 'Ship Date', key: 'shipDate' },
            { header: 'Qty', key: 'qty' },
        ];

        // Style the header row
        newWorksheet.getRow(1).font = { name: 'Arial', size: 12, bold: true };
        newWorksheet.getRow(1).alignment = { horizontal: 'center' };
        newWorksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F1EFEE' }
        };
        newWorksheet.getRow(1).font.color = { argb: '153C63' };

        // Sort rows by Order Date (oldest first)
        skuGroups[sku].sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));

        // Write sorted rows to the new worksheet
        skuGroups[sku].forEach((data, index) => {
            const newRow = newWorksheet.addRow(data);

            // Set the font style for data rows
            newRow.font = { name: 'Arial', size: 11 };

            // Apply light grey fill for every other row
            if (index % 2 === 0) {
                newRow.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'F1EFEE' }
                };
            }

            // Set row height to 30 px (approx. 22.5 points in ExcelJS)
            newRow.height = 22.5;
        });

        // Add 2 blank rows between data and summary rows
        newWorksheet.addRow({});
        newWorksheet.addRow({});

        // Add Total Qty row
        const totalQtyRow = newWorksheet.addRow({
            qty: skuTotals[sku]
        });
        totalQtyRow.getCell('H').value = 'Total:';
        totalQtyRow.font = { name: 'Arial Narrow', size: 11, bold: true, color: { argb: '000000' } };

        // Set specific column widths
        const columnWidths = [160, 97, 70, 142, 133, 572, 117, 97, 185, 107, 107, 107];
        newWorksheet.columns.forEach((col, index) => {
            if (index < columnWidths.length) {
                col.width = columnWidths[index] / 8;
            }
        });
    });

    // Save the new file
    await newWorkbook.xlsx.writeFile(outputFilePathSet);
    console.log(`New Excel file created at: ${outputFilePathSet}`);
}




// Start processing
processExcel().catch(err => console.error(err));
processSets().catch(err => console.error(err));
