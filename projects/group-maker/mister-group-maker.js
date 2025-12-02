const groupName = ["2643-Slide Road", "2642-Milwaukee", "2641-Mac Davis", "2644-Loop 289", "2645-74th Street"];
const storeNum = ["2643", "2642", "2641", "2644", "2645"];
const ccNum = ["806", "806", "806", "806", "806"];





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
  
  await page.goto('https://admin.marcomcentral.app.pti.com/Group/List',{timeout: 0});
  await page.waitForTimeout(4000);

  await page.click(".pti-button")
  await page.waitForTimeout(4000);
  await page.click("#GroupName")
  await page.keyboard.type(groupName[i])
  await page.waitForTimeout(4000)

  //Select Visible Product folders 'none' from dropdown 
  await page.waitForSelector("#ProductAndFolderVisibilityId");
  await page.select('#ProductAndFolderVisibilityId', 'None')
  //Hit Save
  await page.click("#GroupSubmit")
  await page.waitForTimeout(4000);
  await page.waitForTimeout(4000);
  //Nav to General Tab
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(4000);
  await page.click("#pivotEdit")
  await page.waitForTimeout(4000);
  //When Users Login Launch Page Option
  await page.select('#LaunchPageId', 'Catalog Top')
  //When Users Login Launch Page Option Option 1 is Corporate Only
  await page.select('#EnabledAddressBooksId', '1')
  await page.waitForTimeout(4000);
  //Uncheck All Corporate Addresses Visible
  await page.click("#AllAddresses")
  await page.waitForTimeout(4000);
  //Click on button that will select store Address and Corporate North
  await page.click("#VisiAddressearch");
  await page.waitForTimeout(4000);
  await page.waitForSelector("#ui-dialog-title-modalGridListDialogBox");
  await page.waitForTimeout(4000);
  await page.click("#gs_CompanyName");
  //search store Address
  await page.keyboard.type(storeNum[i])
  await page.waitForTimeout(4000);
  
  
  await page.waitForSelector("#fbox_Grid_search");
  //click store Address
  await page.click('[onclick="Locations.Search()"]');
  await page.waitForTimeout(5000);
//Search North Address
  await page.click(".jqgfirstrow");
  await page.waitForTimeout(4000);
  await page.click("#gs_CompanyName", { clickCount: 2 });
  await page.waitForTimeout(4000);
  await page.keyboard.type("North Campus HQ")

  //Click North Address
  await page.waitForSelector("#fbox_Grid_search");
  await page.click('[onclick="Locations.Search()"]');
  await page.waitForTimeout(5000);
  await page.click(".jqgfirstrow");
  await page.waitForTimeout(4000);
  //Save Addresses
  await page.click("#ModalSave_List");
  await page.waitForTimeout(4000);
  //Nav to Billing Tab
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(4000);
  //Select Default Bill To and Select North
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
//Lock Bill To Address
  await page.click("#DisableBillToSelection")
  await page.waitForTimeout(4000);
//Set Purchase Order as the only payment method and default method
await page.select('#PaymentMethodIds', '1')
await page.select('#PurchaseMethodDefaultId', '1')
await page.waitForTimeout(4000);
//Click on Visible Cost Centers and Type Search and Select store CC
  await page.click("#VisiCostCentersSearch");
  await page.waitForTimeout(4000);
  await page.waitForSelector("#ui-dialog-title-modalGridListDialogBox");
  await page.waitForTimeout(4000);
  await page.click("#gs_Name");
  await page.keyboard.type(ccNum[i])
  await page.waitForTimeout(4000);

   //
   await page.waitForSelector("#fbox_Grid_search");
   await page.click('[onclick="CostCenterGrid.Search()"]');
   await page.waitForTimeout(5000);
   await page.click(".jqgfirstrow");
   await page.waitForTimeout(4000);
   //Save the applied CC for store
   await page.click("#ModalSave_List");
   await page.waitForTimeout(4000);
//Click on Default Cost Centers and Type Search and Select store CC
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
   //Lock the Cost Center
   await page.click("#DisableCostCenterSelection");
   await page.waitForTimeout(4000);
   //Check show Pricing?
   await page.click("#formNoteFor_ShowPricing");
   await page.waitForTimeout(4000);
   //Nav to Shipping Page
   await page.keyboard.press('ArrowRight');
   await page.waitForTimeout(4000);
//Search and Select Store Address
  await page.click("#DefShipAddressSearch");
  await page.waitForTimeout(4000);
  await page.waitForSelector("#ui-dialog-title-modalGridListDialogBox");
  await page.waitForTimeout(4000);
  await page.click("#gs_CompanyName");
  await page.keyboard.type(storeNum[i])
  await page.waitForTimeout(4000);
  
  //Select Store Address
  await page.waitForSelector("#fbox_Grid_search");
  await page.click('[onclick="Locations.Search()"]');
  await page.waitForTimeout(5000);

  await page.click(".jqgfirstrow");
  await page.waitForTimeout(4000);
  //Lock Shipping Address
  await page.click("#DisableShipToSelection");
  await page.waitForTimeout(4000);
  //Select Westpress as Shipping Method
  await page.select('#DefaultShippingMethodId', '5:21593')
  //Uncheck Show Shipping Method
  await page.click("#ShowShippingMethod");
  //Check Hide Shipping Amount  in Portal when it is Zero
  await page.click("#ShowShippingAmount");
  await page.waitForTimeout(4000);
  //Nav to Checkout Workflow
  await page.click(".navButtonRight");
  await page.waitForTimeout(4000);
  //Check Remain on Add to Cart
  await page.click("#RemainInAddToCart");
  //Check Skip Billing
  await page.click("#SkipBilling");
  //Check Hide Billing Link
  await page.click("#HideBillingLink");
  await page.waitForTimeout(4000);
  //Nav to Admin
  await page.click(".navButtonRight");
  await page.waitForTimeout(4000);
//Set the see orders for for the group
await page.click("#SeeOrdersSearch");
    await page.waitForTimeout(4000);
    await page.waitForSelector("#ui-dialog-title-modalGridListDialogBox");
    await page.waitForTimeout(4000);
    await page.click("#gs_Name");
    await page.keyboard.type(groupName[i]);
    await page.waitForTimeout(4000);
  
    await page.waitForSelector("#fbox_Grid_search");
    await page.click('[onclick="CostCenterGrid.Search()"]');
    await page.waitForTimeout(5000);
    await page.click(".jqgfirstrow");
    await page.waitForTimeout(4000);
    await page.click("#ModalSave_List");
    await page.waitForTimeout(4000);
//Set Req approver and Senior purchaser as
  await page.click("#RequisitionApproverEmail");
  await page.keyboard.type("po_mcw@westpress.com")
  await page.click("#SeniorPurchaserEmail");
  await page.keyboard.type("po_mcw@westpress.com")
  await page.waitForTimeout(4000);
  //Save all!
  await page.click("#GroupSubmit")
  await page.waitForTimeout(8000);
  }
  await page.close();
  
  
  
   


   

  




// //Login to BulkOps Page
//   await page.goto('https://admin.marcomcentral.app.pti.com/BulkOps/Edit',{timeout: 0});
  
//   let counter = 1;

// //Login to BulkOps Page
//     await page.goto('https://admin.marcomcentral.app.pti.com/BulkOps/Edit',{timeout: 0});

// //Select SKU list from dropdown and filter by inventory SKUs only  
//   await page.waitForSelector("#SupplierInfo");
//   await page.select('#BulkOperations', 'SKUs')
//   await page.click("#DownloadOptions_5");

// //Tell browser instance where to save the file from Marcom
//   await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: downloadPath})

// //Download the SKU list
//   await page.click("#Download");
//   await page.waitForTimeout(10000);

// //Check the download directory called out above and return list of files (Only newest SKUS file should be found)
//   const fs = require('fs');
//   const fileNames = fs.readdirSync(downloadPath);
//   const fileData = `${fileNames[1]}`;
// //Overwrite the existing SKUs.xlsx with the new version by changing its name to match the old 'SKUS.xslx'
// fs.renameSync(`${downloadPath}\\${fileData}`, `${downloadPath}\\SKUs.xlsx`);
// //Wait and then confirm that a file named SKUs.xlsx exists
// await page.waitForTimeout(5000);
// const fileCheck = `${fileNames[0]}`;

// //Return an error message if file is not found or close the browser tab when done
// if(fileCheck===`SKUs.xlsx`){
    
//     const client = new google.auth.JWT(
//       googleKeys.client_email, 
//       null, 
//       googleKeys.private_key,
//       ['https://www.googleapis.com/auth/spreadsheets']
//       );
      
      
//       client.authorize(function(err,tokens){
      
//       if (err){
//           console.log (err);
//           return;
//       }
//       else{
//           console.log(`Connected!`)
//           gsrun(client);
//       }
      
//       });
      
//       async function gsrun(cl){
//           const gsapi = google.sheets({version:'v4', auth: cl});
      
//       const wb = new Excel.Workbook();
//       let excelFile = await wb.xlsx.readFile(`${downloadPath}\\SKUs.xlsx`);
//       let ws = excelFile.getWorksheet(`SKUs`);
//       let data = ws.getSheetValues();
//       data = data.map(function(r){
//           return [r[2],r[3],r[11],r[12],r[15],r[16],r[18]]
//       });
//       data.shift();
//       data.shift();
//       data.shift();
//       data.shift();
//       data.shift();
//       data.shift();
//       data.shift();
//       data.shift();
      
//       const sortOptions = {
//           //spreadsheetId: `1ziLNgx3ci5_OOyJmgWJL7hPTTuEPg6D1S1GnLxtdcn0`,
//           spreadsheetId: `14JGNtRb-hxjKowzYMEQe0UObFE2sED5KUCYhnaIX1jI`,
//           range:`Inventory Status!A2`,
//           valueInputOption: `USER_ENTERED`,
//           resource: {values:data}
//           };
      
      
//       const updateOptions = {
//               //spreadsheetId: `1ziLNgx3ci5_OOyJmgWJL7hPTTuEPg6D1S1GnLxtdcn0`,
//               spreadsheetId: `14JGNtRb-hxjKowzYMEQe0UObFE2sED5KUCYhnaIX1jI`,
//               range:`Inventory Status!A2`,
//               valueInputOption: `USER_ENTERED`,
//               resource: {values:data}
//               };
      
//       let res = await gsapi.spreadsheets.values.update(updateOptions);


//     await page.goto('https://admin.marcomcentral.app.pti.com/PortalInformation/List',{timeout: 0});
//     await page.waitForTimeout(4000);
//     //Filter by WestPressInventory
//     await page.click("#gs_Name")
//     //await page.click(`[title*="WestPressInventory"]`)
//     await page.keyboard.type("Mister")
//     await page.waitForTimeout(4000)
//     await page.click("#fbox_Grid_search")
//     await page.waitForTimeout(4000);
//     await page.click(".gridCell")
//     await page.waitForTimeout(4000);

//     await page.close();
//     }




// }
// else{
//   console.log(`There was an error renaming the file`);
// }
// /**/
})();