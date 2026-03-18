const primeDirectory = "C:\\projects\\";
const robot = require(`${primeDirectory}node_modules\\robotjs`);

// Your list of 496 group names
const groupNames = ["001-Crosstimbers", "002-Gessner", "003-Voss", "004-1960 E.", "005-Westheimer", "006-Champions", "008-Uvalde", "009-Humble", "010-Kirby", "011-Sugar Land", "015 - Upper Kirby", "025 - Copperfield", "026 - South Main", "222-Seminole CW", "223-Gandy CW", "224-Dale Mabry CW", "225-Brandon CW", "226-N. Dale Mabry CW", "228 - Lake Mary", "241-Highway 280 CW", "257-Piedmont", "258-Ponce", "261-Mesquite CW", "272 - E Adamo", "275 - Lakeland", "293 - S 27th St", "305-Research", "321-Tanque Verde", "322-Oracle", "324-Cortaro", "325-Oracle & River", "327-Kolb", "351-Cielo Vista", "352-Coronado", "353-Montwood (Flex)", "354-Osborne", "391-Central", "392-Coors NM", "393-Snow Heights NM", "394-San Mateo NM", "395-San Pedro NM", "396-Highway 528 NM", "452-Shoreview", "461 - Wyoming", "483 - Park St", "492 - State St", "531 - Cottonwood", "575-Kennewick", "601-Edina", "602 - Downtowner", "605-Roseville", "606-St. Louis Park", "612-Brooklyn Park", "651-Annapolis", "652-Severna", "688-York", "690-Lancaster", "692-Reading", "722-University", "723-Cedar Rapids", "753-Campbell", "801-41st Street", "1801 - Del Prado"];

// MCWCorp+CS+FLORIDA
//const groupNames = ["221-Clearwater CW", "224-Dale Mabry CW", "226-N. Dale Mabry CW", "223-Gandy CW", "225-Brandon CW", "222-Seminole CW", "230-Clermont CW", "MCW Corporate Users", "227 - Sanford", "228 - Lake Mary", "229 - Melbourne", "233 - Fern Park", "234 - French Ave", "235 - Colonial", "236 - Chicksaw", "231 - Ocoee", "276 - HWY 27", "272 - E Adamo", "273 - Hudson", "274 - Spring Hill", "275 - Lakeland", "Corporate Select", "admin", "209 - Lee", "208 - Tavares", "277-Deltona", "278-Titusville", "1222-Cypress Gardens", "1205-Commerce Ctr Dr", "1206-Kissimmee", "205 - Viera", "206 - Irlo Bronson", "1223-Neptune", "1221-State Route 52", "279-Orange Blossom", "243-Silver Star", "1211-Port Orange", "1212-Mt. Dora", "1213-Palm Coast", "1214-LPGA", "1215-Ormand Beach", "1207 - Leesburg", "1801 - Del Prado", "1802 - Pine Island", "1803 - Cape Coral Pkwy", "1804 - Skyline", "1805 - Santa Barbara", "1806 - Liberty Park", "1807 - NE 16th Place", "1244 - Red Bug", "1815 - McCall", "1813 - Arborwood", "1233 - Altamonte", "1234 - Oviedo", "1235 - Colonial (Orlando)", "1236 - Poinciana", "1237 - Clermont", "1238 - Landstar", "1239 - Lake Nona", "1241 - Curry Ford", "1242 - Semoran", "1243 - Minneola", "1245 - Clyde Morris", "1808 - Airport", "1809 - Bonita", "1811 - Cody Lee", "1812 - Rattlesnake", "1814 - Colonial (Ft. Myers)", "1816 - Estero", "1851 - Port St. Lucie 9200", "1852 - Port St. Lucie 229", "1853 - Cutler Bay", "1854 - Hypoluxo", "1901 - Hillsborough", "1902 - Wesley Chapel", "1903 - Land O Lakes", "1904 - Bruce B Downs", "1905 - New Tampa", "1906 - Lakeland South", "1907 - Lakeland North", "1908 - Winter Haven", "1909 - Bartow", "1208 - Oaks Blvd", "1224 - Winter Haven", "1225 - Mulberry", "1249-Irwin", "1253-Long Key", "1254-Millenia", "1251-Park Ridge"];

// Configuration
const DELAY_BETWEEN_ACTIONS = 50; // milliseconds
const DELAY_BETWEEN_GROUPS = 250; // milliseconds between each group
const DELAY_AFTER_SEARCH = 150; // wait founr search results to load
const SEARCH_BOX_X = 181; // X coordinate of the search box
const SEARCH_BOX_Y = 582; // Y coordinat
// e of the search box
const RESULT_ITEM_X = 186; // X coordinate of the top element after search
const RESULT_ITEM_Y = 623; // Y coordinate of the top element after search

// Helper function to add delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function selectGroups() {
  console.log(`Starting to select ${groupNames.length} groups...`);
  console.log('You have 5 seconds to click into the search box!');
  
  // Give user time to position cursor in the search box
  await sleep(5000);
  
  for (let i = 0; i < groupNames.length; i++) {
    console.log(`Processing group ${i + 1}/${groupNames.length}: ${groupNames[i]}`);
    
    // Type the group name
    robot.typeString(groupNames[i]);
    await sleep(DELAY_BETWEEN_ACTIONS);
    
    // Press Enter to search
    robot.keyTap('enter');
    await sleep(DELAY_AFTER_SEARCH); // Wait for search results
    
    // For first group, just click normally
    // For subsequent groups, hold Ctrl while clicking
    if (i > 0) {
      robot.keyToggle('control', 'down');
      await sleep(DELAY_BETWEEN_ACTIONS);
    }
    
    // Click the first result
    robot.moveMouse(RESULT_ITEM_X, RESULT_ITEM_Y);
    robot.mouseClick();
    await sleep(DELAY_BETWEEN_ACTIONS);
    
    // Release Ctrl if it was held
    if (i > 0) {
      robot.keyToggle('control', 'up');
      await sleep(DELAY_BETWEEN_ACTIONS);
    }
    
    // Click back into search box
    robot.moveMouse(SEARCH_BOX_X, SEARCH_BOX_Y);
    robot.mouseClick();
    await sleep(DELAY_BETWEEN_ACTIONS);
    
    // Select all text in search box
    robot.keyTap('a', 'control');
    await sleep(DELAY_BETWEEN_ACTIONS);
    
    await sleep(DELAY_BETWEEN_GROUPS);
  }
  
  console.log('Done! All groups have been selected.');
}

// Run the script
selectGroups().catch(err => {
  console.error('Error:', err);
  // Release control key in case of error
  robot.keyToggle('control', 'up');
});