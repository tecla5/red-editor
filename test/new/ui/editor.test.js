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

test('Editor: validateNodeProperties', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  let definition = {}
  let properties = {}
  let valid = editor.validateNodeProperties(node, definition, properties)
  t.truthy(valid)
})

test('Editor: validateNodeProperty', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  let definition = {}
  let properties = {}
  let value = 'a'
  let valid = editor.validateNodeProperty(node, definition, property, value)
  t.truthy(valid)
})

test('Editor: validateNodeEditor', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  let prefix = 'a'
  let valid = editor.validateNodeEditor(node, prefix)
  t.truthy(valid)
})

test('Editor: validateNodeEditorProperty', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  let defaults = {}
  let property = {}
  let prefix = 'a'
  let valid = editor.validateNodeEditorProperty(node, defaults, property, prefix)
  t.truthy(valid)
})

test('Editor: updateNodeProperties', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  let output = {}
  let removedLinks = editor.updateNodeProperties(node, outputMap)
  t.truthy(removedLinks)
})

test('Editor: prepareConfigNodeSelect', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  let type = 'io'
  let property = {}
  let prefix = 'a'
  let prepared = editor.prepareConfigNodeSelect(node, property, type, prefix)
  t.truthy(prepared)
})

test('Editor: prepareConfigNodeButton', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  let type = 'io'
  let property = {}
  let prefix = 'a'
  let prepared = editor.prepareConfigNodeButton(node, property, type, prefix)
  t.truthy(prepared)
})

test('Editor: preparePropertyEditor', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  let definition = {}
  let property = {}
  let prefix = 'a'
  let prepared = editor.preparePropertyEditor(node, property, prefix, definition)
  t.truthy(prepared)
})

test('Editor: attachPropertyChangeHandler', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  let definition = {}
  let property = {}
  let prefix = 'a'
  let prepared = editor.attachPropertyChangeHandler(node, definition, property, prefix)
  t.truthy(prepared)
})

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
