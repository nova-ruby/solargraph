const LanguageServer       = require("./LanguageServer")
const Sidebar              = require("./Sidebar")
const solargraph           = require("./utils/index")
const { showNotification } = require("./helpers")

/** @type {LanguageServer} */
let langserver = null

/** @type {Sidebar} */
let sidebar = null

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
	nova.workspace.config.remove("tommasonegri.solargraph.internals.skipFormatOnSave")

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

// Check gem version command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.checkGemVersion", () => {
		if (nova.workspace.config.get("tommasonegri.solargraph.internals.stopped")) {
			console.warn("Impossible to check gem version: server not running.")
			return
		}

		langserver.languageClient.sendNotification("$/solargraph/checkGemVersion", { verbose: true })
	})
)

// TODO: Make sure config command is safe
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

// EDITOR COMMANDS

// Internal format command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.editor._format", async (_, editor, options = {}) => {
		if (nova.workspace.config.get("tommasonegri.solargraph.internals.skipFormatOnSave")) {
			nova.workspace.config.remove("tommasonegri.solargraph.internals.skipFormatOnSave")
			return
		}

		const textEdits = await langserver.customRequests.formatting(editor, options)

		textEdits.forEach((textEdit) => {
			solargraph.requests.helpers.applyTextEdit(editor, textEdit)
		})
	})
)

// Format command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.editor.format", (editor) => {
		nova.commands.invoke("tommasonegri.solargraph.editor._format", editor)
	})
)

// TODO: Make sure command is safe
// Save without formatting command
nova.subscriptions.add(
	nova.commands.register("tommasonegri.solargraph.editor.saveWithoutFormatting", (editor) => {
		if (nova.workspace.config.get("tommasonegri.solargraph.workspace.enabled")) {
			nova.workspace.config.set("tommasonegri.solargraph.internals.skipFormatOnSave", true)
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
