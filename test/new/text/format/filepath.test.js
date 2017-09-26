import test from 'ava'
import {
  format
} from '../text'

const {
  filepath
} = format

test('filepath: structure', t => {
  t.is(typeof filepath, 'object')
  t.is(typeof filepath.format, 'function')
})

// format(text, args, isRtl, isHtml, locale, parseOnly)
test('filepath: format', t => {
  let content = 'xyz'
  t.truthy(filepath.format(content))
})
