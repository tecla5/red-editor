const nightmare = require('../nightmare')
import test from 'ava'
import {
  Clipboard
} from './ui'

const ctx = {}

function create(ctx) {
  return new Clipboard(ctx)
}

test('Clipboard: create', t => {
  let clipboard = create(ctx)
  t.falsy(clipboard.disabled)

  // calls setupDialogs() which adds dialog to HTML body

  // use nightmare
  // body
})

test('Clipboard: setupDialogs', t => {
  let clipboard = create(ctx)
  clipboard.setupDialogs()
})

test('Clipboard: validateImport', t => {
  let clipboard = create(ctx)
  clipboard.validateImport()

  // use nightmare
})

test('Clipboard: importNodes', t => {
  let clipboard = create(ctx)
  clipboard.importNodes()

  // use nightmare
})

test('Clipboard: exportNodes', t => {
  let clipboard = create(ctx)
  clipboard.exportNodes()

  // use nightmare
})

test('Clipboard: hideDropTarget', t => {
  let clipboard = create(ctx)
  clipboard.hideDropTarget()

  // use nightmare
})

test('Clipboard: copyText', t => {
  let clipboard = create(ctx)
  let value = 'x'
  let element = $('#x')
  let msg = 'hello'

  clipboard.copyText(value, element, msg)

  // use nightmare
})
