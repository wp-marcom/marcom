/**
 * Puppeteer Script for Product Entry Automation
 * Compatible with Puppeteer version 13.5.1
 * 
 * This script automates the process of entering products into a web application
 * with appropriate delays to handle slow page loads.
 */

const puppeteer = require('puppeteer');

// Configuration
const BASE_URL = 'http://192.168.1.8:8082/servoy-webclient/?x=AiAkmJtb*c02-EH*9RJoMg';

// Array of product names to process
const PRODUCT_NAMES = [
    'Product Name 1',
    'Product Name 2',
    'Product Name 3',
    // Add more product names as needed
];

// Array to track products that were not found
const PRODUCTS_NOT_FOUND = [];

// Delay helper function (waits for specified milliseconds)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main function to process all products
 */
async function processProducts() {
    // Launch browser with appropriate settings
    const browser = await puppeteer.launch({
        headless: false, // Set to true for headless mode
        defaultViewport: {
            width: 1920,
            height: 1080
        },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
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
        
        // Loop through each product name
        for (let i = 0; i < PRODUCT_NAMES.length; i++) {
            const productName = PRODUCT_NAMES[i];
            console.log(`\nProcessing product ${i + 1}/${PRODUCT_NAMES.length}: ${productName}`);
            
            try {
                const result = await processProduct(page, productName);
                
                // If product was not found, add to the not found list
                if (result === 'NOT_FOUND') {
                    PRODUCTS_NOT_FOUND.push(productName);
                    console.log(`  ⚠ Product not found, skipping to next...`);
                }
            } catch (error) {
                console.error(`  ✗ Error processing product "${productName}":`, error.message);
                // Add to not found list on error and continue
                PRODUCTS_NOT_FOUND.push(productName);
                console.log(`  ⚠ Adding to not found list and continuing...`);
            }
            
            // Wait between products
            console.log('Waiting before next product...');
            await delay(3000);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('PROCESSING COMPLETE');
        console.log('='.repeat(60));
        console.log(`Total products processed: ${PRODUCT_NAMES.length}`);
        console.log(`Successfully processed: ${PRODUCT_NAMES.length - PRODUCTS_NOT_FOUND.length}`);
        console.log(`Not found/Failed: ${PRODUCTS_NOT_FOUND.length}`);
        
        if (PRODUCTS_NOT_FOUND.length > 0) {
            console.log('\n' + '='.repeat(60));
            console.log('PRODUCTS NOT FOUND:');
            console.log('='.repeat(60));
            PRODUCTS_NOT_FOUND.forEach((product, index) => {
                console.log(`${index + 1}. ${product}`);
            });
            console.log('='.repeat(60));
        } else {
            console.log('\n✓ All products processed successfully!');
        }
        
    } catch (error) {
        console.error('Error occurred:', error);
        // Take screenshot on error for debugging
        await page.screenshot({ path: 'error-screenshot.png' });
        console.log('Screenshot saved as error-screenshot.png');
    } finally {
        // Close browser
        await delay(2000);
        await browser.close();
    }
}

/**
 * Process a single product entry
 */
async function processProduct(page, productName) {
    try {
        // Step 1: Click on the input field and type product name
        console.log('  Step 1: Clicking input field...');
        
        // Wait for the input field to be available
        await page.waitForSelector('input[name="62"]', { timeout: 30000 });
        await delay(1000);
        
        // Click on the input field
        await page.click('input[name="62"]');
        await delay(500);
        
        // Clear any existing text
        await page.evaluate(() => {
            const input = document.querySelector('input[name="62"]');
            if (input) input.value = '';
        });
        
        // Type the product name
        console.log(`  Step 2: Typing product name: ${productName}`);
        await page.type('input[name="62"]', productName, { delay: 100 });
        await delay(1000);
        
        // Press Enter
        console.log('  Step 3: Pressing Enter...');
        await page.keyboard.press('Enter');
        
        // Wait for response after Enter
        await delay(5000); // Wait 5 seconds for slow site to respond
        
        // Check if the product was found by looking for the collapsed node element
        // If it doesn't appear, the product wasn't found
        console.log('  Step 3.5: Checking if product was found...');
        const productFound = await page.evaluate(() => {
            const collapseElement = document.querySelector('span.id103_sv__84ED198C_FF9F_40EB_A124_64A681EB9DBB_lb');
            return collapseElement !== null;
        });
        
        if (!productFound) {
            console.log('  ⚠ Product not found in system');
            return 'NOT_FOUND';
        }
        
        console.log('  ✓ Product found, continuing...');
        
        // Step 2: Click on the first span element (collapsed node image)
        console.log('  Step 4: Clicking first span element...');
        await page.waitForSelector('span.id103_sv__84ED198C_FF9F_40EB_A124_64A681EB9DBB_lb', { timeout: 30000 });
        await delay(1000);
        
        await page.click('span.id103_sv__84ED198C_FF9F_40EB_A124_64A681EB9DBB_lb');
        await delay(3000); // Wait for expansion
        
        // Step 3: Click on the second span element (1pixel transparent image)
        console.log('  Step 5: Clicking second span element...');
        await page.waitForSelector('span#id11b_lb', { timeout: 30000 });
        await delay(1000);
        
        await page.click('span#id11b_lb');
        await delay(4000); // Wait for page to load
        
        // Step 4: Select "Taxable" from the dropdown
        // Note: The dropdown's name attribute changes dynamically (e.g., name="39" or name="1831")
        // So we search for any select.field element that contains the tax-related options
        console.log('  Step 6: Selecting "Taxable" from dropdown...');
        
        // Wait for any select element with the field class that contains ALL the specific tax options
        await page.waitForFunction(() => {
            const selects = document.querySelectorAll('select.field');
            for (let select of selects) {
                const options = Array.from(select.options);
                // Check that this dropdown has exactly these 4 options with specific text
                const hasCustomerShipTo = options.some(opt => opt.value === 'C' && opt.textContent.includes('Based on Customer/Ship-To'));
                const hasTaxType = options.some(opt => opt.value === 'Y' && opt.textContent.includes('Based on Tax Type'));
                const hasTaxable = options.some(opt => opt.value === 'T' && opt.textContent.trim() === 'Taxable');
                const hasNonTaxable = options.some(opt => opt.value === 'N' && opt.textContent.includes('Non-Taxable'));
                
                // Only return true if ALL 4 options are present
                if (hasCustomerShipTo && hasTaxType && hasTaxable && hasNonTaxable) {
                    return true;
                }
            }
            return false;
        }, { timeout: 30000 });
        
        await delay(1000);
        
        // Get the selector ID for the dropdown
        const dropdownSelector = await page.evaluate(() => {
            const selects = document.querySelectorAll('select.field');
            for (let select of selects) {
                const options = Array.from(select.options);
                // Check that this dropdown has exactly these 4 options with specific text
                const hasCustomerShipTo = options.some(opt => opt.value === 'C' && opt.textContent.includes('Based on Customer/Ship-To'));
                const hasTaxType = options.some(opt => opt.value === 'Y' && opt.textContent.includes('Based on Tax Type'));
                const hasTaxable = options.some(opt => opt.value === 'T' && opt.textContent.trim() === 'Taxable');
                const hasNonTaxable = options.some(opt => opt.value === 'N' && opt.textContent.includes('Non-Taxable'));
                
                // Only match if ALL 4 options are present
                if (hasCustomerShipTo && hasTaxType && hasTaxable && hasNonTaxable) {
                    // Return the selector we can use
                    if (select.id) {
                        return `#${select.id}`;
                    } else if (select.name) {
                        return `select[name="${select.name}"]`;
                    }
                }
            }
            return null;
        });
        
        if (!dropdownSelector) {
            throw new Error('Could not find the correct tax dropdown with all 4 options');
        }
        
        console.log(`    Found correct dropdown: ${dropdownSelector}`);
        
        // Check current value before changing
        const beforeValue = await page.$eval(dropdownSelector, el => el.value);
        console.log(`    Current value: ${beforeValue}`);
        
        // Click on the dropdown first to ensure it has focus
        await page.click(dropdownSelector);
        await delay(500);
        
        // Now select the "Taxable" option
        await page.select(dropdownSelector, 'T');
        await delay(1000);
        
        // Verify the selection was made
        const afterValue = await page.$eval(dropdownSelector, el => el.value);
        console.log(`    After selection value: ${afterValue}`);
        
        if (afterValue !== 'T') {
            console.log('    Selection did not stick, trying alternative method...');
            
            // Alternative method: Use evaluate to forcefully set and trigger events
            await page.evaluate((selector) => {
                const select = document.querySelector(selector);
                if (select) {
                    // Set the value
                    select.value = 'T';
                    
                    // Trigger focus event
                    select.focus();
                    
                    // Trigger change event with proper event object
                    const changeEvent = new Event('change', { bubbles: true });
                    select.dispatchEvent(changeEvent);
                    
                    // Also trigger the onchange handler directly if it exists
                    if (select.onchange) {
                        select.onchange({ target: select, type: 'change' });
                    }
                }
            }, dropdownSelector);
            
            await delay(1000);
            
            // Verify again
            const finalValue = await page.$eval(dropdownSelector, el => el.value);
            console.log(`    Final value after alternative method: ${finalValue}`);
        }
        
        await delay(3000); // Wait longer for selection to process and page to update
        
        // Step 5: Click the save button (span with id id122_lb)
        console.log('  Step 7: Clicking save button...');
        await page.waitForSelector('span#id122_lb', { timeout: 30000 });
        await delay(1000);
        
        await page.click('span#id122_lb');
        await delay(5000); // Wait for save to complete
        
        // Step 6: Click the table view button to return to main page
        console.log('  Step 8: Returning to main page...');
        await page.waitForSelector('div#idf6', { timeout: 30000 });
        await delay(1000);
        
        await page.click('div#idf6');
        await delay(5000); // Wait for main page to load
        
        console.log(`  ✓ Product "${productName}" processed successfully`);
        return 'SUCCESS';
        
    } catch (error) {
        console.error(`  ✗ Error in processProduct:`, error.message);
        throw error;
    }
}

// Run the script
console.log('Starting product entry automation...');
console.log(`Products to process: ${PRODUCT_NAMES.length}`);
processProducts();
