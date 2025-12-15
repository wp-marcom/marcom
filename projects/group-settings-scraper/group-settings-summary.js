// This thing takes HTML files that have been generated from the group-setting-scraper.js script and summarizes them to compare settings

const primeDirectory = "C:\\projects\\";
const fs = require('fs');
const path = require('path');
//const ExcelJS = require('exceljs');
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);

// The specific clientPortal value you want to search for
const targetClientPortal = "westpressmarketingpromo";

// Directory where individual HTML files are stored
//const outputDir = __dirname;
const outputDir = `${__dirname}/${targetClientPortal}`; // Creates subfolder with clientPortal name



// Function to read and parse HTML files
const parseSettingsFromHtml = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const settings = [];

  // Debugging output: Check the content of the file
 // console.log(`--- Content of ${filePath} ---\n${content}\n--- End of Content ---`);

  // Regex to match setting name and value
  const regex = /<tr>\s*<td>([^<]+)<\/td>\s*<td>([^<]*)<\/td>\s*<\/tr>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    settings.push({
      settingName: match[1].trim(),
      value: match[2].trim()
    });
  }

  return settings;
};

// Gather all settings from each HTML file
const aggregateSettings = () => {
  const settingsMap = new Map();

  // Read all files in the directory
  const files = fs.readdirSync(outputDir).filter(file => file.endsWith('settings-table.html'));

  files.forEach(file => {
    if (file.includes(targetClientPortal)) {
      const filePath = path.join(outputDir, file);
      const settings = parseSettingsFromHtml(filePath);

      settings.forEach(({ settingName, value }) => {
        if (!settingsMap.has(settingName)) {
          settingsMap.set(settingName, new Map());
        }
        settingsMap.get(settingName).set(file, value);
      });
    }
  });

  return settingsMap;
};

// Generate the Excel file
const generateExcelFile = (settingsMap) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Settings');

  // Determine all unique groups and settings
  const groups = Array.from(settingsMap.values()).reduce((acc, groupMap) => {
    return [...new Set([...acc, ...groupMap.keys()])];
  }, []);
  
  const settings = Array.from(settingsMap.keys());

  // Add column titles
  worksheet.columns = [
    { header: 'Group', key: 'group', width: 30 },
    ...settings.map(setting => ({ header: setting, key: setting, width: 30 }))
  ];

  // Populate worksheet with data
  groups.forEach(group => {
    const row = { group };
    settings.forEach(setting => {
      row[setting] = settingsMap.get(setting)?.get(group) || '';
    });
    worksheet.addRow(row);
  });

  const outputFileName = path.join(outputDir, `${targetClientPortal}_group_settings_summary.xlsx`);
  return workbook.xlsx.writeFile(outputFileName).then(() => {
    console.log(`Excel file '${outputFileName}' has been created successfully.`);
  }).catch(error => {
    console.error('Error writing Excel file:', error);
  });
};

// Main script execution
(async () => {
  const settingsMap = aggregateSettings();
  await generateExcelFile(settingsMap);
})();
