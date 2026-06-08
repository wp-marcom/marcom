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
                    current += 2;
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


const values = [101, 102, 103, 105, 107, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 122, 165, 167, 169, 199, 200, 201, 202, 203, 215, 217, 405, 437, 438, 439, 440, 441, 442, 444, 446, 448, 449, 450, 452, 454, 456, 458, 460, 462, 464, 466, 468, 470, 472, 497, 499, 500, 501, 502, 503, 504, 508, 509, 510, 512, 515, 519, 520, 521, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 602, 623, 624, 625, 626, 627, 700, 702, 704, 706, 801, 810, 900, 904, 1000, 1001, 1002, 1003, 1010, 1015, 1016, 1017, 1018, 1022, 1023, 1025, 1026, 1027, 1028, 1029, 1030, 1039, 1040, 1041, 1042, 1043, 1044, 1046, 1072, 1073, 1074, 1098, 1100, 1102, 1103, 1104, 1106, 1108, 1109, 1110, 1111, 1112, 1113, 1114, 1120, 1122, 1124, 1126, 1128, 1130, 1132, 1133, 1140, 1142, 1143, 1144, 1146, 1148, 1149, 1150, 1151, 1152, 1153, 1154, 1160, 1162, 1164, 1166, 1168, 1170, 1172, 1173, 1180, 1182, 1184, 1186, 1188, 1190, 1192, 1193, 1200, 1201, 1202, 1203, 1204, 1205, 1206, 1207, 1208, 1220, 1222, 1224, 1226, 1228, 1230, 1240, 1241, 1242, 1244, 1246, 1248, 1250, 1260, 1262, 1264, 1266, 1280, 1282, 1284, 1286, 1303, 1418, 1498, 1500, 1502, 1625, 1824, 2001, 2003, 2005, 2007, 2009, 2010, 2011, 2013, 2015, 2017, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2100, 2102, 2104, 2106, 2108, 2110, 2112, 2114, 2116, 2118, 2124, 2126, 2128, 2130, 2132, 2134, 2136, 2138, 2140, 2142, 2148, 2150, 2152, 2154, 2156, 2158, 2164, 2166, 2168, 2170, 2172, 2174, 2176, 2178, 2180, 2182, 2228, 2436, 2501, 2503, 3002, 3004, 3005, 3006, 4000, 4002, 4004, 4005, 4006, 4008, 4010, 4012, 4013, 4014, 4018, 4022, 4023, 4024, 4025, 4027, 4028, 5002, 5004, 5006, 5008, 5010, 5011, 5012, 5013, 5014, 5015, 5016, 5017, 5018, 5019, 5020, 5021, 5031, 5042, 5043, 5292, 5302, 6000, 6002, 6004, 6005, 6006, 6008, 6012, 6014, 6999, 7000, 7001, 7003, 7005, 7006, 7007, 7008, 7009, 7010, 7011, 7012, 7013, 7015, 7997, 7999, 8000, 8001, 8002, 8003, 8004, 8005, 8008, 8012, 8016, 9002, 9008, 9009, 9019, 9020, 9027, 9028, 9035, 9202, 9204, 9395, 9400, 9500, 10002, 10003, 10008, 10010, 10012, 10032, 11003, 11005, 11006, 11008, 11009, 11011, 11013, 11014, 11018, 11019, 11020, 11022, 11023, 11024, 11025, 11026, 11050, 11051, 11052, 11053, 11054, 11066, 11067, 11068, 11069, 11070, 11071, 11091, 11092, 11093, 11094, 11095, 11096, 11097, 11098, 11120, 11122, 11130, 11134, 11136, 11137, 11140, 11141, 11143, 11144, 11145, 11146, 11148, 11149, 11151, 11152, 11154, 11156, 11157, 11158, 11159, 11160, 11161, 11162, 11163, 11168, 11169, 11170, 11171, 11174, 11176, 11177, 11178, 11179, 11181, 11191, 11197, 11198, 11199, 11200, 11201, 11212, 11213, 11214, 11215, 11217, 11220, 11238, 11240, 11242, 11246, 11247, 11250, 11258, 11282, 11285, 11286, 11289, 11293, 11294, 11295, 11302, 11303, 11305, 11306, 11308, 11335, 11336, 12000, 12001, 12002, 12003, 12007, 12008, 12011, 12012, 12013, 12014, 12015, 12016, 12021, 12022, 12024, 12026, 12031, 12032, 12036, 13000, 14000, 14001, 14002, 14003, 14005, 14006, 14007, 14016, 14021, 14022, 14023, 14026, 15004, 16022, 17000, 17002, 17003, 17006, 17007, 17008, 17010, 17012, 17014, 17015, 18996, 18998, 18999, 19000, 19001, 19004, 19006, 19008, 19010, 19012, 19014, 19016, 19018, 19020, 19022, 19024, 19026, 20000, 20004, 20996, 20998, 20999, 21001, 21002, 21003, 21007, 21011, 21012, 21014, 21016, 21050, 21053, 21064, 21073, 21075, 21256, 21258, 21260, 21262, 21305, 21306, 21307, 21308, 21310, 23056, 23058, 23060, 23062, 23064, 26018, 30000, 30002, 30004, 30007, 30008, 31012, 31014, 31016, 31018, 31020, 31022, 31024, 31026, 40010, 40031, 40071, 40072, 50101, 50102, 111312, 111315, 111335, 111336, 111337, 111340, 111341, 111343, 111444, 111445, 111446, 111447, 111448, 111449, 111450, 111451, 111452, 111453, 111454, 111455, 111465, 111467, 111470, 111471, 111490, 111494, 111496, 111500, 111501, 111502, 111503, 111504, 111505, 111507, 111512, 111547, 111548, 111552, 111554, 111567, 111583, 111584, 111586, 111586, 111586, 111590, 111592, 111600, 111601, 111602, 111604, 111610, 111611, 111612, 111613, 111614, 111620, 111626, 111627, 111645, 111657, 111660, 111669, 111671, 111673, 111675, 111677, 111679, 111704, 111781, 111787, 111789, 111791, 111793, 111795, 111797, 111799, 111800, 111801, 111803, 111805, 111807, 111851, 111854, 111856, 111858, 111860, 111862, 111864, 111866, 111868, 111870, 111872, 111874, 111876, 111878, 111880, 111882, 111884, 111886, 111888, 211451, 211454, "1104DMD", "11090P", "110-L1", "110-L2", "110-L3", "110-L4", "110-L5", "110-L6", "110-L7", "110-L8", "11120-I", "11135PVC", "11147PVC", "11182A", "11182B", "11184A", "11184B", "11184C", "11184D", "11184E", "11216C", "11216P", "11288-14", "11288-24", "11288-36", "11288-48", "11291-14", "11291-24", "11291-36", "11291-48", "114-I1", "12015P", "12016P", "12028PVC", "12029PVC", "12033PVC", "12035PVC", "16015.T1", "16015.T2", "16015.T3", "16017.T1", "16017.T2", "16017.T3", "16019.T1", "16019.T2", "16019.T3", "16020.T1", "16020.T2", "16020.T3", "20999A", "20999B", "20999C", "20999D", "3000f", "4015A", "4015B", "4015C", "531S", "9396-12", "9396-13", "9396-14", "9396-15", "MCWBUSCARD", "STOREBUSCARD"]
const skuQtyNeeded = 22;// How many SKUS
const skuPrefix = 6;// What digit should they start with
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