const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Grab the local PC username to match to chrome key file
const os = require('os');

const userInfo = os.userInfo();
const userName = userInfo.username;

console.log(`Current username: ${userName}`);

// Relative link to keys directory before looking for username match
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);
//const keys = require(`${primeDirectory}\\chrome_marcom_keys.json`);
//const googleKeys = require(`${primeDirectory}\\googleapi_keys.json`);

const outputDir = __dirname; // Set output directory to the script's running directory

const portalNamesAndSelectors = [
    
    { clientPortal: "Mister Car Wash" },
    { clientPortal: "NorthwestMedicalCenter" },
    { clientPortal: "Therapy Partners" },
    { clientPortal: "Tierra Antigua" },
    { clientPortal: "TMC" },
    { clientPortal: "UOA6" },
    { clientPortal: "WestPressInventory" },
    { clientPortal: "WestPressMarketingPromo" }
];

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

  // Variable to control CSS blocking
  let shouldBlockCSS = false;

  // Enable request interception
  await page.setRequestInterception(true);

  // Function to handle requests
  const handleRequest = (request) => {
    if (shouldBlockCSS && request.resourceType() === 'stylesheet') {
      request.abort();  // Block the CSS request
    } else {
      request.continue();  // Allow other requests
    }
  };

  page.on('request', handleRequest);

  // Login to Marcom Page
  await page.goto('https://admin.marcomcentral.app.pti.com/Account/LogOn?ReturnUrl=%2f', { timeout: 0 });
  await page.waitForTimeout(4000);
  await page.click(".ui-button");
  await page.waitForTimeout(4000);

  // Iterate through portal names and selectors
  for (let i = 0; i < portalNamesAndSelectors.length; i++) {
    const { clientPortal } = portalNamesAndSelectors[i];

    await page.goto('https://admin.marcomcentral.app.pti.com/PortalInformation/List', { timeout: 0 });
    await page.waitForTimeout(4000);
    await page.click("#gs_Name");
    await page.keyboard.type(clientPortal);
    await page.waitForTimeout(4000);
    await page.click("#fbox_Grid_search");
    await page.waitForTimeout(4000);
    await page.click(".gridCell");
    await page.waitForTimeout(4000);

    // Enable CSS blocking only for the specific URL
    shouldBlockCSS = true;
    const targetUrl = 'https://admin.marcomcentral.app.pti.com/Feature/EditOptions';
    await page.goto(targetUrl, { timeout: 0 });  // Navigate to the specific URL
    shouldBlockCSS = false; // Disable CSS blocking for future requests

    // Evaluate the page content to get data from checked checkboxes and associated labels
    const checkedData = await page.evaluate(() => {
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      const checkedCheckboxes = Array.from(checkboxes).filter(input => input.getAttribute('checked') === 'checked');
      return checkedCheckboxes.map(input => {
        const parentRow = input.closest('tr');
        const labels = Array.from(parentRow.querySelectorAll('label')).map(label => label.textContent.trim());
        return { labels: labels };
      });
    });

    // Build an HTML string with a table
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Settings Table</title>
      <style>
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid black; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h1>${clientPortal} Settings Table</h1>
      <table>
        <tr>
          <th>Setting</th>
          <th>Description</th>
        </tr>
    `;

    // Add rows to the table
    checkedData.forEach(item => {
      if (item.labels.length >= 2) {
        htmlContent += `
          <tr>
            <td>${item.labels[0]}</td>
            <td>${item.labels[1]}</td>
          </tr>
        `;
      }
    });

    // Close the table and HTML structure
    htmlContent += `
      </table>
    </body>
    </html>
    `;

    // Write the HTML content to a file
    let lowercasedClientPortal = clientPortal.toLowerCase().replace(/\s+/g, '');
    const outputPath = path.join(outputDir, `${lowercasedClientPortal}-settings.html`);
    fs.writeFileSync(outputPath, htmlContent, 'utf8');
    console.log(`HTML file for ${clientPortal} has been created.`);
  }

   // After all HTML files are created, but before closing the browser
  // try {
  //  console.log('Running summary script...');
 //   execSync('node setting-scraper-summary.js', { stdio: 'inherit' });
  //  console.log('Summary script completed.');
 // } catch (error) {
 //   console.error('Error running summary script:', error);
 // }

  //try {
 // console.log('Running summary script...');
 // execSync('node setting-scraper-summary.js', { 
 //   stdio: 'inherit',
  //  cwd: __dirname  // Use the directory of the current script
 // });
 // console.log('Summary script completed.');
//} catch (error) {
 // console.error('Error running summary script:', error);
//}

try {
  console.log('Running summary script...');
  execSync('node setting-scraper-summary.js', { 
    stdio: 'inherit',
    cwd: __dirname,
    shell: 'powershell.exe'
  });
  console.log('Summary script completed.');
} catch (error) {
  console.error('Error running summary script:', error);
}

  await page.close();
  await browser.disconnect();
})();
