class ReferencesView {
  constructor() {
    this.tree = new TreeView("tommasonegri.solargraph.sidebar.references", {
      dataProvider: this
    })

    this.rootItems = []

    this.getChildren = this.getChildren.bind(this)
    this.getTreeItem = this.getTreeItem.bind(this)
  }

  reload() {
    this.tree.reload()
  }

  deactivate() {
    this.dispose()
  }

  dispose() {
    this.tree.dispose()
  }

  /**
   * Take LSP references and display them in a sidebar
   * @param {String} symbol
   * @param {Object[]} references
   */
  display(symbol, references) {
    const rootItems = []
    const uris      = new Set()

    references.forEach(reference => uris.add(reference.uri))

    uris.forEach(uri => {
      const uriReferences = references.filter(reference => reference.uri == uri)
      const scanner       = new Scanner(uri)

      scanner.scanString("file://")

      const path = scanner.scanChars(Charset.whitespaceAndNewlines.invert())
      const relativePath = uri.includes(nova.workspace.path) ? `.${path.replace(nova.workspace.path, "")}` : path

      const item = new ReferencesItem(relativePath)

      item.collapsibleState = TreeItemCollapsibleState.Expanded
      item.descriptiveText  = `(${uriReferences.length})`
      item.path             = path
      item.tooltip          = path

      uriReferences.forEach(reference => {
        const childItem = new ReferencesItem(symbol)

        const line = reference.range.start.line + 1
        const column = reference.range.start.character + 1

        childItem.descriptiveText = `Ln ${line}, Col ${column}`

        item.addChild(childItem)
      })

      rootItems.push(item)
    })

    this.rootItems = rootItems

    this.reload()
  }

  // Private

  getChildren(element) {
    if (!this.rootItems?.length > 0) return []

    if (!element) {
      return this.rootItems
    } else {
      return element.children
    }
  }

  getParent(element) {
    return element.parent
  }

  getTreeItem(element) {
    let item = new TreeItem(element.name)

    item.collapsibleState = element.collapsibleState
    item.command          = element.command
    item.color            = element.color
    item.contextValue     = element.contextValue
    item.descriptiveText  = element.descriptiveText
    item.identifier       = element.identifier
    item.image            = element.image
    item.path             = element.path
    item.tooltip          = element.tooltip

    item.line             = element.line

    return item
  }
}

module.exports = ReferencesView

class ReferencesItem {
  /**
   * @param {string} name
   */
  constructor(name) {
    this.name             = name
    this.collapsibleState = TreeItemCollapsibleState.None
    this.command          = "tommasonegri.bridgetown.commands.sidebar.notes.openFile"
    this.color            = null
    this.contextValue     = null
    this.descriptiveText  = ""
    this.identifier       = null
    this.image            = null
    this.path             = null
    this.tooltip          = ""

    this.line             = null

    this.children         = []
    this.parent           = null
  }

  /**
   * @param {ReferencesItem} item
   */
  addChild(item) {
    item.parent = this
    this.children  = [...this.children, item]
  }
}
