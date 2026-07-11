/**
 * Entry point for the Club Portal web app.
 */
function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle(CONFIG.APP_TITLE);
}
