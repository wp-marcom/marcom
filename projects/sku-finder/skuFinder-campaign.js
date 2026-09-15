const primeDirectory = "C:\\projects\\";
const ExcelJS = require(`${primeDirectory}node_modules\\exceljs`);
const path = require('path');

function reserveCampaignSkuBlocks(values, chunks, options = {}) {
    const { prefix, length, buffer = 1, maxAltPrefixes = 5 } = options;

    if (prefix === undefined || prefix === null || !length) {
        throw new Error("prefix and length are required");
    }
    for (const c of chunks) {
        if (c.neededNow > c.totalItems) {
            throw new Error(`Chunk "${c.name}": neededNow (${c.neededNow}) exceeds totalItems (${c.totalItems})`);
        }
    }

    const skuSet = new Set(
        values.map(v => parseInt(v, 10)).filter(n => !isNaN(n))
    );

    const totalSpan = chunks.reduce((sum, c) => sum + c.totalItems, 0)
        + buffer * Math.max(chunks.length - 1, 0);

    const findContiguousFreeRun = (start, end, sizeNeeded) => {
        let runStart = null;
        for (let n = start; n <= end; n++) {
            if (!skuSet.has(n)) {
                if (runStart === null) runStart = n;
                if (n - runStart + 1 === sizeNeeded) return runStart;
            } else {
                runStart = null;
            }
        }
        return null;
    };

    const rangeFor = (pfx) => {
        const start = parseInt(pfx.toString().padEnd(length, '0'), 10);
        const end = parseInt(pfx.toString().padEnd(length, '9'), 10);
        return [start, end];
    };

    const layoutFrom = (blockStart) => {
        const chunkPlan = [];
        let cursor = blockStart;
        for (const c of chunks) {
            const subStart = cursor;
            const subEnd = subStart + c.totalItems - 1;
            const skusToCreateNow = [];
            for (let i = 0; i < c.neededNow; i++) skusToCreateNow.push(subStart + i);
            chunkPlan.push({
                name: c.name,
                reservedRange: [subStart, subEnd],
                totalItems: c.totalItems,
                skusToCreateNow,
                reservedForLater: c.totalItems - c.neededNow
            });
            cursor = subEnd + 1 + buffer;
        }
        return chunkPlan;
    };

    const [searchStart, searchEnd] = rangeFor(prefix);
    const blockStart = findContiguousFreeRun(searchStart, searchEnd, totalSpan);

    if (blockStart !== null) {
        return {
            fit: true,
            prefix,
            length,
            totalSpanUsed: totalSpan,
            overallReservedRange: [blockStart, blockStart + totalSpan - 1],
            chunks: layoutFrom(blockStart),
            suggestions: []
        };
    }

    // Didn't fit at this prefix — look for alternate prefixes of the same length
    const suggestions = [];
    const rangeMin = Math.pow(10, length - 1);
    const rangeMax = Math.pow(10, length) - 1;
    const prefixLength = prefix.toString().length;
    const checked = new Set([prefix.toString()]);

    for (let p = rangeMin; p <= rangeMax; p++) {
        const candidatePrefix = p.toString().substring(0, prefixLength);
        if (checked.has(candidatePrefix)) continue;
        checked.add(candidatePrefix);

        const [candStart, candEnd] = rangeFor(candidatePrefix);
        const candBlockStart = findContiguousFreeRun(candStart, candEnd, totalSpan);
        if (candBlockStart !== null) {
            suggestions.push({ prefix: candidatePrefix, length, blockStart: candBlockStart });
            if (suggestions.length >= maxAltPrefixes) break;
        }
    }

    return {
        fit: false,
        prefix,
        length,
        totalSpanUsed: totalSpan,
        overallReservedRange: null,
        chunks: [],
        suggestions
    };
}

// ============================================================
// CONFIG — edit this section per campaign, then just run:
//   node skuFinder-v3.js
// ============================================================

const skuPrefix = 14;    // leading digit(s) SKUs should start with
const skuLength = 5;    // total digit length of each SKU
const skuBuffer = 0;    // digits reserved between chunk blocks

// One entry per chunk, IN THE ORDER you want them laid out on the number line.
// totalItems = that chunk's worst case (all product types in the chunk).
// neededNow  = how many of those currently have inventory requested.
const chunks = [
    { name: 'A',   totalItems: 7, neededNow: 6 },
];

// Existing SKUs already in use (paste your live export in here)
const values = [12008, 8005, 11003, 11005, 14000, 14001, 14006, 11014, 10012, 14026, 12021, 14023, 11258, 11259, 4000, 5002, 14016, 1010, 21002, 3006, 11023, 11025, 11024, 5011, 5012, 5013, 5014, 5015, 5016, 5019, 5020, 5021, 10032, 900, 801, 501, 502, 40071, 14022, 504, 3004, 11240, 11250, 11246, 11067, 11120, 11130, 11135, 11136, 11140, 11141, 11147, 11152, 11156, 11158, 11159, 11160, 11161, 11162, 11163, "11165OLD", 11170, 11197, 11198, 11200, 11201, 5018, 5017, 11212, 11213, 11020, 11238, 4008, 11285, 11286, 11294, 11143, 111312, 111455, 111453, 111451, 111449, 111447, 111467, 111341, 111470, 16022, 111490, 111494, 111496, 11179, 11174, 111552, 111567, 21012, 21007, 40010, "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Digital-Board-Get-Ready-to-Shine-160x80.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Get Ready to Shine<br><span class=\"choice\">Choose reader size:</span>", "Get Ready To Shine", "Mister Car Wash - White", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Mister-Car-Wash-White-160x80-02.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Mister Car Wash w/White<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Mister-Car-Wash-Blue-160x80-03.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Mister Car Wash w/Blue<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Digital-Board-Now-Open-160x80.jpg\" alt=\"Smiley face\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Now Open<br><span class=\"choice\">Choose reader size:</span>", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/UWC-Blue-160x80-05.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">UWC w/Blue<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/UWC-White-160x80-06.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">UWC w/White<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Now-Hiring-160x80-01.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Now Hiring<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Express-Wash-Hours-Digital-160x80.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Express Wash Hours<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/FreeVacuums-Digital-160x80.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Free Vacuums<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/FreeVacuums-24x112.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Free Vacuums<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/GetReadytoShine-24x112.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Get Ready to Shine<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/UWC-24x112.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">UWC<br><span class=\"choice\">Choose reader size:", 111590, 111600, 111620, 111645, 111660, 11022, 11220, 11199, 4013, 111547, 111315, 11214, 111471, 11151, 4010, 4014, 12035, 11282, 111612, 111583, 7000, 12001, "11184A", "11184B", "11184C", "11184D", "11184E", "11182A", "11182B", 11289, 111611, 111613, 111505, 111679, 1029, 17000, 17002, 17008, 17010, 111584, 11066, 1003, 1002, 111614, 1028, 111677, 111669, 111671, 11122, 12032, 20998, 1418, 1072, 1073, 8012, 11026, 4018, 111673, 111675, 11052, 11068, 11069, 111503, 19000, 19004, 19006, 11091, 11092, 11093, 11094, 11095, 11096, 11097, 1074, 1026, 11009, 9009, 13000, 19010, 9008, 12011, 12013, 1030, 2436, 2228, 2024, 1015, 1016, 1017, 500, 6000, 6002, 6004, 6006, 6008, 11070, 11215, "11090P", 111610, 111627, 111626, 510, 512, 520, 3002, 526, 528, 30004, 30000, 30002, 1040, 1042, 1824, 5042, 5043, 1044, 1046, 700, 704, 702, 706, 524, 525, 527, 6012, 6014, 2026, 2030, 2028, 2029, 9992, 509, 9395, 30008, 111512, 5010, 111340, 11071, 5008, 30007, 111657, 21064, 11176, 11177, 11168, 10002, 1041, 1043, 12015, 1023, 11178, 624, 40031, 11169, 5004, 5006, 626, 1018, 19012, 19014, 19016, 19018, 19020, 19022, 19024, 19026, 31012, 31014, 31016, 31018, 31020, 31022, 31024, 31026, 18996, 18998, 11308, 12016, 11006, 11008, 530, 532, 21001, 21003, "9396-12", "9396-13", "9396-14", "9396-15", 4023, 11018, 11011, 26018, 9202, 9204, 4024, 6005, 4005, 4006, 111592, 21256, 17006, 17007, 1200, 1202, 1204, 1206, 21258, 21260, 21262, 4004, 12022, 12026, 2501, 20000, 11019, 12024, 438, 440, 442, 444, 446, 448, 450, 452, 454, 456, 458, 460, 462, 464, 466, 468, 470, 472, 11145, 11149, 1000, 1001, 5302, 499, 1022, 111448, 111781, 50101, 50102, 111343, 111450, 111446, 497, 534, 536, 538, 540, 10008, 10010, 542, 550, 544, 546, 548, 552, 554, 556, 11302, 11146, 4027, 21073, 810, 439, 449, 101, 11051, 11013, 519, 7003, 200, 11293, 12031, 2503, 111554, 602, 4028, 2010, 7008, 7010, 531, 533, 535, 537, 539, 102, 11157, 11144, 549, 551, 553, 555, 12007, 21014, 21016, 541, 543, 545, 547, 202, 2001, 2003, 10003, 1201, 1203, 1205, 1207, 7005, 7007, 7009, 7011, 20999, 215, 217, 111801, 111803, 111805, 627, 111791, 111800, 111807, 111799, 111501, 111502, 111504, 199, 201, 203, 437, 19001, "16015.T1", 529, 15004, 1208, 111854, 111856, 111858, 111860, 111870, 111872, 111874, 6999, 7001, "16020.T1", "16020.T2", "16020.T3", "16015.T2", "16015.T3", "16017.T1", "16017.T2", "16017.T3", "16019.T1", "16019.T2", "16019.T3", "UWC - 112x24", "UWCALSO", 111454, "4015A", 11217, 111862, 111864, 111866, 111868, 111876, 111878, 111880, 111882, 111884, 111886, 111888, 20996, 40072, 14007, "Ahead Arrow w/ Logo", "Left/Right Arrow", "Mister Logo At Bottom", "Mister Logo At Top", "No Logo", "Ahead Arrow", "Left/Right Arrow", "U-Turn", "Dark Blue - Oracal 751", "Telegrey - Oracal 751", "White - Oracal 751", "Dark Blue - Oracal 751", "Telegrey - Oracal 751", "White - Oracal 751", "Dark Blue - Oracal 751", "Telegrey - Oracal 751", "White - Oracal 751", "$10", "$8", "4015B", "4015C", "531S", 7012, 17003, 17012, 17014, 17015, 12000, "20999A", "20999B", "20999C", "20999D", 111604, 11098, 103, 105, 107, 109, 111, 113, 115, 117, 119, "11216C", "11216P", 21011, 111601, 5292, 14006, 40071, 1015, 1016, 1017, 1018, 21001, 21003, "11120-I", 11154, 111704, 1142, 1146, 1148, 1150, 1152, 21075, 1160, 1120, 1180, 1162, 1102, 1122, 1182, 1164, 1104, 1124, 1184, 1166, 1106, 1186, 1168, 1108, 1128, 1188, 1170, 1110, 1130, 1190, 1172, 1112, 1132, 1192, 1126, 9035, "12015P", "12016P", 11054, 11336, 515, 1230, 1250, 1153, 1173, 1113, 1133, 1193, 1286, 1266, 1280, 1260, 1240, 1241, 1220, 1226, 1222, 1246, 1242, 1282, 1262, 1228, 1224, 1248, 1244, 1284, 1264, 1303, 1140, 1100, 1149, 1151, 1109, 1111, 1144, 1104, 1154, 1114, 11137, 2015, 2017, 2017, 2011, 2013, 2005, 2007, 2009, 11303, 211454, 211451, 1500, 2020, 2022, 1103, 1143, 11134, 7006, 11018, 11171, 14001, 165, 167, 169, 4022, 111507, 3000, 11181, 2100, 2124, 2148, 2164, 2118, 2142, 2158, 2182, 2112, 2114, 2116, 2136, 2138, 2140, 2156, 2176, 2178, 2180, 2106, 2108, 2110, 2130, 2132, 2134, 2154, 2170, 2172, 2174, 2104, 2128, 2152, 2168, 2102, 2126, 2150, 2166, 12003, 20004, 2021, 2023, 21050, 21053, 11247, 6020, 6022, 6024, 6026, 6028, 6030, 6032, 6034, 6036, 6038, 6040, 6042, 6044, 6046, 6048, 6050, 6052, 6054, 6056, 6058, 6060, 2155, 2192, 2196, 2165, 2149, 2101, 2125, "111341SP", "111340SP", "14001SP", 2183, 2119, 2143, 2159, 2121, 2145, 2161, 2185, 6062, 800, 802, 6064, 6066, 1300, 18999, 111500, 111602, 11242, 11191, 19008];

// Output .xlsx file — one row per reserved SKU number, in chunk/number order,
// ready to copy/paste into your product name builder file.
const outputFile = 'campaign-sku-plan-3buffer.xlsx';

async function writeExcel(result) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('SKU Plan');

    sheet.columns = [
        { header: 'Chunk', key: 'chunk', width: 10 },
        { header: 'SKU', key: 'sku', width: 12 },
        { header: 'Status', key: 'status', width: 18 }
    ];
    sheet.getRow(1).font = { bold: true };

    for (const c of result.chunks) {
        const createNowSet = new Set(c.skusToCreateNow);
        for (let sku = c.reservedRange[0]; sku <= c.reservedRange[1]; sku++) {
            sheet.addRow({
                chunk: c.name,
                sku,
                status: createNowSet.has(sku) ? 'Create Now' : 'Reserved for Later'
            });
        }
    }

    const outPath = path.join(__dirname, outputFile);
    await workbook.xlsx.writeFile(outPath);
    console.log(`\nExcel file written: ${outPath}`);
}

// ============================================================
// RUN
// ============================================================

const result = reserveCampaignSkuBlocks(values, chunks, {
    prefix: skuPrefix,
    length: skuLength,
    buffer: skuBuffer
});

if (result.fit) {
    console.log(`Reserved range for full campaign: ${result.overallReservedRange[0]}–${result.overallReservedRange[1]} (${result.totalSpanUsed} numbers)\n`);
    result.chunks.forEach(c => {
        console.log(`Chunk ${c.name} — reserved ${c.reservedRange[0]}–${c.reservedRange[1]} (${c.totalItems} total)`);
        if (c.skusToCreateNow.length > 0) {
            console.log(`  Create now: ${c.skusToCreateNow.join(', ')}`);
        } else {
            console.log(`  Create now: none yet`);
        }
        if (c.reservedForLater > 0) {
            console.log(`  Reserved for later: ${c.reservedForLater} slot(s)`);
        }
        console.log('');
    });
    writeExcel(result).catch(err => console.error('Failed to write Excel file:', err));
} else {
    console.log(`No contiguous run of ${result.totalSpanUsed} free numbers found at prefix "${skuPrefix}", length ${skuLength}.`);
    if (result.suggestions.length > 0) {
        console.log("\nTry one of these prefixes instead (same digit length):");
        result.suggestions.forEach(s => {
            console.log(`  prefix "${s.prefix}" — free block starts at ${s.blockStart}`);
        });
    } else {
        console.log("No suggestions found at this digit length either — try a different length.");
    }
}
