// This thing creates HTML files that contain all the groups of the designated portal and creates an HTML file of their settings

const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);
const fs = require('fs');
const path = require('path');
//const axios = require('axios');  // Add this for HTTP requests
const { execSync } = require('child_process');

//const keys = require(`${primeDirectory}\\chrome_marcom_keys.json`);
//const googleKeys = require(`${primeDirectory}\\googleapi_keys.json`);

// Grab the local PC username to match to chrome key file
const os = require('os');

const userInfo = os.userInfo();
const userName = userInfo.username;

console.log(`Current username: ${userName}`);

// Relative link to keys directory before looking for username match
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

const clientPortal="westpressinventory";

//const outputDir = __dirname; // Set output directory to the script's running directory
const outputDir = `${__dirname}/${clientPortal}`; // Creates subfolder with clientPortal name
//const clientPortal="westpressmarketingpromo";
// Group URLs
//const groupUrls = ["2111075", "5626814", "6094758"];

// Helper function to sanitize strings for web-friendly filenames
function sanitizeForFilename(str) {
    return str
        .toLowerCase()                           // Convert to lowercase
        .trim()                                  // Remove leading/trailing whitespace
        .replace(/\s+/g, '-')                   // Replace spaces with hyphens
        .replace(/[^a-z0-9-_]/g, '')            // Remove special characters, keep alphanumeric, hyphens, underscores
        .replace(/-+/g, '-')                    // Replace multiple consecutive hyphens with single hyphen
        .replace(/^-+|-+$/g, '');               // Remove leading/trailing hyphens
}

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
    

        await page.goto('https://admin.marcomcentral.app.pti.com/PortalInformation/List', { timeout: 0 });
        await page.waitForTimeout(4000);
        await page.click("#gs_Name");
        await page.keyboard.type(clientPortal);
        await page.waitForTimeout(4000);
        await page.click("#fbox_Grid_search");
        await page.waitForTimeout(4000);
        await page.click(".gridCell");
        await page.waitForTimeout(4000);

        
            const jsonUrl = 'https://admin.marcomcentral.app.pti.com/Group/DataRequested/?isActive=1&_search=false&nd=1724427009079&rows=1000&page=1&sidx=&sord=asc';
    
            // Navigate to the page containing the JSON data
            await page.goto(jsonUrl, { waitUntil: 'networkidle2' });
    
            // Explicitly wait for the <pre> tag to be loaded
            await page.waitForSelector('body > pre', { timeout: 10000 }); // Wait up to 10 seconds
    
            // Extract the content inside the <pre> tag
            const rawData = await page.evaluate(() => {
                const preElement = document.querySelector("body > pre");
                return preElement ? preElement.innerText : null;
            });
    
            if (!rawData) {
                console.error("Error: No data found inside the <pre> tag.");
                return;
            }
    
            console.log("Raw JSON data:", rawData); // Log the raw data to verify

            
        // Parse the JSON data
        const jsonData = JSON.parse(rawData);
        let groupUrls=[];
        // Check if rows exist and is an array
        if (Array.isArray(jsonData.rows)) {
            // Extracting the first element from the 'cell' array in each row
            groupUrls = jsonData.rows.map(record => record.cell[0]);
            console.log("Extracted group URLs:", groupUrls);
        } else {
            console.error(`Error: Expected 'rows' to be an array but got ${typeof jsonData.rows}`);
        }        


    // Load group URLs from JSON URL
    //const groupUrls = await fetchDataFromJsonPage(jsonFilePath);

        
        for (let i = 0; i < groupUrls.length; i++) {
            const groupUrl = groupUrls[i]; // Directly assign the string value to groupUrl
            
            console.log(groupUrl);

        // Navigate to the specific URL without CSS blocking
        shouldBlockCSS = false;
        
        const targetUrl = `https://admin.marcomcentral.app.pti.com/Group/Edit/${groupUrl}`;
       console.log (`targetURL:${targetUrl}`);
        //const targetUrl = 'https://admin.marcomcentral.app.pti.com/Group/Edit/2111075';
        await page.goto(targetUrl, { timeout: 0 });

     // Function to collect label elements and the text values of pivotDisplayField class elements
async function collectLabelAndPivotData(page) {
    return await page.evaluate(() => {
        // Get all label elements and pivotDisplayField elements
        const labels = Array.from(document.querySelectorAll('label'))
            .map(label => label.textContent.trim())
            .filter(label => label.length > 0); // Filter out empty labels

        const pivotDisplayFields = Array.from(document.querySelectorAll('.pivotDisplayField'))
            .map(field => field.textContent.trim());

        // Pair up each label with the corresponding pivotDisplayField based on their occurrence order
        return labels.map((label, index) => ({
            label: label,
            pivotDisplayField: pivotDisplayFields[index] || ''
        }));
    });
}

        // Collect data
        const labelPivotData = await collectLabelAndPivotData(page);
    //    console.log(labelPivotData); // This will log an array of objects with label and pivotDisplayField pairs
       // Extract the pivotDisplayField value for the label 'GroupName'
    const groupNamePivotField = labelPivotData.find(pair => pair.label === 'Group Name')?.pivotDisplayField || 'UnknownGroup';

const sanitizedClientPortal = sanitizeForFilename(clientPortal);
const sanitizedGroupName = sanitizeForFilename(groupNamePivotField);

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
          <h1>${clientPortal}-${groupNamePivotField} Group Settings Table</h1>
          <table>
            <tr>
              <th>Setting</th>
              <th>Description</th>
            </tr>
        `;

        // Add rows to the table with labels and pivotDisplayFields
        labelPivotData.forEach(pair => {
            htmlContent += `
            <tr>
              <td>${pair.label}</td>
              <td>${pair.pivotDisplayField}</td>
            </tr>
            `;
        });

        // Close the table and HTML structure
        htmlContent += `
          </table>
        </body>
        </html>
        `;

// Write the HTML content to a file with web-friendly naming
const outputPath = path.join(outputDir, `${sanitizedClientPortal}-${sanitizedGroupName}-group-settings-table.html`);


        // Write the HTML content to a file
        //const outputPath = path.join(outputDir, `${clientPortal}_${groupNamePivotField}_group-settings-table.html`);
        fs.writeFileSync(outputPath, htmlContent, 'utf8');
        console.log(`HTML file for ${clientPortal}_${groupNamePivotField} has been created.`);
    }

    await page.close();
    await browser.disconnect();
})();
