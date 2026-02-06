const primeDirectory = "C:\\projects\\";
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);
const path = require('path');
const fs = require('fs');

// Configuration
const quotesDir = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\printsmith-quote-scraper\\quotes`;
const pricingSheetPath = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\printsmith-quote-scraper\\pricing_sheet.xlsx`; // UPDATE THIS PATH
const outputPath = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\printsmith-quote-scraper\\pricing_sheet_updated.xlsx`;

// Helper function to normalize quantities (remove commas, convert to string)
const normalizeQty = (qty) => {
  if (qty === null || qty === undefined) return '';
  return qty.toString().replace(/,/g, '');
};

(async () => {
  console.log('Starting pricing update process...');

  // Step 1: Read the existing pricing sheet
  console.log('Reading existing pricing sheet...');
  console.log(`Pricing sheet path: ${pricingSheetPath}`);
  
  // Check if file exists
  if (!fs.existsSync(pricingSheetPath)) {
    console.error(`ERROR: Pricing sheet not found at: ${pricingSheetPath}`);
    return;
  }

  const pricingWorkbook = new ExcelJS.Workbook();
  await pricingWorkbook.xlsx.readFile(pricingSheetPath);
  
  const pricingSheet = pricingWorkbook.worksheets[0];
  
  if (!pricingSheet) {
    console.error('ERROR: No worksheet found in pricing workbook');
    return;
  }
  
  console.log(`Using worksheet: ${pricingSheet.name}`);
  console.log(`Row count: ${pricingSheet.rowCount}`);

  // Step 2: Get all scraped estimate files
  const estimateFiles = fs.readdirSync(quotesDir).filter(file => file.endsWith('.xlsx'));
  console.log(`Found ${estimateFiles.length} estimate files to process\n`);

  let updatedCount = 0;
  let newRowsCount = 0;

  // Step 3: Process each estimate file
  for (const file of estimateFiles) {
    const estNum = path.basename(file, '.xlsx');
    console.log(`Processing estimate ${estNum}...`);

    const estimateWorkbook = new ExcelJS.Workbook();
    await estimateWorkbook.xlsx.readFile(path.join(quotesDir, file));
    const estimateSheet = estimateWorkbook.worksheets[0];

    // Get estimate data (skip header row)
    const estimateData = [];
    estimateSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        const itemData = {
          estNum: row.getCell(1).value,
          description: row.getCell(2).value,
          qty: normalizeQty(row.getCell(3).value), // Normalize quantity here
          price: row.getCell(4).value
        };
        estimateData.push(itemData);
        console.log(`  Scraped: Qty=${itemData.qty}, Price=${itemData.price}`);
      }
    });

    console.log(`  Found ${estimateData.length} items in estimate ${estNum}`);

    // Step 4: Build a map of all existing rows for this estimate (organized by product)
    const productRowsMap = {};
    const existingQuantities = new Set();

    pricingSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const rowEstNum = row.getCell(1).value?.toString(); // Column A
      const rowProductName = row.getCell(2).value; // Column B
      const rowQty = normalizeQty(row.getCell(5).value); // Column E - Normalize here too
      const rowPrice = row.getCell(8).value; // Column H

      if (rowEstNum === estNum) {
        console.log(`  Existing in pricing: Product=${rowProductName}, Qty=${rowQty}, Price=${rowPrice}`);
        existingQuantities.add(rowQty);
        
        if (!productRowsMap[rowProductName]) {
          productRowsMap[rowProductName] = [];
        }
        productRowsMap[rowProductName].push(row);
      }
    });

    console.log(`  Found ${Object.keys(productRowsMap).length} products with estimate ${estNum}`);
    console.log(`  Existing quantities: ${Array.from(existingQuantities).join(', ')}`);

    // Step 5: Process each item from the estimate
    for (const estItem of estimateData) {
      const estQty = estItem.qty; // Already normalized
      
      console.log(`\n  Checking quantity ${estQty}...`);
      
      // Check if this quantity already exists for this estimate
      if (existingQuantities.has(estQty)) {
        console.log(`    → Quantity ${estQty} exists, updating prices...`);
        // Update existing prices for all products with this estimate + quantity
        pricingSheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header

          const rowEstNum = row.getCell(1).value?.toString();
          const rowQty = normalizeQty(row.getCell(5).value); // Column E - Normalize for comparison

          if (rowEstNum === estNum && rowQty === estQty) {
            const oldPrice = row.getCell(8).value;
            row.getCell(8).value = parseFloat(estItem.price); // Column H
            const productName = row.getCell(2).value;
            console.log(`      ✓ Updated: ${productName}, Qty ${estQty}, ${oldPrice} → ${estItem.price}`);
            updatedCount++;
          }
        });
      } else {
        console.log(`    → Quantity ${estQty} is NEW, creating rows...`);
        // This is a NEW quantity for this estimate
        
        for (const [productName, templateRows] of Object.entries(productRowsMap)) {
          const templateRow = templateRows[0];
          const newRow = pricingSheet.addRow([]);
          
          // Copy all columns from template row
          for (let col = 1; col <= pricingSheet.columnCount; col++) {
            if (col === 5) { // Column E - Quantity
              // Store as number without commas
              newRow.getCell(col).value = parseFloat(estItem.qty);
            } else if (col === 8) { // Column H - Price
              newRow.getCell(col).value = parseFloat(estItem.price);
            } else if (col === 19) { // Column S - Unique identifier (leave blank)
              newRow.getCell(col).value = null;
            } else if (col === 20) { // Column T - Unique identifier (leave blank)
              newRow.getCell(col).value = null;
            } else {
              newRow.getCell(col).value = templateRow.getCell(col).value;
            }
          }

          console.log(`      + Added: ${productName}, Qty ${estItem.qty}, Price ${estItem.price}`);
          newRowsCount++;
        }
        
        existingQuantities.add(estQty);
      }
    }
  }

  // Step 6: Save the updated pricing sheet
  console.log('\nSaving updated pricing sheet...');
  await pricingWorkbook.xlsx.writeFile(outputPath);
  
  console.log('\n=== SUMMARY ===');
  console.log(`✓ Updated ${updatedCount} existing prices`);
  console.log(`+ Added ${newRowsCount} new quantity rows`);
  console.log(`💾 Saved to: ${outputPath}`);
  console.log('\nDone!');
})();