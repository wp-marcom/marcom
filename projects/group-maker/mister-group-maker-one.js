
const groupName = ["2546-Justice"];
const storeNum = ["2546"];
const ccNum = ["806"];

const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);

// Grab the local PC username to match to chrome key file
const os = require('os');

const userInfo = os.userInfo();
const userName = userInfo.username;

console.log(`Current username: ${userName}`);

// Relative link to keys directory before looking for username match
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);


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
  await page.goto('https://admin.marcomcentral.app.pti.com/',{timeout: 0});

  console.log(groupName.length+" groups are being created on this run");

  for (let i = 0; i < groupName.length; i++) { 
  //gs_LongCompanyName
  await page.goto('https://admin.marcomcentral.app.pti.com/Group/List',{timeout: 0});
  await page.waitForTimeout(4000);
  //Filter by WestPressInventory
  await page.click(".pti-button")
  await page.waitForTimeout(4000);
  await page.click("#GroupName")
  await page.keyboard.type(groupName[i])
  await page.waitForTimeout(4000)

  //Select Visible Product folders 'none' from dropdown 
  await page.waitForSelector("#ProductAndFolderVisibilityId");
  await page.select('#ProductAndFolderVisibilityId', 'None')
  await page.click("#GroupSubmit")
  await page.waitForTimeout(4000);
  await page.waitForTimeout(4000);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(4000);
  await page.click("#pivotEdit")
  await page.waitForTimeout(4000);
  await page.select('#LaunchPageId', 'Catalog Top')
  await page.select('#EnabledAddressBooksId', '1')
  await page.waitForTimeout(4000);
  await page.click("#AllAddresses")
  await page.waitForTimeout(4000);
  await page.click("#VisiAddressearch");
  await page.waitForTimeout(4000);
  await page.waitForSelector("#ui-dialog-title-modalGridListDialogBox");
  await page.waitForTimeout(4000);
  await page.click("#gs_CompanyName");
  await page.keyboard.type(storeNum[i])
  await page.waitForTimeout(4000);
  
  //Once filter text is added, click the "Filter" button
  await page.waitForSelector("#fbox_Grid_search");
  await page.click('[onclick="Locations.Search()"]');
  await page.waitForTimeout(5000);

  await page.click(".jqgfirstrow");
  await page.waitForTimeout(4000);
  await page.click("#gs_CompanyName", { clickCount: 2 });
  await page.waitForTimeout(4000);
  await page.keyboard.type("North Campus HQ")

  //Once filter text is added, click the "Filter" button
  await page.waitForSelector("#fbox_Grid_search");
  await page.click('[onclick="Locations.Search()"]');
  await page.waitForTimeout(5000);
  await page.click(".jqgfirstrow");
  await page.waitForTimeout(4000);
  await page.click("#ModalSave_List");
  await page.waitForTimeout(4000);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(4000);
  
  await page.click("#DefBillAddressSearch");
  await page.waitForTimeout(4000);
  await page.waitForSelector("#ui-dialog-title-modalGridListDialogBox");
  await page.waitForTimeout(4000);
  await page.click("#gs_Description");
  await page.keyboard.type("000 - North")
  await page.waitForTimeout(4000);
  
  //Once filter text is added, click the "Filter" button
  await page.waitForSelector("#fbox_Grid_search");
  await page.click('[onclick="Locations.Search()"]');
  await page.waitForTimeout(5000);
  await page.click(".jqgfirstrow");
  await page.waitForTimeout(4000);
  await page.waitForTimeout(4000);

  await page.click("#DisableBillToSelection")
  await page.waitForTimeout(4000);

  await page.click("#VisiCostCentersSearch");
  await page.waitForTimeout(4000);
  await page.waitForSelector("#ui-dialog-title-modalGridListDialogBox");
  await page.waitForTimeout(4000);
  await page.click("#gs_Name");
  await page.keyboard.type(ccNum[i])
  await page.waitForTimeout(4000);

   //Once filter text is added, click the "Filter" button
   await page.waitForSelector("#fbox_Grid_search");
   await page.click('[onclick="CostCenterGrid.Search()"]');
   await page.waitForTimeout(5000);
   await page.click(".jqgfirstrow");
   await page.waitForTimeout(4000);
   await page.click("#ModalSave_List");
   await page.waitForTimeout(4000);

   await page.click("#DefCostCentersSearch");
  await page.waitForTimeout(4000);
  await page.waitForSelector("#ui-dialog-title-modalGridListDialogBox");
  await page.waitForTimeout(4000);
  await page.click("#gs_Name");
  await page.keyboard.type(ccNum[i])
  await page.waitForTimeout(4000);

   //Once filter text is added, click the "Filter" button
   await page.waitForSelector("#fbox_Grid_search");
   await page.click('[onclick="CostCenterGrid.Search()"]');
   await page.waitForTimeout(5000);
   await page.click(".jqgfirstrow");
   await page.waitForTimeout(4000);
   await page.waitForTimeout(4000);
   await page.click("#DisableCostCenterSelection");
   await page.waitForTimeout(4000);
   await page.click("#formNoteFor_ShowPricing");
   await page.waitForTimeout(4000);
   await page.keyboard.press('ArrowRight');
   await page.waitForTimeout(4000);

  await page.click("#DefShipAddressSearch");
  await page.waitForTimeout(4000);
  await page.waitForSelector("#ui-dialog-title-modalGridListDialogBox");
  await page.waitForTimeout(4000);
  await page.click("#gs_CompanyName");
  await page.keyboard.type(storeNum[i])
  await page.waitForTimeout(4000);
  
  //Once filter text is added, click the "Filter" button
  await page.waitForSelector("#fbox_Grid_search");
  await page.click('[onclick="Locations.Search()"]');
  await page.waitForTimeout(5000);

  await page.click(".jqgfirstrow");
  await page.waitForTimeout(4000);
  await page.click("#DisableShipToSelection");
  await page.waitForTimeout(4000);
  await page.select('#DefaultShippingMethodId', '5:21593')
  await page.click("#ShowShippingMethod");
  await page.click("#ShowShippingAmount");
  await page.waitForTimeout(4000);
  await page.click(".navButtonRight");
  await page.waitForTimeout(4000);
  await page.click("#RemainInAddToCart");
  await page.click("#SkipBilling");
  await page.click("#HideBillingLink");
  await page.waitForTimeout(4000);
  await page.click(".navButtonRight");
  await page.waitForTimeout(4000);

  await page.click("#RequisitionApproverEmail");
  await page.keyboard.type("po_mcw@westpress.com")
  await page.click("#SeniorPurchaserEmail");
  await page.keyboard.type("po_mcw@westpress.com")
  await page.waitForTimeout(4000);
  await page.click("#GroupSubmit")
  await page.waitForTimeout(8000);
  }
  await page.close();
  
  
})();