// Product Groups Configuration
// Each group has one "mother" product that will be copied to create the "children"
const productGroups = [
  {
    mother: '55"x41" UWC 9.99|1 Month Promo Windscreen (1146) LF',
    children: [
      '55"x41" UWC 14.99|1 Month Promo Windscreen (1186) LF'
    ]
  },
  {
    mother: '96"x48" UWC 9.99|1 Month Promo Windscreen (1148) LF',
    children: [
      '96"x48" UWC 9.99|2 Month Promo Windscreen (1168) LF',
      '96"x48" UWC 50% Off|1 Month Promo Windscreen (1108) LF',
      '96"x48" UWC 50% Off|2 Month Promo Windscreen (1128) LF',
      '96"x48" UWC 14.99|1 Month Promo Windscreen (1188) LF'
    ]
  },
  {
    mother: 'UWC Mister Kiosk 9.99|1 Month Promo Decal (1150)',
    children: [
      'UWC Mister Kiosk 9.99|2 Month Promo Decal (1170) LF',
      'UWC Mister Kiosk 50% Off|1 Month Promo Decal (1110) LF',
      'UWC Mister Kiosk 50% Off|2 Month Promo Decal (1130) LF',
      'UWC Mister Kiosk 14.99|1 Month Promo Decal (1190) LF'
    ]
  },
  {
    mother: 'UWC Pegasus Gen 2 Kiosk 9.99|1 Month Promo Decal (1152)',
    children: [
      'UWC Pegasus Gen 2 Kiosk 9.99|2 Month Promo Decal (1172) LF',
      'UWC Pegasus Gen 2 Kiosk 50% Off|1 Month Promo Decal (1112) LF',
      'UWC Pegasus Gen 2 Kiosk 50% Off|2 Month Promo Decal (1132) LF',
      'UWC Pegasus Gen 2 Kiosk 14.99|1 Month Promo Decal (1192) LF'
    ]
  }
];

// Client Portal Configuration
const clientPortal = 'Mister';
const clientPortalId = '14715'; // Mister portal ID

// Directory Configuration
const primeDirectory = "C:\\projects\\";
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);

// Get local PC username for chrome key file matching
const os = require('os');
const userInfo = os.userInfo();
const userName = userInfo.username;

console.log(`Current username: ${userName}`);

// Load Chrome keys
const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

/**
 * Extract SKU from product name
 * Matches pattern like (1234) and extracts the number
 */
function extractSKU(productName) {
  const match = productName.match(/\((\d+)\)(?!.*\(\d+\))/);
  return match ? match[1] : null;
}

/**
 * Extract product name without SKU
 * Removes the (SKU) portion from the product name
 */
function extractProductName(fullName) {
  return fullName.replace(/\s*\(\d+\)\s*/, " ").trim();
}

/**
 * Process a single child product creation
 */
async function processChildProduct(page, motherProduct, childProduct) {
  const newSKU = extractSKU(childProduct);
  const newProduct = extractProductName(childProduct);

  console.log("  Product:", newProduct);
  console.log("  SKU:", newSKU);

  // Navigate to Copy Products page
  await page.goto('https://admin.marcomcentral.app.pti.com/CopyProducts/Edit', {timeout: 0});
  await page.waitForTimeout(4000);

  // Configure copy settings
  await page.waitForSelector("#CopyButton");
  await page.select('#CopyToPortalId', clientPortalId);
  await page.click("#CopyDetails");
  await page.click("#CopyInventory");
  await page.click("#CopyTemplate");
  await page.click("#CopyJobInstructions");
  await page.waitForTimeout(4000);

  // Search for mother product
  await page.click("#ProductsSearch");
  await page.waitForTimeout(4000);
  await page.waitForSelector("#ui-dialog-title-modalGridListDialogBox");
  await page.waitForTimeout(4000);
  await page.click("#gs_ProductName");
  await page.keyboard.type(motherProduct);
  await page.waitForTimeout(4000);
  await page.waitForSelector("#fbox_Grid_search");
  await page.click('[onclick="Products.Search()"]');
  await page.waitForTimeout(5000);
  await page.click(".jqgfirstrow");
  await page.waitForTimeout(4000);
  await page.click("#ModalSave_List");
  await page.waitForTimeout(4000);

  // Execute copy
  await page.click("#CopyButton");
  await page.waitForNavigation({ waitUntil: 'networkidle0' });

  // Wait for copy to complete (no more "Pending" status)
  await page.waitForFunction(
    () => !Array.from(document.querySelectorAll('td')).some(el => el.textContent.trim() === "Pending"),
    { timeout: 60000 }
  );

  console.log("  Product copy complete");

  // Navigate to product list and find the copied product
  await page.waitForTimeout(4000);
  await page.goto('https://admin.marcomcentral.app.pti.com/Product/List', {timeout: 0});
  await page.waitForTimeout(4000);
  await page.click("#gs_ProductName");
  await page.keyboard.type('_' + motherProduct);
  await page.click('[onclick="Products.Search()"]');
  await page.waitForTimeout(4000);
  await page.click(".jqgfirstrow");
  await page.waitForTimeout(4000);

  // Edit product details
  await page.click(".pivotDisplayField");
  await page.waitForTimeout(4000);

  // Update Product Name
  await page.click("#ProductName");
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.type(childProduct);
  await page.waitForTimeout(1000);

  // Update External ID
  await page.click("#ExternalId");
  await page.keyboard.type('MCW' + newSKU);
  await page.waitForTimeout(1000);

  // Navigate to next section
  await page.click(".pivotEditorField");
  await page.waitForTimeout(1000);
  await page.click(".navButtonRight");
  await page.waitForTimeout(1000);

  // Update Product Description
  await page.click("#ProductDescription");
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.up('KeyA');
  await page.keyboard.type(newProduct);

  // Navigate through remaining sections
  await page.click(".navButtonRight");
  await page.waitForTimeout(1000);
  await page.click(".navButtonRight");
  await page.waitForTimeout(1000);
  await page.click(".navButtonRight");
  await page.waitForTimeout(4000);

  // Add SKU
  await page.click("#SKUGridTrue");
  await page.waitForSelector("#ui-dialog-title-dialogWindow");
  await page.waitForTimeout(4000);
  await page.click("#SKU");
  await page.keyboard.type(newSKU);
  await page.waitForTimeout(4000);
  await page.click('#ModalSave');
  await page.waitForTimeout(8000);

  // Submit product
  await page.click('#ProdSubmit');
  await page.waitForTimeout(4000);

  console.log("  ✓ Child product created successfully\n");
}

/**
 * Process a product group (one mother, multiple children)
 */
async function processProductGroup(page, group, groupIndex) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing Group ${groupIndex + 1} of ${productGroups.length}`);
  console.log(`Mother: ${group.mother}`);
  console.log(`Children: ${group.children.length} products`);
  console.log('='.repeat(60));

  for (let i = 0; i < group.children.length; i++) {
    console.log(`\nChild ${i + 1} of ${group.children.length}:`);
    await processChildProduct(page, group.mother, group.children[i]);
  }

  console.log(`\n✓ Group ${groupIndex + 1} complete: ${group.children.length} products created from "${group.mother}"\n`);
}

/**
 * Main execution function
 */
(async () => {
  console.log('\n' + '='.repeat(60));
  console.log('MARCOM PRODUCT CREATION SCRIPT');
  console.log('='.repeat(60));
  console.log(`Client Portal: ${clientPortal}`);
  console.log(`Total Product Groups: ${productGroups.length}`);
  
  const totalProducts = productGroups.reduce((sum, group) => sum + group.children.length, 0);
  console.log(`Total Products to Create: ${totalProducts}`);
  console.log('='.repeat(60) + '\n');

  // Connect to Chrome browser
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

  // Login to Marcom
  console.log('Logging into Marcom...');
  await page.goto('https://admin.marcomcentral.app.pti.com/Account/LogOn?ReturnUrl=%2f', {timeout: 0});
  await page.waitForTimeout(4000);
  await page.click(".ui-button");
  await page.waitForTimeout(4000);

  // Navigate to portal
  await page.goto('https://admin.marcomcentral.app.pti.com/PortalInformation/List', {timeout: 0});
  await page.waitForTimeout(4000);
  await page.click("#gs_Name");
  await page.keyboard.type(clientPortal);
  await page.waitForTimeout(4000);
  await page.click("#fbox_Grid_search");
  await page.waitForTimeout(4000);
  await page.click(".gridCell");
  await page.waitForTimeout(4000);

  console.log('✓ Login successful\n');

  // Process each product group
  for (let groupIndex = 0; groupIndex < productGroups.length; groupIndex++) {
    await processProductGroup(page, productGroups[groupIndex], groupIndex);
  }

  // Close the page
  await page.close();

  console.log('\n' + '='.repeat(60));
  console.log('ALL PRODUCTS CREATED SUCCESSFULLY');
  console.log(`Total Groups Processed: ${productGroups.length}`);
  console.log(`Total Products Created: ${totalProducts}`);
  console.log('='.repeat(60) + '\n');

})();