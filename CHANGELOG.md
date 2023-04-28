## Version 1.4

Fix:

- Use willSave instead of didSave as the formatting on save handler. The previous one caused the document to be always in a not saved state.

## Version 1.3

Improved:

- Remove bundlerbridge in favor of $SHELL -c command.
- Support passing custom ENV to the LSP. This facilitates a temporary fix for using Chruby.

## Version 1.2

Fixed:

- Make bundlerbridge executable at the first startup since Nova doesn't allow to ship binaries.

## Version 1.1

Fixed:

- Testing new bundlerbridge binary

## Version 1.0

Initial release
