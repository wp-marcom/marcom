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
const PRODUCT_NAMES = ['28"x44" Please No Parking Or Stopping Windscreen (111448) LF', '28"x44" $3 Phase 3 Towel Program Windscreen (553) LF', '28"x44" $4 Phase 3 Towel Program Windscreen (555) LF', '28"x44" Closed for Renovation Windscreen (111452) LF', '28"x44" Free Vacuums Windscreen (199) LF', '28"x44" Free Vacuums Windscreen - Spanish (201) LF', '28"x44" Free Vacuums Windscreen - Bilingual (203) LF', '28"x44" Towel Program UWC Windscreen (437) LF', '28"x44" Google Review Windscreen (23062) LF', '28"x44" Closing Soon for Renovation Windscreen (111454) LF', '28"x44" \'Enter\' Windscreen (1625) LF', '28"x44" Clean Truck Beds Windscreen - Bilingual (40072) LF', '28"x44" Load On Windscreen - Bilingual (14007) LF', '28"x44" \'We\'re Open\' Windscreen (9028) LF', '28"x44" Closed Due to Weather Windscreen (14000) LF', '28"x44" Disclaimer Windscreen (14001) LF', '28"x44" Sorry Closed Windscreen (14006) LF', '28"x44" Clean Truck Beds Windscreen (40071) LF', '28"x44" Closed for Employee Appreciation Windscreen (12036) LF', '28"x44" UWC 9.99|1 Month Promo Windscreen (1144) LF', '28"x44" UWC 9.99|2 Month Promo Windscreen (1164) LF', '28"x44" UWC 50% Off|1 Month Promo Windscreen (1104) LF', '28"x44" UWC 50% Off|2 Month Promo Windscreen (1124) LF', '28"x44" UWC 14.99|1 Month Promo Windscreen (1184) LF'];

const products = PRODUCT_NAMES.map(name => {
    // Base Price for all items
    //const match = name.match(/\((\d+)\)$/);
    const externalId = '24.89';
    
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
            await page.keyboard.type(product.productName);
            await sleep(200);
            await page.keyboard.press('Enter');
            await sleep(5000);
            
            // Click on product to open it
            console.log("2. Opening product...");
            await page.mouse.click(186, 244);
            await sleep(5000);
            
            // Click Edit button
            console.log("3. Clicking Edit button...");
            await page.mouse.click(219, 82);
            await sleep(8000);

             // Click Selling Units Tab
            console.log("4. Selling Units Tab...");
            await page.mouse.click(311, 286);
            await sleep(8000);
            
            // OK on popup - Approach 3 (Focus and Press Enter)
           // console.log("4. Confirming duplicate via OK button...");
          //  await page.evaluate(() => {
             //   const buttons = document.querySelectorAll('button.button');
             //   for (let btn of buttons) {
            //        if (btn.textContent.trim() === 'OK') {
             //           btn.focus();
              //          return true;
             //       }
             //   }
            //    return false;
          //  });
          //  await page.keyboard.press('Enter');
           // await sleep(3000);
            
            // List Price field
            console.log("5. Entering New List Price: " + product.externalId);
            await page.mouse.click(611, 364);
            await sleep(200);
            await page.keyboard.down('Control');
            await page.keyboard.press('A');
            await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
            await sleep(100);
            await page.keyboard.type(product.externalId);
            await sleep(500);
            
            // Product Name field
            //console.log("6. Entering Product Name: " + product.productName);
            //await page.mouse.click(334, 173);
            //await sleep(200);
            //await page.keyboard.down('Control');
            //await page.keyboard.press('A');
            //await page.keyboard.up('Control');
            //await page.keyboard.press('Backspace');
            //await sleep(100);
            //await page.keyboard.type(product.productName);
            //await sleep(500);
            
            // Save
            console.log("7. Saving...");
            await page.mouse.click(1707, 85);
            await sleep(5000);
            
            // Close
            console.log("8. Closing dialog...");
            await page.mouse.click(1637, 84);
            await sleep(5000);
            
            console.log(`✓ Successfully changed price for: ${product.productName}`);
            
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
