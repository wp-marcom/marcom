

// Define the primeDirectory variable for file paths
const primeDirectory = "C:\\projects\\";

// Import Puppeteer for browser automation
const puppeteer = require(`${primeDirectory}node_modules\\puppeteer`);

// Import Google APIs
const { google } = require(`${primeDirectory}node_modules\\googleapis`);

// Import Google API keys
//const googleKeys = require(`${primeDirectory}\\googleapi_keys.json`);
const googleKeys = require(`${primeDirectory}\\googleapi_keys_portalsync.json`);

// Import Chrome marcom keys
//const keys = require(`${primeDirectory}\\chrome_marcom_keys.json`);

const os = require('os');

const userInfo = os.userInfo();
const userName = userInfo.username;

console.log(`Current username: ${userName}`);


const keys = require(`${__dirname}\\..\\keys\\chrome_marcom_keys_${userName}.json`);

console.log(`Current keys: ${keys}`);

// Import path module for file paths
const path = require('path');

// Import ExcelJS module
const Excel = require(`${primeDirectory}node_modules\\exceljs`);

// Import Axios for making HTTP requests
//const axios = require('axios');
const fs = require('fs');


// Assuming portalNames is an array containing the portal names and their corresponding order selectors
const portalNamesAndSelectors = [
    { portalName: "Mister", orderSelector: "MCW Online - " },
    { portalName: "WestPressInventory", orderSelector: "WP Inventory - " },
    { portalName: "TMC", orderSelector: "TMC Online - " },
    { portalName: "NorthwestMedicalCenter", orderSelector: "NWH Online - " },
];

// Helper function to find the most recent file
const findMostRecentFile = (directory) => {
  const files = fs.readdirSync(directory).filter(file => file.startsWith('SKUs_') && file.endsWith('.xlsx'));
  if (files.length === 0) return null;

  const filesWithStats = files.map(file => {
    const filePath = path.join(directory, file);
    return { file, stats: fs.statSync(filePath) };
  });

  const mostRecent = filesWithStats.reduce((prev, curr) =>
    prev.stats.mtime > curr.stats.mtime ? prev : curr
  );

  return mostRecent.file;
};


// Helper function to rename the most recent file
// Helper function to rename the most recent file

const renameMostRecentFile = async (directory, newName, clientPortal) => {
    const mostRecentFile = findMostRecentFile(directory);
    if (!mostRecentFile) {
      console.error('No files found in the directory.');
      return;
    }
  
    const oldPath = path.join(directory, mostRecentFile);
    const newPath = path.join(directory, newName);
  
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed '${mostRecentFile}' to '${newName}'`);
  
    // Verify the file exists with the new name
    if (verifyFileExists(newPath)) {
      console.log(`File ${newName} exists, proceeding with next steps...`);
      await nextSteps(clientPortal, newPath); // Wait for next steps to complete
    } else {
      console.error(`File ${newName} does not exist. Please check the renaming process.`);
    }
  };

const clearSheet = async (gsapi, spreadsheetId, range) => {
        await gsapi.spreadsheets.values.clear({
            spreadsheetId,
            range,
        });
        console.log(`Cleared range ${range} in Google Sheet.`);
    };
  

// Function to verify if the file exists
const verifyFileExists = (filename) => {
  return fs.existsSync(filename);
};

// Function to define and execute next steps
const nextSteps = async (portalName, newPath) => {
    const clientPortal = portalName;
    const newFilePath = newPath;
    // Example next steps
    console.log('Uploading to Google Sheet...');
    // Define download path for Marcom data

    try {
      const client = new google.auth.JWT(
        googleKeys.client_email,
        null,
        googleKeys.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
      );
  
      await new Promise((resolve, reject) => {
        client.authorize(function (err, tokens) {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            console.log(`Connected!`);
            resolve();
          }
        });
      });
  
      const gsapi = google.sheets({ version: 'v4', auth: client });
      const wb = new Excel.Workbook();
      let excelFile = await wb.xlsx.readFile(`${newFilePath}`);
      let ws = excelFile.getWorksheet(`SKUs`);
      let data = ws.getSheetValues();

       // Transform Mister Data
    if (portalName === 'Mister') {
      data = data.map(function (r) {
        // Extract the text after the colon using a regular expression
        let match = /Location:<\/b><\/span>(.*)/.exec(r[4]);
        let locationText = match ? match[1].trim() : ''; // Extract the matched text and trim whitespace
        return [r[2], r[3], locationText, r[11], r[12], r[15], r[16], r[18]];
      });
      data.shift();
      data.shift();
      data.shift();
      data.shift();
      data.shift();
      data.shift();
      data.shift();
      data.shift();

    
  
      const updateOptions = {
        spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
        range: `Mister Car Wash!A2`,
        valueInputOption: `USER_ENTERED`,
        resource: { values: data }
      };
    
      
    
      await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `Mister Car Wash!A2:H`);
      console.log('SKU data cleared from Google Sheet.');
      await gsapi.spreadsheets.values.update(updateOptions);
      console.log('SKU data updated successfully.');
    }

    else if (portalName === 'WestPressInventory') {
        data = data.map(function (r) {

            let fullSKUdescription= r[4];  
            // Extract the text after the colon using a regular expression
        let locationText = /Location:<\/b><\/span>(.*)/.exec(fullSKUdescription);
        let locationInfo = locationText ? locationText[1].trim() : ''; // Extract the matched text and trim whitespace
            return [r[2],r[3],locationInfo,fullSKUdescription,r[11],r[12],r[15],r[16],r[18]];
          });
          data.shift();
          data.shift();
          data.shift();
          data.shift();
          data.shift();
          data.shift();
          data.shift();
          data.shift();
    
          // Create new arrays for Inventory Snapshot groups
          let updateAllSKUS = [];
          let updateSierraTucson = [];
          let updateOPPM = [];
          let updatePFCU = [];
          let updateVWCU = [];
    
    // Update all SKUS without filtering
    updateAllSKUS = data.map(function(row) {
      // Map each row to include only the necessary columns for upload
      return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]]; // Include only columns you want to upload
    });
    
    
         // Filter data array based on condition and populate updateSierraTucson
    updateSierraTucson = data.filter(function(row) {
      // Condition: Check if the value in r[1] (the second column after processing) contains "SIET"
      return row[1].includes('SIET');
    }).map(function(row) {
      // Map each filtered row to include only the necessary columns for upload
      return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]]; // Include only columns you want to upload
    });
    
    // Filter data array based on condition and populate updateOPPM
    updateOPPM = data.filter(function(row) {
      // Condition: Check if the value in r[1] (the second column after processing) contains "OPPM"
      return row[1].includes('OPPM');
    }).map(function(row) {
      // Map each filtered row to include only the necessary columns for upload
      return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]]; // Include only columns you want to upload
    });
    
    
    // Filter data array based on condition and populate updatePFCU
    updatePFCU = data.filter(function(row) {
      // Condition: Check if the value in r[1] (the second column after processing) contains "PFCU"
      return row[1].includes('PFCU');
    }).map(function(row) {
      // Map each filtered row to include only the necessary columns for upload
      return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]]; // Include only columns you want to upload
    });
    
    
    // Filter data array based on condition and populate updateVWCU
    updateVWCU = data.filter(function(row) {
      // Condition: Check if the value in r[1] (the second column after processing) contains "VWCU"
      return row[1].includes('VW');
    }).map(function(row) {
      // Map each filtered row to include only the necessary columns for upload
      return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]]; // Include only columns you want to upload
    });
    
          const updateOptions_AllSKUS = {
            spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
            range:`West Press Inventory!A2`,
            valueInputOption: `USER_ENTERED`,
            resource: {values:updateAllSKUS}
          };
    
          // Update Google Spreadsheet with the filtered data
        const updateOptions_SIET = {
         spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
         range: `Sierra Tucson!A2`, // Adjust sheet name as needed
          valueInputOption: `USER_ENTERED`,
          resource: {values: updateSierraTucson}
        };
    
        const updateOptions_OPPM = {
          spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
          range: `OPPM!A2`, // Adjust sheet name as needed
           valueInputOption: `USER_ENTERED`,
           resource: {values: updateOPPM}
         };
    
         const updateOptions_PFCU = {
          spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
          range: `PFCU!A2`, // Adjust sheet name as needed
           valueInputOption: `USER_ENTERED`,
           resource: {values: updatePFCU}
         };
    
         const updateOptions_VWCU = {
          spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
          range: `VWCU!A2`, // Adjust sheet name as needed
           valueInputOption: `USER_ENTERED`,
           resource: {values: updateVWCU}
         };
    
         const clearSheet = async (gsapi, spreadsheetId, range) => {
          await gsapi.spreadsheets.values.clear({
              spreadsheetId,
              range,
          });
          console.log(`Cleared range ${range} in Google Sheet.`);
      };
      
      await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `West Press Inventory!A2:H`);
      await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `Sierra Tucson!A2:H`);
      await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `OPPM!A2:H`);
      await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `PFCU!A2:H`);
      await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `VWCU!A2:H`);
    
    
     // PUSH the filtered data to the spreadsheet
          let res = await gsapi.spreadsheets.values.update(updateOptions_AllSKUS);
          let res_SIET = await gsapi.spreadsheets.values.update(updateOptions_SIET);
          let res_OPPM = await gsapi.spreadsheets.values.update(updateOptions_OPPM);
          let res_PFCU = await gsapi.spreadsheets.values.update(updateOptions_PFCU);
          let res_VWCU = await gsapi.spreadsheets.values.update(updateOptions_VWCU);
    
          console.log('SKU data updated successfully.');


    }
    else if (portalName === 'TMC') {
        data = data.map(function (r) {
            let fullSKUdescription= r[4];  
            // Extract the text after the colon using a regular expression
        let locationText = /Location:<\/b><\/span>(.*)/.exec(fullSKUdescription);
        let locationInfo = locationText ? locationText[1].trim() : ''; // Extract the matched text and trim whitespace
            return [r[2],r[3],locationInfo,fullSKUdescription,r[11],r[12],r[15],r[16],r[18]];
          });
          data.shift();
          data.shift();
          data.shift();
          data.shift();
          data.shift();
          data.shift();
          data.shift();
          data.shift();
    
          // Create new arrays for Inventory Snapshot groups
          let updateAllSKUS = [];
          let updateTMCFORMS = [];
          let updateTMCCOMM_PRINT = [];
          let updateTMCCOMM_PROMO = [];
         let updateTMCCOMMUNICATIONS = [];
          let updateTMCFOUNDATION = [];
         let updateTMCSENIORS = [];
          let updateTMCWELLNESS = [];
          let updateTMCWOMENCHILD = [];
    
    
    // Update all SKUS without filtering
    updateAllSKUS = data.map(function(row) {
      // Map each row to include only the necessary columns for upload
      return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]]; // Include only columns you want to upload
    });
    
    
    
    // Filter data array based on condition and populate updateTMCFORMS
    updateTMCFORMS = data.filter(function(row) {
      // Condition: Check if the value in r[1] (the fourth column after processing) contains "TMCFORMS"
      return row[3].includes('MISC TMC FORMS');
    }).map(function(row) {
      // Map each filtered row to include only the necessary columns for upload
      return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]]; // Include only columns you want to upload
    });
    
    // Filter data array based on condition and populate updateTMCCOMM_PRINT
    updateTMCCOMM_PRINT = data.filter(function(row) {
      // Condition: Check if the value in r[3] (the fourth column after processing) contains "MISC TMC COMM OUT PRINT"
      return row[3].includes('MISC TMC COMM OUT PRINT');
    }).map(function(row) {
      // Map each filtered row to include only the necessary columns for upload
      return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]]; // Include only columns you want to upload
    });
    
    // Filter data array based on condition and populate updateTMCCOMM_PROMO
    updateTMCCOMM_PROMO = data.filter(function(row) {
      // Condition: Check if the value in r[3] (the fourth column after processing) contains "MISC TMC COMM OUT PROMOS"
      return row[3].includes('MISC TMC COMM OUT PROMOS');
    }).map(function(row) {
      // Map each filtered row to include only the necessary columns for upload
      return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]]; // Include only columns you want to upload
    });
    
    
    // Filter data array based on condition and populate updateTMCCOMMUNICATIONS
    updateTMCCOMMUNICATIONS = data.filter(function(row) {
      // Condition: Check if the value in r[3] (the fourth column after processing) contains "TMCCOMMUNICATIONS"
      return row[3].includes('TMC Communications');
    }).map(function(row) {
      // Map each filtered row to include only the necessary columns for upload
      return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]]; // Include only columns you want to upload
    });
    
    
    // Filter data array based on condition and populate updateTMCFOUNDATION
    updateTMCFOUNDATION = data.filter(function(row) {
      // Condition: Check if the value in r[3] (the fourth column after processing) contains "TMCFOUNDATION"
      return row[3].includes('TMC Foundation');
    }).map(function(row) {
      // Map each filtered row to include only the necessary columns for upload
      return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]]; // Include only columns you want to upload
    });
    
    // Filter data array based on condition and populate updateTMCSENIORS
    updateTMCSENIORS = data.filter(function(row) {
      // Condition: Check if the value in r[3] (the fourth column after processing) contains "TMCSENIORS"
      return row[3].includes('TMC Seniors');
    }).map(function(row) {
      // Map each filtered row to include only the necessary columns for upload
      return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]]; // Include only columns you want to upload
    });
    
    
    // Filter data array based on condition and populate updateTMCWELLNESS
    updateTMCWELLNESS = data.filter(function(row) {
      // Condition: Check if the value in r[3] (the fourth column after processing) contains "TMCWELLNESS"
      return row[3].includes('TMC Wellness');
    }).map(function(row) {
      // Map each filtered row to include only the necessary columns for upload
      return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]]; // Include only columns you want to upload
    });
    
    
    // Filter data array based on condition and populate updateTMCWOMENCHILD
    updateTMCWOMENCHILD = data.filter(function(row) {
      // Condition: Check if the value in r[3] (the fourth column after processing) contains "TMCWOMENCHILD"
      return row[3].includes('TMC WOMEN & CHILDREN');
    }).map(function(row) {
      // Map each filtered row to include only the necessary columns for upload
      return [row[0], row[1], row[2], row[4], row[5], row[6], row[7], row[8]]; // Include only columns you want to upload
    });
    
    
    
          const updateOptions_AllSKUS = {
            spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
            range:`TMC!A2`,
            valueInputOption: `USER_ENTERED`,
            resource: {values:updateAllSKUS}
          };
    
         const updateOptions_TMCFORMS = {
          spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
          range: `TMC Forms!A2`, // Adjust sheet name as needed
           valueInputOption: `USER_ENTERED`,
           resource: {values: updateTMCFORMS}
         };
    
         const updateOptions_TMCCOMM_PRINT = {
          spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
          range: `TMC Comm Outreach PRINT!A2`, // Adjust sheet name as needed
           valueInputOption: `USER_ENTERED`,
           resource: {values: updateTMCCOMM_PRINT}
         };
        
         const updateOptions_TMCCOMM_PROMO = {
          spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
          range: `TMC Comm Outreach PROMO!A2`, // Adjust sheet name as needed
           valueInputOption: `USER_ENTERED`,
           resource: {values: updateTMCCOMM_PROMO}
         };
    
          // Update options for TMCCOMMUNICATIONS
    const updateOptions_TMCCOMMUNICATIONS = {
      spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
      range: `TMC Communications!A2`, // Adjust sheet name as needed
      valueInputOption: `USER_ENTERED`,
      resource: { values: updateTMCCOMMUNICATIONS }
      };
      
      // Update options for TMCFOUNDATION
      const updateOptions_TMCFOUNDATION = {
      spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
      range: `TMC Foundation!A2`, // Adjust sheet name as needed
      valueInputOption: `USER_ENTERED`,
      resource: { values: updateTMCFOUNDATION }
      };
    
      // Update options for TMCSENIORS
    const updateOptions_TMCSENIORS = {
      spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
      range: `TMC Seniors!A2`, // Adjust sheet name as needed
      valueInputOption: `USER_ENTERED`,
      resource: { values: updateTMCSENIORS }
      };
      
      // Update options for TMCWELLNESS
      const updateOptions_TMCWELLNESS = {
      spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
      range: `TMC Wellness!A2`, // Adjust sheet name as needed
      valueInputOption: `USER_ENTERED`,
      resource: { values: updateTMCWELLNESS }
      };
      
      // Update options for TMCWOMENCHILD
      const updateOptions_TMCWOMENCHILD = {
      spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
      range: `TMC Women & Children!A2`, // Adjust sheet name as needed
      valueInputOption: `USER_ENTERED`,
      resource: { values: updateTMCWOMENCHILD }
      };
    
      const clearSheet = async (gsapi, spreadsheetId, range) => {
        await gsapi.spreadsheets.values.clear({
            spreadsheetId,
            range,
        });
        console.log(`Cleared range ${range} in Google Sheet.`);
    };
    
    await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `TMC!A2:H`);
    await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `TMC Forms!A2:H`);
    await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `TMC Comm Outreach PRINT!A2:H`);
    await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `TMC Comm Outreach PROMO!A2:H`);
    await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `TMC Communications!A2:H`);
    await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `TMC Foundation!A2:H`);
    await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `TMC Seniors!A2:H`);
    await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `TMC Wellness!A2:H`);
    await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `TMC Women & Children!A2:H`);
        
    
    
    
     // PUSH the filtered data to the spreadsheet
          let res = await gsapi.spreadsheets.values.update(updateOptions_AllSKUS);
          let res_TMCFORMS = await gsapi.spreadsheets.values.update(updateOptions_TMCFORMS);
         let res_TMCCOMM_PRINT = await gsapi.spreadsheets.values.update(updateOptions_TMCCOMM_PRINT);
         let res_TMCCOMM_PROMO = await gsapi.spreadsheets.values.update(updateOptions_TMCCOMM_PROMO);
    
         let res_TMCCOMMUNICATIONS_PROMO = await gsapi.spreadsheets.values.update(updateOptions_TMCCOMMUNICATIONS);
        let res_TMCFOUNDATION = await gsapi.spreadsheets.values.update(updateOptions_TMCFOUNDATION);
          let res_TMCSENIORS = await gsapi.spreadsheets.values.update(updateOptions_TMCSENIORS);
          let res_TMCWELLNESS = await gsapi.spreadsheets.values.update(updateOptions_TMCWELLNESS);
          let res_TMCWOMENCHILD = await gsapi.spreadsheets.values.update(updateOptions_TMCWOMENCHILD);
          console.log('SKU data updated successfully.');


    }

    if (portalName === 'NorthwestMedicalCenter') {
      data = data.map(function (r) {
        // Extract the text after the colon using a regular expression
        let match = /Location:<\/b><\/span>(.*)/.exec(r[4]);
        let locationText = match ? match[1].trim() : ''; // Extract the matched text and trim whitespace
        return [r[2], r[3], locationText, r[11], r[12], r[15], r[16], r[18]];
      });
      data.shift();
      data.shift();
      data.shift();
      data.shift();
      data.shift();
      data.shift();
      data.shift();
      data.shift();

    
  
      const updateOptions = {
        spreadsheetId: `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`,
        range: `Northwest Medical Center!A2`,
        valueInputOption: `USER_ENTERED`,
        resource: { values: data }
      };
    
      
    
      await clearSheet(gsapi, `1H5s2gpr_tM4sWYAB_j9Tg3w1ohiUNlmmeZoQPLWpjSU`, `Northwest Medical Center!A2:H`);
      console.log('SKU data cleared from Google Sheet.');
      await gsapi.spreadsheets.values.update(updateOptions);
      console.log('SKU data updated successfully.');
    }

    //else if (portalName === 'TMC') {

  


} catch (error) {
      console.error('Error in nextSteps:', error);
    }

    

    
};
  

// Self-invoking async function
(async () => {
    // Connect to an existing instance of Chrome browser
    const wsChromeEndpointurl = keys.jsonURL;
    const browser = await puppeteer.connect({
      browserWSEndpoint: wsChromeEndpointurl,
    });
  
    // Create a new browser tab with specified specs
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
  
    // Initialize i before the loop
let portalCount = 0;
    // Iterate through the portal names and selectors
    for (const { portalName, orderSelector } of portalNamesAndSelectors) {
      console.log(`Processing portal: ${portalName}`);
  
      const clientPortal = portalName;
      const downloadPath = `${primeDirectory}sku-tracking\\${clientPortal}\\raw-data`;
      const newFilename = `${clientPortal}-SKUs.xlsx`;
      try {
        // Login to Marcom Page
        if(portalCount===0){
        await page.goto('https://admin.marcomcentral.app.pti.com/Account/LogOn?ReturnUrl=%2f', { timeout: 0 });
        await page.waitForTimeout(4000);
        await page.click(".ui-button");
        await page.waitForTimeout(4000);
        }
        // Increment portalCount after the first iteration
        portalCount++;

        await page.goto('https://admin.marcomcentral.app.pti.com/PortalInformation/List', { timeout: 0 });
        await page.waitForTimeout(4000);
        await page.click("#gs_Name");
        await page.keyboard.type(clientPortal);
        await page.waitForTimeout(4000);
        await page.click("#fbox_Grid_search");
        await page.waitForTimeout(4000);
        await page.click(".gridCell");
        await page.waitForTimeout(4000);
  
        // Login to BulkOps Page
        await page.goto('https://admin.marcomcentral.app.pti.com/BulkOps/Edit', { timeout: 0 });
  
        // Select SKU list from dropdown and filter by inventory SKUs only
        await page.waitForSelector("#SupplierInfo");
        await page.select('#BulkOperations', 'SKUs');
        await page.click("#DownloadOptions_5");
  
        // Set download behavior for the browser instance
        await page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadPath });
  
        // Download the SKU list
        await page.click("#Download");
  
        // Wait for the file to be downloaded
        console.log('Waiting for SKU data to be downloaded...');
        await page.waitForTimeout(10000);
  
        // Rename the most recent file
        console.log('Renaming the most recent SKU file...');
        await renameMostRecentFile(downloadPath, newFilename, clientPortal);
  
        // Perform additional Puppeteer steps
        //await page.goto('https://admin.marcomcentral.app.pti.com/PortalInformation/List', { timeout: 0 });
        //await page.waitForTimeout(4000);
        //await page.click("#gs_Name");
        //await page.keyboard.type("Mister");
        //await page.waitForTimeout(4000);
        //await page.click("#fbox_Grid_search");
        //await page.waitForTimeout(4000);
        //await page.click(".gridCell");
        //await page.waitForTimeout(4000);
  
      } catch (error) {
    console.error(`Error processing portal: ${portalName}`, error);
    throw error; // Re-throw to break out of the loop if needed
    
  } finally {

  }
    }
  
    console.log('All portals processed.');
  
    // Clear the cache after the loop is done
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
    // Disconnect the browser after everything is done
    //await browser.disconnect();
  
    // Exit the process
    process.exit();
  })();
  