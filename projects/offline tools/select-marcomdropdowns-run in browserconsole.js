const selectElement = document.getElementById('ctl00_Content_cascadingDropDown1_listboxChildValues');
const numbersToSelect = ["2546", "24", "1114", "12", "23", "1116", "306", "140", "1117", "1112", "1361", "1118", "1356", "375", "369", "368", "367", "366", "365", "364", "363", "362", "361", "357", "356", "355", "318", "317", "316", "315", "314", "312", "311", "309", "308", "301", "299", "298", "297", "296", "294", "292", "291", "29", "28", "27", "21", "20", "19", "18", "17", "16", "1358", "1355", "1354", "1353", "1352", "1351", "130", "1283", "120", "1113", "1111", "1110", "1109", "1108", "1106", "1104", "1103", "1102", "1101", "2643"];

Array.from(selectElement.options).forEach(option => {
    if (numbersToSelect.includes(option.text.trim())) {
        option.selected = true;
    }
});

// Trigger change event
selectElement.dispatchEvent(new Event('change', { bubbles: true }));