# NodeRed editor

Refactoring of NodeRed editor using ES6 modules.

## Packaging

Should be packaged using [Webpack 3](https://medium.com/webpack/webpack-3-official-release-15fd2dd8f07b)

## Status

The `src/new` folder contains the refactored editor.

Most of the old "global object entries" have been refactored as classes. Not yet tested and lacks some "stitching" to recreate full `RED` application object.
Please make it fully work using TDD (ie. `ava` unit tests)!

TODO: No refactoring work has yet been done no `new/text` and `new/ui` folders.

## Process

First step is to make a simple refactoring and make it work using original functionality with jQuery etc. This is a Work in Progress (WIP)

2nd step will be to convert each main UI component such as `Palette`, `Sidebar` etc. into Vue components that can be imported and used in a Vue app.

Each component should be tested individually use Vue best practices.
