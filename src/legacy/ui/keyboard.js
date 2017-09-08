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
RED.keyboard = (function() {

    var isMac = /Mac/i.test(window.navigator.platform);

    var handlers = {};
    var partialState;

    var keyMap = {
        "left":37,
        "up":38,
        "right":39,
        "down":40,
        "escape":27,
        "enter": 13,
        "backspace": 8,
        "delete": 46,
        "space": 32,
        ";":186,
        "=":187,
        ",":188,
        "-":189,
        ".":190,
        "/":191,
        "\\":220,
        "'":222,
        "?":191 // <- QWERTY specific
    }
    var metaKeyCodes = {
        16:true,
        17:true,
        18: true,
        91:true,
        93: true
    }
    var actionToKeyMap = {}
    var defaultKeyMap = {};

    // FF generates some different keycodes because reasons.
    var firefoxKeyCodeMap = {
        59:186,
        61:187,
        173:189
    }

    function init() {
        var userKeymap = RED.settings.get('keymap') || {};
        $.getJSON("red/keymap.json",function(data) {
            for (var scope in data) {
                if (data.hasOwnProperty(scope)) {
                    var keys = data[scope];
                    for (var key in keys) {
                        if (keys.hasOwnProperty(key)) {
                            if (!userKeymap.hasOwnProperty(keys[key])) {
                                addHandler(scope,key,keys[key],false);
                                defaultKeyMap[keys[key]] = {
                                    scope:scope,
                                    key:key,
                                    user:false
                                };
                            }
                        }
                    }
                }
            }
            for (var action in userKeymap) {
                if (userKeymap.hasOwnProperty(action)) {
                    var obj = userKeymap[action];
                    if (obj.hasOwnProperty('key')) {
                        addHandler(obj.scope, obj.key, action, true);
                    }
                }
            }
        });

        RED.userSettings.add({
            id:'keyboard',
            title: RED._("keyboard.keyboard"),
            get: getSettingsPane,
            focus: function() {
                setTimeout(function() {
                    $("#user-settings-tab-keyboard-filter").focus();
                },200);
            }
        })
    }

    function revertToDefault(action) {
        var currentAction = actionToKeyMap[action];
        if (currentAction) {
            removeHandler(currentAction.key);
        }
        if (defaultKeyMap.hasOwnProperty(action)) {
            var obj = defaultKeyMap[action];
            addHandler(obj.scope, obj.key, action, false);
        }
    }
    function parseKeySpecifier(key) {
        var parts = key.toLowerCase().split("-");
        var modifiers = {};
        var keycode;
        var blank = 0;
        for (var i=0;i<parts.length;i++) {
            switch(parts[i]) {
                case "ctrl":
                case "cmd":
                    modifiers.ctrl = true;
                    modifiers.meta = true;
                    break;
                case "alt":
                    modifiers.alt = true;
                    break;
                case "shift":
                    modifiers.shift = true;
                    break;
                case "":
                    blank++;
                    keycode = keyMap["-"];
                    break;
                default:
                    if (keyMap.hasOwnProperty(parts[i])) {
                        keycode = keyMap[parts[i]];
                    } else if (parts[i].length > 1) {
                        return null;
                    } else {
                        keycode = parts[i].toUpperCase().charCodeAt(0);
                    }
                    break;
            }
        }
        return [keycode,modifiers];
    }

    function resolveKeyEvent(evt) {
        var slot = partialState||handlers;
        if (evt.ctrlKey || evt.metaKey) {
            slot = slot.ctrl;
        }
        if (slot && evt.shiftKey) {
            slot = slot.shift;
        }
        if (slot && evt.altKey) {
            slot = slot.alt;
        }
        var keyCode = firefoxKeyCodeMap[evt.keyCode] || evt.keyCode;
        if (slot && slot[keyCode]) {
            var handler = slot[keyCode];
            if (!handler.scope) {
                if (partialState) {
                    partialState = null;
                    return resolveKeyEvent(evt);
                } else if (Object.keys(handler).length > 0) {
                    partialState = handler;
                    evt.preventDefault();
                    return null;
                } else {
                    return null;
                }
            } else if (handler.scope && handler.scope !== "*") {
                var target = evt.target;
                while (target.nodeName !== 'BODY' && target.id !== handler.scope) {
                    target = target.parentElement;
                }
                if (target.nodeName === 'BODY') {
                    handler = null;
                }
            }
            partialState = null;
            return handler;
        } else if (partialState) {
            partialState = null;
            return resolveKeyEvent(evt);
        }
    }
    d3.select(window).on("keydown",function() {
        if (metaKeyCodes[d3.event.keyCode]) {
            return;
        }
        var handler = resolveKeyEvent(d3.event);
        if (handler && handler.ondown) {
            if (typeof handler.ondown === "string") {
                RED.actions.invoke(handler.ondown);
            } else {
                handler.ondown();
            }
            d3.event.preventDefault();
        }
    });

    function addHandler(scope,key,modifiers,ondown) {
        var mod = modifiers;
        var cbdown = ondown;
        if (typeof modifiers == "function" || typeof modifiers === "string") {
            mod = {};
            cbdown = modifiers;
        }
        var keys = [];
        var i=0;
        if (typeof key === 'string') {
            if (typeof cbdown === 'string') {
                actionToKeyMap[cbdown] = {scope:scope,key:key};
                if (typeof ondown === 'boolean') {
                    actionToKeyMap[cbdown].user = ondown;
                }
            }
            var parts = key.split(" ");
            for (i=0;i<parts.length;i++) {
                var parsedKey = parseKeySpecifier(parts[i]);
                if (parsedKey) {
                    keys.push(parsedKey);
                } else {
                    return;
                }
            }
        } else {
            keys.push([key,mod])
        }
        var slot = handlers;
        for (i=0;i<keys.length;i++) {
            key = keys[i][0];
            mod = keys[i][1];
            if (mod.ctrl) {
                slot.ctrl = slot.ctrl||{};
                slot = slot.ctrl;
            }
            if (mod.shift) {
                slot.shift = slot.shift||{};
                slot = slot.shift;
            }
            if (mod.alt) {
                slot.alt = slot.alt||{};
                slot = slot.alt;
            }
            slot[key] = slot[key] || {};
            slot = slot[key];
            //slot[key] = {scope: scope, ondown:cbdown};
        }
        slot.scope = scope;
        slot.ondown = cbdown;
    }

    function removeHandler(key,modifiers) {
        var mod = modifiers || {};
        var keys = [];
        var i=0;
        if (typeof key === 'string') {

            var parts = key.split(" ");
            for (i=0;i<parts.length;i++) {
                var parsedKey = parseKeySpecifier(parts[i]);
                if (parsedKey) {
                    keys.push(parsedKey);
                } else {
                    console.log("Unrecognised key specifier:",key)
                    return;
                }
            }
        } else {
            keys.push([key,mod])
        }
        var slot = handlers;
        for (i=0;i<keys.length;i++) {
            key = keys[i][0];
            mod = keys[i][1];
            if (mod.ctrl) {
                slot = slot.ctrl;
            }
            if (slot && mod.shift) {
                slot = slot.shift;
            }
            if (slot && mod.alt) {
                slot = slot.alt;
            }
            if (!slot[key]) {
                return;
            }
            slot = slot[key];
        }
        if (typeof slot.ondown === "string") {
            if (typeof modifiers === 'boolean' && modifiers) {
                actionToKeyMap[slot.ondown] = {user: modifiers}
            } else {
                delete actionToKeyMap[slot.ondown];
            }
        }
        delete slot.scope;
        delete slot.ondown;
    }

    var cmdCtrlKey = '<span class="help-key">'+(isMac?'&#8984;':'Ctrl')+'</span>';

    function formatKey(key) {
        var formattedKey = isMac?key.replace(/ctrl-?/,"&#8984;"):key;
        formattedKey = isMac?formattedKey.replace(/alt-?/,"&#8997;"):key;
        formattedKey = formattedKey.replace(/shift-?/,"&#8679;")
        formattedKey = formattedKey.replace(/left/,"&#x2190;")
        formattedKey = formattedKey.replace(/up/,"&#x2191;")
        formattedKey = formattedKey.replace(/right/,"&#x2192;")
        formattedKey = formattedKey.replace(/down/,"&#x2193;")
        return '<span class="help-key-block"><span class="help-key">'+formattedKey.split(" ").join('</span> <span class="help-key">')+'</span></span>';
    }

    function validateKey(key) {
        key = key.trim();
        var parts = key.split(" ");
        for (i=0;i<parts.length;i++) {
            var parsedKey = parseKeySpecifier(parts[i]);
            if (!parsedKey) {
                return false;
            }
        }
        return true;
    }

    function editShortcut(e) {
        e.preventDefault();
        var container = $(this);
        var object = container.data('data');


        if (!container.hasClass('keyboard-shortcut-entry-expanded')) {
            endEditShortcut();

            var key = container.find(".keyboard-shortcut-entry-key");
            var scope = container.find(".keyboard-shortcut-entry-scope");
            container.addClass('keyboard-shortcut-entry-expanded');

            var keyInput = $('<input type="text">').attr('placeholder',RED._('keyboard.unassigned')).val(object.key||"").appendTo(key);
            keyInput.on("keyup",function(e) {
                if (e.keyCode === 13) {
                    return endEditShortcut();
                }
                var currentVal = $(this).val();
                currentVal = currentVal.trim();
                var valid = (currentVal === "" || RED.keyboard.validateKey(currentVal));
                $(this).toggleClass("input-error",!valid);
            })

            var scopeSelect = $('<select><option value="*" data-i18n="keyboard.global"></option><option value="workspace" data-i18n="keyboard.workspace"></option></select>').appendTo(scope);
            scopeSelect.i18n();
            scopeSelect.val(object.scope||'*');

            var div = $('<div class="keyboard-shortcut-edit button-group-vertical"></div>').appendTo(scope);
            var okButton = $('<button class="editor-button editor-button-small"><i class="fa fa-check"></i></button>').appendTo(div);
            var revertButton = $('<button class="editor-button editor-button-small"><i class="fa fa-reply"></i></button>').appendTo(div);

            okButton.click(function(e) {
                e.stopPropagation();
                endEditShortcut();
            });
            revertButton.click(function(e) {
                e.stopPropagation();
                RED.keyboard.revertToDefault(object.id);
                container.empty();
                container.removeClass('keyboard-shortcut-entry-expanded');
                var shortcut = RED.keyboard.getShortcut(object.id);
                var userKeymap = RED.settings.get('keymap') || {};
                delete userKeymap[object.id];
                RED.settings.set('keymap',userKeymap);

                var obj = {
                    id:object.id,
                    scope:shortcut?shortcut.scope:undefined,
                    key:shortcut?shortcut.key:undefined,
                    user:shortcut?shortcut.user:undefined
                }
                buildShortcutRow(container,obj);
            })

            keyInput.focus();
        }
    }

    function endEditShortcut(cancel) {
        var container = $('.keyboard-shortcut-entry-expanded');
        if (container.length === 1) {
            var object = container.data('data');
            var keyInput = container.find(".keyboard-shortcut-entry-key input");
            var scopeSelect = container.find(".keyboard-shortcut-entry-scope select");
            if (!cancel) {
                var key = keyInput.val().trim();
                var scope = scopeSelect.val();
                var valid = (key === "" || RED.keyboard.validateKey(key));
                if (valid) {
                    var current = RED.keyboard.getShortcut(object.id);
                    if ((!current && key) || (current && (current.scope !== scope || current.key !== key))) {
                        var keyDiv = container.find(".keyboard-shortcut-entry-key");
                        var scopeDiv = container.find(".keyboard-shortcut-entry-scope");
                        keyDiv.empty();
                        scopeDiv.empty();
                        if (object.key) {
                            RED.keyboard.remove(object.key,true);
                        }
                        container.find(".keyboard-shortcut-entry-text i").css("opacity",1);
                        if (key === "") {
                            keyDiv.parent().addClass("keyboard-shortcut-entry-unassigned");
                            keyDiv.append($('<span>').text(RED._('keyboard.unassigned'))  );
                            delete object.key;
                            delete object.scope;
                        } else {
                            keyDiv.parent().removeClass("keyboard-shortcut-entry-unassigned");
                            keyDiv.append(RED.keyboard.formatKey(key))
                            $("<span>").text(scope).appendTo(scopeDiv);
                            object.key = key;
                            object.scope = scope;
                            RED.keyboard.add(object.scope,object.key,object.id,true);
                        }
                        var userKeymap = RED.settings.get('keymap') || {};
                        userKeymap[object.id] = RED.keyboard.getShortcut(object.id);
                        RED.settings.set('keymap',userKeymap);
                    }
                }
            }
            keyInput.remove();
            scopeSelect.remove();
            $('.keyboard-shortcut-edit').remove();
            container.removeClass('keyboard-shortcut-entry-expanded');
        }
    }

    function buildShortcutRow(container,object) {
        var item = $('<div class="keyboard-shortcut-entry">').appendTo(container);
        container.data('data',object);

        var text = object.id.replace(/(^.+:([a-z]))|(-([a-z]))/g,function() {
            if (arguments[5] === 0) {
                return arguments[2].toUpperCase();
            } else {
                return " "+arguments[4].toUpperCase();
            }
        });
        var label = $('<div>').addClass("keyboard-shortcut-entry-text").text(text).appendTo(item);

        var user = $('<i class="fa fa-user"></i>').prependTo(label);

        if (!object.user) {
            user.css("opacity",0);
        }

        var key = $('<div class="keyboard-shortcut-entry-key">').appendTo(item);
        if (object.key) {
            key.append(RED.keyboard.formatKey(object.key));
        } else {
            item.addClass("keyboard-shortcut-entry-unassigned");
            key.append($('<span>').text(RED._('keyboard.unassigned'))  );
        }

        var scope = $('<div class="keyboard-shortcut-entry-scope">').appendTo(item);

        $("<span>").text(object.scope === '*'?'global':object.scope||"").appendTo(scope);
        container.click(editShortcut);
    }

    function getSettingsPane() {
        var pane = $('<div id="user-settings-tab-keyboard"></div>');

        $('<div class="keyboard-shortcut-entry keyboard-shortcut-list-header">'+
        '<div class="keyboard-shortcut-entry-key keyboard-shortcut-entry-text"><input id="user-settings-tab-keyboard-filter" type="text" data-i18n="[placeholder]keyboard.filterActions"></div>'+
        '<div class="keyboard-shortcut-entry-key" data-i18n="keyboard.shortcut"></div>'+
        '<div class="keyboard-shortcut-entry-scope" data-i18n="keyboard.scope"></div>'+
        '</div>').appendTo(pane);

        pane.find("input").searchBox({
            delay: 100,
            change: function() {
                var filterValue = $(this).val().trim();
                if (filterValue === "") {
                    shortcutList.editableList('filter', null);
                } else {
                    filterValue = filterValue.replace(/\s/g,"");
                    shortcutList.editableList('filter', function(data) {
                        return data.id.toLowerCase().replace(/^.*:/,"").replace("-","").indexOf(filterValue) > -1;
                    })
                }
            }
        });

        var shortcutList = $('<ol class="keyboard-shortcut-list"></ol>').css({
            position: "absolute",
            top: "32px",
            bottom: "0",
            left: "0",
            right: "0"
        }).appendTo(pane).editableList({
            addButton: false,
            scrollOnAdd: false,
            addItem: function(container,i,object) {
                buildShortcutRow(container,object);
            },

        });
        var shortcuts = RED.actions.list();
        shortcuts.sort(function(A,B) {
            var Aid = A.id.replace(/^.*:/,"").replace(/[ -]/g,"").toLowerCase();
            var Bid = B.id.replace(/^.*:/,"").replace(/[ -]/g,"").toLowerCase();
            return Aid.localeCompare(Bid);
        });
        shortcuts.forEach(function(s) {
            shortcutList.editableList('addItem',s);
        });
        return pane;
    }

    return {
        init: init,
        add: addHandler,
        remove: removeHandler,
        getShortcut: function(actionName) {
            return actionToKeyMap[actionName];
        },
        revertToDefault: revertToDefault,
        formatKey: formatKey,
        validateKey: validateKey
    }

})();
