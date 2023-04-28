const solargraph    = require("./utils/index")
const { configFor } = require("./helpers")

class LanguageServer {
	constructor() {
		/** @type {LanguageClient} */
		this.languageClient = null

		/** @type {CustomRequests} */
		this.customRequests = new CustomRequests()

		/** @type {Disposable[]} */
		this.formatOnSaveEventHandlers = []
	}

	async activate() {
		if (nova.inDevMode()) console.log("Activating Solargraph...")

		if (this.languageClient) {
			this.languageClient.stop()
			nova.subscriptions.remove(this.languageClient)

			this.formatOnSaveEventHandlers.forEach(handler => handler.dispose())
		}

		const path = solargraph.commands.helpers.solargraph.path(solargraph.config)
		const args = solargraph.commands.helpers.solargraph.args(solargraph.config)

		const useBundler  = configFor(solargraph.config.solargraph.get("useBundler"))
		const bundlerPath = configFor(solargraph.config.solargraph.get("bundlerPath"))

		if (useBundler && bundlerPath) {
			args[1] = args[1] + " stdio"
		} else {
			args[1] = "stdio"
		}

		const serverOptions = {
			path: path,
			args: args,
			type: "stdio",
			env: nova.workspace.config.get("tommasonegri.solargraph.workspace.env") || {}
		}

		const clientOptions = {
			syntaxes: solargraph.SYNTAXES,
			debug: false,
			initializationOptions: {
				transport: "stdio",
				commandPath: configFor(solargraph.config.solargraph.get("commandPath")),
				useBundler: configFor(solargraph.config.solargraph.get("useBundler")),
				bundlerPath: configFor(solargraph.config.solargraph.get("bundlerPath")),
				checkGemVersion: configFor(solargraph.config.solargraph.get("checkGemVersion")),
				completion: configFor(solargraph.config.solargraph.get("completion")),
				hover: configFor(solargraph.config.solargraph.get("hover")),
				diagnostics: configFor(solargraph.config.solargraph.get("diagnostics")),
				autoformat: false, // Solargraph doest not truly support this request
				formatting: configFor(solargraph.config.solargraph.get("formatting")) != false,
				symbols: configFor(solargraph.config.solargraph.get("symbols")),
				definitions: configFor(solargraph.config.solargraph.get("definitions")),
				rename: configFor(solargraph.config.solargraph.get("rename")),
				references: configFor(solargraph.config.solargraph.get("references")),
				folding: false, // Nova does not expose this api
				logLevel: configFor(solargraph.config.solargraph.get("logLevel")),

				enablePages: false,
				viewsPath: null
			}
		}

		const client = new LanguageClient("tommasonegri.solargraph", "Solargraph", serverOptions, clientOptions)

		try {
			client.start()

			nova.workspace.config.remove("tommasonegri.solargraph.internals.server.error")

			nova.subscriptions.add(client)
			this.languageClient = client

			this.customRequests.setLanguageClient(client)

			// Respond to restart server notification
			client.onNotification("$/solargraph/restartServer", () => {
				nova.commands.invoke("tommasonegri.solargraph.restart")
			})

			// Check gem version at startup if specified
			if (configFor(solargraph.config.solargraph.get("checkGemVersion"))) {
				client.sendNotification('$/solargraph/checkGemVersion', { verbose: false })
			}

			// Format on save if specified
			if (configFor(solargraph.config.solargraph.get("formatting")) == "onsave") {
				const didAddTextEditorHandler = nova.workspace.onDidAddTextEditor((editor) => {
					if (!solargraph.SYNTAXES.includes(editor.document.syntax)) return

					const willSaveHandler = editor.onWillSave(async (editor) => {
						await nova.commands.invoke("tommasonegri.solargraph._format", editor, { verbose: false })
					})

					const didDestroyHandler = editor.onDidDestroy(() => {
						willSaveHandler.dispose()
					})

					this.formatOnSaveEventHandlers.push(willSaveHandler)
					this.formatOnSaveEventHandlers.push(didDestroyHandler)
				})

				this.formatOnSaveEventHandlers.push(didAddTextEditorHandler)
			}

			// Populate symbols sidebar
			if (configFor(solargraph.config.solargraph.get("symbols"))) {
				setTimeout(() => {
					nova.commands.invoke("tommasonegri.solargraph.sidebar.symbols.commands.refresh")
				}, 2000)
			}

			// Check if the server stopped or crashed
			client.onDidStop((error) => {
				if (error) {
					nova.workspace.config.set("tommasonegri.solargraph.internals.server.error", true)

					console.error(error)

					const message  = `Server stopped unexpectedly: ${error}\n\nIf you are not going to use Solargraph in this project and want to silence this message, disable the server from the project settings.`
					const options  = { buttons: ["OK", "Project settings"] }
					const callback = (action) => {
						switch (action) {
							case 0:
								break
							case 1:
								nova.workspace.openConfig()
								break
						}
					}

					nova.workspace.showActionPanel(message, options, callback)
				}
			})
		} catch (error) {
			console.error(error.message)
		}
	}

	deactivate() {
		if (nova.inDevMode()) console.log("Deactivating Solargraph...")

		nova.workspace.config.remove("tommasonegri.solargraph.internals.server.error")

		if (this.languageClient) {
			this.languageClient.stop()
			nova.subscriptions.remove(this.languageClient)
			this.languageClient = null
		}

		this.formatOnSaveEventHandlers.forEach(handler => handler.dispose())
	}
}

/** @private */
class CustomRequests {
	constructor() {
		/** @type {LanguageClient} */
		this.languageClient = null
	}

	/**
	 * Send a formatting request to the server and return the response.
	 * @param {TextEditor} editor
	 * @param {object} options
	 * @param {boolean} [options.verbose=true]
	 * @returns {Promise<TextEdits[]>}
	 */
	formatting(editor, options) {
		const { verbose = true } = options

		if (!nova.workspace.config.get("tommasonegri.solargraph.workspace.enabled")) {
			if (verbose) console.warn("Impossible to format the document: server not enabled in the project.")
			return []
		}
		if (nova.workspace.config.get("tommasonegri.solargraph.internals.server.error")) {
			if (verbose) console.warn("Impossible to format the document: server not running.")
			return []
		}

		if (configFor(solargraph.config.solargraph.get("formatting")) == false) {
			const message  = "Document formatting is disabled. You can enable it from the extension or project settings."
			const options  = { buttons: ["OK", "Project settings", "Extension settings"] }
			const callback = (action) => {
				switch (action) {
					case 0:
						break
					case 1:
						nova.workspace.openConfig()
						break
					case 2:
						nova.openConfig()
						break
				}
			}

			nova.workspace.showActionPanel(message, options, callback)

			return []
		}

		return solargraph.requests.formatting(this.languageClient, editor)
	}

	/**
	 * Send a find references request to the server and return the response.
	 * @param {TextEditor} editor
	 * @return {Promise<Location[]>}
	 */
	findReferences(editor) {
		if (!nova.workspace.config.get("tommasonegri.solargraph.workspace.enabled")) {
			console.warn("Impossible to find references: server not enabled in the project.")
			return []
		}
		if (nova.workspace.config.get("tommasonegri.solargraph.internals.server.error")) {
			console.warn("Impossible to find references: server not running.")
			return []
		}

		if (!configFor(solargraph.config.solargraph.get("references"))) {
			const message  = "Finding references is disabled. You can enable it from the extension or project settings."
			const options  = { buttons: ["OK", "Project settings", "Extension settings"] }
			const callback = (action) => {
				switch (action) {
					case 0:
						break
					case 1:
						nova.workspace.openConfig()
						break
					case 2:
						nova.openConfig()
						break
				}
			}

			nova.workspace.showActionPanel(message, options, callback)

			return []
		}

		return solargraph.requests.findReferences(this.languageClient, editor)
	}

	/**
	 * Send a find workspace symbol request to the server and return the response.
	 * @return {Promise<SymbolInformation[]>}
	 */
	findSymbols() {
		if (!nova.workspace.config.get("tommasonegri.solargraph.workspace.enabled")) {
			console.warn("Impossible to find workspace symbols: server not enabled in the project.")
			return []
		}
		if (nova.workspace.config.get("tommasonegri.solargraph.internals.server.error")) {
			console.warn("Impossible to find workspace symbols: server not running.")
			return []
		}

		if (!configFor(solargraph.config.solargraph.get("symbols"))) {
			const message  = "Symbols are disabled. You can enable them from the extension or project settings."
			const options  = { buttons: ["OK", "Project settings", "Extension settings"] }
			const callback = (action) => {
				switch (action) {
					case 0:
						break
					case 1:
						nova.workspace.openConfig()
						break
					case 2:
						nova.openConfig()
						break
				}
			}

			nova.workspace.showActionPanel(message, options, callback)

			return []
		}

		return solargraph.requests.findSymbols(this.languageClient)
	}

	/**
	 * Send a rename workspace symbol request to the server and return the response.
	 * @param {TextEditor} editor
	 * @return {Promise<WorkspaceEdit>}
	 */
	async renameSymbol(editor) {
		if (!nova.workspace.config.get("tommasonegri.solargraph.workspace.enabled")) {
			console.warn("Impossible to find workspace symbols: server not enabled in the project.")
			return []
		}
		if (nova.workspace.config.get("tommasonegri.solargraph.internals.server.error")) {
			console.warn("Impossible to find workspace symbols: server not running.")
			return []
		}

		if (!configFor(solargraph.config.solargraph.get("rename"))) {
			const message  = "Renaming symbols is disabled. You can enable it from the extension or project settings."
			const options  = { buttons: ["OK", "Project settings", "Extension settings"] }
			const callback = (action) => {
				switch (action) {
					case 0:
						break
					case 1:
						nova.workspace.openConfig()
						break
					case 2:
						nova.openConfig()
						break
				}
			}

			nova.workspace.showActionPanel(message, options, callback)

			return []
		}

		/** @type {Promise<string | null>} */
		const newName = await new Promise((resolve) => {
			nova.workspace.showInputPalette("New name for symbol", {
				placeholder: editor.selectedText,
				value: editor.selectedText,
			}, resolve)
		})

		if (!newName) return []

		console.log(newName)

		return solargraph.requests.renameSymbol(this.languageClient, editor, newName)
	}

	/** @param {LanguageClient} languageClient */
	setLanguageClient(languageClient) {
		this.languageClient = languageClient
	}
}

module.exports = LanguageServer
