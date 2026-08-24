function findAvailableSkuSets(values, skuQtyNeeded, maxSets = 5, options = {}) {
    const { prefix = null, length = null } = options;

    const existingSkus = values
        .map(v => parseInt(v, 10))
        .filter(n => !isNaN(n));

    if (existingSkus.length === 0) return { sets: [], suggestions: [] };

    const skuSet = new Set(existingSkus);

    // Determine search bounds
    let searchStart, searchEnd;

    if (prefix !== null && length !== null) {
        // e.g. prefix "3", length 4 → 3000 to 3999
        searchStart = parseInt(prefix.toString().padEnd(length, '0'), 10);
        searchEnd = parseInt(prefix.toString().padEnd(length, '9'), 10);
    } else {
        // Original behavior: search from min to max + buffer
        const minSku = Math.min(...existingSkus);
        const maxSku = Math.max(...existingSkus);
        searchStart = minSku;
        searchEnd = maxSku + ((skuQtyNeeded - 1) * 2);
    }

    const findSetsInRange = (start, end) => {
        const found = [];
        for (let s = start; s <= end; s++) {
            const sequence = [];
            let current = s;
            for (let i = 0; i < skuQtyNeeded; i++) {
                if (current > end) break; // don't spill outside range
                if (!skuSet.has(current)) {
                    sequence.push(current);
                    current += 1;
                } else {
                    break;
                }
            }
            if (sequence.length === skuQtyNeeded) {
                found.push(sequence);
            }
        }
        return found;
    };

    const sets = findSetsInRange(searchStart, searchEnd);

    // If we found enough, return them
    if (sets.length > 0) {
        return {
            sets: sets.slice(0, maxSets),
            suggestions: []
        };
    }

    // Nothing found — suggest other prefixes of the same length
    const suggestions = [];

    if (prefix !== null && length !== null) {
        // Find all possible prefixes of the same length that have viable sets
        // First digit(s) can vary, but length stays the same
        const rangeMin = Math.pow(10, length - 1); // e.g. 1000 for length 4
        const rangeMax = Math.pow(10, length) - 1; // e.g. 9999 for length 4

        // Group by first digit (or first two digits if length is long)
        // to keep suggestions meaningful
        const prefixLength = prefix.toString().length;
        const checkedPrefixes = new Set([prefix.toString()]);

        for (let p = rangeMin; p <= rangeMax; p++) {
            const candidatePrefix = p.toString().substring(0, prefixLength);
            if (checkedPrefixes.has(candidatePrefix)) continue;
            checkedPrefixes.add(candidatePrefix);

            const candStart = parseInt(candidatePrefix.padEnd(length, '0'), 10);
            const candEnd = parseInt(candidatePrefix.padEnd(length, '9'), 10);
            const candSets = findSetsInRange(candStart, candEnd);

            if (candSets.length > 0) {
                suggestions.push({
                    prefix: candidatePrefix,
                    length,
                    availableSets: candSets.length,
                    example: candSets[0]
                });
            }

            if (suggestions.length >= 5) break;
        }
    }

    return { sets: [], suggestions };
}

// Example usage with your data


const values = [12008, 8005, 11003, 11005, 14000, 14001, 14006, 11014, 10012, 14026, 12021, 14023, 11258, 11259, 4000, 5002, 14016, 1010, 21002, 3006, 11023, 11025, 11024, 5011, 5012, 5013, 5014, 5015, 5016, 5019, 5020, 5021, 10032, 900, 801, 501, 502, 40071, 14022, 504, 3004, 11240, 11250, 11246, 11067, 11120, 11130, 11135, 11136, 11140, 11141, 11147, 11152, 11156, 11158, 11159, 11160, 11161, 11162, 11163, "11165OLD", 11170, 11197, 11198, 11200, 11201, 5018, 5017, 11212, 11213, 11020, 11238, 4008, 11285, 11286, 11294, 11143, 111312, 111455, 111453, 111451, 111449, 111447, 111467, 111341, 111470, 16022, 111490, 111494, 111496, 11179, 11174, 111552, 111567, 21012, 21007, 40010, "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Digital-Board-Get-Ready-to-Shine-160x80.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Get Ready to Shine<br><span class=\"choice\">Choose reader size:</span>", "Get Ready To Shine", "Mister Car Wash - White", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Mister-Car-Wash-White-160x80-02.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Mister Car Wash w/White<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Mister-Car-Wash-Blue-160x80-03.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Mister Car Wash w/Blue<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Digital-Board-Now-Open-160x80.jpg\" alt=\"Smiley face\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Now Open<br><span class=\"choice\">Choose reader size:</span>", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/UWC-Blue-160x80-05.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">UWC w/Blue<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/UWC-White-160x80-06.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">UWC w/White<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Now-Hiring-160x80-01.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Now Hiring<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Express-Wash-Hours-Digital-160x80.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Express Wash Hours<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/FreeVacuums-Digital-160x80.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Free Vacuums<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/FreeVacuums-24x112.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Free Vacuums<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/GetReadytoShine-24x112.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Get Ready to Shine<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/UWC-24x112.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">UWC<br><span class=\"choice\">Choose reader size:", 111590, 111600, 111620, 111645, 111660, 11022, 11220, 11199, 4013, 111547, 111315, 11214, 111471, 11151, 4010, 4014, 12035, 11282, 111612, 111583, 7000, 12001, "11184A", "11184B", "11184C", "11184D", "11184E", "11182A", "11182B", 11289, 111611, 111613, 111505, 111679, 1029, 17000, 17002, 17008, 17010, 111584, 11066, 1003, 1002, 111614, 1028, 111677, 111669, 111671, 11122, 12032, 20998, 1418, 1072, 1073, 8012, 11026, 4018, 111673, 111675, 11052, 11068, 11069, 111503, 19000, 19004, 19006, 11091, 11092, 11093, 11094, 11095, 11096, 11097, 1074, 1026, 11009, 9009, 13000, 19010, 9008, 12011, 12013, 1030, 2436, 2228, 2024, 1015, 1016, 1017, 500, 6000, 6002, 6004, 6006, 6008, 11070, 11215, "11090P", 111610, 111627, 111626, 510, 512, 520, 3002, 526, 528, 30004, 30000, 30002, 1040, 1042, 1824, 5042, 5043, 1044, 1046, 700, 704, 702, 706, 524, 525, 527, 6012, 6014, 2026, 2030, 2028, 2029, 9992, 509, 9395, 30008, 111512, 5010, 111340, 11071, 5008, 30007, 111657, 21064, 11176, 11177, 11168, 10002, 1041, 1043, 12015, 1023, 11178, 624, 40031, 11169, 5004, 5006, 626, 1018, 19012, 19014, 19016, 19018, 19020, 19022, 19024, 19026, 31012, 31014, 31016, 31018, 31020, 31022, 31024, 31026, 18996, 18998, 11308, 12016, 11006, 11008, 530, 532, 21001, 21003, "9396-12", "9396-13", "9396-14", "9396-15", 4023, 11018, 11011, 26018, 9202, 9204, 4024, 6005, 4005, 4006, 111592, 21256, 17006, 17007, 1200, 1202, 1204, 1206, 21258, 21260, 21262, 4004, 12022, 12026, 2501, 20000, 11019, 12024, 438, 440, 442, 444, 446, 448, 450, 452, 454, 456, 458, 460, 462, 464, 466, 468, 470, 472, 11145, 11149, 1000, 1001, 5302, 499, 1022, 111448, 111781, 50101, 50102, 111343, 111450, 111446, 497, 534, 536, 538, 540, 10008, 10010, 542, 550, 544, 546, 548, 552, 554, 556, 11302, 11146, 4027, 21073, 810, 439, 449, 101, 11051, 11013, 519, 7003, 200, 11293, 12031, 2503, 111554, 602, 4028, 2010, 7008, 7010, 531, 533, 535, 537, 539, 102, 11157, 11144, 549, 551, 553, 555, 12007, 21014, 21016, 541, 543, 545, 547, 202, 2001, 2003, 10003, 1201, 1203, 1205, 1207, 7005, 7007, 7009, 7011, 20999, 215, 217, 111801, 111803, 111805, 627, 111791, 111800, 111807, 111799, 111501, 111502, 111504, 199, 201, 203, 437, 19001, "16015.T1", 529, 15004, 1208, 111854, 111856, 111858, 111860, 111870, 111872, 111874, 6999, 7001, "16020.T1", "16020.T2", "16020.T3", "16015.T2", "16015.T3", "16017.T1", "16017.T2", "16017.T3", "16019.T1", "16019.T2", "16019.T3", "UWC - 112x24", "UWCALSO", 111454, "4015A", 11217, 111862, 111864, 111866, 111868, 111876, 111878, 111880, 111882, 111884, 111886, 111888, 20996, 40072, 14007, "Ahead Arrow w/ Logo", "Left/Right Arrow", "Mister Logo At Bottom", "Mister Logo At Top", "No Logo", "Ahead Arrow", "Left/Right Arrow", "U-Turn", "Dark Blue - Oracal 751", "Telegrey - Oracal 751", "White - Oracal 751", "Dark Blue - Oracal 751", "Telegrey - Oracal 751", "White - Oracal 751", "Dark Blue - Oracal 751", "Telegrey - Oracal 751", "White - Oracal 751", "$10", "$8", "4015B", "4015C", "531S", 7012, 17003, 17012, 17014, 17015, 12000, "20999A", "20999B", "20999C", "20999D", 111604, 11098, 103, 105, 107, 109, 111, 113, 115, 117, 119, "11216C", "11216P", 21011, 111601, 5292, 14006, 40071, 1015, 1016, 1017, 1018, 21001, 21003, "11120-I", 11154, 111704, 1142, 1146, 1148, 1150, 1152, 21075, 1160, 1120, 1180, 1162, 1102, 1122, 1182, 1164, 1104, 1124, 1184, 1166, 1106, 1186, 1168, 1108, 1128, 1188, 1170, 1110, 1130, 1190, 1172, 1112, 1132, 1192, 1126, 9035, "12015P", "12016P", 11054, 11336, 515, 1230, 1250, 1153, 1173, 1113, 1133, 1193, 1286, 1266, 1280, 1260, 1240, 1241, 1220, 1226, 1222, 1246, 1242, 1282, 1262, 1228, 1224, 1248, 1244, 1284, 1264, 1303, 1140, 1100, 1149, 1151, 1109, 1111, 1144, 1104, 1154, 1114, 11137, 2015, 2017, 2017, 2011, 2013, 2005, 2007, 2009, 11303, 211454, 211451, 1500, 2020, 2022, 1103, 1143, 11134, 7006, 11018, 11171, 14001, 165, 167, 169, 4022, 111507, 3000, 11181, 2100, 2124, 2148, 2164, 2118, 2142, 2158, 2182, 2112, 2114, 2116, 2136, 2138, 2140, 2156, 2176, 2178, 2180, 2106, 2108, 2110, 2130, 2132, 2134, 2154, 2170, 2172, 2174, 2104, 2128, 2152, 2168, 2102, 2126, 2150, 2166, 12003, 20004, 2021, 2023, 21050, 21053, 11247, 6020, 6022, 6024, 6026, 6028, 6030, 6032, 6034, 6036, 6038, 6040, 6042, 6044, 6046, 6048, 6050, 6052, 6054, 6056, 6058, 6060, 2155, 2192, 2196, 2165, 2149, 2101, 2125, "111341SP", "111340SP", "14001SP", 2183, 2119, 2143, 2159, 2121, 2145, 2161, 2185, 6062, 800, 802, 6064, 6066, 1300, 18999, 111500, 111602, 11242, 11191, 19008]
const skuQtyNeeded = 83;// How many SKUS
const skuPrefix = 1;// What digit should they start with
const skuLength = 4;// How long should the SKUs be 5 digits etc
const result = findAvailableSkuSets(values, skuQtyNeeded, 10, { prefix: skuPrefix, length: skuLength });

if (result.sets.length > 0) {
    console.log(`Found ${result.sets.length} valid sets:`);
    result.sets.forEach((set, i) => {
        console.log(`Set ${i + 1}: ${set.join(', ')}`);
    });
} else {
    console.log("No sets found in that range.");
    if (result.suggestions.length > 0) {
        console.log("\nTry one of these instead (same digit length):");
        result.suggestions.forEach(s => {
            console.log(`  prefix "${s.prefix}", length ${s.length} — ${s.availableSets} set(s) available, e.g. ${s.example.join(', ')}`);
        });
    } else {
        console.log("No suggestions found at this digit length either.");
    }
}