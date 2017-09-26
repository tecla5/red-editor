const nightmare = require('../nightmare')
import test from 'ava'
import {
  Library
} from './ui'
const ctx = {}

function create(ctx) {
  return new Library(ctx)
}

test('Library: create', t => {
  let library = create(ctx)
  t.is(typeof library.exportToLibraryDialog, 'object')
})

test('Library: loadFlowLibrary', t => {
  let library = create(ctx)
  library.loadFlowLibrary()
  // makes AJAX call to get JSON data
  // updates UI

  // use nightmare to test UI update
})

test('Library: createUI', t => {
  let library = create(ctx)
  let options = {}
  library.createUI(options)

  t.is(typeof library.ui, 'object')
  // use nightmare to test UI update of editor
})

test('Library: exportFlow', t => {
  let library = create(ctx)
  let options = {}
  library.exportFlow()

  // use nightmare to test UI update of editor
})

function createUi(ctx) {
  return new LibraryUI(ctx)
}


test('LibraryUI: create', t => {
  let ui = createUi(ctx)
  t.is(typeof ui, 'object')
})

test('LibraryUI: buildFileListItem', t => {
  let ui = createUi(ctx)
  let item = {

  }
  let li = ui.buildFileListItem(item)
  // use nightmare to test returned li element
})

test('LibraryUI: buildFileList', t => {
  let ui = createUi(ctx)
  let root = {} // document element?
  let data = {

  }
  let ul = ui.buildFileList(root, data)
  // use nightmare to test returned ul element
})

test('LibraryUI: saveToLibrary', t => {
  let ui = createUi(ctx)
  let root = {} // document element?
  let overwrite = true
  ui.saveToLibrary(overwrite)

  // test nofified correctly of result from save
})
