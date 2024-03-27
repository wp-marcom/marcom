// showData.js

function showData(dataArray) {
  var table = $('#data-table').DataTable({
    data: dataArray,
    columns: [
      {"title": "Product Name"}, // Disable sorting for the first column
      {"title": "SKU"},
      {"title": "Location"},
      {"title": "Unit"},
      {"title": "Unit Qty"},
      {"title": "Min Qty"},
      {"title": "Refill Qty"},
      {"title": "QOS"},
      {"title": "Status"},
      {"title": "Notes"}
    ],
    order: [], // Disable initial sorting
    pageLength: 100, // Set default number of entries per page to 100
    columnDefs: [
      {targets: [0, 1, 2, 3, 4, 5, 6, 7, 8], className: 'text-nowrap'}, // Apply 'text-nowrap' class to columns 0 to 8
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
}
