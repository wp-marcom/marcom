const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);
const os = require('os');
const userInfo = os.userInfo();
const userName = userInfo.username;
console.log(`Current username: ${userName}`);
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

const products = [
    {
        externalId: "MCW2100",
        productName: '36"x96" Vinyl UWC 50% Off|1 Month Promo Banner-L (2100)'
    },
    {
        externalId: "MCW2124",
        productName: '36"x96" Vinyl UWC 75% Off|1 Month Promo Banner-N (2124)'
    },
    {
        externalId: "MCW2148",
        productName: '36"x96" Vinyl UWC 9.99|1 Month Promo Banner-I (2148)'
    }
];


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
