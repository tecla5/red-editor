# NodeRed editor

Refactoring of NodeRed editor using ES6 modules.

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

## Assets

The `/assets` folder contains the original assets used to generate the main HTML page.

`templates/index.mst` contains a [mustache](https://mustache.github.io/) template to create the HTML. This can be used for E2E testing using [nightmare](nightmarejs.org/) (ie. better Jasmine)

## Development Process

First step is to make the simple (class) refactoring work using original functionality with jQuery etc. This is a current Work in Progress (WIP)

Next step will be to convert each main UI component such as `Palette`, `Sidebar` etc. into [Vue components](https://vuejs.org/v2/guide/components.html) that can be imported and used in a Vue app.

Each component should be tested individually use Vue best practices.

## Tests

For unit tests use [ava](https://github.com/avajs/ava) test runner.

### Run tests

run all tests:

- `npm test`

run a particular test:

- `ava test/comms.test.js`

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
