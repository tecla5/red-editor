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
} from '../context'

export class Search extends Context {
  constructor(ctx) {
    super(ctx)
    var disabled = false;
    var dialog = null;
    var searchInput;
    var searchResults;
    var selected = -1;
    var visible = false;

    var index = {};
    var keys = [];
    var results = [];

    var disable = () => {
      this.disabled = true;
    }
    var enable = () => {
      this.disabled = false;
    }

    ctx.actions.add("core:search", show);

    ctx.events.on("editor:open", disable);
    ctx.events.on("editor:close", enable);
    ctx.events.on("type-search:open", disable);
    ctx.events.on("type-search:close", enable);

    $("#header-shade").on('mousedown', this.hide);
    $("#editor-shade").on('mousedown', this.hide);
    $("#palette-shade").on('mousedown', this.hide);
    $("#sidebar-shade").on('mousedown', this.hide);

  }

  indexNode(n) {
    var l = ctx.utils.getNodeLabel(n);
    if (l) {
      l = ("" + l).toLowerCase();
      index[l] = index[l] || {};
      index[l][n.id] = {
        node: n,
        label: l
      }
    }
    l = l || n.label || n.name || n.id || "";


    var properties = ['id', 'type', 'name', 'label', 'info'];
    if (n._def && n._def.defaults) {
      properties = properties.concat(Object.keys(n._def.defaults));
    }
    for (var i = 0; i < properties.length; i++) {
      if (n.hasOwnProperty(properties[i])) {
        var v = n[properties[i]];
        if (typeof v === 'string' || typeof v === 'number') {
          v = ("" + v).toLowerCase();
          index[v] = index[v] || {};
          index[v][n.id] = {
            node: n,
            label: l
          };
        }
      }
    }
  }

  indexWorkspace() {
    index = {};
    ctx.nodes.eachWorkspace(indexNode);
    ctx.nodes.eachSubflow(indexNode);
    ctx.nodes.eachConfig(indexNode);
    ctx.nodes.eachNode(indexNode);
    keys = Object.keys(index);
    keys.sort();
    keys.forEach(function (key) {
      index[key] = Object.keys(index[key]).map(function (id) {
        return index[key][id];
      })
    })
  }

  search(val) {
    searchResults.editableList('empty');
    selected = -1;
    results = [];
    if (val.length > 0) {
      val = val.toLowerCase();
      var i;
      var j;
      var list = [];
      var nodes = {};
      for (i = 0; i < keys.length; i++) {
        var key = keys[i];
        var kpos = keys[i].indexOf(val);
        if (kpos > -1) {
          for (j = 0; j < index[key].length; j++) {
            var node = index[key][j];
            nodes[node.node.id] = nodes[node.node.id] = node;
            nodes[node.node.id].index = Math.min(nodes[node.node.id].index || Infinity, kpos);
          }
        }
      }
      list = Object.keys(nodes);
      list.sort(function (A, B) {
        return nodes[A].index - nodes[B].index;
      });

      for (i = 0; i < list.length; i++) {
        results.push(nodes[list[i]]);
      }
      if (results.length > 0) {
        for (i = 0; i < Math.min(results.length, 25); i++) {
          searchResults.editableList('addItem', results[i])
        }
      } else {
        searchResults.editableList('addItem', {});
      }
    }
  }

  ensureSelectedIsVisible() {
    var selectedEntry = searchResults.find("li.selected");
    if (selectedEntry.length === 1) {
      var scrollWindow = searchResults.parent();
      var scrollHeight = scrollWindow.height();
      var scrollOffset = scrollWindow.scrollTop();
      var y = selectedEntry.position().top;
      var h = selectedEntry.height();
      if (y + h > scrollHeight) {
        scrollWindow.animate({
          scrollTop: '-=' + (scrollHeight - (y + h) - 10)
        }, 50);
      } else if (y < 0) {
        scrollWindow.animate({
          scrollTop: '+=' + (y - 10)
        }, 50);
      }
    }
  }

  createDialog() {
    dialog = $("<div>", {
      id: "red-ui-search",
      class: "red-ui-search"
    }).appendTo("#main-container");
    var searchDiv = $("<div>", {
      class: "red-ui-search-container"
    }).appendTo(dialog);
    searchInput = $('<input type="text" data-i18n="[placeholder]menu.label.searchInput">').appendTo(searchDiv).searchBox({
      delay: 200,
      change: function () {
        search($(this).val());
      }
    });
    searchInput.on('keydown', function (evt) {
      var children;
      if (results.length > 0) {
        if (evt.keyCode === 40) {
          // Down
          children = searchResults.children();
          if (selected < children.length - 1) {
            if (selected > -1) {
              $(children[selected]).removeClass('selected');
            }
            selected++;
          }
          $(children[selected]).addClass('selected');
          ensureSelectedIsVisible();
          evt.preventDefault();
        } else if (evt.keyCode === 38) {
          // Up
          children = searchResults.children();
          if (selected > 0) {
            if (selected < children.length) {
              $(children[selected]).removeClass('selected');
            }
            selected--;
          }
          $(children[selected]).addClass('selected');
          ensureSelectedIsVisible();
          evt.preventDefault();
        } else if (evt.keyCode === 13) {
          // Enter
          if (results.length > 0) {
            reveal(results[Math.max(0, selected)].node);
          }
        }
      }
    });
    searchInput.i18n();

    var searchResultsDiv = $("<div>", {
      class: "red-ui-search-results-container"
    }).appendTo(dialog);
    searchResults = $('<ol>', {
      id: "search-result-list",
      style: "position: absolute;top: 5px;bottom: 5px;left: 5px;right: 5px;"
    }).appendTo(searchResultsDiv).editableList({
      addButton: false,
      addItem: function (container, i, object) {
        var node = object.node;
        if (node === undefined) {
          $('<div>', {
            class: "red-ui-search-empty"
          }).html(ctx._('search.empty')).appendTo(container);

        } else {
          var def = node._def;
          var div = $('<a>', {
            href: '#',
            class: "red-ui-search-result"
          }).appendTo(container);

          var nodeDiv = $('<div>', {
            class: "red-ui-search-result-node"
          }).appendTo(div);
          var colour = def.color;
          var icon_url = ctx.utils.getNodeIcon(def, node);
          if (node.type === 'tab') {
            colour = "#C0DEED";
          }
          nodeDiv.css('backgroundColor', colour);

          var iconContainer = $('<div/>', {
            class: "palette_icon_container"
          }).appendTo(nodeDiv);
          $('<div/>', {
            class: "palette_icon",
            style: "background-image: url(" + icon_url + ")"
          }).appendTo(iconContainer);

          var contentDiv = $('<div>', {
            class: "red-ui-search-result-description"
          }).appendTo(div);
          if (node.z) {
            var workspace = ctx.nodes.workspace(node.z);
            if (!workspace) {
              workspace = ctx.nodes.subflow(node.z);
              workspace = "subflow:" + workspace.name;
            } else {
              workspace = "flow:" + workspace.label;
            }
            $('<div>', {
              class: "red-ui-search-result-node-flow"
            }).html(workspace).appendTo(contentDiv);
          }

          $('<div>', {
            class: "red-ui-search-result-node-label"
          }).html(object.label || node.id).appendTo(contentDiv);
          $('<div>', {
            class: "red-ui-search-result-node-type"
          }).html(node.type).appendTo(contentDiv);
          $('<div>', {
            class: "red-ui-search-result-node-id"
          }).html(node.id).appendTo(contentDiv);

          div.click(function (evt) {
            evt.preventDefault();
            reveal(node);
          });
        }
      },
      scrollOnAdd: false
    });

  }

  reveal(node) {
    this.hide();
    ctx.view.reveal(node.id);
  }

  show() {
    if (disabled) {
      return;
    }
    if (!visible) {
      ctx.keyboard.add("*", "escape", function () {
        hide()
      });
      $("#header-shade").show();
      $("#editor-shade").show();
      $("#palette-shade").show();
      $("#sidebar-shade").show();
      $("#sidebar-separator").hide();
      indexWorkspace();
      if (dialog === null) {
        createDialog();
      }
      dialog.slideDown(300);
      ctx.events.emit("search:open");
      visible = true;
    }
    searchInput.focus();
  }

  hide() {
    if (visible) {
      ctx.keyboard.remove("escape");
      visible = false;
      $("#header-shade").hide();
      $("#editor-shade").hide();
      $("#palette-shade").hide();
      $("#sidebar-shade").hide();
      $("#sidebar-separator").show();
      if (dialog !== null) {
        dialog.slideUp(200, function () {
          searchInput.searchBox('value', '');
        });
      }
      ctx.events.emit("search:close");
    }
  }

}
