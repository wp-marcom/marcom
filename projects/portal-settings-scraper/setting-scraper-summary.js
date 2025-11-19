const fs = require('fs');
const path = require('path');

// Directory where individual HTML files are stored
const outputDir = __dirname;

// Function to read and parse HTML files
const parseSettingsFromHtml = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const settings = [];

  // Use regex to extract settings (from first column)
  const regex = /<td>([^<]+)<\/td>\s*<td>[^<]*<\/td>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    settings.push(match[1].trim());
  }

  return settings;
};

// Gather all settings from each HTML file
const aggregateSettings = () => {
  const settingsMap = new Map();
  const portalsSet = new Set();

  // Read all files in the directory
  const files = fs.readdirSync(outputDir).filter(file => file.endsWith('-settings.html'));

  files.forEach(file => {
    const clientPortal = path.basename(file, '-settings.html');
    portalsSet.add(clientPortal);  // Add portal to the set
    const filePath = path.join(outputDir, file);
    const settings = parseSettingsFromHtml(filePath);

    settings.forEach(setting => {
      if (!settingsMap.has(setting)) {
        settingsMap.set(setting, new Set());  // Use a Set to avoid duplicate entries
      }
      settingsMap.get(setting).add(clientPortal);
    });
  });

  return { settingsMap, totalPortals: portalsSet, allPortals: Array.from(portalsSet) };
};

// Generate the final summary HTML file
const generateSummaryHtml = ({ settingsMap, totalPortals, allPortals }) => {
  let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Summary of Settings</title>
  <style>
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid black; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Summary of Settings</h1>
  <table>
    <tr>
      <th>Setting</th>
      <th>Portals</th>
      <th>Excluded Portals</th>
    </tr>
  `;

  settingsMap.forEach((portalsSet, setting) => {
    const portalsArray = Array.from(portalsSet);
    const excludedPortals = allPortals.filter(portal => !portalsSet.has(portal));

    // Correct comparison to check if all portals have this setting
    const portalsText = portalsArray.length === totalPortals.size ? 'All Portals' : portalsArray.join(', ');
    const excludedText = excludedPortals.length > 0 ? excludedPortals.join(', ') : 'None';

    htmlContent += `
      <tr>
        <td>${setting}</td>
        <td>${portalsText}</td>
        <td>${excludedText}</td>
      </tr>
    `;
  });

  htmlContent += `
  </table>
</body>
</html>
  `;

  // Write the HTML content to a file
  fs.writeFileSync(path.join(outputDir, 'summary-of-settings.html'), htmlContent, 'utf8');
  console.log('Summary HTML file has been created.');
};

// Main script execution
(async () => {
  const { settingsMap, totalPortals, allPortals } = aggregateSettings();
  generateSummaryHtml({ settingsMap, totalPortals, allPortals });
})();
