const helpers = require("./helpers")

/**
 * Send a find references request to the server and return the response.
 * @param {LanguageClient} languageClient
 * @param {TextEditor} editor
 * @return {Promise<Location[]>}
 */
module.exports = (languageClient, editor) => {
	const position = helpers.rangeToLspRange(editor.document, editor.selectedRange)?.start

	if (!position) {
		nova.workspace.showWarningMessage("Couldn't figure out what you've selected.")
		return []
	}

	const params = {
		textDocument: {
			uri: editor.document.uri
		},
		position,
		context: {
			includeDeclaration: true
		}
	}

	return languageClient.sendRequest("textDocument/references", params)
}
