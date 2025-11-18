
// Define the primeDirectory variable for file paths
const primeDirectory = "C:\\projects\\";

// Import ExcelJS module
const Excel = require(`${primeDirectory}node_modules\\exceljs`);

const fs = require('fs');

// Your updated function
function splitRange(rangeStart, rangeEnd, numIntervals) {
    const totalCards = (rangeEnd - rangeStart + 1);
    const intervalSize = Math.floor(totalCards / numIntervals);
    const intervals = [];

    for (let i = 0; i < numIntervals; i++) {
        const start = rangeStart + i * intervalSize;
        let end = start + intervalSize - 1;

        // Ensure last interval ends at exact rangeEnd
        if (i === numIntervals - 1) {
            end = rangeEnd;
        }

        intervals.push(`${start}-${end}`);
    }

    return intervals;
}

// Parameters
const firstCardNum = 617975;
const lastCardNum = 620474;
const howManyPacks = 100;

// Create workbook and worksheet
const workbook = new Excel.Workbook();
const worksheet = workbook.addWorksheet('Card Packs');

// Add header row
worksheet.addRow(['Card Range']);

// Add the intervals
const intervals = splitRange(firstCardNum, lastCardNum, howManyPacks);
intervals.forEach(interval => {
    worksheet.addRow([interval]);
});

// Save to file
//const outputPath = './card_packs.xlsx';
const outputPath = __dirname + `\\processedSequences\\card_packs.xlsx`;
workbook.xlsx.writeFile(outputPath)
    .then(() => {
        console.log(`Excel file saved to ${outputPath}`);
    })
    .catch(err => {
        console.error('Error writing Excel file:', err);
    });