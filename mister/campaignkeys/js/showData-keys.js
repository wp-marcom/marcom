function showData(dataArray) {
 
    // Fetch the JSON data asynchronously
    async function fetchJsonData() {
        var jsonDataUrl = 'https://wp-marcom.github.io/marcom/inventorytrackers/json/product-thumbsource.json';
        try {
            var response = await fetch(jsonDataUrl);
            var jsonData = await response.json();
            return jsonData;
        } catch (error) {
            console.error('Error fetching JSON data:', error);
            throw error;
        }
    }

    // Render the DataTable after fetching JSON data
    fetchJsonData().then(jsonData => {
        var table = $('#data-table').DataTable({
         layout: {
        topStart: {
            buttons: ['copy', 'csv', 'excel', 'pdf', 'print']
        }
    },      
            data: dataArray,
            columns: [
  { "title": "Store#" },
  { "title": "State" },
  { "title": "120\" Retail Gate Arm" },
  { "title": "107\" Retail Gate Arm" },
  { "title": "100\" Retail Gate Arm" },
  { "title": "92\" Retail Gate Arm" },
  { "title": "87\" Retail Gate Arm" },
  { "title": "82\" Retail Gate Arm" },
  { "title": "77\" Retail Gate Arm" },
  { "title": "71\" Retail Gate Arm" },
  { "title": "60\" Retail Gate Arm" },
  { "title": "120\" Member Gate Arm" },
  { "title": "107\" Member Gate Arm" },
  { "title": "100\" Member Gate Arm" },
  { "title": "92\" Member Gate Arm" },
  { "title": "87\" Member Gate Arm" },
  { "title": "82\" Member Gate Arm" },
  { "title": "77\" Member Gate Arm" },
  { "title": "71\" Member Gate Arm" },
  { "title": "60\" Member Gate Arm" },
  { "title": "GMWP WS - 55x41\"" },
  { "title": "T-P WS - 55x41\"" },
  { "title": "GMWP WS - 96x48\"" },
  { "title": "T-P WS - 96x48\"" },
  { "title": "GMWP WS - 28x44\"" },
  { "title": "Titanium WS - 28x44\"" },
  { "title": "Platinum WS - 28x44\"" },
  { "title": "Kiosk Sticker - 12x20" },
  { "title": "Kiosk Sticker - 10x19" },
  { "title": "Google Vacuum Hose Sign" },
  { "title": "Google Vacuum Sticker" },
  { "title": "Google Window Cling" },
  { "title": "Collateral Guide" },
  { "title": "Box Sticker" }
],
            order: [], // Disable initial sorting
            pageLength: 100, // Set default number of entries per page to 100
            scrollX: true, // Enable horizontal scrolling
            columnDefs: [
                { targets: '_all', className: 'text-nowrap'  }, // Apply 'text-nowrap' class to columns 0 to 8
                {
    targets: 0, // Target the Packed Status column
    render: function (data, type, row, meta) {
        if (type === 'display') {
            // Check if the data value is 'Yes'
            var isChecked = data.toLowerCase() === 'yes';

            // Create the checkbox HTML with an event listener
            var checkboxHtml = '<input type="checkbox" ' + (isChecked ? 'checked' : '') + ' onchange="updateGoogleSheet(' + meta.row + ', this.checked ? \'Yes\' : \'No\')">';

            return checkboxHtml;
        } else {
            // For other types like sorting or filtering, return the data as is
            return data;
        }
    }
},
                {
                    targets: 1, // Target the SKU column
                    render: function (data, type, row, meta) {
                        if (type === 'display') {
                            // Convert SKU value to a clickable link opening in a new tab
                            return '<a href="https://marcomcentral.app.pti.com/westpress/0001/catalogsearch.aspx?uigroup_id=14110&query=' + encodeURIComponent(data) + '" target="_blank">' + data + '</a>';
                        } else {
                            return data; // Return original data for other types (sorting, filtering, etc.)
                        }
                    }
                }
            ]
        });

         // Populate dropdown with unique values from column 1 (State)
         var states = table.column(1).data().unique().sort();
         var stateFilter = $('#stateFilter');
         stateFilter.append($('<option>').val("").text("All States")); // Add option for all states
         $.each(states, function(i, state) {
             stateFilter.append($('<option>').val(state).text(state));
         });
 
         // Apply filter when dropdown selection changes
         stateFilter.on('change', function() {
             var selectedState = $(this).val();
             table.column(1).search(selectedState).draw();
         });
        

        // Iterate over each row in the table
        table.rows().every(function (rowIdx, tableLoop, rowLoop) {
            var rowData = this.data();
            var status = rowData[8]; // Assuming "Status" column is at index 7

            // Apply styling based on the value of the "Status" column
            if (status === "BACKORDER") {
                $(this.node()).addClass('backorder');
            } else if (status === "BELOW OR AT SET MINIMUM") {
                $(this.node()).addClass('below-minimum');
            }
        });
    }).catch(error => {
        console.error('Error rendering DataTable:', error);
    });
}

// Get the last time the spreadsheet was modified

function getLastModifiedTime() {
    const spreadsheetId = "1hAHAceVX86adpUAgVXTRL7OJ-BkU2WRONDYM5EMP13E";
    const apiKey = "AIzaSyD6pzfDZqNZNcwmj3wNlyJ-oXmVXFL93fI";
    const url = `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=modifiedTime&key=${apiKey}`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch file metadata');
            }
            return response.json();
        })
        .then(data => {
            const modifiedTime = data.modifiedTime;
            if (!modifiedTime) {
                throw new Error('Modified time not found in response');
            }
            return modifiedTime;
        })
        .catch(error => {
            console.error('Error fetching or parsing last modified time:', error);
            return null;
        });
}
function sendRefillEmail(productName) {
    // Extract SKU from productName
    var sku = extractSkuFromProductName(productName);

    // Construct the email body with labels only
    var emailBody = "Product Name: " + productName + "\n\n" +
                    "SKU: " + sku + "\n\n" +
                    "QUANTITY RECEIVED:\n\n" +
                    "WP OWNED OVERS RECEIVED:\n\n" +
                    "QUANTITY ON HAND:\n\n" +
                    "BACKORDERS:\n\n" +
                    "LOCATION:\n\n" +
                    "NOTES:";

    // Construct the email subject
    var subject = encodeURIComponent(productName + " - Refill - INVOICE NUMBER:");

    // Construct the email link with subject and body
    var emailLink = "mailto:kaleb@westpress.com" +
                    "?subject=" + subject +
                    "&body=" + encodeURIComponent(emailBody);

    // Open the email client
    window.location.href = emailLink;
}

function sendLocationEmail(productName) {
    // Extract SKU from productName
    var sku = extractSkuFromProductName(productName);

    // Construct the email body with labels only
    var emailBody = "Product Name: " + productName + "\n\n" +
                    "SKU: " + sku + "\n\n" +
                    "NEW LOCATION:\n\n" +
                    "NOTES:";

    // Construct the email subject
    var subject = encodeURIComponent(productName + " - LOCATION CHANGE");

    // Construct the email link with subject and body
    var emailLink = "mailto:kaleb@westpress.com" +
                    "?subject=" + subject +
                    "&body=" + encodeURIComponent(emailBody);

    // Open the email client
    window.location.href = emailLink;
}

// Function to extract SKU from productName
function extractSkuFromProductName(productName) {
    var lastParenIndex = productName.lastIndexOf(")");
    if (lastParenIndex !== -1) {
        var start = productName.lastIndexOf("(", lastParenIndex - 1);
        if (start !== -1) {
            return productName.substring(start + 1, lastParenIndex);
        }
    }
    return ""; // Return empty string if no SKU found
}

function updateGoogleSheet(rowIndex, packedStatus) {
  var scriptUrl = 'https://script.google.com/macros/s/AKfycbw1skmaRfciDxIw6qNnf7-G_udVoiH0IV5BvMJpJyK5p3DROvYhM13ktovjBo8nfhsdcA/exec';
    
  // Convert the data to JSON format
  var payload = JSON.stringify({
    "rowIndex": rowIndex,
    "packedStatus": packedStatus
  });

  $.ajax({
    url: scriptUrl,
    method: "POST",
    data: payload,
    success: function(response) {
      console.log(response);
    },
    error: function(xhr, status, error) {
      console.error(status, error);
    }
  });
}

