import test from 'ava'
import {
  History
} from '../api'
const ctx = {}

function create(ctx) {
  return new History(ctx)
}

test('history: undo', t => {
  let history = create(ctx)
  let ev = {
    id: 'a'
  }

  history.push(ev)
  let latest = nodes.peek()
  t.is(latest, ev)
  history.undo()

  latest = nodes.peek()
  t.falsy(latest)
})
