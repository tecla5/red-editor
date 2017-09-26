import test from 'ava'
import {
  format
} from '../text'

const {
  email
} = format

test('email: structure', t => {
  t.is(typeof email, 'object')
  t.is(typeof email.format, 'function')
})

// format(text, args, isRtl, isHtml, locale, parseOnly)
test('email: format', t => {
  let content = 'xyz'
  t.truthy(email.format(content))
})
