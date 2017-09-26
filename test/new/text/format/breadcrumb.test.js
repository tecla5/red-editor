import test from 'ava'
import {
  format
} from '../text'

const {
  breadcrumb
} = format

test('breadcrumb: structure', t => {
  t.is(typeof breadcrumb, 'object')
  t.is(typeof breadcrumb.format, 'function')
})

// format(text, args, isRtl, isHtml, locale, parseOnly)
test('breadcrumb: format text', t => {
  let text = 'my text'
  t.truthy(breadcrumb.format(text))
})
