import test from 'ava'
import {
  format
} from '../text'

const {
  misc
} = format

test('misc: structure', t => {
  t.is(typeof misc, 'object')
  t.is(typeof misc.isBidiLocale, 'function')
})

// isBidiLocale(locale)
test('misc: isBidiLocale', t => {
  let locale = 'us'
  t.truthy(misc.isBidiLocale(locale))
})
