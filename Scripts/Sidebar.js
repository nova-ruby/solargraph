const SidebarReferences = require("./sidebar/References")
const SidebarSymbols    = require("./sidebar/Symbols")

class Sidebar {
	constructor() {
		this.references = new SidebarReferences()
		nova.subscriptions.add(this.references)

		this.symbols = new SidebarSymbols()
		nova.subscriptions.add(this.symbols)
	}
}

module.exports = Sidebar
