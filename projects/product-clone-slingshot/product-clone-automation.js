/**
 * Puppeteer Script for Product Cloning Automation
 * Compatible with Puppeteer version 13.5.1
 * 
 * This script automates the process of cloning a base product and creating
 * multiple variations with different external IDs and product names.
 */

// Define the primeDirectory variable for file paths
const primeDirectory = "C:\\projects\\";

// Import Puppeteer for browser automation
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);

// Grab the local PC username to match to chrome key file
const os = require('os');

const userInfo = os.userInfo();
const userName = userInfo.username;

console.log(`Current username: ${userName}`);

// Relative link to keys directory before looking for username match
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

// Configuration
const BASE_URL = 'http://192.168.1.8:8082/servoy-webclient/?x=LYy7nKPqsLsRl*q17n6Sg0D6ldQDxFhl';

// The base product name to clone (stays the same for all clones)
const BASE_PRODUCT_NAME = '28"x44" Delighter "Finishing Station" Windscreen (167)';

// Array of external IDs to assign to cloned products
const EXTERNAL_IDS = [
    'MCW2100',
    'MCW2124',
    'MCW2148',
    'MCW2164'
    // Add more external IDs as needed
];

// Array of product names for the cloned products
// Must have the same length as EXTERNAL_IDS or they will be paired in order
const PRODUCT_NAMES = ['36"x96" Vinyl UWC 50% Off|1 Month Promo Banner-L (2100)', '36"x96" Vinyl UWC 75% Off|1 Month Promo Banner-N (2124)', '36"x96" Vinyl UWC 9.99|1 Month Promo Banner-I (2148)', '36"x96" Vinyl UWC All Plans Promo Banner-B (2164)'];

// Array to track clones that failed
const CLONES_FAILED = [];

// Delay helper function (waits for specified milliseconds)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main function to process all clones
 */
async function processClones() {
    const wsChromeEndpointurl = keys.jsonURL;
    const browser = await puppeteer.connect({
        browserWSEndpoint: wsChromeEndpointurl,
        slowMo: 100 // Slows down Puppeteer operations by 100ms
    });

    const page = await browser.newPage();
    
    // Set longer timeout for slow site
    page.setDefaultTimeout(60000); // 60 seconds
    
    try {
        console.log('Navigating to the application...');
        
        // Navigate to the initial URL
        await page.goto(BASE_URL, { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });
        
        // Wait for page to fully load
        console.log('Waiting for initial page load...');
        await delay(5000); // 5 second initial wait
        
        // Validate that we have matching arrays
        if (EXTERNAL_IDS.length !== PRODUCT_NAMES.length) {
            console.warn(`⚠ Warning: EXTERNAL_IDS (${EXTERNAL_IDS.length}) and PRODUCT_NAMES (${PRODUCT_NAMES.length}) have different lengths`);
            console.warn(`Will process ${Math.min(EXTERNAL_IDS.length, PRODUCT_NAMES.length)} clones`);
        }
        
        const cloneCount = Math.min(EXTERNAL_IDS.length, PRODUCT_NAMES.length);
        
        // Loop through each clone combination
        for (let i = 0; i < cloneCount; i++) {
            const externalId = EXTERNAL_IDS[i];
            const productName = PRODUCT_NAMES[i];
            console.log(`\nProcessing clone ${i + 1}/${cloneCount}`);
            console.log(`  External ID: ${externalId}`);
            console.log(`  Product Name: ${productName}`);
            
            try {
                // Find and navigate to the base product
                await navigateToProduct(page, BASE_PRODUCT_NAME);
                
                // Perform the clone workflow
                await cloneProduct(page, externalId, productName);
                
                console.log(`  ✓ Clone ${i + 1} completed successfully`);
            } catch (error) {
                console.error(`  ✗ Error processing clone ${i + 1}:`, error.message);
                CLONES_FAILED.push({
                    index: i + 1,
                    externalId: externalId,
                    productName: productName,
                    error: error.message
                });
            }
            
            // Wait between clones
            console.log('Waiting before next clone...');
            await delay(3000);
        }
        
        // Print final summary
        printSummary(cloneCount);
        
    } catch (error) {
        console.error('Error occurred:', error);
        // Take screenshot on error for debugging
        await page.screenshot({ path: 'error-screenshot.png' });
        console.log('Screenshot saved as error-screenshot.png');
    } finally {
        // Close browser
        //await delay(2000);
        //await browser.close();
    }
}

/**
 * Navigate to and open a product
 */
async function navigateToProduct(page, productName) {
    console.log('  Navigating to product...');
    
    // Wait for the input field to be available
    await page.waitForSelector('input[name="31"]', { timeout: 30000 });
    await delay(1000);
    
    // Click on the input field
    await page.click('input[name="31"]');
    await delay(500);
    
    // Clear any existing text
    await page.evaluate(() => {
        const input = document.querySelector('input[name="31"]');
        if (input) input.value = '';
    });
    
    // Type the product name
    await page.type('input[name="31"]', productName, { delay: 100 });
    await delay(1000);
    
    // Press Enter
    await page.keyboard.press('Enter');
    
    // Wait for response after Enter
    await delay(5000);
    
    // Check if product was found
    console.log('  Checking if product was found...');
    const productFound = await page.evaluate(() => {
        const collapseElement = document.querySelector('span.id103_sv__84ED198C_FF9F_40EB_A124_64A681EB9DBB_lb');
        return collapseElement !== null;
    });
    
    if (!productFound) {
        throw new Error(`Product "${productName}" not found in system`);
    }
    
    // Click on the first span element (collapsed node image) to expand
    console.log('  Clicking to expand product...');
    await page.waitForSelector('span.id103_sv__84ED198C_FF9F_40EB_A124_64A681EB9DBB_lb', { timeout: 30000 });
    await delay(1000);
    
    await page.click('span.id103_sv__84ED198C_FF9F_40EB_A124_64A681EB9DBB_lb');
    await delay(3000); // Wait for expansion
    
    // Click on the second span element to view product details
    console.log('  Opening product details...');
    await page.waitForSelector('span#id11b_lb', { timeout: 30000 });
    await delay(1000);
    
    await page.click('span#id11b_lb');
    await delay(4000); // Wait for page to load
}

/**
 * Clone a product with a new external ID and product name
 */
async function cloneProduct(page, externalId, productName) {
    try {
        // Step 1: Click the duplicate button
        console.log('    Step 1: Clicking duplicate button...');
        await page.waitForSelector('div#id11c', { timeout: 30000 });
        await delay(1000);
        
        await page.click('div#id11c');
        await delay(3000); // Wait for dialog to appear
        
        // Step 2: Click OK button to confirm duplicate
        console.log('    Step 2: Clicking OK button...');
        await page.waitForSelector('button#id897b', { timeout: 30000 });
        await delay(1000);
        
        await page.click('button#id897b');
        await delay(5000); // Wait for form to load
        
        // Step 3: Enter external ID in input field
        console.log(`    Step 3: Entering external ID: ${externalId}`);
        await page.waitForSelector('input[name="1794"]', { timeout: 30000 });
        await delay(1000);
        
        // Click the field
        await page.click('input[name="1794"]');
        await delay(500);
        
        // Clear existing content
        await page.evaluate(() => {
            const input = document.querySelector('input[name="1794"]');
            if (input) input.value = '';
        });
        
        // Type external ID
        await page.type('input[name="1794"]', externalId, { delay: 100 });
        await delay(1000);
        
        // Step 4: Enter product name in the other input field
        console.log(`    Step 4: Entering product name: ${productName}`);
        await page.waitForSelector('input[name="1848"]', { timeout: 30000 });
        await delay(1000);
        
        // Click the field
        await page.click('input[name="1848"]');
        await delay(500);
        
        // Clear existing content
        await page.evaluate(() => {
            const input = document.querySelector('input[name="1848"]');
            if (input) input.value = '';
        });
        
        // Type product name
        await page.type('input[name="1848"]', productName, { delay: 100 });
        await delay(1000);
        
        // Step 5: Click save button
        console.log('    Step 5: Clicking save button...');
        await page.waitForSelector('div#id122', { timeout: 30000 });
        await delay(1000);
        
        await page.click('div#id122');
        await delay(5000); // Wait for save to complete
        
        // Step 6: Return to main page by clicking table view button
        console.log('    Step 6: Returning to main page...');
        await page.waitForSelector('div#idf6', { timeout: 30000 });
        await delay(1000);
        
        await page.click('div#idf6');
        await delay(5000); // Wait for main page to load
        
        console.log('    ✓ Clone created successfully');
        
    } catch (error) {
        console.error('    ✗ Error in clone workflow:', error.message);
        throw error;
    }
}

/**
 * Print final summary report
 */
function printSummary(totalClones) {
    console.log('\n' + '='.repeat(60));
    console.log('CLONING COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total clones requested: ${totalClones}`);
    console.log(`Successfully created: ${totalClones - CLONES_FAILED.length}`);
    console.log(`Failed: ${CLONES_FAILED.length}`);
    
    if (CLONES_FAILED.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('FAILED CLONES:');
        console.log('='.repeat(60));
        CLONES_FAILED.forEach((clone) => {
            console.log(`Clone #${clone.index}`);
            console.log(`  External ID: ${clone.externalId}`);
            console.log(`  Product Name: ${clone.productName}`);
            console.log(`  Error: ${clone.error}`);
            console.log('');
        });
        console.log('='.repeat(60));
    } else {
        console.log('\n✓ All clones created successfully!');
    }
}

// Run the script
console.log('Starting product cloning automation...');
console.log(`Base product: ${BASE_PRODUCT_NAME}`);
console.log(`Total clones to create: ${Math.min(EXTERNAL_IDS.length, PRODUCT_NAMES.length)}`);
processClones();
