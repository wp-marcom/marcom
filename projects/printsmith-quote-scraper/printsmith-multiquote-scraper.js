const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);
const fs = require('fs');
const path = require('path');
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);

//const keys = require(`${primeDirectory}\\chrome_marcom_keys.json`);

// Grab the local PC username to match to chrome key file
const os = require('os');

const userInfo = os.userInfo();
const userName = userInfo.username;

console.log(`Current username: ${userName}`);

// Relative link to keys directory before looking for username match
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

//const outputDir = __dirname;

let outputDir = `\\\\DataKing1\\homes\\kaleb\\Github Repos\\marcom\\projects\\printsmith-quote-scraper\\quotes`;
console.log(outputDir)

// Define estimate numbers - ADD MORE ESTIMATES TO THIS ARRAY
const estNums = ["40137", "40160", "40138", "40139", "40141", "40142", "40506", "40143", "40144", "40480", "40482", "40147", "40148", "40149", "40150", "40159", "40154", "40155", "40167", "40168", "40169", "40170", "40172", "40173", "40174", "40215", "40216", "40515", "40218", "40219", "40508", "40220", "40221", "40224", "40226", "40487", "40227", "40228", "40229", "40230", "40231", "40233", "40235", "40236", "40237", "40238", "40240", "40241", "40250", "40252", "40253", "40254", "40255", "40256", "40257", "40260", "40269", "40270", "40271", "40272", "40273", "40275", "40276", "40277", "40279", "40280", "40283", "40284", "40285", "40286", "40287", "40516", "40289", "40431", "40432", "40433", "40434", "40435", "40436", "40517", "40437", "40484", "40439", "40440", "40443", "40444", "40251", "40447", "40448", "40451", "40453", "40454", "40455", "40457", "40473", "40475", "40476", "40477", "40505", "40488", "40489", "40507", "40518", "40151", "40519", "40510", "40520", "40521", "40522", "40478", "40102", "40523", "40452", "40445", "40446", "40524", "40526", "40527", "40438", "40145", "40481", "40479", "40530", "40531", "40532", "40533", "40534", "40535", "40536", "40537", "40538", "40049", "40539", "40450", "40540", "40541", "40543", "40544", "40545", "40278", "40546", "40547", "40548", "40549", "40550", "40551", "40458", "40552", "40553", "40554", "39817"]; // Add as many as you need

(async () => {
  const wsChromeEndpointurl = keys.jsonURL;
  const browser = await puppeteer.connect({
    browserWSEndpoint: wsChromeEndpointurl,
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });

  let shouldBlockCSS = false;

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (shouldBlockCSS && request.resourceType() === 'stylesheet') {
      request.abort();
    } else {
      request.continue();
    }
  });

  // Login to PrintSmith Page
  await page.goto('http://192.168.1.4:9191/PrintSmith/PrintSmith.html', { timeout: 0 });
  await page.waitForTimeout(4000);
  await page.click("#userName");
  await page.keyboard.type("Kaleb");
  await page.waitForTimeout(4000);
  await page.click("#password");
  await page.keyboard.type("westpress");
  await page.waitForTimeout(4000);
  await page.click("#loginBtn");

  await page.waitForTimeout(4000);
  await page.select('#module_select', '2');

  for (let i = 0; i < estNums.length; i++) {
    const estNum = estNums[i];
    
    // Array to hold data for this specific estimate
    const allData = [];

    await page.click(".dot-search");
    await page.waitForTimeout(4000);
    await page.keyboard.type(estNum);
    await page.waitForTimeout(4000);
    await page.click(".dot-search-button");
    await page.waitForTimeout(4000);

    await page.click(".dot-search-button");

    // Wait a bit longer for the modal to potentially appear
    await page.waitForTimeout(2000);

   // Wait for either the modal or the table to appear
try {
  await page.waitForSelector('.dot-modal', { timeout: 3000 });
  console.log('Modal appeared, closing it...');
  
  // Wait a moment for the modal to fully render
  await page.waitForTimeout(500);
  
  // Click the close button using the shadow DOM piercing selector
  await page.click('invoice-selector > app-invoicenote div.close > span');
  
  console.log('Clicked close button');
  await page.waitForTimeout(1000);
  
} catch (error) {
  console.log('No modal appeared or error closing:', error.message);
}

   // Wait for either the modal or the table to appear
try {
  await page.waitForSelector('.dot-wrapper', { timeout: 3000 });
  console.log('Stock Error appeared, closing it...');
  
  // Wait a moment for the modal to fully render
  await page.waitForTimeout(500);
  
  // Click the close button using the shadow DOM piercing selector
  await page.click('p-confirmdialog a > span');
  
  console.log('Clicked close button');
  await page.waitForTimeout(1000);
  
} catch (error) {
  console.log('No stock error appeared or error closing:', error.message);
}

//body > app-root > div.dot-wrapper > p-confirmdialog > div > div.ui-dialog-titlebar.ui-widget-header.ui-helper-clearfix.ui-corner-top > a > span

await page.waitForSelector('.ui-treetable-table');
    const tableData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.ui-treetable-table tbody tr'));
      return rows.map(row => {
        const columns = row.querySelectorAll('td');
        
        // Helper function to get values from input elements or innerText if no input exists
        const getValue = (col) => {
          if (!col) return ''; // Check if the column exists
          const inputField = col.querySelector('input');
          if (inputField) {
            return inputField.value || '';  // Get value from the input field
          }
          return col.innerText || '';  // Fall back to innerText if no input field
        };

        // Clean up column 8 value to remove dollar sign and keep only digits and decimal point
        const cleanPrice = (price) => price.replace(/[^0-9.]/g, '');

        return {
          col2: getValue(columns[1]),  // Column 2
          col4: getValue(columns[3]),  // Column 4
          col8: cleanPrice(getValue(columns[7])) // Column 8
        };
      });
    });

    // Filter out rows where col8 is empty
    const filteredData = tableData.filter(row => row.col8.trim() !== '');

    // Add the data to the allData array with the source estNum
    filteredData.forEach(row => {
      allData.push({
        estNum: estNum,
        col2: row.col2,
        col4: row.col4,
        col8: row.col8
      });
    });

    console.log(`Data for estimate ${estNum} processed.`);

    // Create and save the workbook for THIS estimate
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Table Data');

    // Add headers
    sheet.addRow(['Estimate', 'Description', 'Qty', 'Price']);

    // Add all data
    allData.forEach(row => {
      sheet.addRow([row.estNum, row.col2, row.col4, row.col8]);
    });

    // FIXED: Now estNum is accessible here because it's still in the loop scope
    const filePath = path.join(outputDir, `${estNum}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    console.log(`Data saved to ${filePath}`);
  }

  // Close the browser (uncomment to close the browser after script runs)
  // await browser.close();
})();