/**
 * @param {string} id Notification ID
 * @param {string} title Notification Title
 * @param {boolean} showAlways Whether to override the user notifications settings
 * @param {string=} body Notification Body
 * @param {[string]=} actions Notification Action
 * @param {function(any)=} handler Notification Handler
 */
exports.showNotification = function({ id = null, title = null, body = null, actions = null, handler = null}) {
  if (!title) return

  let request = new NotificationRequest(id || nova.crypto.randomUUID())

  request.title = title

  if (body)    request.body    = body
  if (actions) request.actions = actions

  nova.notifications.add(request)
    .then(reply => { if (handler) handler(reply) })
    .catch(err => console.error(err, err.stack))
}

/**
 * If overwritten retrieve a config from the current workspace, otherwise use the global default
 * @param {string} key - Config key
 * @returns {(string|number|boolean|array|null)} The value retrieved from the config
 */
exports.configFor = (config) => {
  const workspace   = nova.workspace.config.get(config.key)
  const environment = nova.config.get(config.key)

  if (workspace != null) {
    return workspace
  } else if (environment != null) {
    return environment
  } else {
    return config.default
  }
}

/**
 * Debounce function execution
 * @param {function} fn - Function to debounce
 * @param {number} delay - Amount of delay
 */
exports.debounce = (fn, delay = 10) => {
  let timeoutId = null

  return (...args) => {
    const callback = () => fn.apply(this, args)
    clearTimeout(timeoutId)
    timeoutId = setTimeout(callback, delay)
  }
}

/**
 * Parse a uri string into an object with the different components
 * @param {string} uriString - The uri string to parse
 */
exports.parseURI = (uriString) => {
  const uri = {
    valid: false,
    string: null,
    scheme: null,
    path: null,
    query: null,
    fragment: null
  }

  if (typeof uriString == "string") {
    uri.string = uriString.toLowerCase()

    const matches = uri.string.match(/(?<SCHEME>(?:solargraph?))\:(?<PATH>[a-zA-Z0-9\-\.\/]+)?(?<QUERY>(?:\?$|[a-zA-Z0-9\.\,\;\?\'\\\+&%\$\=~_\-\*]+))?(?<FRAGMENT>#[a-zA-Z0-9\-\.]+)?/)

    if (matches[1] && matches[2]) uri.valid = true

    if (matches[1]) uri.scheme   = matches[1]
    if (matches[2]) uri.path     = matches[2]
    if (matches[3]) uri.query    = matches[3].substring(1)
    if (matches[4]) uri.fragment = matches[4]
  }

  return uri
}

/**
 * Build or rebuild the gem documentation used by Solargraph
 * @param {LanguageClient} languageClient - The language client
 * @param {boolean} rebuild - Build or rebuild the documentation
 */
exports.buildGemDocs = (languageClient, rebuild) => {
  try {
    languageClient.sendRequest("$/solargraph/documentGems", { rebuild: rebuild }).then((response) => {
      if (response.status == "ok") {
        exports.showNotification({ title: "Gem documentation complete." })
      } else {
        nova.workspace.showErrorMessage("An error occurred building gem documentation.")
      }
    })
  } catch (error) {
    throw error
  }
}
