async function adminData(dataArray) {
  try {
    // Fetch the JSON data asynchronously
    const jsonDataUrl = "https://wp-marcom.github.io/marcom/inventorytrackers/json/tmc-producthumbsource.json";
    const response = await fetch(jsonDataUrl);
    const jsonData = await response.json();

    // Process the dataArray (Google Sheets data)
    return dataArray.map(row => {
      let rowClass = ""; // Default: No special class

      const originalProductName = row[0];
      let productName = originalProductName;

      // Truncate productName to 67 characters
      if (productName.length > 67) {
        productName = productName.substring(0, 67) + "...";
      }

      // Find the matching record in the JSON data
      const matchingRecord = jsonData.rows.find(record => record.cell[4] === originalProductName);

      if (matchingRecord) {
        const imageUrl = "https://images.printable.com" + matchingRecord.cell[2];
        const strippedProductName = productName.replace(/<[^>]*>/g, "").replace(/[^\w\s()-\.]/g, "");
        var emailProductName = originalProductName.replace(/<[^>]*>/g, '').replace(/[^\w\s()-\.]/g, ''); // Remove HTML tags ONLY from productName for emailing only

        // Create links for the product
        const productNameLink = `<a href="${imageUrl}" target="_blank">${strippedProductName}</a>`;
        //const refillLink = `<a href="#" onclick="sendRefillEmail('${strippedProductName}'); return false;">Refill</a>`;
        const refillLink = `<a href="#" onclick="sendRefillEmail('${emailProductName}'); return false;"><i class="fa fa-arrow-circle-up" aria-hidden="true"></i></a>`;
        const locationLink = `<a href="#" onclick="sendLocationEmail('${emailProductName}'); return false;"><i class="fa fa-map-marker" aria-hidden="true"></i></a>`;

        return { 
          data: [productNameLink + " " + refillLink + " " + locationLink, ...row.slice(1)], 
          rowClass 
        };
      } else {
        // If no match found, return the truncated Product Name
        return { 
          data: [productName, ...row.slice(1)], 
          rowClass 
        };
      }
    });
  } catch (error) {
    console.error("Error fetching JSON data:", error);
  }
}

  

/* function showData(dataArray) {
    // Fetch the JSON data asynchronously
    async function fetchJsonData() {
        var jsonDataUrl = 'https://wp-marcom.github.io/marcom/inventorytrackers/json/mister-producthumbsource.json';
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
        var table = $('.datatable').DataTable({
            data: dataArray,
           // columns: [
          //      { "title": "Products Name" }, // Disable sorting for the first column
          //      { "title": "SKU" },
          //      { "title": "Location" },
           //     { "title": "Unit" },
           //     { "title": "Unit Qty" },
           //     { "title": "Min Qty" },
           //     { "title": "Refill Qty" },
           //     { "title": "QOS" },
           //     { "title": "Status" },
           //     { "title": "Notes" }
          //  ],
            order: [], // Disable initial sorting
            pageLength: 100, // Set default number of entries per page to 100
            columnDefs: [
                { targets: [0, 1, 2, 3, 4, 5, 6, 7, 8], className: 'text-nowrap' }, // Apply 'text-nowrap' class to columns 0 to 8
                {
                    targets: 0, // Target the Product Name column
                    render: function (data, type, row, meta) {
                        if (type === 'display') {
                            var originalProductName = data;
                            var productName = originalProductName;

                            // Truncate productName to 67 characters including spaces
                            if (productName.length > 67) {
                                productName = productName.substring(0, 67) + '...';
                            }

                            // Find the matching record in the JSON data using originalProductName
                            var matchingRecord = jsonData.rows.find(record => record.cell[4] === originalProductName);
                            if (matchingRecord) {
                                 //use original productName without HTML tags for sending emails
                                var emailProductName = originalProductName.replace(/<[^>]*>/g, '').replace(/[^\w\s()-\.]/g, ''); // Remove HTML tags ONLY from productName for emailing only
                                // Use truncated productName for strippedProductName
                                var strippedProductName = productName.replace(/<[^>]*>/g, '').replace(/[^\w\s()-\.]/g, ''); // Remove HTML/misc tags from productName for display only
                                // Retrieve the URL from the matching record
                                var imageUrl = matchingRecord.cell[2];
                                // Prepend "https://images.printable.com" to the URL
                                var fullImageUrl = "https://images.printable.com" + imageUrl;
                                // Create the link with the productName and attach onclick event
                                // Create the link with the productName and attach onclick event
                                var productNameLink = '<a href="' + fullImageUrl + '" target="_blank" title="' + emailProductName + '">' + strippedProductName + '</a>';
                                // Create the link for the "Refill" icon image to trigger the sendRefillEmail function
                                var refillLink = `<a href="#" onclick="sendRefillEmail('${emailProductName}'); return false;"><i class="fa fa-arrow-circle-up" aria-hidden="true"></i></a>`;
                                // Create the link for the "Location Change" icon image to trigger the sendLocationEmail function
                                var locationLink = `<a href="#" onclick="sendLocationEmail('${emailProductName}'); return false;"><i class="fa fa-map-marker" aria-hidden="true"></i></a>`;
                                // Return the combined content of productName link and refillLink
                                return productNameLink + ' ' + refillLink + ' ' + locationLink;
                            } else {
                                // If no match found, return the truncated Product Name
                                return productName;
                            }
                        } else {
                            // Return original data for other types (sorting, filtering, etc.)
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
                },

                {
                    targets: 7, // Target the 8th column (zero-based index)
                    createdRow: function (row, data, dataIndex) {
                        if (data[7] === 'BACKORDER') { // Check the value in column 8
                            $(row).addClass('table-danger'); // Apply the Bootstrap 'table-danger' class
                        }
                    }
                }
            ]
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
} */

// Get the last time the spreadsheet was modified

// Function to get and display the last modified time
async function updateLastModifiedTime() {
    const spreadsheetId = "14JGNtRb-hxjKowzYMEQe0UObFE2sED5KUCYhnaIX1jI";
    const apiKey = "AIzaSyD6pzfDZqNZNcwmj3wNlyJ-oXmVXFL93fI";
    const url = `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=modifiedTime&key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch file metadata');
        }

        const data = await response.json();
        const modifiedTime = data.modifiedTime;

        if (!modifiedTime) {
            throw new Error('Modified time not found in response');
        }

        const formattedTime = new Date(modifiedTime).toLocaleString();
        document.getElementById('last-modified').textContent = `Current as of: ${formattedTime}`;
    } catch (error) {
        console.error('Error fetching or updating last modified time:', error);
        document.getElementById('last-modified').textContent = `Error retrieving last modified time.`;
    }
}

// Call the function to update the element
updateLastModifiedTime();



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


