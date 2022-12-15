const SolargraphLanguageServer  = require("./LanguageServer")
const SolargraphWebviewProvider = require("./WebviewProvider")
const SolargraphSidebar         = require("./Sidebar")
const solargraph                = require("./utils/index")
const {
  showNotification,
  debounce,
  parseURI,
  buildGemDocs
} = require("./helpers")

/**
 * Solargraph language server
 * @type {SolargraphLanguageServer}
 */
let langserver = null

/**
 * Web view provider
 * @type {SolargraphWebviewProvider}
 */
let webViewProvider = null

/**
 * Extension sidebar
 * @type {SolargraphSidebar}
 */
let sidebar = null

exports.activate = function() {
  langserver = new SolargraphLanguageServer()
  langserver.activate()

  webViewProvider = new SolargraphWebviewProvider(langserver.languageClient)
  nova.subscriptions.add(webViewProvider)

  sidebar = new SolargraphSidebar()
  nova.subscriptions.add(sidebar)

  solargraph.config.keys.forEach(key => {
    const globalListener = nova.config.onDidChange(key, debounce(reload, 500))
    nova.subscriptions.add(globalListener)

    const workspaceListener = nova.workspace.config.onDidChange(key, debounce(reload, 500))
    nova.subscriptions.add(workspaceListener)
  })
}

exports.deactivate = function() {
  if (langserver) {
    langserver.deactivate()
    langserver = null
  }
}

const reload = () => {
  exports.deactivate()
  exports.activate()
}

// Open URL command (used internally for browsing documentation pages)
nova.subscriptions.add(
  nova.commands.register("tommasonegri.solargraph._openDocumentUrl", (_, uriString) => {
    if (webViewProvider) {
      const uri = parseURI(uriString)
      webViewProvider.open(uri)
    } else {
      console.warn("Solargraph cannot find the web view provider.")
    }
  })
)

// Restart command
nova.subscriptions.add(
  nova.commands.register("tommasonegri.solargraph.restart", () => {
    reload()
    showNotification({ title: "Solargraph server restarted." })
  })
)

// Search command
nova.subscriptions.add(
  nova.commands.register("tommasonegri.solargraph.search", () => {
    nova.workspace.showInputPalette("Search Ruby documentation", { placeholder: "Search..." }, (input) => {
      if (!input) return

      if (webViewProvider) {
        const searchCommand = `solargraph:/search?query=${encodeURIComponent(input)}`
        const uri = parseURI(searchCommand)
        webViewProvider.open(uri)
      } else {
        console.warn("Solargraph cannot find the web view provider.")
      }
    })
  })
)

// Environment command
nova.subscriptions.add(
  nova.commands.register("tommasonegri.solargraph.environment", () => {
    if (webViewProvider) {
      const uri = parseURI("solargraph:/environment")
      webViewProvider.open(uri)
    } else {
      console.warn("Solargraph cannot find the web view provider.")
    }
  })
)

// Check gem version command
nova.subscriptions.add(
  nova.commands.register("tommasonegri.solargraph.checkGemVersion", () => {
    if (langserver.languageClient) {
      langserver.languageClient.sendNotification("$/solargraph/checkGemVersion", { verbose: true })
    } else {
      showNotification({ title: "Solargraph is still starting. Please try again in a moment." })
    }
  })
)

// Build gem documentation command
nova.subscriptions.add(
  nova.commands.register("tommasonegri.solargraph.buildGemDocs", () => {
    try {
      showNotification({ title: "Building new gem documentation" })
      buildGemDocs(langserver.languageClient, false)
    } catch (error) {
      const message = "Error building gem documentation."

      nova.workspace.showErrorMessage(message)
      console.error(message, error.message)
    }
  })
)

// Rebuild gems documentation command
nova.subscriptions.add(
  nova.commands.register("tommasonegri.solargraph.rebuildAllGemDocs", () => {
    try {
      showNotification({ title: "Rebuilding all gem documentation..." })
      buildGemDocs(langserver.languageClient, true)
    } catch (error) {
      const message = "Error rebuilding gem documentation."

      nova.workspace.showErrorMessage(message)
      console.error(message, error.message)
    }
  })
)

// Generate configuration command
nova.subscriptions.add(
  nova.commands.register("tommasonegri.solargraph.config", () => {
    try {
      solargraph.commands.solargraph(["config"], solargraph.config)

      showNotification({ title: "Created default .solargraph.yml file." })
    } catch (error) {
      const message = "Error creating .solargraph.yml file."

      nova.workspace.showErrorMessage(message)
      console.error(message, error.message)
    }
  })
)

// Download core command
nova.subscriptions.add(
  nova.commands.register("tommasonegri.solargraph.downloadCore", () => {
    if (langserver.languageClient) {
      langserver.languageClient.sendNotification("$/solargraph/downloadCore", { verbose: true })
    } else {
      showNotification({ title: "Solargraph is still starting. Please try again in a moment." })
    }
  })
)

// Format document command
nova.subscriptions.add(
  nova.commands.register("tommasonegri.solargraph.format", (editor) => {
    langserver.customRequests.formatting(editor)
  })
)

// Find references command
nova.subscriptions.add(
  nova.commands.register("tommasonegri.solargraph.findReferences", async (editor) => {
    const symbol     = editor.selectedText
    const references = await langserver.customRequests.findReferences(editor)

    sidebar.displaySymbolReferences(symbol, references)
  })
)

// Restore default settings command
nova.subscriptions.add(
  nova.commands.register("tommasonegri.solargraph.restoreSettings", () => {
    solargraph.config.keys.forEach(key => {
      nova.config.remove(key)
    })
  })
)

// Restore default workspace settings command
nova.subscriptions.add(
  nova.commands.register("tommasonegri.solargraph.restoreWorkspaceSettings", () => {
    solargraph.config.keys.forEach(key => {
      nova.workspace.config.remove(key)
    })
  })
)
