const helpers = require("./helpers")

module.exports = async (args, config) => {
	return new Promise((resolve, reject) => {
		const process = new Process(helpers.solargraph.path(config), {
			cwd: nova.workspace.path,
			args: [...helpers.solargraph.args(config), ...args],
			stdio: ["ignore", "pipe", "pipe"],
			env: {
				cwd: nova.workspace.path
			},
			shell: true
		})

		let str = ""
		let err = ""

		process.onStdout((output) => { str += output })

		process.onStderr((error) => { err += error })

		process.onDidExit((status) => {
			if (status == 1) reject(err)

			return resolve(str)
		})

		process.start()
	})
}
