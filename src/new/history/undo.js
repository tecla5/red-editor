// THIS needs major refactoring!!!

// NEVER have a huge function like this (max ~7 lines for any function)
// NEVER have nested if/else
// NEVER rely on globals

function createUndoEvent(ctx) {
  const nodes = ctx.nodes;

  return function undoEvent(ev) {
    var i;
    var len;
    var node;
    var subflow;
    var modifiedTabs = {};
    if (ev) {
      if (ev.t == 'multi') {
        len = ev.events.length;
        for (i = len - 1; i >= 0; i--) {
          undoEvent(ev.events[i]);
        }
      } else if (ev.t == 'replace') {
        nodes.clear();
        var imported = nodes.import(ev.config);
        imported[0].forEach(function (n) {
          if (ev.changed[n.id]) {
            n.changed = true;
          }
        })

        nodes.version(ev.rev);
      } else if (ev.t == 'add') {
        if (ev.nodes) {
          for (i = 0; i < ev.nodes.length; i++) {
            node = nodes.node(ev.nodes[i]);
            if (node.z) {
              modifiedTabs[node.z] = true;
            }
            nodes.remove(ev.nodes[i]);
          }
        }
        if (ev.links) {
          for (i = 0; i < ev.links.length; i++) {
            nodes.removeLink(ev.links[i]);
          }
        }
        if (ev.workspaces) {
          for (i = 0; i < ev.workspaces.length; i++) {
            nodes.removeWorkspace(ev.workspaces[i].id);
            ctx.workspaces.remove(ev.workspaces[i]);
          }
        }
        if (ev.subflows) {
          for (i = 0; i < ev.subflows.length; i++) {
            nodes.removeSubflow(ev.subflows[i]);
            ctx.workspaces.remove(ev.subflows[i]);
          }
        }
        if (ev.subflow) {
          if (ev.subflow.instances) {
            ev.subflow.instances.forEach(function (n) {
              var node = nodes.node(n.id);
              if (node) {
                node.changed = n.changed;
                node.dirty = true;
              }
            });
          }
          if (ev.subflow.hasOwnProperty('changed')) {
            subflow = nodes.subflow(ev.subflow.id);
            if (subflow) {
              subflow.changed = ev.subflow.changed;
            }
          }
        }
        if (ev.removedLinks) {
          for (i = 0; i < ev.removedLinks.length; i++) {
            nodes.addLink(ev.removedLinks[i]);
          }
        }

      } else if (ev.t == "delete") {
        if (ev.workspaces) {
          for (i = 0; i < ev.workspaces.length; i++) {
            nodes.addWorkspace(ev.workspaces[i]);
            ctx.workspaces.add(ev.workspaces[i]);
          }
        }
        if (ev.subflow && ev.subflow.subflow) {
          nodes.addSubflow(ev.subflow.subflow);
        }
        if (ev.subflowInputs && ev.subflowInputs.length > 0) {
          subflow = nodes.subflow(ev.subflowInputs[0].z);
          subflow.in.push(ev.subflowInputs[0]);
          subflow.in[0].dirty = true;
        }
        if (ev.subflowOutputs && ev.subflowOutputs.length > 0) {
          subflow = nodes.subflow(ev.subflowOutputs[0].z);
          ev.subflowOutputs.sort(function (a, b) {
            return a.i - b.i
          });
          for (i = 0; i < ev.subflowOutputs.length; i++) {
            var output = ev.subflowOutputs[i];
            subflow.out.splice(output.i, 0, output);
            for (var j = output.i + 1; j < subflow.out.length; j++) {
              subflow.out[j].i++;
              subflow.out[j].dirty = true;
            }
            nodes.eachLink(function (l) {
              if (l.source.type == "subflow:" + subflow.id) {
                if (l.sourcePort >= output.i) {
                  l.sourcePort++;
                }
              }
            });
          }
        }
        if (ev.subflow && ev.subflow.hasOwnProperty('instances')) {
          ev.subflow.instances.forEach(function (n) {
            var node = nodes.node(n.id);
            if (node) {
              node.changed = n.changed;
              node.dirty = true;
            }
          });
        }
        if (subflow) {
          nodes.filterNodes({
            type: "subflow:" + subflow.id
          }).forEach(function (n) {
            n.inputs = subflow.in.length;
            n.outputs = subflow.out.length;
            while (n.outputs > n.ports.length) {
              n.ports.push(n.ports.length);
            }
            n.resize = true;
            n.dirty = true;
          });
        }
        if (ev.nodes) {
          for (i = 0; i < ev.nodes.length; i++) {
            nodes.add(ev.nodes[i]);
            modifiedTabs[ev.nodes[i].z] = true;
          }
        }
        if (ev.links) {
          for (i = 0; i < ev.links.length; i++) {
            nodes.addLink(ev.links[i]);
          }
        }
        if (ev.changes) {
          for (i in ev.changes) {
            if (ev.changes.hasOwnProperty(i)) {
              node = nodes.node(i);
              if (node) {
                for (var d in ev.changes[i]) {
                  if (ev.changes[i].hasOwnProperty(d)) {
                    node[d] = ev.changes[i][d];
                  }
                }
                node.dirty = true;
              }
            }
          }

        }
      } else if (ev.t == "move") {
        for (i = 0; i < ev.nodes.length; i++) {
          var n = ev.nodes[i];
          n.n.x = n.ox;
          n.n.y = n.oy;
          n.n.dirty = true;
          n.n.moved = n.moved;
        }
        // A move could have caused a link splice
        if (ev.links) {
          for (i = 0; i < ev.links.length; i++) {
            nodes.removeLink(ev.links[i]);
          }
        }
        if (ev.removedLinks) {
          for (i = 0; i < ev.removedLinks.length; i++) {
            nodes.addLink(ev.removedLinks[i]);
          }
        }
      } else if (ev.t == "edit") {
        for (i in ev.changes) {
          if (ev.changes.hasOwnProperty(i)) {
            if (ev.node._def.defaults[i] && ev.node._def.defaults[i].type) {
              // This is a config node property
              var currentConfigNode = nodes.node(ev.node[i]);
              if (currentConfigNode) {
                currentConfigNode.users.splice(currentConfigNode.users.indexOf(ev.node), 1);
              }
              var newConfigNode = nodes.node(ev.changes[i]);
              if (newConfigNode) {
                newConfigNode.users.push(ev.node);
              }
            }
            ev.node[i] = ev.changes[i];
          }
        }
        if (ev.subflow) {
          if (ev.subflow.hasOwnProperty('inputCount')) {
            if (ev.node.in.length > ev.subflow.inputCount) {
              ev.node.in.splice(ev.subflow.inputCount);
            } else if (ev.subflow.inputs.length > 0) {
              ev.node.in = ev.node.in.concat(ev.subflow.inputs);
            }
          }
          if (ev.subflow.hasOwnProperty('outputCount')) {
            if (ev.node.out.length > ev.subflow.outputCount) {
              ev.node.out.splice(ev.subflow.outputCount);
            } else if (ev.subflow.outputs.length > 0) {
              ev.node.out = ev.node.out.concat(ev.subflow.outputs);
            }
          }
          if (ev.subflow.hasOwnProperty('instances')) {
            ev.subflow.instances.forEach(function (n) {
              var node = nodes.node(n.id);
              if (node) {
                node.changed = n.changed;
                node.dirty = true;
              }
            });
          }
          nodes.filterNodes({
            type: "subflow:" + ev.node.id
          }).forEach(function (n) {
            n.inputs = ev.node.in.length;
            n.outputs = ev.node.out.length;
            ctx.editor.updateNodeProperties(n);
          });
        } else {
          var outputMap;
          if (ev.outputMap) {
            outputMap = {};
            for (var port in ev.outputMap) {
              if (ev.outputMap.hasOwnProperty(port) && ev.outputMap[port] !== "-1") {
                outputMap[ev.outputMap[port]] = port;
              }
            }
          }
          ctx.editor.updateNodeProperties(ev.node, outputMap);
          ctx.editor.validateNode(ev.node);
        }
        if (ev.links) {
          for (i = 0; i < ev.links.length; i++) {
            nodes.addLink(ev.links[i]);
          }
        }
        ev.node.dirty = true;
        ev.node.changed = ev.changed;
      } else if (ev.t == "createSubflow") {
        if (ev.nodes) {
          nodes.filterNodes({
            z: ev.subflow.subflow.id
          }).forEach(function (n) {
            n.z = ev.activeWorkspace;
            n.dirty = true;
          });
          for (i = 0; i < ev.nodes.length; i++) {
            nodes.remove(ev.nodes[i]);
          }
        }
        if (ev.links) {
          for (i = 0; i < ev.links.length; i++) {
            nodes.removeLink(ev.links[i]);
          }
        }

        nodes.removeSubflow(ev.subflow.subflow);
        ctx.workspaces.remove(ev.subflow.subflow);

        if (ev.removedLinks) {
          for (i = 0; i < ev.removedLinks.length; i++) {
            nodes.addLink(ev.removedLinks[i]);
          }
        }
      } else if (ev.t == "reorder") {
        if (ev.order) {
          ctx.workspaces.order(ev.order);
        }
      }
      Object.keys(modifiedTabs).forEach(function (id) {
        var subflow = nodes.subflow(id);
        if (subflow) {
          ctx.editor.validateNode(subflow);
        }
      });

      nodes.dirty(ev.dirty);
      ctx.view.ctxraw(true);
      ctx.palette.refresh();
      ctx.workspaces.refresh();
      ctx.sidebar.config.refresh();
    }
  }
}
