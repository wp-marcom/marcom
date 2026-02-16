/**
 * Puppeteer Script for Product Entry Automation
 * Compatible with Puppeteer version 13.5.1
 * 
 * This script automates the process of entering products into a web application
 * with appropriate delays to handle slow page loads.
 */

// Define the primeDirectory variable for file paths
const primeDirectory = "C:\\projects\\";

// Import Puppeteer for browser automation
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);


//const puppeteer = require('puppeteer');

// Grab the local PC username to match to chrome key file
const os = require('os');

const userInfo = os.userInfo();
const userName = userInfo.username;

console.log(`Current username: ${userName}`);

// Relative link to keys directory before looking for username match
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

// Configuration
const BASE_URL = 'http://192.168.1.8:8082/servoy-webclient/?x=AiAkmJtb*c02-EH*9RJoMg';

// Array of product names to process
const PRODUCT_NAMES = ['Look Your Best Decal-10.5x5 (9019) LF', 'Spring for Windmaster Frame (11014)', '18"x48" Aluminum Exit Sign (10012) LF', 'Fundraising Brochure (21000)', '28"x44" Ice Removal Windscreen (14026) LF', '28"x44" Now Hiring Windscreen (12021) LF', '28"x44" Both Lanes Open Windscreen (14023) LF', '28"x44" Exterior & Full Serve Directional Windscreen (11258-11259) LF', 'Gift Card Holder-Generic (4000)', 'Jeep Mirror Hangers (5002)', 'Jeep Customer Flyer (Tunnel Pads Yellow) (14016)', 'RFID Stickers (500 stickers per can - DRB) (1010)', 'UWC Terms and Conditions Pads (1035)', 'Fundraising & Donations Card (21002)', '#10 Logo\'d Envelopes - Mister Car Wash Corporate (3006) DIG', '#10 Logo\'d Envelopes - Mister Car Wash Stores (3005) DIG', 'UWC Members Only Directional Sign (1098) LF', 'Pet Friendly Door Sign (12014) LF', 'Express Wash Shaker Arrow (no towel dry) (12028) LF', 'Bottle Labels - Tire Shine (11023)', 'Bottle Labels - Renovation (11025)', 'Bottle Labels - All Purpose Cleaner (APC) (11024)', '15"x10" Black Towel Decal (5011)', '15"x10" Gray Towel Decal - 15x10 (5012)', '15"x10" Yellow Towel Decal - 15x10 (5013)', '15"x10" Blue Towel Decal (5014)', '15"x10" Trash Bin Decal (5015)', '19"x13" Washing Instructions Unimac Decal - 19x13 (5016)', '15"x3" Yellow Towel Decal (Front Loader) (5019)', '15"x3" Blue Towel Decal (Front Loader) (5020)', '19"x13" Washing Instructions Unimac <b><em>Coroplast</em></b> (Front Loader) - 19x13 (5021)', 'Napkin Dispenser Insert (10032)', 'Curved RFID Reader Decal (900) LF', 'Lobby Entrance Plastic w/ Velcro Back - 11x8.5 (801) LF', '28"x44" Exterior Directional Windscreen (14002) LF', '10"x14" Aluminum Tipping Policy Sign (501) LF', '6.5"x4.75" Tip Box Sticker (502) LF', '28"x44" Free Vacs Directional Windscreen (14021) LF', '28"x44" Free Vacs Straight Arrow Windscreen (14022) LF', '10"x14" Aluminum Free Vacs Vacuum Post Sign (504) LF', 'Uber Informational Flyer (1039)', 'Daily Morning Huddle Pads (3004)', 'Free Vacuums Shaker Arrow w/ Car Wash (12029) LF', 'Recruitment Cards (11242)', 'Razor Scraper (11240)', 'EXTERIOR RFID Protectors 4.75x6 (11250)', 'Mister Journal (11246)', '28"x44" Careers Recruitment Windscreen (11067) LF', 'Audio Guide On Sticker 7" x 7" (11120) LF', 'Mister Terms and Conditions Pads CA Only (11130)', 'Free Car Washes Shaker Arrow (11135) LF', '36"x96" Vinyl Free Car Washes Banner (11136) LF', 'Business Card Holder (11140)', '8.5"x5.5" Campaign Flyer Holder (11141)', 'Now Open Shaker Sign 24x60 (11147) LF', 'Valve Tag Set (11152)', 'Do Not Drink Tags (11156)', 'Soft Water Labels with Arrows (11158)', 'Gas Labels with Arrows (11159)', 'R.O. Water Labels with Arrows (11160)', 'R.O.R. Water Labels with Arrows (11161)', 'City Water Labels with Arrows  (11162)', 'Reclaim Water Labels with Arrows  (11163)', '8-Pocket Prepaid Card Holder (11170)', 'Employee Referral Card (11190) DIG', '\'Welcome to the Team\' Employee Card (11191)', '28"x44" Car Wash Entrance LEFT Windscreen (11197) LF', '28"x44" Car Wash Entrance RIGHT Windscreen (11198) LF', 'Air Labels with Arrows (11200)', 'Hot Labels (11201)', 'Gray Towel Decal (Front Loader) - 15x3 (5018)', 'Black Towel Decal (Front Loader) - 15x3 (5017)', 'Operations Leadership Program - Manager Toolkit (11050)', 'Generic Anniversary Card  & Blank Envelopes (11212)', 'Promotion Card (11213)', 'Bottle Labels - Glass Cleaner (11020)', 'RFID Blocking Passport Sleeve CORPORATE (11238)', 'Gift Card Envelopes (4008)', 'Employee Decal M Star 3x3 (11285)', 'Employee Decal Mister Logo 8x3 (11286)', 'Barrel Measuring Stick - 2025 Revision (11294)', '8.5"x3.6" Brochure Holder (11143)', 'Litter Bag (111312)', '28"x44" Exterior Exit Directional Windscreen (111335) LF', '28"x44" Exit Only Windscreen (111455) LF', '28"x44" Excessive Mud Windscreen (111453) LF', '28"x44" Reopening Soon Windscreen (111451) LF', '28"x44" Please Do Not Stop with Up Arrow Windscreen (111449) LF'];

// Delay helper function (waits for specified milliseconds)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main function to process all products
 */
async function processProducts() {
const wsChromeEndpointurl = keys.jsonURL;
    const browser = await puppeteer.connect({
        browserWSEndpoint: wsChromeEndpointurl,
        slowMo: 100 // Slows down Puppeteer operations by 100ms
    });


    // Launch browser with appropriate settings

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
            
            await processProduct(page, productName);
            
            // Wait between products
            console.log('Waiting before next product...');
            await delay(3000);
        }
        
        console.log('\nAll products processed successfully!');
        
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
        console.log('  Step 6: Selecting "Taxable" from dropdown...');
        await page.waitForSelector('select[name="39"]', { timeout: 30000 });
        await delay(1000);
        
        await page.select('select[name="39"]', 'T'); // 'T' is the value for Taxable
        await delay(2000); // Wait for selection to process
        
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
        
    } catch (error) {
        console.error(`  ✗ Error processing product "${productName}":`, error.message);
        throw error;
    }
}

// Run the script
console.log('Starting product entry automation...');
console.log(`Products to process: ${PRODUCT_NAMES.length}`);
processProducts();