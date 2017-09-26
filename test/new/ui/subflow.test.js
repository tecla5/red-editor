const nightmare = require('../nightmare')
import test from 'ava'
import {
  Subflow
} from './ui'

const ctx = {}

function create(ctx) {
  return new Search(ctx)
}

test('Subflow: create', t => {
  let subflows = create(ctx)

  // TODO: test
  // subflow.ctx.events
  // subflow.ctx.actions
})

test('Subflow: getSubflow', t => {
  let subflows = create(ctx)
  // TODO: register subflows

  let found = subflows.getSubflow()
  t.truthy(found)
})

test('Subflow: findAvailableSubflowIOPosition', t => {
  let subflows = create(ctx)
  // TODO: register subflows
  let subflow = {}
  let isInput = false
  let found = subflows.findAvailableSubflowIOPosition(subflow, isInput)
  t.truthy(found)
})

test('Subflow: addSubflowInput', t => {
  let subflows = create(ctx)
  subflows.addSubflowInput()

  // test active workspace subflow

  // use nightmare to test UI
  // $("#workspace-subflow-input-add") // class: active
  // $("#workspace-subflow-input-remove") // not class: active
})

test('Subflow: removeSubflowInput', t => {
  let subflows = create(ctx)
  subflows.removeSubflowInput()

  // test active workspace subflow

  // use nightmare to test UI
  // $("#workspace-subflow-input-add") // not class: active
  // $("#workspace-subflow-input-remove") // class: active
})

test('Subflow: addSubflowOutput', t => {
  let subflows = create(ctx)
  subflows.addSubflowOutput()

  // test active workspace subflow

  // use nightmare to test UI
})

test('Subflow: removeSubflowOutput', t => {
  let subflows = create(ctx)
  subflows.removeSubflowOutput()

  // test active workspace subflow

  // use nightmare to test UI
})

test('Subflow: refresh', t => {
  let subflows = create(ctx)
  let markChange = false
  subflows.refresh(markChange)
})

test('Subflow: refreshToolbar', t => {
  let subflows = create(ctx)
  subflows.refreshToolbar(markChange)
  // use nightmare to test UI
})

test('Subflow: showWorkspaceToolbar', t => {
  let subflows = create(ctx)
  subflows.showWorkspaceToolbar(markChange)
  // use nightmare to test UI
})

test('Subflow: hideWorkspaceToolbar', t => {
  let subflows = create(ctx)
  subflows.hideWorkspaceToolbar(markChange)
  // use nightmare to test UI
})

test('Subflow: createSubflow', t => {
  let subflows = create(ctx)
  let id = 'x'
  subflows.createSubflow()
  // use nightmare to test UI
})

test('Subflow: removeSubflow', t => {
  let subflows = create(ctx)
  let id = 'x'
  subflows.createSubflow()
  subflows.removeSubflow(id)
  // use nightmare to test UI

})

test('Subflow: convertToSubflow', t => {
  let subflows = create(ctx)
  let id = 'x'
  subflows.convertToSubflow()
  // use nightmare to test UI
})
