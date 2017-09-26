import test from 'ava'
import {
  format
} from '../text'

const {
  custom
} = format

test('custom: structure', t => {
  t.is(typeof custom, 'object')
  t.is(typeof custom.format, 'function')
})

//
test('custom: format', t => {
  let content = 'xyz'
  t.truthy(custom.format(content))
})
