const LanguageServer       = require("./LanguageServer")
const Sidebar              = require("./Sidebar")
const solargraph           = require("./utils/index")
const { showNotification } = require("./helpers")

/** @type {LanguageServer} */
let langserver = null

/** @type {Sidebar} */
let sidebar = null

let skipFormatOnSave = false

/** Activate the extension. */
exports.activate = async function() {
	langserver = new LanguageServer()

	if (nova.workspace.config.get("tommasonegri.solargraph.workspace.enabled")) {
		langserver.activate()
	}

	sidebar = new Sidebar()
}

/** Deactivate the extension. */
exports.deactivate = function() {
	if (langserver) {
		langserver.deactivate()
		langserver = null
	}
}

/** Reload the extension. */
const reload = () => {
	exports.deactivate()
	exports.activate()
}

// Restart command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.restart", () => {
		if (!nova.workspace.config.get("tommasonegri.solargraph.workspace.enabled")) {
			showNotification({
				title: "Impossible to restart the server",
				body: "The server is disabled in the current project. Go to the project settings to enable it.",
				actions: ["OK", "Project settings"],
				handler: (response) => {
					switch (response.actionIdx) {
						case 0:
							break
						case 1:
							nova.workspace.openConfig()
							break
					}
				}
			})

			console.warn("Impossible to restart the server: server not enabled in the project.")
			return
		}

		reload()
		showNotification({ title: "Solargraph server restarted" })
	})
)

// Generate configuration command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.config", async () => {
		try {
			await solargraph.commands.solargraph(["config"], solargraph.config)

			showNotification({
				title: "Config file generated",
				body: "You should see a new .solargraph.yml file in the root of the project."
			})
		} catch (error) {
			const message = "Something went wrong creating .solargraph.yml file."

			nova.workspace.showErrorMessage(`${message}\n\nCheck out the Extension Console for more info.`)
			console.error(`${message}\n\n${error}`)
		}
	})
)

// Check gem version command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.checkGemVersion", () => {
		if (nova.workspace.config.get("tommasonegri.solargraph.internals.server.error")) {
			console.warn("Impossible to check gem version: server not running.")
			return
		}

		langserver.languageClient.sendNotification("$/solargraph/checkGemVersion", { verbose: true })
	})
)

// Internal format command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph._format", async (_, editor, options = {}) => {
		if (skipFormatOnSave) {
			skipFormatOnSave = false
			return
		}

		const textEdits = await langserver.customRequests.formatting(editor, options)

		textEdits.forEach((textEdit) => {
			solargraph.requests.helpers.applyTextEdit(editor, textEdit)
		})
	})
)

// Internal rename symbol command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph._rename", async (_, editor) => {
		const workspaceEdit = await langserver.customRequests.renameSymbol(editor)
		const files         = Object.keys(workspaceEdit.changes)
		const relativeFiles = files.map(file => {
			const path = file.replace("file:/", "")
			return `./${nova.workspace.relativizePath(path)}`
		})
		const changes       = Object.entries(workspaceEdit.changes)

		/** @type {boolean} */
		const confirmation = await new Promise((resolve) => {
			const message  = `Are you sure? The following files will be modified:\n\n${relativeFiles.join("\n")}`
			const options  = { buttons: ["Confirm changes", "Cancel"] }
			const callback = (action) => {
				switch (action) {
					case 0:
						resolve(true)
						break
					case 1:
						resolve(false)
						break
				}
			}

			nova.workspace.showActionPanel(message, options, callback)
		})

		if (confirmation) {
			for ([uri, textEdits] of changes) {
				const editor = await nova.workspace.openFile(uri)

				if (!editor) return

				textEdits.forEach(textEdit => {
					solargraph.requests.helpers.applyTextEdit(editor, textEdit)
				})

				editor.save()
			}
		}
	})
)

// EDITOR COMMANDS

// Format command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.editor.format", (editor) => {
		nova.commands.invoke("tommasonegri.solargraph._format", editor)
	})
)

// Save without formatting command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.editor.saveWithoutFormatting", (editor) => {
		if (nova.workspace.config.get("tommasonegri.solargraph.workspace.enabled")) {
			skipFormatOnSave = true
		}

		editor.save()
	})
)

// Find references command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.editor.findReferences", async (editor) => {
		const symbol     = editor.selectedText
		const references = await langserver.customRequests.findReferences(editor)

		sidebar.references.display(symbol, references)
	})
)

// Rename command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.editor.rename", (editor) => {
		nova.commands.invoke("tommasonegri.solargraph._rename", editor)
	})
)

// SIDEBAR COMMANDS

// References - Open file command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.sidebar.references.commands.openFile", () => {
		const selection = sidebar.references.tree.selection[0]
		const path      = selection.path || selection.parent.path

		nova.workspace.openFile(path, {
			line: selection.line,
			column: selection.column
		})
	})
)

// Symbols - Refresh command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.sidebar.symbols.commands.refresh", async () => {
		const symbols = await langserver.customRequests.findSymbols()

		sidebar.symbols.display(symbols)
	})
)

// Symbols - Open file command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.sidebar.symbols.commands.openFile", () => {
		const selection = sidebar.symbols.tree.selection[0]
		const path      = selection.path

		nova.workspace.openFile(path)
	})
)

// SETTINGS COMMANDS

// Restore default settings command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.restoreSettings", () => {
		solargraph.config.keys.forEach(key => {
			nova.config.remove(key)
		})

		showNotification({
			title: "Extension settings restored",
			body: "Restarting the server..."
		})

		nova.commands.invoke("tommasonegri.solargraph.restart")
	})
)

// Restore default workspace settings command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.restoreWorkspaceSettings", () => {
		solargraph.config.keys.forEach(key => {
			nova.workspace.config.remove(key)
		})
		nova.workspace.config.remove("tommasonegri.solargraph.workspace.enabled")

		showNotification({
			title: "Workspace settings restored",
			body: "Restarting the server..."
		})

		nova.commands.invoke("tommasonegri.solargraph.restart")
	})
)
