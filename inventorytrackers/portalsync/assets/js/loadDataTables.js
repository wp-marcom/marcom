async function adminData(dataArray,client) {
  try {

    // Declare jsonDataUrl outside the conditional blocks
    let jsonDataUrl;

    // Assign the appropriate URL based on the client value
    if (client === "Mister") {
      jsonDataUrl = "assets/json/mister-producthumbsource.json";
    } else if (client === "Westpress Inventory") {
      jsonDataUrl = "assets/json/westpressinventory-producthumbsource.json";
    } else if (client === "TMC") {
      jsonDataUrl = "assets/json/tmc-producthumbsource.json";
    } else if (client === "Northwest Medical Center") {
      jsonDataUrl = "assets/json/nmc-producthumbsource.json";
    } else {
      throw new Error("Invalid client specified");
    }
    // Fetch the JSON data asynchronously
    
    const response = await fetch(jsonDataUrl);
    const jsonData = await response.json();

    // Process the dataArray (Google Sheets data)
    return dataArray.map(row => {
      console.log("Data Array before processing:", dataArray);

      let rowClass = ""; // Default: No special class

      const originalProductName = row[0];
      const skuName = row[1];
      console.log("HEY HERE IS THE SKU:", skuName);
      let productName = originalProductName;
      console.log("Original product name:", originalProductName);

      // Truncate productName to 67 characters
      if (productName.length > 67) {
        productName = productName.substring(0, 67) + "...";
      }

      // Find the matching record in the JSON data
      //const matchingRecord = jsonData.rows.find(record => record.cell[4] === originalProductName);

      // Find the matching record in the JSON data while making sure product names with inches symbol load correctly
      const matchingRecord = jsonData.rows.find(record => record.cell[4].replace(/\\"/g, '"') === originalProductName);

      if (matchingRecord) {
        const imageUrl = "https://images.printable.com" + matchingRecord.cell[2];
        const strippedProductName = productName.replace(/<[^>]*>/g, "").replace(/[^\w\s()-\.]/g, "");
        var emailProductName = originalProductName.replace(/<[^>]*>/g, '').replace(/[^\w\s()-\.]/g, ''); // Remove HTML tags ONLY from productName for emailing only

        // Create links for the product
        const productNameLink = `<a href="${imageUrl}" target="_blank">${strippedProductName}</a>`;
        
        //const userRole = sessionStorage.getItem("userRole");
        //let refillLink = "";
       // let locationLink = "";
        //let getLowLink = "";
        
        //if(userRole === "warehouse" || userRole === "admin")
        //  {
          //refillLink = `<a href="#" onclick="sendRefillEmail('${emailProductName}'); return false;"><i class="fa fa-arrow-circle-up" aria-hidden="true"></i></a>`;
         // refillLink = `<a href="#" onclick="sendRefillEmail('${emailProductName}', '${skuName}'); return false;"><i class="fa fa-arrow-circle-up" aria-hidden="true"></i></a>`;
          //locationLink = `<a href="#" onclick="sendLocationEmail('${emailProductName}'); return false;"><i class="fa fa-map-marker" aria-hidden="true"></i></a>`;
         // locationLink = `<a href="#" onclick="sendLocationEmail('${emailProductName}', '${skuName}'); return false;"><i class="fa fa-map-marker" aria-hidden="true"></i></a>`;
          //getLowLink = `<a href="#" onclick="sendGetLowEmail('${emailProductName}'); return false;"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i></a>`;
        //  getLowLink = `<a href="#" onclick="sendGetLowEmail('${emailProductName}', '${skuName}'); return false;"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i></a>`;

        //  }
const userRoles = JSON.parse(sessionStorage.getItem("userRoles") || "[]"); // Fetch the roles from sessionStorage
let refillLink = "";
let locationLink = "";
let getLowLink = "";

// Check if the user has any of the roles that should have access
if (userRoles.includes("warehouse") || userRoles.includes("admin")) {
  refillLink = `<a href="#" onclick="sendRefillEmail('${emailProductName}', '${skuName}'); return false;">
    <i class="fa fa-arrow-circle-up" aria-hidden="true"></i></a>`;

  locationLink = `<a href="#" onclick="sendLocationEmail('${emailProductName}', '${skuName}'); return false;">
    <i class="fa fa-map-marker" aria-hidden="true"></i></a>`;

  getLowLink = `<a href="#" onclick="sendGetLowEmail('${emailProductName}', '${skuName}'); return false;">
    <i class="fa fa-exclamation-triangle" aria-hidden="true"></i></a>`;
}

        
        
        else{
          refillLink = ``;
          locationLink = ``;
          getLowLink = ``;
        }

        return { 
          data: [productNameLink + " " + refillLink + " " + locationLink + " " + getLowLink, ...row.slice(1)], 
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

async function recentSalesData(dataArray, client) {
  try {
    // Process the dataArray (Google Sheets data)
    return dataArray.map(row => {
      let rowClass = ""; // Default: No special class
      const originalProductName = row[0];
      let productName = originalProductName;

      // Truncate productName to 67 characters
      if (productName.length > 67) {
        productName = productName.substring(0, 67) + "...";
      }

      // Check if column G (index 3) is empty, blank, or null, and insert the <span> element
    if (row[3].trim() === "Order Received") {
    row[3] = '<span class="badge bg-warning">Order Received</span>';
    }
 else if (/\d/.test(row[3].trim())) {
  // Split the value into individual numbers using "," as the delimiter
  const numbers = row[3].trim().split(",");

  // Map each number to a clickable link wrapped in the desired span
  const links = numbers.map(number => {
    const trimmedNumber = number.trim();
    return `<a href="https://www.fedex.com/fedextrack/?trknbr=${trimmedNumber}" target="_blank">
              <span class="bi bi-archive-fill">${trimmedNumber}</span>
            </a>`;
  });

  // Join the links with a comma (or any other separator you prefer)
  row[3] = links.join(", ");
}





      // Return the processed row with productName
      return {
        data: [productName, ...row.slice(1)],
        rowClass
      };
    });
  } catch (error) {
    console.error("Error processing data:", error);
  }
}



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
        //document.getElementById('last-modified').textContent = `Current as of: ${formattedTime}`;
        document.querySelectorAll('.last-modified').forEach((element) => {
        element.textContent = `Current as of: ${formattedTime}`;
        });

    } catch (error) {
        console.error('Error fetching or updating last modified time:', error);
        //document.getElementById('last-modified').textContent = `Error retrieving last modified time.`;
      document.querySelectorAll('.last-modified').forEach((element) => {
        element.textContent = `Error retrieving last modified time.`;
        });
    }
}

// Call the function to update the element
updateLastModifiedTime();



function sendRefillEmail(productName, skuName) {
    // Extract SKU from productName
    //var sku = extractSkuFromProductName(productName);
    var sku = skuName;
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

function sendLocationEmail(productName, skuName) {
    // Extract SKU from productName
    //var sku = extractSkuFromProductName(productName);
    var sku = skuName;
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

function sendGetLowEmail(productName, skuName) {
var currentUrl = window.location.href;
var salesEmail = "";
if (currentUrl.includes("mister")) {
    // Do something special for the "mister" tracker page
    salesEmail = "lprice@westpress.com";
}
else if (currentUrl.includes("siet")) {
  // Do something special for the "mister" tracker page
  salesEmail = "lprice@westpress.com";
}

else if (currentUrl.includes("vwcu")) {
  // Do something special for the "mister" tracker page
  salesEmail = "andy@westpress.com";
}
else if (currentUrl.includes("pfcu")) {
  // Do something special for the "mister" tracker page
  salesEmail = "andy@westpress.com";
}

else if (currentUrl.includes("tmc")) {
  // Do something special for the "mister" tracker page
  salesEmail = "marlo@westpress.com";
}

else if (currentUrl.includes("nmc")) {
  // Do something special for the "mister" tracker page
  salesEmail = "chenoa@westpress.com";
}

  
    // Extract SKU from productName
    //var sku = extractSkuFromProductName(productName);
    var sku = skuName;
    // Construct the email body with labels only
    var emailBody = "On shelf inventory is currently low on:" + "\n\n" +
                    "Product Name: " + productName + "\n\n" +
                    "SKU: " + sku + "\n\n" +
                    "NOTES:";

    // Construct the email subject
    var subject = encodeURIComponent(productName + " - LOW INVENTORY");

  // Build recipient list
   // old version--> var recipients = salesEmail ? salesEmail + ",kaleb@westpress.com" : "kaleb@westpress.com";
   var recipients = salesEmail ? salesEmail + "; kaleb@westpress.com" : "kaleb@westpress.com";

    // Construct the email link with subject and body
    var emailLink = "mailto:" + recipients +
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


