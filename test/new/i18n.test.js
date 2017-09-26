import test from 'ava'
import {
  I18n
} from './api'

function create(ctx) {
  return new I18n(ctx)
}

const ctx = {}

test('I18n: create', t => {
  let inst = create(ctx)
  t.is(typeof inst, 'object')
  t.is(typeof inst.i18n, 'object')
})

test('i18n: init', async t => {
  let inst = create(ctx)
  await inst.init()
  t.is(typeof inst.i18n, 'object')
})

test('i18n: loadCatalog - no namespace', async t => {
  let inst = create(ctx)
  await inst.init()
  try {
    await inst.loadCatalog()
    t.fail('should fail when no namespace')
  } catch (err) {
    t.pass('fails when no namespace')
  }
})

test('i18n: loadCatalog - valid namespace', async t => {
  let inst = create(ctx)
  await inst.init()
  try {
    await inst.loadCatalog()
    t.pass('pass with valid namespace')
  } catch (err) {
    t.fail('should not fail when valid namespace')
  }
})


test('i18n: loadCatalogs', async t => {

})
