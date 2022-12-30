const { configFor } = require("../../helpers")

const solargraph = {
	/**
	 * Return the path of the Solargraph command.
	 * @param {object} config
	 */
	path: (config) => {
		const useBundler  = configFor(config.solargraph.get("useBundler"))
		const bundlerPath = configFor(config.solargraph.get("bundlerPath"))

		if (useBundler && bundlerPath) {
			return nova.environment.SHELL
		} else {
			return "/usr/bin/env"
		}
	},

	/**
	 * Return the args for the Solargraph command.
	 * @param {object} config
	 */
	args: (config) => {
		const useBundler  = configFor(config.solargraph.get("useBundler"))
		const bundlerPath = configFor(config.solargraph.get("bundlerPath"))
		const commandPath = configFor(config.solargraph.get("commandPath"))

		if (useBundler && bundlerPath) {
			return [ "-c", `cd ${nova.workspace.path}; bundle exec solargraph` ]
		} else {
			return [ commandPath ]
		}
	}
}

module.exports = {
	solargraph
}
