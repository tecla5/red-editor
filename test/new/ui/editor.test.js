const nightmare = require('../nightmare')
import ava from 'ava'
import {
  Editor
} from './ui'
const ctx = {}

function create(ctx) {
  return new Editor(ctx)
}

test('Editor: create', t => {
  let editor = create(ctx)
  t.deepEqual(editor.editStack, [])
})

test('Editor: getCredentialsURL', t => {
  let editor = create(ctx)
  let url = editor.getCredentialsURL('a b', 'x')
  t.is(url, 'credentials/a-b/x')
})

test('Editor: validateNode', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  let valid = editor.validateNode(node)
  t.truthy(valid)
})

test('Editor: validateNodeProperties', t => {})
test('Editor: validateNodeProperty', t => {})
test('Editor: validateNodeEditor', t => {})
test('Editor: validateNodeEditorProperty', t => {})
test('Editor: updateNodeProperties', t => {})
test('Editor: prepareConfigNodeSelect', t => {})
test('Editor: prepareConfigNodeButton', t => {})
test('Editor: preparePropertyEditor', t => {})
test('Editor: attachPropertyChangeHandler', t => {})
test('Editor: populateCredentialsInputs', t => {})
test('Editor: updateNodeCredentials', t => {})

test('Editor: prepareEditDialog', t => {})
test('Editor: getEditStackTitle', t => {})
test('Editor: buildEditForm', t => {})
test('Editor: refreshLabelForm', t => {})
test('Editor: buildLabelRow', t => {})
test('Editor: buildLabelForm', t => {})

test('Editor: showEditDialog', t => {})
test('Editor: showEditConfigNodeDialog', t => {})
test('Editor: defaultConfigNodeSort', t => {})
test('Editor: updateConfigNodeSelect', t => {})
test('Editor: showEditSubflowDialog', t => {})
test('Editor: editExpression', t => {})

test('Editor: editJSON', t => {})
test('Editor: stringToUTF8Array', t => {})
test('Editor: editBuffer', t => {})
test('Editor: createEditor', t => {})
