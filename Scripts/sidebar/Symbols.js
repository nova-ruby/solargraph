class SidebarSymbols {
	constructor() {
		this.tree = new TreeView("tommasonegri.solargraph.sidebar.symbols", {
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
	 * Display LSP symbols in the sidebar.
	 * @param {Object[]} symbols
	 */
	display(symbols) {
		const rootItems = []

		symbols.forEach(symbol => {
			const item = new TreeItem(symbol.name)

			item.command = "tommasonegri.solargraph.sidebar.symbols.commands.openFile"
			item.image   = symbolImages[symbol.kind] ? `__symbol.${symbolImages[symbol.kind]}` : ""
			item.path    = symbol.location.uri

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

		item.command = element.command
		item.image   = element.image
		item.path    = element.path

		return item
	}
}

module.exports = SidebarSymbols

const symbolImages = {
	1: "file",
	2: "package", // Module
	3: "package", // Namespace
	4: "package",
	5: "class",
	6: "method",
	7: "property",
	8: "property", // Field
	9: "constructor",
	10: "enum",
	11: "interface",
	12: "function",
	13: "variable",
	14: "constant",
	15: "variable", // String
	16: "variable", // Number
	17: "variable", // Boolean
	18: "variable", // Array
	19: "variable", // Object
	20: "keyword", // Key
	21: "variable", // Null
	22: "enum-member",
	23: "struct",
	24: "variable", // Event
	25: "expression", // Operator
	26: "type", // TypeParameter
}
