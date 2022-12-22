const helpers = require("./helpers")

/**
 * Send a find workspace symbol request to the server and return the response.
 * @param {LanguageClient} languageClient
 * @return {Promise<SymbolInformation[]>}
 */
module.exports = (languageClient) => {
	return languageClient.sendRequest("workspace/symbol")
}
