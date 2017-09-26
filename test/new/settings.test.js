import test from 'ava'
import {
  Settings
} from './api'

const ctx = {}

function create(ctx) {
  return new Settings(ctx)
}

test('settings: create', t => {
  const settings = create(ctx)
  t.is(typeof settings.loadedSettings, 'object')
})

test('settings: init', async t => {
  const settings = create(ctx)
  // TODO: change done callback to async with promise
  await settings.init()
})

test('settings: localstorage', t => {
  const settings = create(ctx)
  t.true(settings.hasLocalStorage())
})

test('settings: properties', t => {
  const settings = create(ctx)
  const data = {
    x: 2
  }
  settings.setProperties(data)

  t.true(settings.x, 2)
})

// called by init
test('settings: load', async t => {
  const settings = create(ctx)
  // TODO: change done callback to async with promise
  await settings.load()
})

test('settings: theme', t => {
  const settings = create(ctx)
  let defaultValue = true
  // test real theme values
  let property = 'palette.editable'
  settings.theme(property, defaultValue)

  // test theme value is set on .editorTheme object
  t.is(typeof settings.editorTheme, 'object')
  t.is(settings.editorTheme.palette.editable, true)
})
