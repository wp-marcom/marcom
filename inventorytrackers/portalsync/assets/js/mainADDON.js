/**
* Template Name: GoogleConnection
*/
// Replace with your Google Sheets ID and range where data is stored
const sheetID = '1lZuCrQ9vy64LEkHAwZe8W16__E-tFIKLxcxHITHA0EM'; // Replace with your Sheet ID
const apiKey = 'AIzaSyCMFuTpnIGqrFXL2UjbzRVICiEgc-8ySBs'; // Replace with your API Key
const sheetRange = 'vwcuOrderTracker!A:Z'; // Adjust based on your sheet tab and range

// Function to fetch data from the sheet
async function fetchData() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${sheetRange}?key=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}

// Function to filter orders by period
async function filterByPeriod(period) {
  const rows = await fetchData();
  if (rows.length === 0) return;

  // Assuming headers are in the first row
  const headers = rows[0];
  const orderDateIndex = headers.indexOf('Order Date');

  // Filter and count unique orders
  const uniqueOrders = filterOrders(rows.slice(1), orderDateIndex, period);

  // Update the count in the sales card
  document.getElementById('orderCount').textContent = uniqueOrders.length;

  // Update the filter label
  document.getElementById('filterLabel').textContent = `| ${capitalizePeriod(period)}`;
}

// Function to filter orders by custom date range
async function filterByCustomPeriod() {
  const rows = await fetchData();
  if (rows.length === 0) return;

  // Get custom date range values
  const startDate = new Date(document.getElementById('startDate').value);
  const endDate = new Date(document.getElementById('endDate').value);

  // Validate the custom period
  if (isNaN(startDate) || isNaN(endDate)) {
    alert('Please select a valid start and end date.');
    return;
  }
  if (startDate > endDate) {
    alert('The start date cannot be after the end date.');
    return;
  }

  // Ensure the end date is inclusive by setting it to the end of the day
  endDate.setHours(23, 59, 59, 999);

  // Assuming headers are in the first row
  const headers = rows[0];
  const orderDateIndex = headers.indexOf('Order Date');

  // Filter and count unique orders
  const uniqueOrders = filterOrdersByDateRange(rows.slice(1), orderDateIndex, startDate, endDate);

  // Update the count in the sales card
  document.getElementById('orderCount').textContent = uniqueOrders.length;

  // Update the filter label
  document.getElementById('filterLabel').textContent = `| Custom Period`;
}

// Helper function to filter orders by custom date range
function filterOrdersByDateRange(orders, dateIndex, startDate, endDate) {
  const orderNumbers = new Set(); // To store unique order numbers

  // Adjust endDate to include the entire day
  endDate.setHours(23, 59, 59, 999);

  orders.forEach(order => {
    const orderDate = new Date(order[dateIndex]);
    const rawOrderNumber = order[0]; // Assuming Order Number is in column 1 (index 0)

    // Extract numeric order number from the raw text
    const orderNumberMatch = rawOrderNumber.match(/\d+/); // Matches the first number
    const orderNumber = orderNumberMatch ? orderNumberMatch[0] : null;

    if (orderNumber && orderDate >= startDate && orderDate <= endDate) {
      orderNumbers.add(orderNumber); // Add only unique order numbers
    }
  });

  return Array.from(orderNumbers); // Return unique order numbers as an array
}


// Helper function to filter orders by custom date range
function filterOrdersByDateRange(orders, dateIndex, startDate, endDate) {
  const orderNumbers = new Set(); // To store unique order numbers

  orders.forEach(order => {
    const orderDate = new Date(order[dateIndex]);
    const orderNumber = order[0]; // Assuming Order Number is in column 1 (index 0)

    if (orderDate >= startDate && orderDate <= endDate) {
      orderNumbers.add(orderNumber);
    }
  });

  return Array.from(orderNumbers); // Return unique order numbers as an array
}

// Helper function to determine if an order's date matches the filter
function shouldIncludeOrder(orderDate, now, period) {
  switch (period) {
    case 'today':
      return orderDate.toDateString() === now.toDateString();
    case 'thisMonth':
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    case 'thisYear':
      return orderDate.getFullYear() === now.getFullYear();
    default:
      return false;
  }
}

// Helper function to capitalize the period for display
function capitalizePeriod(period) {
  return period.charAt(0).toUpperCase() + period.slice(1).replace(/([A-Z])/g, ' $1').trim();
}
