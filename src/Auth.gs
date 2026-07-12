/**
 * Entry point for the Club Portal web app.
 */
function doGet() {
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle(CONFIG.APP_TITLE);
}
