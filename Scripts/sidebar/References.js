class SidebarReferences {
	constructor() {
		this.tree = new TreeView("tommasonegri.solargraph.sidebar.references", {
			dataProvider: this
		})

		this.rootItems = []

		this.getChildren = this.getChildren.bind(this)
		this.getParent   = this.getParent.bind(this)
		this.getTreeItem = this.getTreeItem.bind(this)
	}

	reload() {
		this.tree.reload()
	}

	dispose() {
		this.tree.dispose()
	}

	/**
	 * Display LSP references in the sidebar.
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

			const path         = scanner.scanChars(Charset.whitespaceAndNewlines.invert())
			const relativePath = uri.includes(nova.workspace.path) ? `.${path.replace(nova.workspace.path, "")}` : path

			const item = new Item(relativePath)

			item.collapsibleState = TreeItemCollapsibleState.Expanded
			item.descriptiveText  = `(${uriReferences.length})`
			item.path             = path
			item.tooltip          = path

			uriReferences.forEach(reference => {
				const childItem = new Item(symbol)

				const line   = reference.range.start.line + 1
				const column = reference.range.start.character + 1

				childItem.descriptiveText = `Ln ${line}, Col ${column}`
				childItem.line            = line
				childItem.column          = column

				item.addChild(childItem)
			})

			rootItems.push(item)
		})

		this.rootItems = rootItems

		this.reload()
	}

	/**
	 * @private
	 * @param {TreeItem} element
	 */
	getChildren(element) {
		if (!this.rootItems?.length > 0) return []

		return !element ? this.rootItems : element.children
	}

	/**
	 * @private
	 * @param {TreeItem} element
	 */
	getParent(element) {
		return element.parent
	}

	/**
	 * @private
	 * @param {TreeItem} element
	 */
	getTreeItem(element) {
		const item = new TreeItem(element.name)

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
		item.column           = element.column

		return item
	}
}

module.exports = SidebarReferences

/**
 * @private
 */
class Item {
	/**
	 * @param {string} name
	 */
	constructor(name) {
		this.name             = name
		this.collapsibleState = TreeItemCollapsibleState.None
		this.command          = "tommasonegri.solargraph.sidebar.references.commands.openFile"
		this.color            = null
		this.contextValue     = null
		this.descriptiveText  = ""
		this.identifier       = null
		this.image            = null
		this.path             = null
		this.tooltip          = ""

		this.line             = null
		this.column           = null

		this.children         = []
		this.parent           = null
	}

	/**
	 * @param {Item} item
	 */
	addChild(item) {
		item.parent = this
		this.children = [...this.children, item]
	}
}
