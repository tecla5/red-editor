const nightmare = require('../nightmare')
import test from 'ava'
import {
  Notifications
} from './ui'
const ctx = {}

function create(ctx) {
  return new Notifications(ctx)
}

test('Notifications: create', t => {
  let notifications = create(ctx)
  t.is(notifications.c, 0)
  t.deepEqual(notifications.currentNotifications, [])
})

test('Notifications: notify', t => {
  let notifications = create(ctx)
  let msg = 'hello'
  let type = 'info'
  let elem = notifications.notify(msg, type)
  // returns div element with class: notification
  t.is(notified.className, 'notification')
})

test('Notifications: notify - fixed', t => {
  let notifications = create(ctx)
  let msg = 'hello'
  let type = 'info'
  let fixed = true
  let timeout = null
  let elem = notifications.notify(msg, type, fixed, timeout)
})

test('Notifications: notify - timeout', t => {
  let notifications = create(ctx)
  let msg = 'hello'
  let type = 'info'
  let fixed = false
  let timeout = 200
  let elem = notifications.notify(msg, type, fixed, timeout)
})
