const nightmare = require('../nightmare')
import test from 'ava'
import {
  TypeSearch
} from './ui'
const ctx = {}

function create(ctx) {
  return new TypeSearch(ctx)
}

test('TypeSearch: create', t => {
  let ts = create(ctx)
  t.false(ts.disabled)
})

test('TypeSearch: search', t => {
  let ts = create(ctx)
  let val = 'x'
  ts.search(val)
  // updates UI with search result

  // use nightmare
})

test('TypeSearch: ensureSelectedIsVisible', t => {
  let ts = create(ctx)
  ts.ensureSelectedIsVisible()
  // use nightmare
})

test('TypeSearch: createDialog', t => {
  let ts = create(ctx)
  ts.createDialog()
  // use nightmare
})

test('TypeSearch: confirm', t => {
  let ts = create(ctx)
  let def = {}
  ts.confirm(def)
  // use nightmare
})

test('TypeSearch: handleMouseActivity', t => {
  let ts = create(ctx)
  let def = {}
  ts.handleMouseActivity(evt)
  // use nightmare
})

test('TypeSearch: show', t => {
  let ts = create(ctx)
  let opts = {}
  ts.show(opts)
  // use nightmare
})

test('TypeSearch: hide', t => {
  let ts = create(ctx)
  let opts = {}
  ts.hide(fast)
  // use nightmare
})

test('TypeSearch: getTypeLabel', t => {
  let ts = create(ctx)
  let opts = {}
  ts.getTypeLabel(type, def)
  // use nightmare
})

test('TypeSearch: refreshTypeList', t => {
  let ts = create(ctx)
  ts.refreshTypeList()
  // use nightmare
})
