const nightmare = require('../nightmare')
import test from 'ava'
import {
  Tip,
  SidebarTabInfo
} from './ui'

const ctx = {}

function createTip(ctx) {
  return new Tip(ctx)
}

function create(ctx) {
  return new SidebarTabInfo(ctx)
}

test('Tip: create', t => {
  let tip = createTip(ctx)
  t.truthy(tip.enabled)
})

test('Tip: setTip', t => {
  let tip = createTip(ctx)
  tip.setTip()
  // use nightmare to test UI
})

test('Tip: cycleTips', t => {
  let tip = createTip(ctx)
  tip.cycleTips()
  // use nightmare to test UI
})

test('Tip: startTips', t => {
  let tip = createTip(ctx)
  tip.startTips()
  // use nightmare to test UI
})

test('Tip: stopTips', t => {
  let tip = createTip(ctx)
  tip.stopTips()
  // use nightmare to test UI
})

test('Tip: nextTip', t => {
  let tip = createTip(ctx)
  tip.nextTip()
  // use nightmare to test UI
})

test('Sidebar TabInfo: create', t => {
  let tabInfo = create(ctx)
  t.is(typeof tabInfo.tips, 'object')
  // use nightmare to test UI
})

test('TabInfo: show', t => {
  let tabInfo = create(ctx)
  tabInfo.show()
  // use nightmare to test UI
})

test('TabInfo: jsonFilter', t => {
  let tabInfo = create(ctx)
  tabInfo.jsonFilter(key, value)
})

test('TabInfo: addTargetToExternalLinks', t => {
  let tabInfo = create(ctx)
  let element = $('#target')
  tabInfo.addTargetToExternalLinks(element)
})

test('TabInfo: refresh', t => {
  let tabInfo = create(ctx)
  let node = {}
  tabInfo.refresh(node)
})

test('TabInfo: setInfoText', t => {
  let tabInfo = create(ctx)
  let node = {}
  tabInfo.setInfoText(infoText)
})

test('TabInfo: clear', t => {
  let tabInfo = create(ctx)
  tabInfo.clear()
})

test('TabInfo: set', t => {
  let tabInfo = create(ctx)
  let html = '<b>hello</b>'
  tabInfo.set(html)
})
