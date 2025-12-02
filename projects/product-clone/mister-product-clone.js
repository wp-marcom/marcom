
const motherFormName = ['36"x96" Vinyl "UWC Plans 22.99" Banner (202) LF'];
const childFormNames = ['36"x96" Vinyl "Free Vacuums" Banner (7007) LF','36"x96" Vinyl "New & Improved" Vacuum Banner (7009) LF','36"x96" Vinyl "Coming Soon" Vacuum Banner (7011) LF'];
//const ccNum = ["800"];




// Define clientPortal variable
const clientPortal = 'Mister'

const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);

// Grab the local PC username to match to chrome key file
const os = require('os');

const userInfo = os.userInfo();
const userName = userInfo.username;

console.log(`Current username: ${userName}`);

// Relative link to keys directory before looking for username match
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

//const keys = require(`${primeDirectory}\\chrome_marcom_keys.json`);



(async () => {
//Connect to existing instance of Chrome browser and create a new tab with the following specs
  const wsChromeEndpointurl = keys.jsonURL;
  const browser = await puppeteer.connect({
      browserWSEndpoint: wsChromeEndpointurl,
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);
  await page.setViewport({
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
});


//Login to Marcom Page
    // Login to Marcom Page
    await page.goto('https://admin.marcomcentral.app.pti.com/Account/LogOn?ReturnUrl=%2f',{timeout: 0});
    await page.waitForTimeout(4000);
    await page.click(".ui-button");
    await page.waitForTimeout(4000);
    await page.goto('https://admin.marcomcentral.app.pti.com/PortalInformation/List',{timeout: 0});
    await page.waitForTimeout(4000);
    await page.click("#gs_Name");
    await page.keyboard.type(clientPortal);
    await page.waitForTimeout(4000);
    await page.click("#fbox_Grid_search");
    await page.waitForTimeout(4000);
    await page.click(".gridCell");
    await page.waitForTimeout(4000);

  console.log(childFormNames.length+" products are being created on this run");

  for (let i = 0; i < childFormNames.length; i++) { 

const match = childFormNames[i].match(/\((\d+)\)(?!.*\(\d+\))/);
// BELOW extracts skus from Child Form names like Body in Balance - RX Pad (TP-1002) and Others like Wallmount Windscreen Frame - 28x44 (11003)
   const newSKU = match ? match[1] : null;

    // Remove the matched newSKU part (including the parentheses) to get newProduct
const newProduct = childFormNames[i].replace(/\s*\(\d+\)\s*/, " ").trim();

 console.log("Product:", newProduct);
  console.log("SKU:", newSKU);
    
  //gs_LongCompanyName
  await page.goto('https://admin.marcomcentral.app.pti.com/CopyProducts/Edit',{timeout: 0});
  await page.waitForTimeout(4000);
  await page.waitForTimeout(4000);
  await page.waitForTimeout(4000)

  //Select Visible Product folders 'none' from dropdown 
  await page.waitForSelector("#CopyButton");
  await page.select('#CopyToPortalId', '14715')//Mister
  await page.click("#CopyDetails")
  //await page.click("#CopyProductImage")
  //await page.click("#CopySKUs")
  await page.click("#CopyInventory")
  await page.click("#CopyTemplate")
  await page.click("#CopyJobInstructions")
  await page.waitForTimeout(4000);
  await page.waitForTimeout(4000);
  await page.click("#ProductsSearch");
  await page.waitForTimeout(4000);
  await page.waitForSelector("#ui-dialog-title-modalGridListDialogBox");
  await page.waitForTimeout(4000);
  await page.click("#gs_ProductName");
  await page.keyboard.type(motherFormName[0])
  await page.waitForTimeout(4000);
  await page.waitForSelector("#fbox_Grid_search");
  await page.click('[onclick="Products.Search()"]');
  await page.waitForTimeout(5000);
  await page.click(".jqgfirstrow");
  await page.waitForTimeout(4000);
  await page.click("#ModalSave_List");
  await page.waitForTimeout(4000);
  await page.click("#CopyButton");
await page.waitForNavigation({ waitUntil: 'networkidle0' });

await page.waitForFunction(
    () => !Array.from(document.querySelectorAll('td')).some(el => el.textContent.trim() === "Pending"),
    { timeout: 60000 }  // Timeout set to 1 minute (60000 milliseconds)
);

console.log("All 'Pending' items have been processed. Product Copy Complete");

// Proceed with the next steps

  
  // Proceed with the next steps
  
  
  // Proceed with the next steps
  await page.waitForTimeout(4000);
  await page.goto('https://admin.marcomcentral.app.pti.com/Product/List',{timeout: 0});
  await page.waitForTimeout(4000);
  await page.click("#gs_ProductName");
  await page.keyboard.type('_' + motherFormName[0]);
  await page.click('[onclick="Products.Search()"]');
  await page.waitForTimeout(4000);
  await page.click(".jqgfirstrow");
  await page.waitForTimeout(4000);
  await page.waitForTimeout(4000);
  await page.click(".pivotDisplayField");
  await page.waitForTimeout(4000);
  await page.click("#ProductName");
    // Simulate pressing Control key and then 'A' key
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');

    await page.keyboard.type(childFormNames[i])
    await page.waitForTimeout(1000);
    await page.click("#ExternalId");
    await page.keyboard.type('MCW'+newSKU);
    await page.waitForTimeout(1000);
    await page.click(".pivotEditorField");
    await page.waitForTimeout(1000);
    await page.click(".navButtonRight");
    await page.waitForTimeout(1000);
    await page.click("#ProductDescription");
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.up('KeyA');
    await page.keyboard.type(newProduct+'<div class="button button-orange"><i class="fa fa-exclamation-triangle"></i><strong>Sold individually</strong></div>');
    await page.click(".navButtonRight");
    await page.waitForTimeout(1000);
    await page.click(".navButtonRight");
    await page.waitForTimeout(1000);
    await page.click(".navButtonRight");
    await page.waitForTimeout(4000);
    await page.click("#SKUGridTrue");
    await page.waitForSelector("#ui-dialog-title-dialogWindow");
    await page.waitForTimeout(4000);
    await page.click("#SKU");
    await page.keyboard.type(newSKU);
    await page.waitForTimeout(4000);
    await page.click('#ModalSave');
    await page.waitForTimeout(8000);
    await page.click('#ProdSubmit');
    await page.waitForTimeout(4000);
    
  }
  await page.close();

})();