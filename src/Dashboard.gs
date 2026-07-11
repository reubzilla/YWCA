/**
 * Reads a sheet and returns each row as an object.
 *
 * The first row must contain column headings.
 *
 * @param {string} sheetName
 * @return {Object[]}
 */
function getSheetObjects_(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`The sheet "${sheetName}" could not be found.`);
  }

  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map(header =>
    String(header).trim()
  );

  return values
    .slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const item = {};

      headers.forEach((header, index) => {
        item[header] = row[index];
      });

      return item;
    });
}
