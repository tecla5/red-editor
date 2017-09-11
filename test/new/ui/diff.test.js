const nightmare = require('../nightmare')
import ava from 'ava'
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
  let container = $('#container')

  // TODO: real data
  let node = {}
  let stats = {}
  diff.createNodeDiffRow(node, stats)

  // use nightmare
})
test('Diff: createNodePropertiesTable', t => {})
test('Diff: createNodeConflictRadioBoxes', t => {})
test('Diff: refreshConflictHeader', t => {})
test('Diff: getRemoteDiff', t => {})
test('Diff: showRemoteDiff', t => {})
test('Diff: parseNodes', t => {})
test('Diff: generateDiff', t => {})
test('Diff: resolveDiffs', t => {})
test('Diff: showDiff', t => {})
test('Diff: mergeDiff', t => {})
