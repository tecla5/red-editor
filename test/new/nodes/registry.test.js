const nightmare = require('../nightmare')
import ava from 'ava'
import {
  NodesRegistry
} from '../ui'

const ctx = {}

function create(ctx) {
  return new NodesRegistry(ctx)
}

test('NodesRegistry: create', t => {
  let registry = create(ctx)
  t.is(typeof registry, 'object')
})

test('registry: setModulePendingUpdated', t => {
  let registry = create(ctx)
  let module = 'x'
  let version = 1
  registry.setModulePendingUpdated(module, version)
  let v = registry.moduleList[module].pending_version
  t.is(v, version)
})

test('registry: getModule', t => {
  let registry = create(ctx)
  let module = {
    id: 'x'
  }
  let ns = {
    module
  }
  registry.addNodeSet(ns)
  let registered = registry.getModule(module)
  t.is(registered, module)
})

test('registry: getNodeSetForType', t => {})
test('registry: getModuleList', t => {})
test('registry: getNodeList', t => {})
test('registry: getNodeTypes', t => {})
test('registry: setNodeList', t => {})
test('registry: removeNodeSet', t => {})
test('registry: addNodeSet', t => {})
test('registry: getNodeSet', t => {})
test('registry: enableNodeSet', t => {})
test('registry: disableNodeSet', t => {})
test('registry: registerNodeType', t => {})
test('registry: removeNodeType', t => {})
test('registry: getNodeType', t => {})
