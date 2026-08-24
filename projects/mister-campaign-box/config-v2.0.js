// ============================================================
// PACKING SLIP CONFIG
// Edit this file when the master spreadsheet layout changes
// (more/fewer stores, more/fewer products, different columns).
// Everything the generator needs to know lives here.
// ============================================================

module.exports = {
  // Path to the input spreadsheet (can be overridden with a CLI arg)
 inputFile: './IncomingKeys/Shipping Key NB Blitz sorted-prepped.xlsx',

  // Worksheet name to read from. Set to null to just use the first sheet.
  sheetName: null,

  // ---- Store info (one row per store) ----
  store: {
    numberCol: 'D',
    nameCol: 'E',
    stateCol: 'I',
        // Optional. Set to a column letter to print the store's address under
    // the "Store #..." line on every page. Set to null to omit it.
    addressCol: 'G',
    // Legacy fallback: only used when transitTimes.enabled (below) is false.
    // Number of days it takes to ship to this store.

    shipDaysCol: 'J',
    // First row containing actual store data
    dataStartRow: 5,
    // If null, the script auto-detects the last row by stopping at the
    // first row where numberCol is blank. Set a number to hard-cap it.
    dataEndRow: null,
  },

  // ---- Product info (one column per product, reading across) ----
  product: {
    // First column containing a product (matches store.dataStartRow's column direction)
    startCol: 'O',
    // If null, auto-detects the last product column by stopping at the
    // first column where the name row is blank. Set a column letter (e.g. 'DA')
    // to hard-cap it instead.
    endCol: null,

    boxRow: 1,   // row containing the box number for each product column
    nameRow: 3,  // row containing the product name
    codeRow: 4,  // row containing the product code
  },

  // ---- Transit time lookup (separate workbook) ----
  // When enabled, ship-days AND local-delivery-ticket eligibility come from
  // this file instead of a column in the master spreadsheet — look up each
  // store number in storeNumberCol, read the matching row.
  transitTimes: {
    enabled: true,
    file: './TransitTimes.xlsx',
    sheetName: null, // null = first sheet
    dataStartRow: 2, // row 1 assumed to be a header row
    storeNumberCol: 'A',
    transitDaysCol: 'B',
    // Optional. 'Yes'/'No' (case-insensitive; y/true/1 also count as yes).
    // Stores marked Yes get an EXTRA page in LocalDeliveryTickets.pdf,
    // on top of their normal packing-slip pages. Set to null if you don't
    // use this column.
    deliveryTicketCol: 'C',
  },

  // ---- Campaign ----
  // Used in the {campaign} placeholder in output.leadTimeFileNamePattern.
  // Override per-run with a CLI arg: node generate-packing-slips.js input.xlsx "Campaign Name"
  campaign: {
    name: 'NewBuildBlitzWave4',
  },

  // ---- Output ----
  output: {
    dir: './output/NewBuildBlitzWave4-SignatureClusters-deliverytickets',
    // 'perBoxAndLeadTime': one PDF per (box, ship-days) combo — e.g. all
    //     4-day-transit stores that need Box 1 go in one file. Stores stay
    //     in the same order they appear in the spreadsheet.
    // 'perBox': one PDF per box number, all ship times mixed together.
    // 'combined': a single PDF with every store/box page.
    mode: 'perBoxAndLeadTime',

    // Used when mode is 'perBoxAndLeadTime'. Placeholders: {campaign} {shipDays} {box}
    // A store with no ship-days value fills in "unknown" for {shipDays}.
    leadTimeFileNamePattern: '{campaign}-{shipDays}day-Box{box}.pdf',
    // Used when mode is 'perBox'. Placeholder: {box}
    boxFileNamePattern: 'box-{box}.pdf',
    // Used when mode is 'combined'.
    combinedFileName: 'packing-slips.pdf',

    // Written whenever transitTimes.deliveryTicketCol flags any stores Yes,
    // regardless of output.mode. One page per flagged store, in config.output.dir.
    localDeliveryTicketsFileName: 'LocalDeliveryTickets-Print2copies.pdf',
  },

  // ---- Packing slip page elements ----
  slip: {
    packedByLine: {
      enabled: true,
      label: 'Packed By:',
    },
    // Within each box+ship-days file, cluster stores that need the exact
    // same products and quantities so the team can batch-pack them.
    groupIdenticalOrders: {
      enabled: true,
      showBadge: true, // print a note on the page when a store is part of an identical-order group
    },
    // Adds a summary page as the first page of each box+ship-days PDF,
    // listing every identical-order cluster ("make 15 of this exact
    // list") largest first. Uses the same grouping as groupIdenticalOrders
    // even if that toggle's badge/reordering is turned off.
    summaryPage: {
      enabled: true,
    },
    // Signature block at the bottom of each LocalDeliveryTickets.pdf page
    // (replaces packedByLine on those pages).
    receivedByLine: {
      enabled: true,
      label1: 'Received By:',
      label2: 'Date:',
    },
  },

  // ---- Table layout (points; Letter page is 612x792 with 50pt margins) ----
  table: {
    codeColWidth: 110,
    qtyColWidth: 50,
    // name column gets whatever content width is left over — this lets
    // long product names wrap onto multiple lines instead of overlapping
  },

  // ---- Optional header/letterhead template ----
  // If enabled, every generated page is stamped on top of headerFile
  // (e.g. a pre-made 8.5x11 PDF with your logo/address at the top).
  // contentTopMargin pushes the generated content down so it starts
  // below the artwork. Side margins (MARGIN in the script) stay the same.
  header: {
    enabled: true,
    file: './header.pdf',
    contentTopMargin: 108, // 1.5in * 72pt/in
  },
};
