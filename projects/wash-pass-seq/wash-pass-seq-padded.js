
// Define the primeDirectory variable for file paths
const primeDirectory = "C:\\projects\\";

// Import ExcelJS module
const Excel = require(`${primeDirectory}node_modules\\exceljs`);

const fs = require('fs');

const totalDigits = 6; // how many total digits needed will add leading zeros to each to reach this number

// Your updated function with leading zeros
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
        
        // Add leading zeros using padStart()
        const paddedStart = start.toString().padStart(totalDigits, '0');
        const paddedEnd = end.toString().padStart(totalDigits, '0');
        
        intervals.push(`${paddedStart}-${paddedEnd}`);
    }
    
    return intervals;
}

// Parameters
const firstCardNum = 25001;
const lastCardNum = 40000;
const howManyPacks = 600;

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
//const outputPath = './card_packs_padded.xlsx';
const outputPath = __dirname + `\\processedSequences\\card_packs_padded.xlsx`;
workbook.xlsx.writeFile(outputPath)
    .then(() => {
        console.log(`Excel file saved to ${outputPath}`);
    })
    .catch(err => {
        console.error('Error writing Excel file:', err);
    });