// showData.js

// Declare jsonData at a higher scope
var jsonData;

function showData(dataArray) {
    // Fetch the JSON data asynchronously
    async function fetchJsonData() {
        var jsonDataUrl = 'https://wp-marcom.github.io/marcom/inventorytrackers/json/product-thumbsource.json';
        try {
            var response = await fetch(jsonDataUrl);
            jsonData = await response.json();
            return jsonData;
        } catch (error) {
            console.error('Error fetching JSON data:', error);
            throw error;
        }
    }

    // Render the DataTable after fetching JSON data
    fetchJsonData().then(data => {
        var table = $('#data-table').DataTable({
            data: dataArray,
            columns: [
                // Your column definitions
            ],
            // Other DataTable options
        });

        // Iterate over each row in the table
        table.rows().every(function (rowIdx, tableLoop, rowLoop) {
            // Apply styling based on the value of the "Status" column
            var rowData = this.data();
            var status = rowData[8]; // Assuming "Status" column is at index 7

            // Apply styling based on status
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
    // Implementation of getLastModifiedTime function
}

// Function to send email
function sendEmail(productName) {
    // Implementation of sendEmail function
}

// Function to get product info for email body
function getProductInfo(productName) {
    // Get the matching row
    var matchingRow = jsonData.rows.find(record => record.cell[4] === productName);

    // Extract product name and SKU from the matching row
    var productName = matchingRow ? matchingRow.cell[0] : '';
    var sku = matchingRow ? matchingRow.cell[1] : '';

    // Construct the email body
    var emailBody = 'Product Name: ' + productName + '\n' +
                    'SKU: ' + sku + '\n\n' +
                    'QUANTITY RECEIVED:\n\n' +
                    'WP OWNED OVERS RECEIVED:\n\n' +
                    'QUANTITY ON HAND:\n\n' +
                    'BACKORDERS:\n\n' +
                    'LOCATION:\n\n' +
                    'NOTES:';

    return emailBody;
}

    } else {
        return "No information available for this product.";
    }
}
