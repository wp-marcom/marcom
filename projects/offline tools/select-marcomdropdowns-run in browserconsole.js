const selectElement = document.getElementById('ctl00_Content_cascadingDropDown1_listboxChildValues');
const numbersToSelect = ["10", "9", "2641", "1118", "351", "1109", "1354", "291", "261", "357", "130", "314", "1355", "26", "24", "364", "1103", "293", "1356", "316", "1106", "1", "299", "305", "315", "352", "311", "368", "22", "6", "12", "1102", "294", "1358", "366", "8", "354", "17", "2642", "7", "301", "3", "361", "317", "13", "1116", "365", "369", "1114", "312", "20", "19", "16", "29", "25", "1352", "362", "5", "1111", "23", "353", "15", "1283", "367", "27", "4", "140", "1113", "150", "309", "1104", "356", "2546", "2644", "120", "18", "363", "1108", "1361", "1110", "21", "2", "292", "1353", "298", "355", "11", "296", "308", "375", "297", "1117", "1112", "1101", "318", "28", "1351", "306"];

Array.from(selectElement.options).forEach(option => {
    if (numbersToSelect.includes(option.text.trim())) {
        option.selected = true;
    }
});

// Trigger change event
selectElement.dispatchEvent(new Event('change', { bubbles: true }));