const nightmare = require('../nightmare')
import test from 'ava'
import {
  Search
} from '../../../src/new/ui/search'
const ctx = {}

function create(ctx) {
  return new Search(ctx)
}

test('Search: create', t => {
  let search = create(ctx)
  t.falsy(search.disabled)
})

test('Search: indexNode', t => {
  let search = create(ctx)
  let n = {
    id: 'x',
    label: 'abc'
  }
  search.indexNode(n)
  // fix
  let indexed = search.index[n.label]
  t.is(indexed, n)
})

test('Search: indexWorkspace', t => {})
test('Search: search', t => {})
test('Search: ensureSelectedIsVisible', t => {})
test('Search: createDialog', t => {})
test('Search: reveal', t => {})
test('Search: show', t => {})
test('Search: hide', t => {})
