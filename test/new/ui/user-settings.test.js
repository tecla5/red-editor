const nightmare = require('../nightmare')
import test from 'ava'
import {
  UserSettings
} from './ui'
const ctx = {}

function create(ctx) {
  return new UserSettings(ctx)
}

test('UserSettings: create', t => {
  let settings = create(ctx)
  t.deepEqual(settings.viewSettings, {})
})

test('UserSettings: addPane', t => {
  let settings = create(ctx)
  let options = {
    id: 'x'
  }
  settings.addPane(options)
  let pane = settings.panes[0]
  t.deepEqual(pane, options)
})

test('UserSettings: show', t => {
  let settings = create(ctx)
  let initialTab = {}
  settings.show(initialTab)
})

test('UserSettings: createViewPane', t => {
  let settings = create(ctx)
  settings.createViewPane()
})

test('UserSettings: setSelected', t => {
  let settings = create(ctx)
  settings.setSelected(id, value)
})

test('UserSettings: toggle', t => {
  let settings = create(ctx)
  let id = 'x'
  settings.toggle(id)
})
