import test from 'ava'
import {
  format
} from '../text'

const {
  common
} = format

test('common: structure', t => {
  t.is(typeof common, 'object')
  t.is(typeof common.handle, 'function')
})

// handle(content, segments, args, locale)
test('common: handle', t => {
  let content = 'xyz'
  t.truthy(common.handle(content))
})
