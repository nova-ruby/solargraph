const helpers = require("./helpers")

/**
 * Request a find references action and display the response
 * @param {LanguageClient} languageClient
 * @param {TextEditor} editor
 * @return {Object[]}
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

  return languageClient.sendRequest("textDocument/references", params).then(response => {
    // RESPONSE
    // [{
    //   uri: String,
    //   range: {
    //     start: { line: Int, character: Int },
    //     end: { line: Int, character: Int }
    //   }
    // }]

    return response
  })
}
