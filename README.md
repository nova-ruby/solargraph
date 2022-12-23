<p align="center">
	<img src="https://raw.githubusercontent.com/nova-ruby/solargraph/main/misc/extension.png" width="80" height="80">
</p>
<h1 align="center">Solargraph for Nova</h1>

Connect Nova to **[Solargraph](https://solargraph.org)** language server. Solargraph provides intellisense, code completion, and inline documentation for Ruby.

> Please be patient if you get into issues or limitations. We are still testing and improving the extension.

## Features

### Supported

- Code completions
- Go to definition
- Diagnostics (RuboCop required)
- Format (RuboCop required)
- Format on save (RuboCop required)
- Documentation on hover
- Find references
- Workspace symbols
- Rename symbol

### Not supported

- Code folding
- Search documentation
- On type formatting

## Requirements

You need to install the Ruby gem:

```
$ gem install solargraph
```

### Run from bundle

If you want you can use the Solargraph version installed in your project bundle.

Start by adding the gem to the development group:

```
$ bundle add solargraph --group=development --require=false
```

Then you can check the `Use Bundler` config in the extension or project settings.

> Warning: If you have the `Use Bundler` config checked but you have not added Solargraph to the bundle, the extension will raise an error.

## Diagnostics & Formatting

Solargraph uses [RuboCop](https://rubocop.org) to provide diagnostics and formatting. Make sure to install that gem too.

When you have RuboCop installed you can opt-in for diagnostics and formatting from the extension or project settings.

## Find references & Workspace symbols

You can see the workspace symbols and find references results in the Nova's Solargraph sidebar.
