const nightmare = require('../nightmare')
import test from 'ava'
import {
  Diff
} from './ui'
const ctx = {}

function create(ctx) {
  return new Diff(ctx)
}

test('Diff: create', t => {
  let diff = create(ctx)
  t.deepEqual(diff.currentDiff, {})
  t.falsy(diff.diffVisible)
})

test('Diff: buildDiffPanel', t => {
  let diff = create(ctx)
  let container = $('#container')
  diff.buildDiffPanel(container)

  // use nightmare
})

test('Diff: formatWireProperty', t => {
  let diff = create(ctx)
  let container = $('#container')

  // TODO: real data
  let wires = []
  let allNodes = []
  diff.formatWireProperty(wires, allNodes)

  // use nightmare
})

test('Diff: createNodeIcon', t => {
  let diff = create(ctx)
  // TODO: real data
  let node = {}
  let def = {}
  diff.createNodeIcon(node, def)

  // use nightmare
})

test('Diff: createNode', t => {
  let diff = create(ctx)
  // TODO: real data
  let node = {}
  let def = {}
  diff.createNode(node, def)

  // use nightmare
})
test('Diff: createNodeDiffRow', t => {
  let diff = create(ctx)
  // TODO: real data
  let node = {}
  let stats = {}
  diff.createNodeDiffRow(node, stats)

  // use nightmare
})
test('Diff: createNodePropertiesTable', t => {
  let diff = create(ctx)
  // TODO: real data
  let node = {}
  let def = {}
  let localNodeObj = {}
  let remoteNodeObj = {}
  diff.createNodePropertiesTable(def, node, localNodeObj, remoteNodeObj)

  // use nightmare
})

test('Diff: createNodeConflictRadioBoxes', t => {
  let diff = create(ctx)
  // TODO: real data
  let node = {}
  let row = {}
  let localDiv = {}
  let remoteDiv = {}
  let propertiesTable = {}
  let hide = true
  let state = {}
  diff.createNodeConflictRadioBoxes(node, row, localDiv, remoteDiv, propertiesTable, hide, state)

  // use nightmare
})

test('Diff: refreshConflictHeader', t => {
  let diff = create(ctx)
  diff.refreshConflictHeader()

  // use nightmare
})

test('Diff: getRemoteDiff', t => {
  let diff = create(ctx)
  let cb = function () {
    return 'x'
  }
  diff.getRemoteDiff(cb)
  // use nightmare
})

test('Diff: showRemoteDiff', t => {
  let diff = create(ctx)
  let difference = {}
  diff.showRemoteDiff(difference)
  // use nightmare
})

test('Diff: parseNodes', t => {
  let diff = create(ctx)
  let node = {
    id: 'x'
  }
  let nodeList = [
    node
  ]
  diff.parseNodes(nodeList)
  // use nightmare
})

test('Diff: generateDiff', t => {
  let diff = create(ctx)
  let node = {
    id: 'x'
  }
  let currentNodes = []
  let newNodes = []
  diff.generateDiff(currentNodes, newNodes)
  // use nightmare
})

test('Diff: resolveDiffs', t => {
  let diff = create(ctx)
  let localDiff = {}
  let remoteDiff = {}
  diff.resolveDiffs(localDiff, remoteDiff)
  // use nightmare
})

test('Diff: showDiff', t => {
  let diff = create(ctx)
  let difference = {}
  diff.showDiff(difference)
  // use nightmare
})

test('Diff: mergeDiff', t => {
  let diff = create(ctx)
  let difference = {}
  diff.mergeDiff(difference)
  // use nightmare
})
