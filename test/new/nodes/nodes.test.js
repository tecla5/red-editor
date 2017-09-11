import ava from 'ava'
import {
  Nodes
} from './api'
const ctx = {}

function create(ctx) {
  return new Nodes(ctx)
}

test('nodes: create', t => {
  let nodes = create(ctx)
  t.is(typeof nodes, 'object')
})

test('nodes: getID', t => {
  let nodes = create(ctx)
  t.is(typeof nodes.getID(), 'number')
})

test('nodes: addNode', t => {
  let nodes = create(ctx)
  let node = {
    id: 'a'
  }
  nodes.addNode(node)
  t.is(nodes.configNodes[node.id], node)
})

test('nodes: addLink', t => {

})
test('nodes: getNode - finds it', t => {
  let nodes = create(ctx)
  let found = nodes.getNode('b')
  t.falsy(found)

  let node = {
    id: 'a'
  }
  let found = nodes.getNode(node.id)
  t.is(found, node)
})

test('nodes: removeNode - removes it', t => {
  let nodes = create(ctx)
  let node = {
    id: 'a'
  }
  nodes.removeNode(node)
  let found = nodes.getNode(node.id)
  t.falsy(found)
})

test('nodes: removeLink - removes it', t => {
  let nodes = create(ctx)
  let link = {
    id: 'a'
  }
  nodes.removeLink(link)
  let found = nodes.links.find(link)
  t.falsy(found)
})

test('nodes: addWorkspace - adds it', t => {
  let nodes = create(ctx)
  let ws = {
    id: 'a'
  }
  nodes.addWorkspace(ws)
  let found = nodes.getWorkspace(ws.id)
  t.truthy(found)
})

test('nodes: getWorkspace - finds it', t => {
  let nodes = create(ctx)
  let ws = {
    id: 'a'
  }
  nodes.addWorkspace(ws)
  let found = nodes.getWorkspace(ws.id)
  t.truthy(found)
})

test('nodes: removeWorkspace - removes it', t => {
  let nodes = create(ctx)
  let ws = {
    id: 'a'
  }
  nodes.addWorkspace(ws)
  nodes.removeWorkspace(ws.id)
  let found = nodes.getWorkspace(ws.id)
  t.falsy(found)
})

test('nodes: addSubflow - adds it', t => {
  let nodes = create(ctx)
  let subflow = {
    id: 'a'
  }
  nodes.addSubflow(subflow)
  let found = nodes.getSubflow(subflow.id)
  t.truthy(found)
})

test('nodes: getSubflow - finds it', t => {
  let nodes = create(ctx)
  let subflow = {
    id: 'a'
  }
  nodes.addSubflow(subflow)
  let found = nodes.getSubflow(subflow.id)
  t.truthy(found)
})

test('nodes: removeSubflow - removes it', t => {
  let nodes = create(ctx)
  let subflow = {
    id: 'a'
  }
  nodes.addSubflow(subflow)
  nodes.removeSubflow(subflow.id)
  let found = nodes.getSubflow(ws.id)
  t.falsy(found)
})

test('nodes: subflowContains', t => {
  let nodes = create(ctx)
  let sfid = 'x'
  let nodeid = 'a'
  let subflow = {
    id: sfid
  }
  nodes.addSubflow(subflow)

  let found = nodes.subflowContains(sfid, nodeid)
  t.truthy(found)
})

test('nodes: getAllFlowNodes', t => {

})
test('nodes: convertWorkspace', t => {

})
test('nodes: convertNode', t => {

})
test('nodes: convertSubflow', t => {

})
test('nodes: createExportableNodeSet', t => {

})
test('nodes: createExportableNodeSet', t => {

})
test('nodes: checkForMatchingSubflow', t => {

})
test('nodes: compareNodes', t => {

})
test('nodes: importNodes', t => {

})
test('nodes: filterNodes', t => {

})
test('nodes: filterLinks', t => {

})
test('nodes: updateConfigNodeUsers', t => {

})
test('nodes: flowVersion', t => {

})
test('nodes: clear', t => {

})
test('nodes: getWorkspaceOrder', t => {

})
test('nodes: setWorkspaceOrder', t => {

})
test('nodes: eachNode', t => {

})
test('nodes: eachLink', t => {

})
test('nodes: eachConfig', t => {

})
test('nodes: eachSubflow', t => {

})
test('nodes: eachWorkspace', t => {

})
test('nodes: originalFlow', t => {

})
test('nodes: dirty', t => {

})
