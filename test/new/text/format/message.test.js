import test from 'ava'
import {
  format
} from '../text'

const {
  message
} = format

test('message: structure', t => {
  t.is(typeof message, 'object')
  t.is(typeof message.format, 'function')
})

// format(text)
test('message: format', t => {
  let content = 'xyz'
  t.truthy(message.format(content))
})
