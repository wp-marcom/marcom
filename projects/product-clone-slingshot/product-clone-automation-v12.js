const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);
const os = require('os');
const userInfo = os.userInfo();
const userName = userInfo.username;
console.log(`Current username: ${userName}`);
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

// OPTION 1: Use two separate arrays (paired by index)
/*
const EXTERNAL_IDS = [
    'MCW2100',
    'MCW2124',
    'MCW2148',
    'MCW2164'
];
const PRODUCT_NAMES = [
    '36"x96" Vinyl UWC 50% Off|1 Month Promo Banner-L (2100)',
    '36"x96" Vinyl UWC 75% Off|1 Month Promo Banner-N (2124)',
    '36"x96" Vinyl UWC 9.99|1 Month Promo Banner-I (2148)',
    '36"x96" Vinyl UWC All Plans Promo Banner-B (2164)'
];
const products = PRODUCT_NAMES.map((name, index) => ({
    productName: name,
    externalId: EXTERNAL_IDS[index]
}));
*/

// OPTION 2: Extract external ID from product name (cleaner - only one array needed)
// Extracts number from parentheses and adds 'MCW' prefix
const PRODUCT_NAMES = ['UWC Starts at $5 | First Month Scan Cards-C8 (1341)', '36"x96" Vinyl UWC $10 | 3 Month Promo Banner-A (1313)', '36"x96" Vinyl UWC $8 | First Month Promo Banner-8F (1376)', '36"x96" Vinyl UWC Starts at $5 | First Month Promo Banner-C (1334)', 'UWC Mister Kiosk Save $15 | First Month Promo Decal-B (1324)', 'UWC Mister Kiosk $10 | 3 Month Promo Decal-A (1316)', 'UWC Mister Kiosk $8 | First Month Promo Decal-8F (1379)', 'UWC Mister Kiosk 50% Off | First Month Promo Decal-E (1367)', 'UWC Pegasus Gen 2 Kiosk Starts at $5 | First Month Promo Decal-C (1336)', 'UWC Pegasus Gen 2 Kiosk $10 | 3 Month Promo Decal-A (1317)', 'UWC Pegasus Gen 2 Kiosk $8 | First Month Promo Decal-8F (1380)', 'UWC Pegasus Gen 2 Kiosk Save $15 | First Month Promo Decal-B (1326)', 'UWC Pegasus Gen 2 Kiosk $9.99 | First Month Promo Decal-8D (1359)', 'UWC Pegasus Gen 1 Kiosk $10 | First Month Promo Decal-10F (1387)', 'UWC Pegasus Gen 1 Kiosk $9.99 | First Month Less Than 1 Wash Promo Decal-D (1346)', 'UWC Pegasus Gen 1 Kiosk Save $15 | First Month Promo Decal-B (1325)', 'UWC DRB Kiosk $10 | 3 Month Promo Decal-A (1315)', 'UWC DRB Kiosk $9.99 | First Month Less Than 1 Wash Promo Decal-D (1344)', 'UWC DRB Kiosk $8 | First Month Promo Decal-8F (1378)', 'UWC DRB Kiosk $10 | First Month Promo Decal-10F (1385)', 'UWC DRB Kiosk Save $15 | First Month Promo Decal-B (1323)', 'UWC DRB Kiosk Starts at $5 | First Month Promo Decal-C (1335)', 'UWC DRB Kiosk 50% Off | First Month Promo Decal-E (1366)', 'UWC DRB Kiosk $9.99 | First Month Promo Decal-8D (1358)', 'UWC $9.99 | First Month CSA Price Menu-8D-05 (1363)', 'UWC $9.99 | First Month CSA Price Menu-8D-04 (1362)', 'UWC $9.99 | First Month CSA Price Menu-D06 (1355)', 'UWC $9.99 | First Month CSA Price Menu-D03 (1354)', 'UWC $10 | First Month CSA Price Menu-10F-104 (1393)', 'UWC Starts at $5 | First Month CSA Price Menu-C04 (1340)', 'UWC Starts at $5 | First Month CSA Price Menu-C01 (1339)', 'UWC Save $15 | First Month CSA Price Menu-B06 (1332)', 'UWC Save $15 | First Month CSA Price Menu-B01 (1330)', 'UWC 50% Off | First Month CSA Price Menu-E07 (1374)', 'UWC $9.99 | First Month Promo Awareness Flyer-8D-04 (1360)', 'UWC $9.99 | First Month Promo Awareness Flyer-D06 (1351)', 'UWC Starts at $5 | First Month Promo Awareness Flyer-C04 (1338)', 'UWC Save $15 | First Month Promo Awareness Flyer-B06 (1329)', 'UWC Save $15 | First Month Promo Awareness Flyer-B01 (1327)', 'UWC 50% Off | First Month Promo Awareness Flyer-E07 (1371)', '96"x48" UWC $10 | 3 Month Promo Windscreen-A (1397)', '96"x48" UWC Save $15 | First Month Promo Windscreen-B (1399)', '96"x48" UWC Starts at $5 | First Month Promo Windscreen-C (1401)', '96"x48" UWC $9.99 | First Month Promo Windscreen-D (1403)', '96"x48" UWC 50% Off | First Month Promo Windscreen-E (1405)', '96"x48" UWC $10 | First Month Promo Windscreen-10F (1409)', '96"x48" UWC $8 | First Month Promo Windscreen-8F (1407)', '96"x48" UWC 90 Days for $30 Promo Windscreen-G (1411)', '55"x41" UWC $10 | 3 Month Promo Windscreen-A (1396)', '55"x41" UWC Save $15 | First Month Promo Windscreen-B (1398)', '55"x41" UWC Starts at $5 | First Month Promo Windscreen-C (1400)', '55"x41" UWC 50% Off | First Month Promo Windscreen-E (1404)', '55"x41" UWC $10 | First Month Promo Windscreen-10F (1408)', '55"x41" UWC $8 | First Month Promo Windscreen-8F (1406)', '55"x41" UWC 90 Days for $30 Promo Windscreen-G (1410)'];

const products = PRODUCT_NAMES.map(name => {
    // Extract number from parentheses at end: (2100) -> 2100
    const match = name.match(/\((\d+)\)$/);
    const externalId = match ? 'MCW' + match[1] : 'UNKNOWN';
    
    return {
        productName: name,
        externalId: externalId
    };
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    // Connect to Chrome browser
    const wsChromeEndpointurl = keys.jsonURL;
    const browser = await puppeteer.connect({
        browserWSEndpoint: wsChromeEndpointurl,
    });
    
    const pages = await browser.pages();
    console.log("\nOPEN TABS:");
    for (let i = 0; i < pages.length; i++) {
        console.log(`${i}: ${await pages[i].title()}`);
        console.log(`   ${pages[i].url()}`);
    }
    
    const page = pages.find(p =>
        p.url().includes("servoy-webclient")
    );
    
    await page.setViewport({
        width: 1920,
        height: 1080
    });
    console.log("New viewport:", page.viewport());
    
    if (!page) {
        throw new Error("Could not find Servoy tab");
    }
    
    await page.bringToFront();
    console.log("Found tab:");
    console.log(await page.title());
    console.log(page.url());
    console.log("Viewport:", page.viewport());
    console.log("\nStarting clone process for " + products.length + " products...");
    await sleep(5000);

    // Loop through each product
    for (let productIndex = 0; productIndex < products.length; productIndex++) {
        const product = products[productIndex];
        console.log(`\n===== Processing product ${productIndex + 1}/${products.length} =====`);
        console.log(`External ID: ${product.externalId}`);
        console.log(`Product Name: ${product.productName}`);
        
        try {
            // Search for template product
            console.log("1. Searching for template product...");
            await page.mouse.click(313, 150);
            await sleep(300);
            await page.keyboard.down('Control');
            await page.keyboard.press('A');
            await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
            await sleep(100);
            await page.keyboard.type('(167)');
            await sleep(200);
            await page.keyboard.press('Enter');
            await sleep(5000);
            
            // Click on product to open it
            console.log("2. Opening product...");
            await page.mouse.click(186, 244);
            await sleep(5000);
            
            // Click Copy button
            console.log("3. Clicking Copy button...");
            await page.mouse.click(286, 82);
            await sleep(8000);
            
            // OK on popup - Approach 3 (Focus and Press Enter)
            console.log("4. Confirming duplicate via OK button...");
            await page.evaluate(() => {
                const buttons = document.querySelectorAll('button.button');
                for (let btn of buttons) {
                    if (btn.textContent.trim() === 'OK') {
                        btn.focus();
                        return true;
                    }
                }
                return false;
            });
            await page.keyboard.press('Enter');
            await sleep(3000);
            
            // External ID field
            console.log("5. Entering External ID: " + product.externalId);
            await page.mouse.click(350, 147);
            await sleep(200);
            await page.keyboard.down('Control');
            await page.keyboard.press('A');
            await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
            await sleep(100);
            await page.keyboard.type(product.externalId);
            await sleep(500);
            
            // Product Name field
            console.log("6. Entering Product Name: " + product.productName);
            await page.mouse.click(334, 173);
            await sleep(200);
            await page.keyboard.down('Control');
            await page.keyboard.press('A');
            await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
            await sleep(100);
            await page.keyboard.type(product.productName);
            await sleep(500);
            
            // Save
            console.log("7. Saving...");
            await page.mouse.click(1707, 85);
            await sleep(5000);
            
            // Close
            console.log("8. Closing dialog...");
            await page.mouse.click(1637, 84);
            await sleep(5000);
            
            console.log(`✓ Successfully created clone for: ${product.productName}`);
            
        } catch (error) {
            console.error(`✗ Error processing product ${productIndex + 1}: ${error.message}`);
        }
        
        // Wait before next iteration
        if (productIndex < products.length - 1) {
            console.log("Waiting before next product...");
            await sleep(3000);
        }
    }

    console.log(`\n===== All ${products.length} products completed =====`);
    
})();
