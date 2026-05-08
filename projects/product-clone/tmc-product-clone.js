
const motherFormName = ["BRUN-1107"];
const childFormNames = ["BRUN-1108 - TMCHCC Colorectal: Condyloma Info Brochure", "BRUN-1109 - TMCHCC Colorectal: Lavator Syndrome Info Brochure", "BRUN-1110 - TMCHCC Colorectal: Pruritus Info Brochure", "BRUN-1112 - TMCHCC Colorectal: Anal Fistula Info Brochure", "BRUN-1113 - TMCHCC Colorectal: Constipation Info Brochure"];
//const ccNum = ["800"];




// Define clientPortal variable
const clientPortal = 'tmc'

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
    await page.click('.primary-submit')
    //await page.click(".ui-button");
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

    let newSKU = childFormNames[i].split(' - ')[0];
  //gs_LongCompanyName
  await page.goto('https://admin.marcomcentral.app.pti.com/CopyProducts/Edit',{timeout: 0});
  await page.waitForTimeout(4000);
  await page.waitForTimeout(4000);
  await page.waitForTimeout(4000)

  //Select Visible Product folders 'none' from dropdown 
  await page.waitForSelector("#CopyButton");
  await page.select('#CopyToPortalId', '23660')
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
    await page.click(".pivotEditorField");
    await page.waitForTimeout(1000);
    await page.click(".navButtonRight");
    await page.waitForTimeout(1000);
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