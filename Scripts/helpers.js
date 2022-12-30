/**
 * @param {object} options
 * @param {string} [options.id=null]
 * @param {string} [options.title=null]
 * @param {string} [options.body=null]
 * @param {string[]} [options.actions=null]
 * @param {function(NotificationResponse)} [options.handler=null]
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
	const workspace   = sanitazeConfig(nova.workspace.config.get(config.key))
	const environment = sanitazeConfig(nova.config.get(config.key))

	if (workspace != null && workspace !== "") {
		return workspace
	} else if (environment != null) {
		return environment
	} else {
		return config.default
	}
}

const sanitazeConfig = (value) => {
	if (value === "")           return null
	else if (value === "true")  return true
	else if (value === "false") return false
	else return value
}
