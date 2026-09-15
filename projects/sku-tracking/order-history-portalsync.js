

// Define the primeDirectory variable for file paths
const primeDirectory = "C:\\projects\\";

// Import Puppeteer for browser automation
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);

// Import Google APIs
const { google } = require(`${primeDirectory}node_modules\\googleapis`);

// Import Google API keys
//const googleKeys = require(`${primeDirectory}\\googleapi_keys.json`);
//const googleKeys = require(`${primeDirectory}\\googleapi_keys_portalsync.json`);
const googleKeys = require(`${__dirname}\\..\\keys\\googleapi_keys_portalsync.json`);
// Import Chrome marcom keys
//const keys = require(`${primeDirectory}\\chrome_marcom_keys.json`);

// Grab the local PC username to match to chrome key file
const os = require('os');

const userInfo = os.userInfo();
const userName = userInfo.username;

console.log(`Current username: ${userName}`);

// Relative link to keys directory before looking for username match
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

// Import path module for file paths
const path = require('path');

// Import ExcelJS module
const Excel = require(`${primeDirectory}node_modules\\exceljs`);


const fs = require('fs');

  

// Self-invoking async function
(async () => {
  // Connect to an existing instance of Chrome browser
  const wsChromeEndpointurl = keys.jsonURL;
  const browser = await puppeteer.connect({
    browserWSEndpoint: wsChromeEndpointurl,
  });

  // Create a new browser tab with specified specs
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });

  // Set up session ID capture BEFORE we navigate into the BI view,
  // so we don't miss the response if it fires early
 let sessionId = null;
const tableauResponses = [];

page.on('response', (response) => {
  const respUrl = response.url();
  if (respUrl.includes('10ay.online.tableau.com')) {
    tableauResponses.push(respUrl);
    console.log('[Tableau]', respUrl);

    const match = respUrl.match(/\/sessions\/([A-Za-z0-9]+-\d:\d)/);
    if (match && !sessionId) {
      sessionId = match[1];
      console.log('>>> Captured session ID:', sessionId);
    }
  }
});

  // Login to Marcom Page
  await page.goto('https://marcomcentral.app.pti.com/westpress/0001/login.aspx?company_id=14715', { timeout: 0 });
  await page.waitForTimeout(4000);
  await page.click(".btn");
  await page.waitForTimeout(4000);

  // Navigate to the BI page
  const url = 'https://portal.assets.site/business-intelligence'; // your real URL here
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Click "Order Summary" accordion header to expand it
  await page.waitForSelector('#bi-nav > ul > li:nth-child(4) > button', { visible: true });
  await page.waitForTimeout(4000);
  await page.click('#bi-nav > ul > li:nth-child(4) > button');
  await page.waitForTimeout(4000);

  // Wait for the accordion to finish expanding, then click into the view
  await page.waitForSelector('#menu4-collapse > ul > li:nth-child(2) > a', { visible: true });
  await page.waitForTimeout(4000);
  await page.click('#menu4-collapse > ul > li:nth-child(2) > a');
  await page.waitForTimeout(4000);
  await page.click('#menu4-collapse > ul > li:nth-child(2) > a');

  // Poll until we've captured a session ID, or give up after 20 seconds
  const maxWaitMs = 45000;
  const pollIntervalMs = 200;
  let waited = 0;
  while (!sessionId && waited < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    waited += pollIntervalMs;
  }

  if (sessionId) {
    console.log('SUCCESS. Session ID ready to use:', sessionId);
  } else {
    console.log('TIMED OUT waiting for session ID — check selectors or increase wait time.');
  }

  // Bonus check: confirm we can find the Tableau iframe
  const tableauFrame = page.frames().find(f => f.url().includes('10ay.online.tableau.com'));
  if (tableauFrame) {
    console.log('Found Tableau iframe:', tableauFrame.url());
  } else {
    console.log('No Tableau iframe found yet — may need more wait time after the click.');
  }

  // Leaving the browser open so you can inspect state / confirm visually.
  // Add `await browser.disconnect();` here once you're ready to close it out.
})();
  