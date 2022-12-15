const ReferencesView = require("./sidebar/ReferencesView")

class SolargraphSidebar {
  constructor() {
    /**
     * @type {ReferencesView}
     */
    this.referencesView = null

    this.activate()
  }

  activate() {
    if (this.referencesView) {
      this.referencesView.deactivate()
      nova.subscriptions.remove(this.referencesView)
    }

    this.referencesView = new ReferencesView()
    nova.subscriptions.add(this.referencesView)
  }

  dispose() {}

  /**
   * Take LSP references and display them in a sidebar
   * @param {String} symbol
   * @param {Object[]} references
   */
  displaySymbolReferences(symbol, references) {
    if (this.referencesView) {
      this.referencesView.display(symbol, references)
    }
  }
}

module.exports = SolargraphSidebar
