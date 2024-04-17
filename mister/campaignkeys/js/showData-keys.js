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
            data: dataArray,
            columns: [
                { "title": "Packed?" },
                { "title": "Region" },
    { "title": "CC" },
    { "title": "Store #" },
    { "title": "Type" },
    { "title": "Location Name" },
    { "title": "General Manager" },
    { "title": "Address" },
    { "title": "City" },
    { "title": "State" },
    { "title": "Zip Code" },
    { "title": "Phone Number" },
    { "title": "Google Review Window Cling" },
    { "title": "Google Review Vacuum Hose Sign" },
    { "title": "Box Sticker" }
            ],
            order: [], // Disable initial sorting
            pageLength: 100, // Set default number of entries per page to 100
            columnDefs: [
                { targets: [0, 1, 2, 3, 4, 5, 6, 7, 8], className: 'text-nowrap' }, // Apply 'text-nowrap' class to columns 0 to 8
                {
    targets: 0, // Target the Packed Status column
    render: function (data, type, row, meta) {
        if (type === 'display') {
            // Check if the data value is 'Yes'
            var isChecked = data.toLowerCase() === 'yes';

            // Create the checkbox HTML
            var checkboxHtml = '<input type="checkbox" ' + (isChecked ? 'checked' : '') + '>';

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

         // Populate dropdown with unique values from column 9 (State)
         var states = table.column(9).data().unique().sort();
         var stateFilter = $('#stateFilter');
         stateFilter.append($('<option>').val("").text("All States")); // Add option for all states
         $.each(states, function(i, state) {
             stateFilter.append($('<option>').val(state).text(state));
         });
 
         // Apply filter when dropdown selection changes
         stateFilter.on('change', function() {
             var selectedState = $(this).val();
             table.column(9).search(selectedState).draw();
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
  var scriptUrl = 'https://script.google.com/macros/s/AKfycbxGfWJ8E0UX3MGptP5VyXnU22O9mqAemiNrq8Jg8_gDU_FJOVMreFm_Hc1YGvgvIMdUnQ/exec';
  var payload = {
    "rowIndex": rowIndex,
    "packedStatus": packedStatus
  };

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

