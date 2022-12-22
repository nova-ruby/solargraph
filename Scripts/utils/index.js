const SYNTAXES = ["ruby"]

module.exports = {
	SYNTAXES,
	commands: require("./commands/index"),
	requests: require("./requests/index"),
	config: require("./config"),
}
