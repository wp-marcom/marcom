// ============================================================
// PACKING SLIP CONFIG
// Edit this file when the master spreadsheet layout changes
// (more/fewer stores, more/fewer products, different columns).
// Everything the generator needs to know lives here.
// ============================================================

module.exports = {
  // Path to the input spreadsheet (can be overridden with a CLI arg)
  inputFile: './sample.xlsx',

  // Worksheet name to read from. Set to null to just use the first sheet.
  sheetName: null,

  // ---- Store info (one row per store) ----
  store: {
    numberCol: 'A',
    nameCol: 'B',
    stateCol: 'C',
    // Number of days it takes to ship to this store. Within each box's PDF,
    // stores with a HIGHER number here are listed first (pack those first).
    shipDaysCol: 'D',
    // First row containing actual store data
    dataStartRow: 4,
    // If null, the script auto-detects the last row by stopping at the
    // first row where numberCol is blank. Set a number to hard-cap it.
    dataEndRow: null,
  },

  // ---- Product info (one column per product, reading across) ----
  product: {
    // First column containing a product (matches store.dataStartRow's column direction)
    startCol: 'E',
    // If null, auto-detects the last product column by stopping at the
    // first column where the name row is blank. Set a column letter (e.g. 'DA')
    // to hard-cap it instead.
    endCol: null,

    boxRow: 1,   // row containing the box number for each product column
    nameRow: 2,  // row containing the product name
    codeRow: 3,  // row containing the product code
  },

  // ---- Output ----
  output: {
    dir: './output',
    // true: one PDF per box number, containing every store that needs that box.
    // false: a single combined PDF with every store/box page (old behavior).
    splitByBox: true,
    // Used when splitByBox is true. {box} is replaced with the box number/label.
    boxFileNamePattern: 'box-{box}.pdf',
    // Used when splitByBox is false.
    combinedFileName: 'packing-slips.pdf',
  },

  // ---- Table layout (points; Letter page is 612x792 with 50pt margins) ----
  table: {
    codeColWidth: 110,
    qtyColWidth: 50,
    // name column gets whatever content width is left over — this lets
    // long product names wrap onto multiple lines instead of overlapping
  },
};
