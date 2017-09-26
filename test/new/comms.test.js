import test from 'ava'
import {
  Communications
} from './api'
const ctx = {}

function create(ctx) {
  return new Communications(ctx)
}

function func(event) {
  return ':' + event
}

test('Communications: create', t => {
  let comms = create(ctx)
  t.is(typeof comms, 'object')
})

test('communications: connect - makes active', t => {
  let comms = create(ctx)
  comms.connect()
  t.true(comms.active)
})

test('communications: connect - opens Web socket', t => {
  let comms = create(ctx)
  comms.connect()
  t.true(typeof comms.ws, 'object')

  // configures callback functions
  t.true(typeof comms.onmessage, 'function')
  t.true(typeof comms.onopen, 'function')
  t.true(typeof comms.onclose, 'function')
})

test('communications: subscribe - adds to subscriptions', t => {
  let comms = create(ctx)
  comms.subscribe('a', func)
  t.true(comms.subscriptions['a'], func)
})

test('communications: unsubscribe - removes from subscriptions', t => {
  let comms = create(ctx)
  comms.subscribe('a', func)
  t.true(comms.subscriptions['a'], func)
  comms.unsubscribe('a')
  t.false(comms.subscriptions['a'], func)
})
