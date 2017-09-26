const nightmare = require('../nightmare')
import test from 'ava'
import {
  Sidebar
} from './ui'
const ctx = {}

function create(ctx) {
  return new Sidebar(ctx)
}

test('Sidebar: create', t => {
  let sidebar = create(ctx)
  t.deepEqual(sidebar.sidebarSeparator, {})
  t.deepEqual(sidebar.knownTabs, {})
})
test('Sidebar: addTab', t => {
  let sidebar = create(ctx)
  let title = 'abc'
  let content = 'xyz'
  let closeable = false
  let visible = false
  sidebar.addTab(title, content, closeable, visible)
})

test('Sidebar: removeTab', t => {
  let sidebar = create(ctx)
  let title = 'abc'
  let content = 'xyz'
  let closeable = false
  let visible = false
  let id = 'x'
  sidebar.addTab(title, content, closeable, visible)
  sidebar.removeTab(id)
})

test('Sidebar: toggleSidebar', t => {
  let sidebar = create(ctx)
  let state = {}
  sidebar.toggleSidebar(state)
})

test('Sidebar: showSidebar', t => {
  let sidebar = create(ctx)
  let id = 'x'
  sidebar.showSidebar(id)
})

test('Sidebar: containsTab', t => {
  let sidebar = create(ctx)
  let id = 'x'
  sidebar.containsTab(id)
})
