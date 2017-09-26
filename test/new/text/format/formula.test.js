import test from 'ava'
import {
  format
} from '../text'

const {
  formula
} = format

test('formula: structure', t => {
  t.is(typeof formula, 'object')
  t.is(typeof formula.format, 'function')
})

// format(text, args, isRtl, isHtml, locale, parseOnly)
test('formula: format', t => {
  let content = 'xyz'
  t.truthy(formula.format(content))
})
