const nightmare = require('../nightmare')

import test from 'ava'
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

test('registry: getNodeSetForType', t => {
  let registry = create(ctx)
  let nodeType = 'io'
  registry.getNodeSetForType(nodeType)

})

test('registry: getModuleList', t => {
  let registry = create(ctx)
  registry.getModuleList()

})

test('registry: getNodeList', t => {
  let registry = create(ctx)
  registry.getNodeList()
})

test('registry: getNodeTypes', t => {
  let registry = create(ctx)
  registry.getNodeTypes()
})

test('registry: setNodeList', t => {
  let registry = create(ctx)
  registry.setNodeList(list)
})

test('registry: removeNodeSet', t => {
  let registry = create(ctx)
  registry.removeNodeSet(id)
})

test('registry: addNodeSet', t => {
  let registry = create(ctx)
  let module = {
    id: 'x'
  }
  let ns = {
    id: 'a',
    module
  }
  registry.addNodeSet(ns)
  let set = registry.getNodeSet(ns.id)
  t.is(set, ns)
})

test('registry: getNodeSet', t => {
  let registry = create(ctx)
  let module = {
    id: 'x'
  }
  let ns = {
    id: 'a',
    module
  }
  registry.addNodeSet(ns)
  let set = registry.getNodeSet(ns.id)
  t.is(set, ns)
})

test('registry: enableNodeSet', t => {
  let registry = create(ctx)
  let module = {
    id: 'x'
  }
  let ns = {
    id: 'a',
    module
  }
  registry.addNodeSet(ns)
  registry.enableNodeSet(ns.id)
  let set = registry.getNodeSet(ns.id)
  t.truthy(set.enabled)
})

test('registry: disableNodeSet', t => {
  let registry = create(ctx)
  let module = {
    id: 'x'
  }
  let ns = {
    id: 'a',
    module
  }
  registry.addNodeSet(ns)
  registry.enableNodeSet(ns.id)
  let set = registry.getNodeSet(ns.id)
  t.truthy(set.enabled)
  registry.disableNodeSet(ns.id)
  t.falsy(set.enabled)
})

test('registry: registerNodeType', t => {
  let registry = create(ctx)
  let nt = 'io'
  let def = {
    id: 'x'
  }
  registry.registerNodeType(nt, def)
  t.is(registry.nodeDefinitions[nt], def)
})

test('registry: removeNodeType', t => {
  let registry = create(ctx)
  let nt = 'io'
  let def = {
    id: 'x'
  }
  registry.registerNodeType(nt, def)
  registry.removeNodeType(nt)
  t.falsy(registry.nodeDefinitions[nt])
})

test('registry: getNodeType', t => {
  let registry = create(ctx)
  let nt = 'io'
  let def = {
    id: 'x'
  }
  registry.registerNodeType(nt, def)
  let node = registry.getNodeType(nt)
  t.is(node, def)
})
