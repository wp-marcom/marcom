const portalName =  "WestPressInventory";
const orderSelector= "WP Inventory - ";

const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);
const keys = require(`${primeDirectory}\\chrome_marcom_keys.json`);

(async () => {
    const wsChromeEndpointurl = keys.jsonURL;
    const browser = await puppeteer.connect({
        browserWSEndpoint: wsChromeEndpointurl,
        slowMo: 100 // Slows down Puppeteer operations by 100ms
    });

    // Get all open pages (tabs)
    let pages = await browser.pages();
    console.log(`Number of open tabs detected: ${pages.length}`);

    // Filter pages to find those with URLs containing "marcomcentral"
    const marcomPages = pages.filter(page => page.url().includes("marcomcentral"));
    console.log(`Number of 'marcomcentral' tabs detected: ${marcomPages.length}`);

    let page;

    if (marcomPages.length > 1) {
        // Close all but one "marcomcentral" tab, if more than one is found
        for (let i = marcomPages.length - 1; i > 0; i--) {
            await marcomPages[i].close();
            console.log(`Closed tab with URL: ${marcomPages[i].url()}`);
        }
        page = await browser.newPage();
        console.log('Opened a new tab.');
    } else {
        // If only one matching tab or no matching tabs are found, open a new tab
        page = await browser.newPage();
        console.log('Opened a new tab.');
    }

    await page.bringToFront();

    // Setting the navigation timeout and viewport
    page.setDefaultNavigationTimeout(0);
    await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
    });
//Login to Marcom Distrib Shipping Page
  //await page.goto('https://admin.marcomcentral.app.pti.com/Distribution/Index?section=4',{timeout: 0});
  await page.goto('https://admin.marcomcentral.app.pti.com/Account/LogOn?ReturnUrl=%2f',{timeout: 0});
  await page.waitForSelector('.ui-button');
  await page.click(".ui-button")
  
await page.goto('https://admin.marcomcentral.app.pti.com/Distribution/Index?section=4',{timeout: 0});
    
// Wait for the select element to be loaded that ships orders or items
await page.waitForSelector('select.distGridSelector[data-view-name="packingSlip"]', { visible: true });

// Select the option with the value "Ship Line Items"
await page.select('select.distGridSelector[data-view-name="packingSlip"]', '/LineItem/PackingSlipLineItemList');

page.on('response', response => {
    if (response.url().includes('PackingSlipLineItemListDataRequested')) {
      console.log(`Response URL: ${response.url()}`);
    }
  });

  const waitForJsonResponse = async (page, baseUrl, secondaryParam, timeout = 10000) => {
    try {
        await page.waitForResponse(response => {
            const url = response.url();
            return url.includes(baseUrl) && url.includes(secondaryParam) && response.status() === 200;
        }, { timeout });
        console.log('Items to ship have been loaded.');
    } catch (error) {
        console.error(`Failed to load JSON file: ${error.message}`);
    }
};




// Check to see if Full Order List has loaded
await waitForJsonResponse(page, 'https://admin.marcomcentral.app.pti.com/LineItem/PackingSlipLineItemListDataRequested?_search=false', 'false', 10000);


 
 // Wait for the specific JSON file request to complete
//const jsonUrlSubstring = 'https://admin.marcomcentral.app.pti.com/LineItem/PackingSlipLineItemListDataRequested?_search=false';
//await page.waitForResponse(response => response.url().includes(jsonUrlSubstring) && response.status() === 200);
//console.log('All Line Items have been loaded.');


 await page.waitForFunction(() => document.readyState === 'complete');
console.log(`Document is fully loaded.`);


    // Function to wait for the loading indicator to disappear or timeout
    const waitForLoading = async (selector, timeout = 5000) => {
         try {
            // Wait for the loading indicator to appear
             await page.waitForSelector(selector, { visible: true, timeout: 2000 });
             console.log(`Loading indicator (${selector}) is visible.`);
            console.log(`Loading...`);

            // Wait for the loading indicator to disappear or the timeout
             await page.waitForSelector(selector, { hidden: true, timeout });
             console.log(`Loading indicator (${selector}) is no longer visible.`);
            //console.log(`Loading complete.`);
         } catch (error) {
            // If the loading indicator does not appear within the timeout, proceed
             if (error.name === 'TimeoutError') {
                 console.log(`Loading indicator (${selector}) did not appear, proceeding...`);
                //console.log(`Loading not needed, proceeding...`);
             } else {
                 throw error;
             }
       }
    };



// Assuming portalNames is an array containing the portal names and their corresponding order selectors
const portalNamesAndSelectors = [
    { portalName: "Mister", orderSelector: "MCW Online - " },
    { portalName: "WestPressInventory", orderSelector: "WP Inventory - " },
    { portalName: "TMC", orderSelector: "TMC Online - " },
    { portalName: "NorthwestMedicalCenter", orderSelector: "NWH Online - " },
];


//Filter by PortalName
for (let i = 0; i < portalNamesAndSelectors.length; i++) {
    const { portalName, orderSelector } = portalNamesAndSelectors[i];

//Wait for the #gs_PortalName element to be present and visible
await page.waitForSelector('#gs_PortalName', { visible: true });
// Ensure the page has fully loaded and the next element is visible
await page.waitForFunction(() => document.readyState === 'complete');
console.log(`Document preparing to type Portal Name...`);
//await page.waitForSelector('#next_PackingSlipLineItemList_pager', { visible: true });
//await page.waitForSelector('#pg_PackingSlipLineItemList_pager', { visible: true });



// Wait for the loading indicator to disappear or timeout
//await waitForLoading('#load_PackingSlipLineItemList', 8000);
//await waitForLoading('.ui-dialog', 8000);



    // Set the portalName
    await page.click("#gs_PortalName");
    if(i!==0){
    await page.focus("#gs_PortalName"); // Focus on the input field
await page.keyboard.down('Control'); // Press Control key
await page.keyboard.press('A'); // Press A key to select all text
await page.keyboard.up('Control'); // Release Control key
await page.keyboard.press('Backspace'); // Delete the selected text
await page.keyboard.type(portalName);
    //await page.waitForTimeout(4000);
}

else{
    //await page.waitForTimeout(4000);
    await page.keyboard.type(portalName);
    //await page.waitForTimeout(4000);
    await page.click("#gs_DistributionOrderType");
    await page.keyboard.type("Standard");
    //await page.waitForTimeout(4000);
}
    // Filter by Standard item (not Backorders)
    

    // Click the "Filter" button
    await page.waitForSelector("#fbox_Grid_search");
    await page.click('[onclick="PackingSlipLineItemList.Search()"]');
    //await page.waitForTimeout(10000);
    //await waitForLoading('#load_PackingSlipLineItemList', 8000);// Adjust timeout as needed



if(i==0){
    await waitForJsonResponse(page, 'https://admin.marcomcentral.app.pti.com/LineItem/PackingSlipLineItemListDataRequested?_search=true', `sord=desc&PortalName=${portalName}`, 5000);   
    
    console.log(`${portalName} items have filtered by Name`);

}



else{
    await waitForJsonResponse(page, 'https://admin.marcomcentral.app.pti.com/LineItem/PackingSlipLineItemListDataRequested?_search=true', `sord=asc&PortalName=${portalName}`, 5000);
    console.log(`${portalName} items have filtered by Name and Date`);
}


 // Wait for the specific JSON file request to complete
// const jsonUrlSubstringFILTERED = 'https://admin.marcomcentral.app.pti.com/LineItem/PackingSlipLineItemListDataRequested?_search=true';
// await page.waitForResponse(response => response.url().includes(jsonUrlSubstringFILTERED) && response.status() === 200);
 

await page.waitForFunction(() => document.readyState === 'complete');
//console.log(`Document has been filtered...`);




    // Sort the workorders so the oldest ships first
    if(i==0){
    await page.waitForSelector("#jqgh_PackingSlipLineItemList_OrderNumber");
    await page.click("#jqgh_PackingSlipLineItemList_OrderNumber");
    await waitForJsonResponse(page, 'https://admin.marcomcentral.app.pti.com/LineItem/PackingSlipLineItemListDataRequested?_search=true', `sord=asc&PortalName=${portalName}`, 5000); 
    console.log(`${portalName} items have filtered by Date`);
      


 // Wait for the specific JSON file request to complete
//const jsonUrlSubstringDATE = 'https://admin.marcomcentral.app.pti.com/LineItem/PackingSlipLineItemListDataRequested?_search=true';
//const dateParams = 'sord=asc';
// Wait for the response that contains both the base URL and the specific query parameters
//await page.waitForResponse(response => {
//    const url = response.url();
//    return url.includes(jsonUrlSubstringDATE) && url.includes(dateParams) && response.status() === 200;
//});

await page.waitForFunction(() => document.readyState === 'complete');
//console.log(`Document has been sorted by date...`);
}
await page.waitForFunction(() => document.readyState === 'complete');
   // await waitForLoading('#load_PackingSlipLineItemList', 8000);// Adjust timeout as needed
    //await page.waitForTimeout(10000);

 

 let orderExists = "initial";
    
 // Check if there are orders to process for the current portalName and orderSelector
 while (orderExists !== "no orders to process") {
     try {
         orderExists = await page.$eval(`[title*="${orderSelector}"]`, (e) => e.innerHTML);
     } catch (error) {
         orderExists = "no orders to process";
     }

     console.log(`The script found ${orderExists} for ${portalName}`);
     if (orderExists !== "no orders to process") {
         const topOrder = await page.$eval(`[title*="${orderSelector}"]`, (e) => e.innerHTML);
         console.log(`${topOrder} is being shipped`);

         let optionsHandle;

         try {
             optionsHandle = await page.$$(`[title*="${topOrder}"]`);

             for (let i = 0; i < optionsHandle.length; i++) {
                 
                 await optionsHandle[i].click();
             }

         } catch (error) {
             console.log(`The script finds no orders to process`);
             break; // Exit loop if no orders to process
         }



         await page.click('[data-modal-action="/PackingSlip/CreateByLineItem"]');

         await waitForJsonResponse(page, 'https://admin.marcomcentral.app.pti.com/PackingSlip/LineItemListDataRequested?', `false`, 10000);

         await page.waitForFunction(() => document.readyState === 'complete');
        console.log(`Packing Slip Loaded`);

         


        // await waitForLoading('#processingSpinner', 8000);// Adjust timeout as needed
        // await waitForLoading('#load_PackingSlipListLineItem', 8000);// Adjust timeout as needed

        try {
            await page.waitForSelector("#distModalSave", { timeout: 1000 });
            await page.waitForSelector("#distModalClose");
            await page.click("#distModalSave");
        } catch (error) {
            while (true) {
                await page.waitForSelector("#distModalSaveAndNext");
                await page.waitForSelector("#distModalClose");
                await page.click("#distModalSaveAndNext");
                await page.waitForTimeout(4000);
                try {
                    await page.waitForSelector("#distModalSave", { timeout: 1000 });
                    break;
                } catch (error) {
                    continue;
                }
            }
            await page.waitForSelector("#distModalClose");
            await page.click("#distModalSave");
        }

        await page.waitForTimeout(4000);
        await page.click("#distModalClose");
        await page.waitForTimeout(4000);
    } else {
        break; // Break out of the loop if no orders to process
    }
}
}
//}
// Close the page after processing all portal names
// Clear the cache
await page.evaluate(async () => {
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
    }
});

console.log('Cache cleared.');

 // Clear the browser cache using DevTools Protocol
 const client = await page.target().createCDPSession();
 await client.send('Network.clearBrowserCache');

 console.log('Browser cache cleared.');



await page.close();


   // Exit the process
   process.exit();

})();

