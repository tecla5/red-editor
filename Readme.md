# NodeRed editor

Refactoring of NodeRed editor using ES6 modules.

## Community

- [Slack](https://nodered.org/slack/)
- [Github organisation](https://github.com/node-red)

## Pre-requisites

- [Node 8+](https://nodejs.org/en/)
- [N](https://github.com/tj/n)
- Npm 5.3+ or [Yarn 1.0+](https://yarnpkg.com/)
- [Ava 0.22+](https://github.com/avajs/ava)

`npm i -g testcafe http-server n yarn ava`

Install latest node version:

`n latest`

## Packaging

Editor is packaged using [Webpack 3](https://medium.com/webpack/webpack-3-official-release-15fd2dd8f07b)

See `/webpack` folder. Webpack is configured to use babili to uglify and compress for production.

### Development

`npm run build:dev` - builds development version: `bundle.js`

### Production

`npm run build:prod` - builds production version: `bundle.prod.js`

## Source

- `src/legacy` contains the old (working) editor code.
- `src/new` contains the new refactored editor code using classes.

`src/new/red.js` attempts to reconstruct the global `RED` object using these classes.

The refactored code is a WIP and has not yet been tested and (might) lack some "stitching" to recreate a fully working `RED` application object.

The source code is written using ES2017 syntax, transpiled to ES5 using [babelJS](https://babeljs.io/)

Please make the new/refactored code work using TDD, ie. with [ava](https://github.com/avajs/ava) unit tests and nightmare E2E tests.

Please note that the editor needs [red-api](https://github.com/tecla5/red-api) for core functionality.

```json
"dependencies": {
  "red-api": "github:tecla5/red-api"
},
```

## Structural Overview

- `Communications` socket communication
- `Events` event notifications (publish/subscribe)
- `I18n` Internationalization
- `Main` Application loader. Loads nodes, flows and editor
- `Settings` Load/save application settings using local storage and ajax. Includes theming.
- `User` user login/logout and control user menu (ie. session state)
- `Validators` validate number, regex and typed inputs in editor
- `History` history action stack (push/pop) with undo/redo
- `NodeConfig` single node configuration (state)
- `NodeRegistry` registry of available nodes
- `Nodes` collection of nodes
- `TextFormat` used to format text for url, email etc. for HTML display
- `Bidi` bidirectional text diaplay (RTL - Right then Left, LTR - Left then Right)

### Ui structure

- `Actions`
- `Clipboard`
- `Diff`
- `Editor`
- `Library`
- `Search`
- `Subflow`
- `Tray`
- `TypeSearch`
- `Ui`
- `UserSettings`
- `Workspaces`

#### Common

- `CheckboxSet`
- `EditableList`
- `Menu`
- `Panels`
- `Popover`
- `SearchBox`
- `Stack`
- `Tabs`
- `TypedInput`

#### Palette

- `PaletteEditor`
- `Palette`

#### Sidebar

- `Sidebar`
- `TabConfig`
- `TabInfo`

#### Touch

- `RadialMenu`

## Rendering the UI

The `/assets` folder contains the original assets used to generate the main HTML page.

The UI is rendered via mustache templates (with partials) in [red-api/src/new/api/ui.js](https://github.com/tecla5/red-api/blob/master/src/new/api/ui.js)

```js
class Ui {
  // ...
  _loadSharedPartials() {
      var partials = {};
      let rootDir = './editor/templates'
      var recursiveReadSync = require('recursive-readdir-sync')
      var files = recursiveReadSync(rootDir)
      for (var i = 0, l = files.length; i < l; i++) {
          var file = files[i];

          if (file.match(/\.mst$/)) {
              var name = path.basename(file, '.mst');
              let contents = fs.readFileSync(file, 'utf8');
              partials[name] = contents
          }
      }

      return partials;
  }

  editor(req, res) {
      let partials = _loadSharedPartials()
      // console.log({
      //     partials: Object.keys(partials)
      // })
      let html = Mustache.render(editorTemplate, theme.context(), partials)
      res.send(html);
  }
}
```

Note: The legacy node-red code did not use partials.

## Assets

`templates/index.mst` contains a [mustache](https://mustache.github.io/) template to create the HTML.

The template needs to be rendered in order to do E2E testing using [nightmare](nightmarejs.org/) (ie. better Jasmine). Alternatively create static pages for testing.
The HTML pages rendered must load the javascript built using webpack.

## Development Process

First step is to make the simple (class) refactoring work using original functionality with jQuery etc. This is a current Work in Progress (WIP)

Next step will be to convert each main UI component such as `Palette`, `Sidebar` etc. into [Vue components](https://vuejs.org/v2/guide/components.html) that can be imported and used in a Vue app.

Each component should be tested individually use Vue best practices.

## Theming

Theming can be done in the `red/api/theme.js` file
The `defaultContext` is loaded from `./default-context`. It contains the basic Them "outline", including `header`, `favicon`, `icon` and `title`, logo image and more...
We have currently changed:

- `title` to `'App Orchestrator'`

```js
const title = 'App Orchestrator'

module.exports = {
  page: {
    title: title,
    favicon: "favicon.ico",
    tabicon: "red/images/node-red-icon-black.svg"
  },
  header: {
    title: title,
    image: "red/images/node-red.png"
  },
  asset: {
    red: (process.env.NODE_ENV == "development") ? "red/red.es5.js" : "red/red.min.js",
    main: (process.env.NODE_ENV == "development") ? "red/main.es5.js" : "red/main.min.js",

  }
};
```

See `theme_spec.js` for examples on how to customize theming.

The theme when fully configured is sent to the Mustache template in `editor/templates/new/index.mst`

```html
<div id="header">
    <span class="logo">{{#header.url}}<a href="{{.}}">{{/header.url}}{{#header.image}}<img src="{{.}}" title="{{version}}">{{/header.image}} <span>{{ header.title }}</span>{{#header.url}}</a>{{/header.url}}</span>
    <ul class="header-toolbar hide">
        <li><a id="btn-sidemenu" class="button" data-toggle="dropdown" href="#"><i class="fa fa-bars"></i></a></li>
    </ul>
    <div id="header-shade" class="hide"></div>
</div>
<div id="main-container" class="sidebar-closed hide">
    <div id="workspace">
    ...
    </div>
</div>
```

Here you can add login/logout buttons and use other custom theming variables as you see fit :)

We should be leveraging [Partials](https://github.com/janl/mustache.js/#partials) for easier re-factoring of the UI.

Partials begin with a greater than sign, like `{{> box}}`. The partial will inherit the  variables from the calling context

`base.mustache` file

```
<h2>Names</h2>
{{#names}}
  {{> user}}
{{/names}}
```

`user.mustache` file

```
<strong>{{name}}</strong>
```

Can be thought of as a single, expanded template:

```
<h2>Names</h2>
{{#names}}
  <strong>{{name}}</strong>
{{/names}}
```

## Tests

For unit tests use [ava](https://github.com/avajs/ava) test runner.

### Run tests

Run all tests:

`$ npm test`

Run a particular test:

`$ ava test/comms.test.js`

## Test/Refactoring strategy

Start bottom up, working on the simplest, bottom down classes/modules first, those with less dependencies and less complex code. Gradually work your way bottom up, breadth first.

Currently the following test is a good starting point:

`$ ava test/new/text/format/breadcrumb.test.js`

### E2E tests

E2E (ie. User Acceptance) tests must be written using [NightmareJS](http://www.nightmarejs.org/) with modern async/await syntax.

Tests should be written using [Page Objects](https://martinfowler.com/bliki/PageObject.html) design pattern and should be run via [test cafe](https://github.com/DevExpress/testcafe)

Please see [How to set up E2E browser testing](https://hackernoon.com/how-to-set-up-e2e-browser-testing-for-your-github-project-89c24e15a84)

See [nightmare API](https://github.com/segmentio/nightmare#api)

```js
var Nightmare = require('nightmare'),
  nightmare = Nightmare({
    show: true
  });

async function run () {
  var result = await nightmare
    //load a url
    .goto('http://yahoo.com')
    //simulate typing into an element identified by a CSS selector
    //here, Nightmare is typing into the search bar
    .type('input[title="Search"]', 'github nightmare')
    //click an element identified by a CSS selector
    //in this case, click the search button
    .click('#uh-search-button')
    //wait for an element identified by a CSS selector
    //in this case, the body of the results
    .wait('#main')
    //execute javascript on the page
    //here, the function is getting the HREF of the first search result
    .evaluate(function() {
      return document.querySelector('#main .searchCenterMiddle li a')
        .href;
    });


  //queue and end the Nightmare instance along with the Electron instance it wraps
  await nightmare.end();

  console.log(result);
};

run();
```

### Ava nightmare

You can also run nightmare tests with `ava` test runner using ava assertions.

```js
import Nightmare from 'nightmare';
import test from 'ava';

test('should find the nightmare github link first', async t => {
  const nightmare = Nightmare()
  let link = await nightmare
    .goto('https://duckduckgo.com')
    .type('#search_form_input_homepage', 'github nightmare')
    .click('#search_button_homepage')
    .wait('#zero_click_wrapper .c-info__title a')
    .evaluate(() =>
      document.querySelector('#zero_click_wrapper .c-info__title a').href
    )
    .end()

  // test link found
  t.is(link, 'https://github.com/segmentio/nightmare')
})
```
