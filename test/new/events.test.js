import test from 'ava'
import {
  Events
} from './api'

const ctx = {}
const evt = 'hello'

function create(ctx) {
  return new Events(ctx)
}

function func(event) {
  return ':' + event
}

test('Events: create', t => {
  let events = create(ctx)
  t.deepEqual(handlers, {})
})

test('events: on', t => {
  let events = create(ctx)
  events.on(evt, func)

  t.is(handlers[evt], func)
})

test('events: off', t => {
  let events = create(ctx)
  events.on(evt, func)
  t.is(handlers[evt], func)

  events.off(evt)
  t.is(handlers[evt], null)
})

test('events: emit', async t => {
  let events = create(ctx)
  events.on(evt, func)
  let result = events.emit(evt)
  t.is(result, ':hello')
})
