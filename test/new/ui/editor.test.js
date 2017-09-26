const nightmare = require('../nightmare')
import test from 'ava'
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

test('Editor: populateCredentialsInputs', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  let credDef = {}
  let credData = {}
  let prefix = 'a'
  editor.populateCredentialsInputs(node, credDef, credData, prefix)

  // use nightmare
})

test('Editor: updateNodeCredentials', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  let credDef = {}
  let prefix = 'a'
  editor.updateNodeCredentials(node, credDef, prefix)

  // use nightmare
})

test.cb('Editor: prepareEditDialog', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  let definition = {}
  let prefix = 'a'
  editor.prepareEditDialog(node, definition, prefix, () => {
    // use nightmare
    // t.is()
    t.end()
  })
})

test('Editor: getEditStackTitle', t => {
  let editor = create(ctx)
  let expected = 'my-title'
  let title = editor.getEditStackTitle()
  t.is(title, expected)
})

test('Editor: buildEditForm', t => {
  let editor = create(ctx)
  let container = $('#container')
  let definition = {}
  let formId = 'a'
  let ns = {}
  editor.buildEditForm(container, formId, type, ns)
  // use nightmare
})

test('Editor: refreshLabelForm', t => {
  let editor = create(ctx)
  let container = $('#container')
  let node = {
    id: 'x'
  }
  editor.refreshLabelForm(container, node)
  // use nightmare
})

test('Editor: buildLabelRow', t => {
  let editor = create(ctx)
  let type = 'io'
  let index = 0
  let value = 'hello'
  let placeholder = 'my-io'
  editor.buildLabelRow(type, index, value, placeHolder)
  // use nightmare
})

test('Editor: buildLabelForm', t => {
  let editor = create(ctx)
  let container = $('#container')
  let node = {
    id: 'x'
  }
  editor.buildLabelForm(container, node)
  // use nightmare
})

test('Editor: showEditDialog', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  editor.showEditDialog(node)
  // use nightmare
})

test('Editor: showEditConfigNodeDialog', t => {
  let editor = create(ctx)
  let node = {
    id: 'x'
  }
  let type = 'io'
  let id = 'x'
  let prefix = 'my-'
  editor.showEditConfigNodeDialog(name, type, id, prefix)
  // use nightmare
})

test('Editor: defaultConfigNodeSort', t => {
  let editor = create(ctx)
  let A = {
    id: 'a'
  }
  let B = {
    id: 'b'
  }
  editor.defaultConfigNodeSort(A, B)
})

test('Editor: updateConfigNodeSelect', t => {
  let editor = create(ctx)
  let name = 'x'
  let type = 'io'
  let value = '2'
  let prefix = 'my-'
  editor.updateConfigNodeSelect(name, type, value, prefix)
})

test('Editor: showEditSubflowDialog', t => {
  let editor = create(ctx)
  let subflow = {}
  editor.showEditSubflowDialog(subflow)
})

test('Editor: editExpression', t => {
  let editor = create(ctx)
  let options = {}
  editor.editExpression(options)
})

test('Editor: editJSON', t => {
  let editor = create(ctx)
  let options = {}
  editor.editJSON(options)
})

test('Editor: stringToUTF8Array', t => {
  let editor = create(ctx)
  let str = 'abc'
  editor.stringToUTF8Array(str)
})

test('Editor: editBuffer', t => {
  let editor = create(ctx)
  let options = {}
  editor.editBuffer(options)
})

test('Editor: createEditor', t => {
  let editor = create(ctx)
  let options = {}
  editor.createEditor(options)
})
