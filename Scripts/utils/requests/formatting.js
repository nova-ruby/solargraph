const helpers = require("./helpers")

/**
 * Send a formatting request to the server and return the response.
 * @param {LanguageClient} languageClient
 * @param {TextEditor} editor
 * @return {Promise<TextEdits[]>}
 */
module.exports = (languageClient, editor) => {
	const params = {
		textDocument: {
			uri: editor.document.uri
		},
		options: {
			tabSize: editor.tabLength,
			insertSpaces: editor.softTabs
		}
	}

	return languageClient.sendRequest("textDocument/formatting", params)
}
