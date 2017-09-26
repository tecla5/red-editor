const nightmare = require('../nightmare')
import test from 'ava'
import {
  Workspaces
} from './ui'
const ctx = {}

function create(ctx) {
  return new Workspaces(ctx)
}

test('Workspaces: create', t => {
  let ws = create(ctx)
  t.is(ws.activeWorkspace, 0)
})

test('Workspaces: addWorkspace', t => {
  let ws = create(ctx)
  let wsTab = {}
  let skipHistoryEntry = false
  ws.addWorkspace(wsTab, skipHistoryEntry)
  // t.is(ws.workspace_tabs ...)
})

test('Workspaces: deleteWorkspace', t => {
  let ws = create(ctx)
  let wsTab = {}
  ws.deleteWorkspace(wsTab)
})

test('Workspaces: showRenameWorkspaceDialog', t => {
  let ws = create(ctx)
  let id = 'x'
  ws.showRenameWorkspaceDialog(id)
})

test('Workspaces: createWorkspaceTabs', t => {
  let ws = create(ctx)
  ws.createWorkspaceTabs()
})

test('Workspaces: editWorkspace', t => {
  let ws = create(ctx)
  let id = 'x'
  ws.editWorkspace(id)
})

test('Workspaces: removeWorkspace', t => {
  let ws = create(ctx)
  let wsTab = {}
  ws.removeWorkspace(wsTab)
})

test('Workspaces: setWorkspaceOrder', t => {
  let ws = create(ctx)
  let order = {}
  ws.setWorkspaceOrder(order)
})

test('Workspaces: contains', t => {
  let ws = create(ctx)
  let id = 'x'
  ws.contains(id)
})

test('Workspaces: count', t => {
  let ws = create(ctx)
  ws.count()
})

test('Workspaces: active', t => {
  let ws = create(ctx)
  ws.active()
})

test('Workspaces: show', t => {
  let ws = create(ctx)
  ws.show(id)
})

test('Workspaces: refresh', t => {
  let ws = create(ctx)
  ws.refresh()
})

test('Workspaces: resize', t => {
  let ws = create(ctx)
  ws.resize()
})
