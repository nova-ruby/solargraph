const solargraph    = require("./utils/index")
const { configFor } = require("./helpers")

class SolargraphLanguageServer {
  constructor() {
    /**
     * @type {LanguageClient}
     */
    this.languageClient = null
    this.customRequests = new CustomRequests()
  }

  async activate() {
    if (nova.inDevMode()) console.log("Activating Solargraph...")

    if (this.languageClient) {
      this.languageClient.stop()
      nova.subscriptions.remove(this.languageClient)
    }

    const path = solargraph.commands.helpers.solargraph.path(solargraph.config)
    const args = solargraph.commands.helpers.solargraph.args(solargraph.config)

    const serverOptions = {
      path: path,
      args: [...args, "stdio"],
      env: {
        cwd: nova.workspace.path
      },
      type: "stdio"
    }

    const clientOptions = {
      syntaxes: ["ruby"],
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
        autoformat: false, // Solargraph doest not really support this request
        formatting: configFor(solargraph.config.solargraph.get("formatting")) != "Disabled",
        symbols: false, // Nova does not currently support this request
        definitions: configFor(solargraph.config.solargraph.get("definitions")),
        rename: configFor(solargraph.config.solargraph.get("rename")),
        references: configFor(solargraph.config.solargraph.get("references")),
        folding: false, // Nova does not currently support this request
        logLevel: configFor(solargraph.config.solargraph.get("logLevel")),

        enablePages: true,
        viewsPath: nova.path.join(nova.extension.path, "Scripts", "views")
      }
    }

    const client = new LanguageClient("tommasonegri.solargraph", "Solargraph", serverOptions, clientOptions)

    try {
      client.start()

      nova.subscriptions.add(client)
      this.languageClient = client

      this.customRequests.setLanguageClient(client)

      // Check gem version at startup if specified
      if (configFor(solargraph.config.solargraph.get("checkGemVersion"))) {
        nova.commands.invoke("tommasonegri.solargraph.checkGemVersion")
      }

      // Format on save if specified
      if (configFor(solargraph.config.solargraph.get("formatting")) == "Enabled (on save)") {
        nova.workspace.activeTextEditor.onDidSave((editor) => {
          this.customRequests.formatting(editor)
        })
      }
    } catch (error) {
      console.error(error.message)
    }
  }

  deactivate() {
    if (nova.inDevMode()) console.log("Deactivating Solargraph...")

    if (this.languageClient) {
      this.languageClient.stop()
      nova.subscriptions.remove(this.languageClient)
      this.languageClient = null
    }
  }

  /**
   * Return a bool indicating if the languageClient is running
   * @type {boolean}
   */
  get isRunning() {
    return this.languageClient != null
  }
}

class CustomRequests {
  constructor() {
    /**
     * @type {LanguageClient}
     */
    this.languageClient = null
  }

  /**
   * @param {LanguageClient} languageClient
   */
  setLanguageClient(languageClient) {
    this.languageClient = languageClient
  }

  /**
   * Request a formatting action and apply the response
   * @param {TextEditor} editor
   */
  formatting(editor) {
    if (!this.isRunning) return
    if (configFor(solargraph.config.solargraph.get("formatting")) == "Disabled") return

    solargraph.requests.formatting(this.languageClient, editor)
  }

  /**
   * Request a find references action and display the response
   * @param {TextEditor} editor
   * @return {Object[]} references
   */
  findReferences(editor) {
    if (!this.isRunning) return []
    if (!configFor(solargraph.config.solargraph.get("references"))) return []

    return solargraph.requests.findReferences(this.languageClient, editor)
  }

  /**
   * Return a bool indicating if the languageClient has been set
   * @type {boolean}
   */
  get isRunning() {
    return this.languageClient != null
  }
}

module.exports = SolargraphLanguageServer
