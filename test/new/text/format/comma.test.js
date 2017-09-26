import test from 'ava'
import {
  format
} from '../text'

const {
  comma
} = format

test('comma: structure', t => {
  t.is(typeof comma, 'object')
  t.is(typeof comma.format, 'function')
})

// format(text, args, isRtl, isHtml, locale, parseOnly)
test('comma: format', t => {
  let text = 'my text'
  t.truthy(comma.format(text))
})
