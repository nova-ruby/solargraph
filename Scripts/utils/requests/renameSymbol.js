const helpers = require("./helpers")

/**
 * Send a rename workspace symbol request to the server and return the response.
 * @param {LanguageClient} languageClient
 * @param {TextEditor} editor
 * @param {string} newName
 * @return {Promise<WorkspaceEdit>}
 */
module.exports = (languageClient, editor, newName) => {
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
		newName
	}

	return languageClient.sendRequest("textDocument/rename", params)
}
