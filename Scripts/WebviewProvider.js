class SolargraphWebviewProvider {
  constructor(languageClient) {
    this.languageClient = languageClient
    this.files = new Map()
  }

  parseQuery(query) {
    console.log("query", query)
    const result = {}
    const parts = query.split("&")
    parts.forEach((part) => {
      const frag = part.split("=")
      result[decodeURIComponent(frag[0])] = decodeURIComponent(frag[1])
    })
    return result
  }

  open(uri) {
    if (!uri.string) return

    if (this.languageClient) {
      var method = "$/solargraph" + uri.path
      var query  = this.parseQuery(uri.query)

      if (this.files.has(uri.string)) {
        this.navigateTo(this.files.get(uri.string))
      } else {
        this.languageClient.sendRequest(method, query).then((response) => {
          const converted = this.convertDocumentation(response.content)

          const path = `${nova.path.join(nova.fs.tempdir, `solargraph-${nova.crypto.randomUUID()}`)}.html`
          const file = nova.fs.open(path, "w+t")
          file.write(converted)
          file.close()

          this.files.set(uri.string, path)
          this.navigateTo(path)
        })
      }
    } else {
      // TODO: Maybe report an error when the language client is unavailable
    }
  }

  navigateTo(file) {
    nova.openURL(`file://${file}`)
  }

  convertDocumentation(text) {
    const regexp = /\"solargraph\:(.*?)\"/g
    let match
    let adjusted = text
    while (match = regexp.exec(text)) {
      var commandUri = "\"command:solargraph._openDocumentUrl?" + encodeURI(JSON.stringify("solargraph:" + match[1])) + "\""
      adjusted = adjusted.replace(match[0], commandUri)
    }
    return adjusted
  }

  dispose() {
    console.log("Dispose")

    this.files.forEach((value) => {
      nova.fs.remove(value)
    })
  }
}

module.exports = SolargraphWebviewProvider
