const helpers = require("./helpers")

/**
 * Request a formatting action and apply the response
 * @param {LanguageClient} languageClient
 * @param {TextEditor} editor
 */
module.exports = (languageClient, editor) => {
  languageClient.sendRequest("textDocument/formatting", { textDocument: { uri: editor.document.uri } }).then(response => {
    // RESPONSE
    // [{
    //   range: {
    //     start: { line: Int, character: Int },
    //     end: { line: Int, character: Int }
    //   },
    //   newText: String
    // }]

    response.forEach(formatting => {
      editor.edit((edit) => {
        const range = helpers.lspRangeToRange(editor.document, formatting.range)

        edit.replace(range, formatting.newText)
      })
    })
  })
}
