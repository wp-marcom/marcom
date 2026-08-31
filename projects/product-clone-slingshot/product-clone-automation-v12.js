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
const PRODUCT_NAMES = ['UWC $10|3 Month Scan Cards-A5 (1320)', 'UWC Save $15|First Month Scan Cards-B7 (1333)', 'UWC $9.99|First Month Scan Cards-D9 (1356)', 'UWC 50% Off|First Month Scan Cards-E12 (1375)', 'UWC All Plans Scan Cards-F (1395)', '36"x96" Vinyl UWC Save $15|First Month Promo Banner-B (1321)', '36"x96" Vinyl UWC $9.99|First Month Promo Banner-D (1342)', '36"x96" Vinyl UWC 50% Off|First Month Promo Banner-E (1364)', '36"x96" Vinyl UWC $10|First Month Promo Banner-10F (1383)', 'UWC Mister Kiosk $9.99|First Month Promo Decal-D (1345)', 'UWC Mister Kiosk $10|First Month Promo Decal-10F (1386)', 'UWC Pegasus Gen 2 Kiosk $9.99|First Month Less Than 1 Wash Promo Decal-D (1347)', 'UWC Pegasus Gen 2 Kiosk 50% Off|First Month Promo Decal-E (1368)', 'UWC Pegasus Gen 2 Kiosk $10|First Month Promo Decal-10F (1388)', 'UWC $10|3 Month CSA Price Menu-A01 (1319)', 'UWC Save $15|First Month CSA Price Menu-B05 (1331)', 'UWC $9.99|First Month CSA Price Menu-D01 (1352)', 'UWC $9.99|First Month CSA Price Menu-D02 (1353)', 'UWC 50% Off|First Month CSA Price Menu-E01 (1372)', 'UWC 50% Off|First Month CSA Price Menu-E03 (1373)', 'UWC $8|First Month CSA Price Menu-8F-304 (1382)', 'UWC $10|First Month CSA Price Menu-10F-101 (1392)', 'UWC $10|First Month CSA Price Menu-10F-201 (1394)', 'UWC $10|3 Month Promo Awareness Flyer-A01 (1318)', 'UWC Save $15|First Month Promo Awareness Flyer-B05 (1328)', 'UWC Starts at $5|First Month Promo Awareness Flyer-C01 (1337)', 'UWC $9.99|First Month Promo Awareness Flyer-D01 (1348)', 'UWC $9.99|First Month Promo Awareness Flyer-D02 (1349)', 'UWC $9.99|First Month Promo Awareness Flyer-D03 (1350)', 'UWC $9.99|First Month Promo Awareness Flyer-8D-05 (1361)', 'UWC 50% Off|First Month Promo Awareness Flyer-E01 (1369)', 'UWC 50% Off|First Month Promo Awareness Flyer-E03 (1370)', 'UWC $8|First Month Promo Awareness Flyer-8F-304 (1381)', 'UWC $10|First Month Promo Awareness Flyer-10F-101 (1389)', 'UWC $10|First Month Promo Awareness Flyer-10F-104 (1390)', 'UWC $10|First Month Promo Awareness Flyer-10F-201 (1391)'];

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
