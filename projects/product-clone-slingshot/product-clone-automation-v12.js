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
const PRODUCT_NAMES = ['UWC $5, $10, $15 | First Month Scan Card-C (8118)', 'UWC $9.99|First Month Scan Card-D (8133)', 'UWC POR | First Month Scan Card-F (8154)', 'UWC 50% Off | 2 Months Scan Card-I (8165)', '36"x96" Vinyl UWC $5, $10, $15 | First Month Promo Banner-C (8100)', '36"x96" Vinyl UWC $9.99|First Month Promo Banner-D (8119)', '36"x96" Vinyl UWC $10 POR | First Month Promo Banner-F10 (8137)', '36"x96" Vinyl UWC $12 POR | First Month Promo Banner-F12 (8146)', '36"x96" Vinyl UWC 50% Off | 2 Months Promo Banner-I (8155)', '36"x96" Vinyl UWC 50% Off | 3 Months Promo Banner-J (8166)', '28"x44" UWC $5, $10, $15 | First Month Promo Windscreen-C (8101)', '28"x44" UWC $9.99|First Month Promo Windscreen-D (8120)', '28"x44" UWC $10 POR | First Month Promo Windscreen-F10 (8138)', '28"x44" UWC $12 POR | First Month Promo Windscreen-F12 (8147)', '28"x44" UWC 50% Off | 2 Months Promo Windscreen-I (8156)', '28"x44" UWC 50% Off | 3 Months Promo Windscreen-J (8167)', '96"x48" UWC 50% Off | First Month Promo Windscreen-E (8136)', '96"x48" UWC 50% Off | 3 Months Promo Windscreen-J (8169)', '96"x48" UWC 50% Off | 2 Months Promo Windscreen-I (8158)', '96"x48" UWC $12 POR | First Month Promo Windscreen-F12 (8149)', '96"x48" UWC $10 POR | First Month Promo Windscreen-F10 (8140)', '96"x48" UWC $9.99|First Month Promo Windscreen-D (8122)', '96"x48" UWC $5, $10, $15 | First Month Promo Windscreen-C (8103)', 'UWC Mister Kiosk $5, $10, $15 | First Month Promo Decal-C (8105)', 'UWC Mister Kiosk $9.99|First Month Promo Decal-D (8124)', 'UWC Pegasus Gen 2 Kiosk $5, $10, $15 | First Month Promo Decal-C (8107)', 'UWC Pegasus Gen 2 Kiosk $9.99|First Month Promo Decal-D (8126)', 'UWC DRB Kiosk $9.99|First Month Promo Decal-D (8123)', 'UWC $5, $10, $15 | First Month CSA Price Menu-C01 (8113)', 'UWC $9.99|First Month CSA Price Menu-D01 (8130)', 'UWC 50% Off | 2 Months CSA Price Menu-I01 (8164)', 'UWC $5, $10, $15 | First Month Promo Awareness Flyer-C01 (8108)', 'UWC $5, $10, $15 | First Month Promo Awareness Flyer-C03 (8109)', 'UWC $5, $10, $15 | First Month Promo Awareness Flyer-C04 (8110)', 'UWC $5, $10, $15 | First Month Promo Awareness Flyer-C05 (8111)', 'UWC $9.99|First Month Promo Awareness Flyer-D01 (8127)', 'UWC $10 POR | First Month Promo Awareness Flyer-F103 (8144)', 'UWC $12 POR | First Month Promo Awareness Flyer-F602 (8152)', 'UWC 50% Off | 2 Months Promo Awareness Flyer-I01 (8163)', 'UWC 50% Off | 3 Months Promo Awareness Flyer-J01 (8173)'];

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
