import test from 'ava'
import {
  User
} from './api'

const ctx = {}

function create(ctx) {
  return new User(ctx)
}

test('user: create', t => {
  const user = create(ctx)
  t.is(typeof user, 'object')
})

test('user: login', async t => {
  // fix - should be async via promise, not done callback
  let opts = {}
  const user = create(ctx)

  await user.login(opts, done)

  // TODO: use nightmare to test that screen is updated as expected
})

test('user: logout', t => {
  let opts = {}
  const user = create(ctx)

  await user.login(opts, done)
  await user.logout()

  // TODO: use nightmare to test that screen is updated as expected
})

test('user: updateUserMenu', t => {
  const user = create(ctx)
  user.updateUserMenu()

  // TODO: use nightmare to test that screen is updated as expected
})
