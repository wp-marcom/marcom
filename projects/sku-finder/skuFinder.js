function findAvailableSkuSets(values, skuQtyNeeded, maxSets = 5) {
    // Convert to numbers and filter out non-numeric values
    const existingSkus = values
        .map(v => parseInt(v, 10))
        .filter(n => !isNaN(n));

    if (existingSkus.length === 0) {
        return [];
    }

    // Create a Set for O(1) lookup
    const skuSet = new Set(existingSkus);
    
    const minSku = Math.min(...existingSkus);
    const maxSku = Math.max(...existingSkus);

    const validSets = [];

    // Allow searching beyond maxSku to complete sequences
    // Calculate how far we might need to go: (skuQtyNeeded - 1) * 2 additional space
    const searchLimit = maxSku + ((skuQtyNeeded - 1) * 2);

    // Check both odd and even starting points
    for (let start = minSku; start <= searchLimit; start++) {
        // Generate a sequence with gaps of 1
        const sequence = [];
        let current = start;
        
        for (let i = 0; i < skuQtyNeeded; i++) {
            // Check if this SKU is available
            if (!skuSet.has(current)) {
                sequence.push(current);
                current += 2; // Skip one number
            } else {
                // This sequence won't work, break early
                break;
            }
        }

        // If we got the full sequence, it's valid
        if (sequence.length === skuQtyNeeded) {
            validSets.push(sequence);
            
            if (validSets.length >= maxSets) {
                return validSets;
            }
        }
    }

    return validSets;
}

// Example usage with your data

const values = ["12008", "8005", "11003", "11005", "14000", "14001", "14006", "9019", "11014", "10012", "21000", "14026", "12021", "14023", "11258", "11259", "4000", "5002", "14016", "1010", "1035", "21002", "3006", "11023", "11025", "11024", "5011", "5012", "5013", "5014", "5015", "5016", "5019", "5020", "5021", "10032", "900", "801", "501", "502", "40071", "14022", "504", "1039", "3004", "11242", "11240", "11250", "11246", "11067", "11120", "11130", "11135", "11136", "11140", "11141", "11147", "11152", "11156", "11158", "11159", "11160", "11161", "11162", "11163", "11165OLD", "11170", "11190", "11191", "11197", "11198", "11200", "11201", "5018", "5017", "11050", "11212", "11213", "11020", "11238", "11061", "4008", "11285", "11286", "11294", "11143", "111312", "111455", "111453", "111451", "111449", "111447", "111467", "111341", "111470", "16022", "111490", "111494", "111496", "111500", "11179", "11174", "111552", "111567", "21012", "21007", "40010", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Digital-Board-Get-Ready-to-Shine-160x80.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Get Ready to Shine<br><span class=\"choice\">Choose reader size:</span>", "Get Ready To Shine", "Mister Car Wash - White", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Mister-Car-Wash-White-160x80-02.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Mister Car Wash w/White<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Mister-Car-Wash-Blue-160x80-03.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Mister Car Wash w/Blue<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Digital-Board-Now-Open-160x80.jpg\" alt=\"Smiley face\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Now Open<br><span class=\"choice\">Choose reader size:</span>", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/UWC-Blue-160x80-05.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">UWC w/Blue<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/UWC-White-160x80-06.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">UWC w/White<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Now-Hiring-160x80-01.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Now Hiring<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Express-Wash-Hours-Digital-160x80.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Express Wash Hours<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/FreeVacuums-Digital-160x80.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Free Vacuums<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/FreeVacuums-24x112.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Free Vacuums<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/GetReadytoShine-24x112.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">Get Ready to Shine<br><span class=\"choice\">Choose reader size:", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/UWC-24x112.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\">UWC<br><span class=\"choice\">Choose reader size:", "111590", "111600", "111620", "111645", "111660", "11022", "11220", "11199", "4013", "111547", "111548", "111315", "11214", "111471", "11151", "4010", "4014", "12035", "11282", "11284", "111612", "111582", "111583", "7000", "12001", "11184A", "11184B", "11184C", "11184D", "11184E", "11182A", "11182B", "11289", "111611", "111613", "111505", "111679", "1029", "17000", "17002", "17008", "17010", "111584", "11066", "9020", "1003", "1002", "111614", "1028", "111677", "111669", "111671", "11122", "9027", "12032", "20998", "1418", "1072", "1073", "8012", "11026", "4018", "111673", "111675", "11052", "11068", "11069", "111503", "19000", "19002", "19004", "19006", "11091", "11092", "11093", "11094", "11095", "11096", "11097", "1074", "1026", "11009", "19008", "9009", "11053", "13000", "19010", "9008", "12011", "12013", "1030", "2436", "2228", "2024", "1015", "1016", "1017", "500", "6000", "6002", "6004", "6006", "6008", "11070", "11215", "11090P", "111610", "111627", "111626", "510", "512", "516", "520", "3002", "526", "528", "30004", "30000", "30002", "1040", "1042", "1824", "5042", "5043", "1044", "1046", "700", "704", "702", "706", "524", "525", "527", "6012", "6014", "2026", "2030", "2028", "2029", "9992", "509", "9395", "30008", "111512", "5010", "508", "111340", "11071", "5008", "30007", "111657", "21064", "11176", "11177", "11168", "10002", "1041", "1043", "12015", "1023", "11178", "624", "40031", "11169", "5004", "5006", "626", "1018", "19012", "19014", "19016", "19018", "19020", "19022", "19024", "19026", "31012", "31014", "31016", "31018", "31020", "31022", "31024", "31026", "18996", "18998", "111602", "11308", "12016", "11006", "11008", "530", "532", "21001", "21003", "9396-12", "9396-13", "9396-14", "9396-15", "4023", "11018", "11011", "26018", "503", "9202", "9204", "4024", "6005", "4005", "4006", "12038", "12039", "111592", "1506", "111563", "21256", "17006", "17007", "17009", "1200", "1202", "1204", "1206", "21258", "21260", "21262", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Digital-Board-Get-Ready-to-Shine-160x80.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\"><span class=\"choice\">Choose reader size:</span>", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Express-Wash-Hours-Digital-160x80.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\"><span class=\"choice\">Choose reader size:</span>", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/FreeVacuums-24x112.jpg\" width=\"120\" height=\"30\" align=\"left\" style=\"margin: 0px 10px\"><span class=\"choice\">Choose reader size:</span>", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/FreeVacuums-Digital-160x80.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\"><span class=\"choice\">Choose reader size:</span>", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/GetReadytoShine-24x112.jpg\" width=\"120\" height=\"30\" align=\"left\" style=\"margin: 0px 10px\"><span class=\"choice\">Choose reader size:</span>", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Mister-Car-Wash-Blue-160x80-03.jpg?dl=1\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\"><span class=\"choice\">Choose reader size:</span>", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Now-Hiring-160x80-01.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\"><span class=\"choice\">Choose reader size:</span>", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Now-Open-160x80-07.jpg?dl=1\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\"><span class=\"choice\">Choose reader size:</span>", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/UWC-24x112.jpg\" width=\"120\" height=\"30\" align=\"left\" style=\"margin: 0px 10px\"><span class=\"choice\">Choose reader size:</span>", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/UWC-Blue-160x80-05.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\"><span class=\"choice\">Choose reader size:</span>", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/UWC-White-160x80-06.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\"><span class=\"choice\">Choose reader size:</span>", "<img src=\"https://wp-marcom.github.io/marcom/mister/images/digitalboard/Mister-Car-Wash-White-160x80-02.jpg\" width=\"120\" height=\"60\" align=\"left\" style=\"margin: 0px 10px\"><span class=\"choice\">Choose reader size:</span>", "4004", "12022", "12026", "2501", "20000", "11019", "12024", "438", "440", "442", "444", "446", "448", "450", "452", "454", "456", "458", "460", "462", "464", "466", "468", "470", "472", "11145", "11149", "1000", "1001", "5302", "499", "5031", "1022", "111448", "111781", "50101", "50102", "111343", "111450", "111446", "497", "534", "536", "538", "540", "4002", "10008", "10010", "542", "550", "544", "546", "548", "552", "554", "556", "11302", "11146", "12002", "4025", "4027", "21073", "810", "439", "441", "445", "449", "101", "11051", "11013", "12040", "12041", "12042", "519", "7003", "200", "11293", "12031", "4026", "2503", "111554", "451", "455", "459", "463", "465", "469", "602", "473", "904", "4028", "2010", "7008", "7010", "531", "533", "535", "537", "539", "102", "11157", "11144", "549", "551", "553", "555", "12007", "21014", "21016", "541", "543", "545", "547", "202", "2001", "2003", "10003", "1201", "1203", "1205", "1207", "7005", "7007", "7009", "7011", "20999", "215", "217", "111801", "111803", "111805", "627", "111782", "111783", "111790", "111791", "111800", "111807", "111855", "111857", "111809", "111817", "111798", "111799", "111501", "111502", "111504", "199", "201", "203", "437", "18999", "19001", "16015.T1", "529", "15004", "1208", "111854", "111856", "111858", "111860", "111870", "111872", "111874", "6999", "7001", "16020.T1", "16020.T2", "16020.T3", "16015.T2", "16015.T3", "16017.T1", "16017.T2", "16017.T3", "16019.T1", "16019.T2", "16019.T3", "UWC - 112x24", "UWCALSO", "111454", "111816", "111826", "111836", "111828", "111830", "111832", "111834", "4015A", "111562", "11217", "111862", "111864", "111866", "111868", "111876", "111878", "111880", "111882", "111884", "111886", "111888", "20996", "40072", "14007", "Ahead Arrow w/ Logo", "Left/Right Arrow", "Mister Logo At Bottom", "Mister Logo At Top", "No Logo", "Ahead Arrow", "Left/Right Arrow", "U-Turn", "Dark Blue - Oracal 751", "Telegrey - Oracal 751", "White - Oracal 751", "Dark Blue - Oracal 751", "Telegrey - Oracal 751", "White - Oracal 751", "Dark Blue - Oracal 751", "Telegrey - Oracal 751", "White - Oracal 751", "$10", "$8", "4015B", "4015C", "531S", "7012", "17003", "17012", "17014", "17015", "12000", "20999A", "20999B", "20999C", "20999D", "111604", "11098", "103", "105", "107", "109", "111", "113", "117", "11216C", "11216P", "21011", "111601", "5292", "14000", "14001", "14006", "40071", "1015", "1016", "1017", "1018", "21001", "21003", "11120-I", "11154"];
const skuQtyNeeded = 7;
const result = findAvailableSkuSets(values, skuQtyNeeded, 1000);

console.log(`Found ${result.length} valid sets:\n`);
result.forEach((set, i) => {
    console.log(`Set ${i + 1}: ${set.join(', ')}`);
});

// Show some analysis
if (result.length > 0) {
    const firstSet = result[0];
    console.log(`\nFirst set analysis:`);
    console.log(`  Range: ${firstSet[0]} to ${firstSet[firstSet.length - 1]}`);
    console.log(`  Total span: ${firstSet[firstSet.length - 1] - firstSet[0] + 1} numbers`);
}