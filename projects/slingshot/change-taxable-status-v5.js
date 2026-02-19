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
const BASE_URL = 'http://192.168.1.8:8082/servoy-webclient/?x=6nRoeC3ipg9Ch01DpHkfnQ';

// Array of product names to process
const PRODUCT_NAMES = ['24"x36" Thank You For Visiting Aluminum Sign (1022) LF', '28"x44" Please No Parking Or Stopping Windscreen (111448) LF', 'Trash Bin Decal - 4x10 (111781) LF', '12.5"x19.5" Trash Can Decal Set (50101) LF', '13.75"x19.75" Trash Can Decal Set (50102) LF', '21.75"x35" Trash Can Coro Set (111343) LF', '24"x36" Please Do Not Stop with Up Arrow Aluminum Sign (111450) LF', '18"x24" Please No Parking or Stopping Aluminum Sign (111446) LF', '12"x18" Guest Parking Only Aluminum Sign (497) LF', '12"x18" No Trespassing/Loitering Aluminum Sign (534) LF', '18"x24" CA ONLY No Trespassing/Loitering Aluminum Sign (536) LF', '22"x30" CA ONLY Loitering Warning Aluminum Sign (538) LF', '24"x24" CA ONLY Trespassing/Loitering Warning Aluminum Sign (540) LF', 'Caution Wet Floor Aluminum Sign (4002) LF', '7"x60" CLEARANCE 7\'2" Aluminum Sign (10008) LF', '7"x60" CLEARANCE 7\'4" Aluminum Sign (10010) LF', '24"x36" Right Turn Only Aluminum Sign (542) LF', '24"x36" Exit Right Aluminum Sign (550) LF', '20"x24" Enter Aluminum Sign (544) LF', '20"x24" Exit Only Aluminum Sign (546) LF', '20"x24" Exit Forward Aluminum Sign (548) LF', '20"x24" Exit Ahead - Vacuums Left Aluminum Sign (552) LF', '20"x24" Exit Ahead - Vacuums Ahead To Left Aluminum Sign (554) LF', '20"x24" Exit Ahead - Vacuums Around To Left Aluminum Sign (556) LF', 'Updates Underway Coupon (11302)', 'All Plans Price of Retail Scan Cards (11146)', 'Express Opening & Closing Procedures (12002)', 'Google Review Vacuum Hose Sign (23056) LF', 'Google Review Vacuum Decal (23058) LF', 'Google Review Cling (23060) LF', 'Kiosk Decal - DRB XPT Retrofit V2 (4025)', 'Kiosk Decal Set - Mister Kiosk (4027)', 'Titanium Roll Labels (21073)', 'Restroom Log Frame - 8x10 (810)', 'Towel Program Litter Bag (439)', '10"x14" Towel Program UWC Aluminum Sign (441)', 'Towel Program Cart Topper (445)', 'Towel Program Double-Sided Tape (449)', 'Exit Decal Sheet (101) LF', 'Operations Leadership Program - Blue Padfolio (11051)', 'Acquisition Opening Kit (11013)', 'Pegasus Gen 1 Kiosk Holiday Closures 14x27 Decal (12040)', 'Pegasus Gen 2 Kiosk Holiday Closures 16x37 Decal (12041)', 'Mister Kiosk Holiday Closures 10x25 Decal (12042)', '16"x92" Standard Mesh All Plans Price of Retail Gate Arm Banner (519)', 'Open During Construction Banner (7003) LF', '36"x96" Vinyl \'Washes Start at $10\' Banner (200) LF', '"Core Values" Decal Set (11293) LF', 'All Plans Price of Retail Shaker Arrow (521) LF', 'Free Vacuums Yard Sign (12031)', 'Kiosk Decal - DRB XPT Retrofit V3 (4026)', '9.99 Promo New Build Scan Cards Set (2503)', 'Do Not Disturb Door Hanger (111554)', '28"x44" $1 Phase 2 Towel Program Windscreen (451)', '28"x44" $2 Phase 2 Towel Program Windscreen (455)', '10"x14" $1 Phase 2 Towel Program Aluminum Sign (459)', '10"x14" $2 Phase 2 Towel Program Aluminum Sign (463)', '$1 Phase 2 Towel Program Cart Front (465)', '$2 Phase 2 Towel Program Cart Front (469)', 'We Love Mister Poster - 14x28 (602)', 'Towel Program Cart Instruction Sheet (473)', 'Open 7 Days A Week Yard Sign (904) LF', '40"x60" Shine Collage Acrylic Sign with Standoffs (4028)', 'RM Site Visit Pocket Guide Card (2010)', '39.5"x83.25" \'We Build Careers\' Retractable Banner Stand (7008)', '39.5"x83.25" \'Join Our Team\' Retractable Banner Stand (7010)', 'Business Card DIG', '10"x14" Phase 3 Towel Program UWC Aluminum Sign (531)', '10"x14" $1 Phase 3 Towel Program Aluminum Sign (533)', '10"x14" $2 Phase 3 Towel Program Aluminum Sign (535)', '10"x14" $3 Phase 3 Towel Program Aluminum Sign (537)', '10"x14" $4 Phase 3 Towel Program Aluminum Sign (539)', '47.5"x47.5" Now Open Yard Sign (102)', 'High Efficiency Applicator Bar Decal (11157) LF', 'Titanium Exterior UWC Scan Cards (11144)', '28"x44" $1 Phase 3 Towel Program Windscreen (549)', '28"x44" $2 Phase 3 Towel Program Windscreen (551)', '28"x44" $3 Phase 3 Towel Program Windscreen (553) LF', '28"x44" $4 Phase 3 Towel Program Windscreen (555) LF', 'Water Testing Job Aide Sheet (12007)', 'Interior Clean CSA Price Menu - Spanish (21306) DIG', 'Exterior CSA Price Menu - Spanish (21308) DIG', 'Business Accounts Welcome Flyer (21014)', 'Fleet Card Welcome Flyer (21016)', '$1 Phase 3 Towel Program Cart Front (541) LF', '$2 Phase 3 Towel Program Cart Front (543) LF', '$3 Phase 3 Towel Program Cart Front (545) LF', '$4 Phase 3 Towel Program Cart Front (547) LF', 'Shine Together Photoshoot Prop Set (2001)', 'Shine Together Photoshoot Backdrop (2003) LF', 'Forbes Wheel Polish Decals (10003) LF', '28"x44" Closed for Renovation Windscreen (111452) LF', 'Office Door Sign (1201)', 'Electrical Room Door Sign (1203)', 'Blue Restroom Door Sign (1205)', 'CA Compliant Blue Restroom Door Sign Set (1207)', '36"x96" Vinyl "Now Open" Reopening Banner (7005) LF', '36"x96" Vinyl "Free Vacuums" Banner (7007) LF', '36"x96" Vinyl "New & Improved" Vacuum Banner (7009) LF', '36"x96" Vinyl "Coming Soon" Vacuum Banner (7011) LF', '96x36 "Now Open" Directional Banner (7013) LF', 'Fundraising Menu Pocket Folder (20999)', 'Fundraising & Donation Base Exterior Wash Passes (215)', 'Fundraising & Donation Platinum Exterior Wash Passes (217)', '96x36 First 3 Months UWC Promo Banner (111793) LF', '96x36 50% Off UWC Promo Banner (111801) LF', '96x48 First 2 Months UWC Promo Windscreen (111787) LF', '96x48 First 3 Months UWC Promo Windscreen (111795) LF', '96x48 50% Off UWC Promo Windscreen (111803) LF', 'First 2 Months UWC Promo Shaker Arrow (111789) LF', 'First 3 Months UWC Promo Shaker Arrow (111797) LF', '50% Off UWC Promo Shaker Arrow (111805) LF', '\'Mister Car Wash\' Yard Sign (627) LF', '96x36 "Entrance" Directional Banner (7015) LF', 'Mister Kiosk First 2 Months UWC $10 Promo Decal (111783)', 'Mister Kiosk 50% Off UWC Promo Kiosk Decal (111800)', '50% Off UWC Promo Scan Cards (111807)', 'Mister Kiosk First Month UWC $8 Promo Decal (111809)', 'Mister Kiosk First Month UWC $10 Promo Decal (111817)', '16"x92" First 3 Months UWC $10 Promo Gate Arm Banner (111799)', 'IC Playbook Flashcards - Vacuum (111501)', 'IC Playbook Flashcards - Finishing (111502)', 'The GSS Workbook (111504)', '28"x44" Free Vacuums Windscreen (199) LF', '28"x44" Free Vacuums Windscreen - Spanish (201) LF', '28"x44" Free Vacuums Windscreen - Bilingual (203) LF', '28"x44" Towel Program UWC Windscreen (437) LF', '28"x44" Google Review Windscreen (23062) LF', '96x36 Retail Price Banner (405) LF', '96x36 UWC Price Banner (202) LF', '\'Unlimited Washes\' Double Sided Flag-34"x150" (18999)', 'UWC Double Sided Flag-34"x150" (19001)', 'T1 Base Exterior Fleet Wash Pass (16015.T1)', 'Hydraflex Panel Decals (529)', 'Titanium Local Store Marketing Coupon (15004) DIG', 'Outreach Coupon Card (1208) DIG', 'Mister Kiosk Evergreen Campaign \'Retail\' Decal (111854)', 'DRB Kiosk Evergreen Campaign \'Retail\' Decal (111856)', 'Pegasus Gen 1 Kiosk Evergreen Campaign \'Retail\' Decal (111858)', 'Pegasus Gen 2 Kiosk Evergreen Campaign \'Retail\' Decal (111860)', '28"x44" Evergreen Campaign \'UWC\' Windscreen (111870)', '55"x41" Evergreen Campaign \'UWC\' Windscreen (111872)', '96"x48" Evergreen Campaign \'UWC\' Windscreen (111874)', '96"x36" Opening Soon Banner (6999) LF', '96"x36" Reopening Soon Banner (7001) LF', 'T1 Titanium Exterior Wash Pass (16020.T1)', 'T2 Titanium Exterior Wash Pass (16020.T2)', 'T3 Titanium Exterior Wash Pass (16020.T3)', 'T2 Base Exterior Fleet Wash Pass (16015.T2)', 'T3 Base Exterior Fleet Wash Pass (16015.T3)', 'T1 Platinum Exterior Fleet Wash Pass (16017.T1)', 'T2 Platinum Exterior Fleet Wash Pass (16017.T2)', 'T3 Platinum Exterior Fleet Wash Pass (16017.T3)', 'T1 Base Plus Exterior Wash Pass (16019.T1)', 'T2 Base Plus Exterior Wash Pass (16019.T2)', 'T3 Base Plus Exterior Wash Pass (16019.T3)', 'Versioned Reader Board Graphics (111586) DL', 'Static Reader Board Graphics', '28"x44" Closing Soon for Renovation Windscreen (111454) LF', 'Kiosk Decal Set - DRB XPT2012 EMV with PVC inserts (4015A)', 'Holiday Closure Window Cling (111562)', 'Google Review Business Card (23064) DIG', 'New Hire Packet (11217)', 'Mister Kiosk Evergreen Campaign \'Member\' Decal (111862)', 'DRB Kiosk Evergreen Campaign \'Member\' Decal (111864)', 'Pegasus Gen 1 Kiosk Evergreen Campaign \'Member\' Decal (111866)', 'Pegasus Gen 2 Kiosk Evergreen Campaign \'Member\' Decal (111868)', '28"x44" Evergreen Campaign \'Thank You\' Windscreen (111876)', '55"x41" Evergreen Campaign \'Thank You\' Windscreen (111878)', '96"x48" Evergreen Campaign \'Thank You\' Windscreen (111880)', '28"x44"  Evergreen Campaign \'UWC\' Poster  (111882) LF', '25.375"x38.375"  Evergreen Campaign \'UWC\' Poster  (111884) LF', '28"x44"  Evergreen Campaign \'Thank You\' Poster  (111886) LF', '25.375"x38.375"  Evergreen Campaign \'Thank You\' Poster  (111888) LF', '28"x44" \'Enter\' Windscreen (1625) LF', 'Real Estate New Builds Brochure (20996) DIG', '28"x44" Clean Truck Beds Windscreen - Bilingual (40072) LF', '28"x44" Load On Windscreen - Bilingual (14007) LF', '28"x44" \'We\'re Open\' Windscreen (9028) LF', '\'Now Open\' Yard Sign (623) LF', '\'Enter\' Yard Sign (625) LF', '"Mister" Decal (11295) LF', '24" "M Star" Decal (11288-24) LF', '36" "Star" Decal (11291-36) LF', '96"x48" First Month UWC Promo Windscreen (111851) LF', 'Kiosk Decal Set - DRB XPT2012 Credit Card with PVC inserts (4015B)', 'Kiosk Decal Set - DRB XPT2012 EMV 4000 with PVC inserts (4015C)', '10"x14" Phase 3 Towel Program UWC Aluminum Sign-SPANISH (531S)', '10\'x10\' \'Mister Car Wash\' Pop-Up Tent (7012)', 'Mister Car Wash Tote Bag (17003)', 'Mister Car Wash Keychain (17012)', 'Mister Car Wash Coasters (17014)', 'FWW Handheld Menu - First Month $9.99 (21310) DIG', 'Mister Car Wash \'Are We There Yet\' Coasters (17015)', 'Tunnel Retract Flashcards (12000)', 'Fundraising Menu $8/$20 (20999A)', 'Fundraising Menu $10/$20 (20999B)', 'Fundraising Menu $10/$22 (20999C)', 'Fundraising Menu $12/$22 (20999D)', 'The GSS Guidebook (111604)', 'Water System Info Labels (11098)', 'Mister Kiosk IC Awareness Decal (103)', 'DRB Kiosk IC Awareness Decal (105)', 'Pegasus Gen 1 Kiosk IC Awareness Decal (107)', 'Pegasus Gen 2 Kiosk IC Awareness Decal (109)', '28"x44" IC Awareness Windscreen (111)', '7"x7" IC Awareness \'$15\' Vacuum Hose Sign (113)', '7"x7" IC Awareness \'Did You Know?\' Vacuum Hose Sign (115)', 'IC Awareness - UWC Welcome Brochure (117)', 'IC Awareness Flyer (119)', 'Mister Pledge Card (11216C)', 'Mister Pledge Poster - 18 x 23.5 (11216P)', 'Customer Care Card (21011)', 'California Break Schedule Board (111601)', 'UWC New Build Blitz Flyer 9.99|1 Month (114) DIG', 'Hydraflex Panel Decals Gen 2 (5292)', '28"x44" Closed Due to Weather Windscreen (14000) LF', '28"x44" Disclaimer Windscreen (14001) LF', '28"x44" Sorry Closed Windscreen (14006) LF', '28"x44" Clean Truck Beds Windscreen (40071) LF', 'New Build Breakroom Photo Set (QTY 2 at 22x28) (1015) LF', 'New Build Hallway Photo Set (QTY 5 at 24x36) (1016) LF', '20"x24" New Build Restroom Photo Set (QTY 1 Set of 3 at 20"x24") (1017) LF', '22"x28" New Build Restroom Photo Set (QTY 1 Set of 3 at 22"x28") (1018) LF', '96"x48" UWC Windscreen (21001) LF', '96"x48" Get Ready to Shine Windscreen (21003) LF', 'Audio Guide On Sticker 7" x 7" (11120-I)', 'Hydraulic Power Pack Labels - #1-6 (11154)', 'The GSS Mentor Handbook (111704)', '28"x44" Closed for Employee Appreciation Windscreen (12036) LF', 'UWC New Build Blitz Flyer 14.99|1 Month (118) DIG', 'UWC New Build Blitz Flyer 9.99|2 Month (116) DIG', 'UWC New Build Blitz Flyer 50% Off|1 Month (110) DIG', 'UWC New Build Blitz Flyer 50% Off|2 Month (112) DIG', 'UWC 9.99|1 Month Promo Banner (1140) LF', 'UWC 9.99|1 Month Promo Shaker (1142) LF', '28"x44" UWC 9.99|1 Month Promo Windscreen (1144) LF', '55"x41" UWC 9.99|1 Month Promo Windscreen (1146) LF', '96"x48" UWC 9.99|1 Month Promo Windscreen (1148) LF', 'UWC Mister Kiosk 9.99|1 Month Promo Decal (1150)', 'UWC Pegasus Gen 2 Kiosk 9.99|1 Month Promo Decal (1152)', 'Mister Star Roll Labels (21075)', 'UWC 9.99|2 Month Promo Banner (1160) LF', 'UWC 50% Off|1 Month Promo Banner (1100) LF', 'UWC 50% Off|2 Month Promo Banner (1120) LF', 'UWC 14.99|1 Month Promo Banner (1180) LF', 'UWC 9.99|2 Month Promo Shaker (1162) LF', 'UWC 50% Off|1 Month Promo Shaker (1102) LF', 'UWC 50% Off|2 Month Promo Shaker (1122) LF', 'UWC 14.99|1 Month Promo Shaker (1182) LF', '28"x44" UWC 9.99|2 Month Promo Windscreen (1164) LF', '28"x44" UWC 50% Off|1 Month Promo Windscreen (1104) LF', '28"x44" UWC 50% Off|2 Month Promo Windscreen (1124) LF', '28"x44" UWC 14.99|1 Month Promo Windscreen (1184) LF', '55"x41" UWC 9.99|2 Month Promo Windscreen (1166) LF', '55"x41" UWC 50% Off|1 Month Promo Windscreen (1106) LF', '55"x41" UWC 14.99|1 Month Promo Windscreen (1186) LF', '96"x48" UWC 9.99|2 Month Promo Windscreen (1168) LF', '96"x48" UWC 50% Off|1 Month Promo Windscreen (1108) LF', '96"x48" UWC 50% Off|2 Month Promo Windscreen (1128) LF', '96"x48" UWC 14.99|1 Month Promo Windscreen (1188) LF', 'UWC Mister Kiosk 9.99|2 Month Promo Decal (1170)', 'UWC Mister Kiosk 50% Off|1 Month Promo Decal (1110)', 'UWC Mister Kiosk 50% Off|2 Month Promo Decal (1130)', 'UWC Mister Kiosk 14.99|1 Month Promo Decal (1190)', 'UWC Pegasus Gen 2 Kiosk 9.99|2 Month Promo Decal (1172)', 'UWC Pegasus Gen 2 Kiosk 50% Off|1 Month Promo Decal (1112)', 'UWC Pegasus Gen 2 Kiosk 50% Off|2 Month Promo Decal (1132)', 'UWC Pegasus Gen 2 Kiosk 14.99|1 Month Promo Decal (1192)', '55"x41" UWC 50% Off|2 Month Promo Windscreen (1126) LF', '96x36 Lane Canopy Banner (11335) LF', '36"x96" Vinyl Monument Banner (9035) LF', 'DayForce Wallet – Get Paid Today Poster (12015P)', 'Spanish DayForce Wallet – Get Paid Today Poster (12016P)', 'Operations Leadership Program - Black Padfolio (11054)', '36"x96" Vinyl "Enter" Banner (11336)', '96x36 All Plans Price of Retail Banner (515) LF', 'UWC First Month Scan Cards (1230)', 'UWC First 2 Months Scan Cards (1250)', 'UWC 9.99|1 Month Scan Cards (1153)', 'UWC New Build Blitz Flyer 1 Month PoR (122) DIG', 'UWC 9.99|2 Month Scan Cards (1173)', 'UWC 50% Off|1 Month Scan Cards (1113)', 'UWC 50% Off|2 Month Scan Cards (1133)', 'UWC 14.99|1 Month Scan Cards (1193)', 'UWC $10 Off Premium|3 Months Scan Cards (1286)', 'UWC Titanium|2 Months Scan Cards (1266)', 'UWC $10 Off Premium|3 Months Promo Banner (1280) LF', 'UWC Titanium|2 Months Promo Banner (1260) LF', 'UWC 2 Months|$8 Promo Promo Banner (1240) LF', 'UWC 2 Months|$10 Promo Promo Banner (1241) LF', 'UWC First Month Promo Promo Banner (1220) LF', 'UWC Mister Kiosk First Month|$10 Promo Decal (1226)', 'UWC Mister Kiosk First Month|$8 Promo Decal (1222)', 'UWC Mister Kiosk First 2 Months|$10 Promo Decal (1246)', 'UWC Mister Kiosk First 2 Months|$8 Promo Decal (1242)', 'UWC Mister Kiosk $10 Off Premium|3 Months Promo Decal (1282)', 'UWC Mister Kiosk First Titanium|2 Months Promo Decal (1262)', 'UWC Pegasus Gen 2 Kiosk First Month|$10 Promo Decal (1228)', 'UWC Pegasus Gen 2 Kiosk First Month|$8 Promo Decal (1224)', 'UWC Pegasus Gen 2 Kiosk First 2 Months|$10 Promo Decal (1248)', 'UWC Pegasus Gen 2 Kiosk First 2 Months|$8 Promo Decal (1244)', 'UWC Pegasus Gen 2 Kiosk $10 Off Premium|3 Months Promo Decal (1284)', 'UWC Pegasus Gen 2 Kiosk First Titanium|2 Months Promo Decal (1264)'];

// Array to track products that were not found
const PRODUCTS_NOT_FOUND = [];

// Delay helper function (waits for specified milliseconds)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main function to process all products
 */
async function processProducts() {const wsChromeEndpointurl = keys.jsonURL;
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
        //await browser.close();
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
        console.log('  Step 5: Clicking Edit mode...');
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
