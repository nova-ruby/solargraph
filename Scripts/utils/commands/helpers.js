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
			// Use bundlerbridge to cd in the workspace directory before running the bundler.
			// This is necessary because Nova doesn't allow to run LSP in shell processes.
			return nova.path.join(nova.extension.path, "Scripts", "bin", "bundlerbridge")
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
			// Prepend the command with the workspace directory so that bundlerbridge can cd into it.
			return [ nova.workspace.path, "--", bundlerPath, "exec", "solargraph" ]
		} else {
			return [ commandPath ]
		}
	}
}

module.exports = {
	solargraph
}
