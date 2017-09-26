/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

import {
  Communications,
  Events,
  I18n,
  Main,
  Settings,
  User,
  Validators,

  History,
  Nodes,
  // TextFormat,
  // Bidi,
}
from '.'

import {
  TextFormat,
  Bidi
}
from './text'


console.log({
  Communications,
  Events,
  I18n,
  Main,
  Settings,
  User,
  Validators,

  History,
  Nodes,
  TextFormat,
  Bidi,
})

var ctx = {};
ctx.text = {
  bidi: new Bidi(ctx),
  format: new TextFormat(ctx)
}
ctx.history = new History(ctx)
// ctx.nodes = new Nodes(ctx)

// See legacy/main.js
// RED.view.init();
// RED.userSettings.init();
// RED.user.init();
// RED.library.init();
// RED.keyboard.init();
// RED.palette.init();
// if (RED.settings.theme('palette.editable') !== false) {
//     RED.palette.editor.init();
// }

// RED.sidebar.init();
// RED.subflow.init();
// RED.workspaces.init();
// RED.clipboard.init();
// RED.search.init();
// RED.editor.init();
// RED.diff.init();

// RED.menu.init({id:"btn-sidemenu",options: menuOptions});

// RED.deploy.init(RED.settings.theme("deployButton",null));

// RED.actions.add("core:show-about", showAbout);
// RED.nodes.init();
// RED.comms.connect();

ctx.i18n = new I18n(ctx)
ctx.events = new Events(ctx)
ctx.comms = new Communications(ctx)
ctx.settings = new Settings(ctx)
ctx.user = new User(ctx)
ctx.validators = new Validators(ctx)

// NOTE: All wired up inside main.loadEditor()
// import {
//   Actions,
//   Clipboard,
//   Deploy,
//   Diff,
//   Editor,
//   Keyboard,
//   Library,
//   Notifications,
//   Search,
//   state,
//   Subflow,
//   Tray,
//   TypeSearch,
//   UserSettings,
//   Utils,
//   Workspaces,
//   Sidebar,
//   SidebarTabConfig,
//   SidebarTabInfo,
//   Palette,
//   PaletteEditor
// }
// from './ui'

// // TODO: All UI editor wiring should be done in ui/main loadEditor() method

// ctx.actions = new Actions(ctx)
// ctx.clipboard = new Clipboard(ctx)

// // RED.settings.theme("deployButton",null
// var deployCtx = ctx.settings.theme('deployButton', null)
// ctx.deploy = new Deploy(deployCtx)
// ctx.diff = new Diff(ctx)
// ctx.editor = new Editor(ctx)
// ctx.keyboard = new Keyboard(ctx)
// ctx.library = new Library(ctx)
// ctx.notifications = new Notifications(ctx)
// ctx.search = new Search(ctx)
// ctx.subflow = new Subflow(ctx)
// ctx.tray = new Tray(ctx)
// ctx.typeSearch = new TypeSearch(ctx)
// ctx.userSettings = new UserSettings(ctx)
// ctx.utils = new Utils(ctx)
// ctx.workspaces = new Workspaces(ctx)
// ctx.sidebar = new Sidebar(ctx)

// // NOTE: created within sidebar constructor
// // ctx.sidebar.config = new SidebarTabConfig(ctx)
// // ctx.sidebar.info = new SidebarTabInfo(ctx)

// ctx.palette = new Palette(ctx)

// // see above or legacy/main
// if (ctx.settings.theme('palette.editable') !== false) {
//   ctx.palette.editor = new PaletteEditor(ctx)
// }

// ctx.touch = {
//   radialMenu: new RadialMenu(ctx)
// }

export default ctx
