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
    Context
} from './context'

import {
    Actions,
    Clipboard,
    Deploy,
    Diff,
    Editor,
    Keyboard,
    Library,
    Notifications,
    Search,
    state,
    Subflow,
    Tray,
    TypeSearch,
    UserSettings,
    Utils,
    Workspaces,
    Sidebar,
    SidebarTabConfig,
    SidebarTabInfo,
    Palette,
    PaletteEditor
}
from './ui'

import {
    Nodes
} from '.'

export class Main extends Context {
    constructor(ctx) {
        super(ctx);
        $(() => {

            if ((window.location.hostname !== "localhost") && (window.location.hostname !== "127.0.0.1")) {
                document.title = document.title + " : " + window.location.hostname;
            }

            ace.require("ace/ext/language_tools");

            ctx.i18n.init(function () {
                ctx.settings.init(loadEditor);
            })
        });

    }

    loadNodeList() {
        const ctx = this.ctx;
        $.ajax({
            headers: {
                "Accept": "application/json"
            },
            cache: false,
            url: 'nodes',
            success: function (data) {
                ctx.nodes.setNodeList(data);
                ctx.i18n.loadNodeCatalogs(loadNodes);
            }
        });
    }

    loadNodes() {
        const ctx = this.ctx;
        $.ajax({
            headers: {
                "Accept": "text/html"
            },
            cache: false,
            url: 'nodes',
            success: (data) => {
                $("body").append(data);
                $("body").i18n();
                $("#palette > .palette-spinner").hide();
                $(".palette-scroll").removeClass("hide");
                $("#palette-search").removeClass("hide");
                this.loadFlows();
            }
        });
    }

    loadFlows() {
        const ctx = this.ctx;
        const nodes = ctx.nodes

        $.ajax({
            headers: {
                "Accept": "application/json",
            },
            cache: false,
            url: 'flows',
            success: (nodes) => {
                var currentHash = window.location.hash;
                nodes.version(nodes.rev);
                nodes.import(nodes.flows);
                nodes.dirty(false);
                ctx.view.redraw(true);
                if (/^#flow\/.+$/.test(currentHash)) {
                    ctx.workspaces.show(currentHash.substring(6));
                }

                var persistentNotifications = {};
                ctx.comms.subscribe("notification/#", function (topic, msg) {
                    var parts = topic.split("/");
                    var notificationId = parts[1];
                    if (notificationId === "runtime-deploy") {
                        // handled in ui/deploy.js
                        return;
                    }
                    if (notificationId === "node") {
                        // handled below
                        return;
                    }
                    if (msg.text) {
                        var text = ctx._(msg.text, {
                            default: msg.text
                        });
                        if (!persistentNotifications.hasOwnProperty(notificationId)) {
                            persistentNotifications[notificationId] = ctx.notify(text, msg.type, msg.timeout === undefined, msg.timeout);
                        } else {
                            persistentNotifications[notificationId].update(text, msg.timeout);
                        }
                    } else if (persistentNotifications.hasOwnProperty(notificationId)) {
                        persistentNotifications[notificationId].close();
                        delete persistentNotifications[notificationId];
                    }
                });
                ctx.comms.subscribe("status/#", function (topic, msg) {
                    var parts = topic.split("/");
                    var node = ctx.nodes.node(parts[1]);
                    if (node) {
                        if (msg.hasOwnProperty("text")) {
                            if (msg.text[0] !== ".") {
                                msg.text = node._(msg.text.toString(), {
                                    defaultValue: msg.text.toString()
                                });
                            }
                        }
                        node.status = msg;
                        node.dirty = true;
                        ctx.view.redraw();
                    }
                });
                ctx.comms.subscribe("notification/node/#", function (topic, msg) {
                    var i, m;
                    var typeList;
                    var info;
                    if (topic == "notification/node/added") {
                        var addedTypes = [];
                        msg.forEach(function (m) {
                            var id = m.id;
                            ctx.nodes.addNodeSet(m);
                            addedTypes = addedTypes.concat(m.types);
                            ctx.i18n.loadCatalog(id, function () {
                                $.get('nodes/' + id, function (data) {
                                    $("body").append(data);
                                });
                            });
                        });
                        if (addedTypes.length) {
                            typeList = "<ul><li>" + addedTypes.join("</li><li>") + "</li></ul>";
                            ctx.notify(ctx._("palette.event.nodeAdded", {
                                count: addedTypes.length
                            }) + typeList, "success");
                        }
                    } else if (topic == "notification/node/removed") {
                        for (i = 0; i < msg.length; i++) {
                            m = msg[i];
                            info = ctx.nodes.removeNodeSet(m.id);
                            if (info.added) {
                                typeList = "<ul><li>" + m.types.join("</li><li>") + "</li></ul>";
                                ctx.notify(ctx._("palette.event.nodeRemoved", {
                                    count: m.types.length
                                }) + typeList, "success");
                            }
                        }
                    } else if (topic == "notification/node/enabled") {
                        if (msg.types) {
                            info = ctx.nodes.getNodeSet(msg.id);
                            if (info.added) {
                                ctx.nodes.enableNodeSet(msg.id);
                                typeList = "<ul><li>" + msg.types.join("</li><li>") + "</li></ul>";
                                ctx.notify(ctx._("palette.event.nodeEnabled", {
                                    count: msg.types.length
                                }) + typeList, "success");
                            } else {
                                $.get('nodes/' + msg.id, function (data) {
                                    $("body").append(data);
                                    typeList = "<ul><li>" + msg.types.join("</li><li>") + "</li></ul>";
                                    ctx.notify(ctx._("palette.event.nodeAdded", {
                                        count: msg.types.length
                                    }) + typeList, "success");
                                });
                            }
                        }
                    } else if (topic == "notification/node/disabled") {
                        if (msg.types) {
                            ctx.nodes.disableNodeSet(msg.id);
                            typeList = "<ul><li>" + msg.types.join("</li><li>") + "</li></ul>";
                            ctx.notify(ctx._("palette.event.nodeDisabled", {
                                count: msg.types.length
                            }) + typeList, "success");
                        }
                    } else if (topic == "node/upgraded") {
                        ctx.notify(ctx._("palette.event.nodeUpgraded", {
                            module: msg.module,
                            version: msg.version
                        }), "success");
                        ctx.nodes.registry.setModulePendingUpdated(msg.module, msg.version);
                    }
                    // Refresh flow library to ensure any examples are updated
                    ctx.library.loadFlowLibrary();
                });
            }
        });
    }

    showAbout() {
        const ctx = this.ctx;
        $.get('red/about', function (data) {
            var aboutHeader = '<div style="text-align:center;">' +
                '<img width="50px" src="red/images/node-red-icon.svg" />' +
                '</div>';

            ctx.sidebar.info.set(aboutHeader + marked(data));
            ctx.sidebar.info.show();
        });
    }

    loadEditor() {
        const ctx = this.ctx;
        var menuOptions = [];
        menuOptions.push({
            id: "menu-item-view-menu",
            label: ctx._("menu.label.view.view"),
            options: [
                // {id:"menu-item-view-show-grid",setting:"view-show-grid",label:ctx._("menu.label.view.showGrid"),toggle:true,onselect:"core:toggle-show-grid"},
                // {id:"menu-item-view-snap-grid",setting:"view-snap-grid",label:ctx._("menu.label.view.snapGrid"),toggle:true,onselect:"core:toggle-snap-grid"},
                // {id:"menu-item-status",setting:"node-show-status",label:ctx._("menu.label.displayStatus"),toggle:true,onselect:"core:toggle-status", selected: true},
                //null,
                // {id:"menu-item-bidi",label:ctx._("menu.label.view.textDir"),options:[
                //     {id:"menu-item-bidi-default",toggle:"text-direction",label:ctx._("menu.label.view.defaultDir"),selected: true, onselect:function(s) { if(s){ctx.text.bidi.setTextDirection("")}}},
                //     {id:"menu-item-bidi-ltr",toggle:"text-direction",label:ctx._("menu.label.view.ltr"), onselect:function(s) { if(s){ctx.text.bidi.setTextDirection("ltr")}}},
                //     {id:"menu-item-bidi-rtl",toggle:"text-direction",label:ctx._("menu.label.view.rtl"), onselect:function(s) { if(s){ctx.text.bidi.setTextDirection("rtl")}}},
                //     {id:"menu-item-bidi-auto",toggle:"text-direction",label:ctx._("menu.label.view.auto"), onselect:function(s) { if(s){ctx.text.bidi.setTextDirection("auto")}}}
                // ]},
                // null,
                {
                    id: "menu-item-sidebar",
                    label: ctx._("menu.label.sidebar.show"),
                    toggle: true,
                    onselect: "core:toggle-sidebar",
                    selected: true
                },
                null
            ]
        });
        menuOptions.push(null);
        menuOptions.push({
            id: "menu-item-import",
            label: ctx._("menu.label.import"),
            options: [{
                    id: "menu-item-import-clipboard",
                    label: ctx._("menu.label.clipboard"),
                    onselect: "core:show-import-dialog"
                },
                {
                    id: "menu-item-import-library",
                    label: ctx._("menu.label.library"),
                    options: []
                }
            ]
        });
        menuOptions.push({
            id: "menu-item-export",
            label: ctx._("menu.label.export"),
            disabled: true,
            options: [{
                    id: "menu-item-export-clipboard",
                    label: ctx._("menu.label.clipboard"),
                    disabled: true,
                    onselect: "core:show-export-dialog"
                },
                {
                    id: "menu-item-export-library",
                    label: ctx._("menu.label.library"),
                    disabled: true,
                    onselect: "core:library-export"
                }
            ]
        });
        menuOptions.push(null);
        menuOptions.push({
            id: "menu-item-search",
            label: ctx._("menu.label.search"),
            onselect: "core:search"
        });
        menuOptions.push(null);
        menuOptions.push({
            id: "menu-item-config-nodes",
            label: ctx._("menu.label.displayConfig"),
            onselect: "core:show-config-tab"
        });
        menuOptions.push({
            id: "menu-item-workspace",
            label: ctx._("menu.label.flows"),
            options: [{
                    id: "menu-item-workspace-add",
                    label: ctx._("menu.label.add"),
                    onselect: "core:add-flow"
                },
                {
                    id: "menu-item-workspace-edit",
                    label: ctx._("menu.label.rename"),
                    onselect: "core:edit-flow"
                },
                {
                    id: "menu-item-workspace-delete",
                    label: ctx._("menu.label.delete"),
                    onselect: "core:remove-flow"
                }
            ]
        });
        menuOptions.push({
            id: "menu-item-subflow",
            label: ctx._("menu.label.subflows"),
            options: [{
                    id: "menu-item-subflow-create",
                    label: ctx._("menu.label.createSubflow"),
                    onselect: "core:create-subflow"
                },
                {
                    id: "menu-item-subflow-convert",
                    label: ctx._("menu.label.selectionToSubflow"),
                    disabled: true,
                    onselect: "core:convert-to-subflow"
                },
            ]
        });
        menuOptions.push(null);
        if (ctx.settings.theme('palette.editable') !== false) {
            menuOptions.push({
                id: "menu-item-edit-palette",
                label: ctx._("menu.label.editPalette"),
                onselect: "core:manage-palette"
            });
            menuOptions.push(null);
        }

        menuOptions.push({
            id: "menu-item-user-settings",
            label: ctx._("menu.label.settings"),
            onselect: "core:show-user-settings"
        });
        menuOptions.push(null);

        menuOptions.push({
            id: "menu-item-keyboard-shortcuts",
            label: ctx._("menu.label.keyboardShortcuts"),
            onselect: "core:show-help"
        });
        menuOptions.push({
            id: "menu-item-help",
            label: ctx.settings.theme("menu.menu-item-help.label", ctx._("menu.label.help")),
            href: ctx.settings.theme("menu.menu-item-help.url", "http://nodered.org/docs")
        });
        menuOptions.push({
            id: "menu-item-node-red-version",
            label: "v" + ctx.settings.version,
            onselect: "core:show-about"
        });

        // TODO: All UI editor wiring should be done in ui/main loadEditor() method

        ctx.actions = new Actions(ctx)
        ctx.clipboard = new Clipboard(ctx)

        // RED.settings.theme("deployButton",null
        var deployCtx = ctx.settings.theme('deployButton', null)
        ctx.deploy = new Deploy(deployCtx)
        ctx.diff = new Diff(ctx)
        ctx.editor = new Editor(ctx)
        ctx.keyboard = new Keyboard(ctx)
        ctx.library = new Library(ctx)
        ctx.notifications = new Notifications(ctx)
        ctx.search = new Search(ctx)
        ctx.subflow = new Subflow(ctx)
        ctx.tray = new Tray(ctx)
        ctx.typeSearch = new TypeSearch(ctx)
        ctx.userSettings = new UserSettings(ctx)
        ctx.utils = new Utils(ctx)
        ctx.workspaces = new Workspaces(ctx)
        ctx.sidebar = new Sidebar(ctx)

        ctx.palette = new Palette(ctx)

        // see above or legacy/main
        if (ctx.settings.theme('palette.editable') !== false) {
            ctx.palette.editor = new PaletteEditor(ctx)
        }

        ctx.touch = {
            radialMenu: new RadialMenu(ctx)
        }
        ctx.nodes = new Nodes(ctx)

        // ctx.view.init();
        // ctx.userSettings.init();
        // ctx.user.init();
        // ctx.library.init();
        // ctx.keyboard.init();
        // ctx.palette.init();
        // if (ctx.settings.theme('palette.editable') !== false) {
        //     ctx.palette.editor.init();
        // }

        // ctx.sidebar.init();
        // ctx.subflow.init();
        // ctx.workspaces.init();
        // ctx.clipboard.init();
        // ctx.search.init();
        // ctx.editor.init();
        // ctx.diff.init();

        // ctx.menu.init({
        //     id: "btn-sidemenu",
        //     options: menuOptions
        // });

        // ctx.deploy.init(ctx.settings.theme("deployButton", null));

        ctx.actions.add("core:show-about", showAbout);
        // ctx.nodes.init();
        ctx.comms.connect();

        $("#main-container").show();
        $(".header-toolbar").show();

        this.loadNodeList();
    }
}
