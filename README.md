<p align="center">
	<img src="https://raw.githubusercontent.com/nova-ruby/solargraph/main/misc/extension.png" width="80" height="80">
</p>
<h1 align="center">Solargraph for Nova</h1>

Connect Nova to **[Solargraph](https://solargraph.org)** language server. Solargraph provides intellisense, code completion, and inline documentation for Ruby.

> Please be patient if you get into issues or limitations. We are still testing and improving the extension.

## Features

- Code completions
- Go to definition
- Diagnostics (RuboCop required)
- Format (RuboCop required)
- Format on save (RuboCop required)
- Documentation on hover
- Find references
- Workspace symbols
- Rename symbol

## Setup

Start by installing the Ruby gem:

```
$ gem install solargraph
```

Then install the documentation for the current version of Ruby:

```
$ solargraph download-core
```

Finally generate the documentation for the installed gems:

```
$ yard gems
```

### Ruby on Rails setup

Follow this [guide](https://solargraph.org/guides/rails) to configure Solargraph so it can pair well with Rails.

Consider installing this [plugin](https://github.com/iftheshoefritz/solargraph-rails) too.

## Launch from bundle

Alternatively, the extension can also launch Solargraph from the project bundle.

Start by adding the gem to the development group:

```
$ bundle add solargraph --group=development --require=false
```

Then check the `Use Bundler` config in the extension or project settings.

> Warning: If the `Use Bundler` config is checked but Solargraph is not in the bundle, the extension will raise an error.

## Diagnostics & Formatting

Solargraph uses [RuboCop](https://rubocop.org) to provide diagnostics and formatting. Make sure to install that gem too.

When RuboCop is installed you can opt-in for diagnostics and formatting from the extension or project settings.

## Find references & Workspace symbols

Workspace symbols and find references results are going to be displayed in the Solargraph sidebar inside Nova.
