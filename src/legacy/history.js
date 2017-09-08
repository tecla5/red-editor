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
RED.history = (function() {
    var undo_history = [];

    function undoEvent(ev) {
        var i;
        var len;
        var node;
        var subflow;
        var modifiedTabs = {};
        if (ev) {
            if (ev.t == 'multi') {
                len = ev.events.length;
                for (i=len-1;i>=0;i--) {
                    undoEvent(ev.events[i]);
                }
            } else if (ev.t == 'replace') {
                RED.nodes.clear();
                var imported = RED.nodes.import(ev.config);
                imported[0].forEach(function(n) {
                    if (ev.changed[n.id]) {
                        n.changed = true;
                    }
                })

                RED.nodes.version(ev.rev);
            } else if (ev.t == 'add') {
                if (ev.nodes) {
                    for (i=0;i<ev.nodes.length;i++) {
                        node = RED.nodes.node(ev.nodes[i]);
                        if (node.z) {
                            modifiedTabs[node.z] = true;
                        }
                        RED.nodes.remove(ev.nodes[i]);
                    }
                }
                if (ev.links) {
                    for (i=0;i<ev.links.length;i++) {
                        RED.nodes.removeLink(ev.links[i]);
                    }
                }
                if (ev.workspaces) {
                    for (i=0;i<ev.workspaces.length;i++) {
                        RED.nodes.removeWorkspace(ev.workspaces[i].id);
                        RED.workspaces.remove(ev.workspaces[i]);
                    }
                }
                if (ev.subflows) {
                    for (i=0;i<ev.subflows.length;i++) {
                        RED.nodes.removeSubflow(ev.subflows[i]);
                        RED.workspaces.remove(ev.subflows[i]);
                    }
                }
                if (ev.subflow) {
                    if (ev.subflow.instances) {
                        ev.subflow.instances.forEach(function(n) {
                            var node = RED.nodes.node(n.id);
                            if (node) {
                                node.changed = n.changed;
                                node.dirty = true;
                            }
                        });
                    }
                    if (ev.subflow.hasOwnProperty('changed')) {
                        subflow = RED.nodes.subflow(ev.subflow.id);
                        if (subflow) {
                            subflow.changed = ev.subflow.changed;
                        }
                    }
                }
                if (ev.removedLinks) {
                    for (i=0;i<ev.removedLinks.length;i++) {
                        RED.nodes.addLink(ev.removedLinks[i]);
                    }
                }

            } else if (ev.t == "delete") {
                if (ev.workspaces) {
                    for (i=0;i<ev.workspaces.length;i++) {
                        RED.nodes.addWorkspace(ev.workspaces[i]);
                        RED.workspaces.add(ev.workspaces[i]);
                    }
                }
                if (ev.subflow && ev.subflow.subflow) {
                    RED.nodes.addSubflow(ev.subflow.subflow);
                }
                if (ev.subflowInputs && ev.subflowInputs.length > 0) {
                    subflow = RED.nodes.subflow(ev.subflowInputs[0].z);
                    subflow.in.push(ev.subflowInputs[0]);
                    subflow.in[0].dirty = true;
                }
                if (ev.subflowOutputs && ev.subflowOutputs.length > 0) {
                    subflow = RED.nodes.subflow(ev.subflowOutputs[0].z);
                    ev.subflowOutputs.sort(function(a,b) { return a.i-b.i});
                    for (i=0;i<ev.subflowOutputs.length;i++) {
                        var output = ev.subflowOutputs[i];
                        subflow.out.splice(output.i,0,output);
                        for (var j=output.i+1;j<subflow.out.length;j++) {
                            subflow.out[j].i++;
                            subflow.out[j].dirty = true;
                        }
                        RED.nodes.eachLink(function(l) {
                            if (l.source.type == "subflow:"+subflow.id) {
                                if (l.sourcePort >= output.i) {
                                    l.sourcePort++;
                                }
                            }
                        });
                    }
                }
                if (ev.subflow && ev.subflow.hasOwnProperty('instances')) {
                    ev.subflow.instances.forEach(function(n) {
                        var node = RED.nodes.node(n.id);
                        if (node) {
                            node.changed = n.changed;
                            node.dirty = true;
                        }
                    });
                }
                if (subflow) {
                    RED.nodes.filterNodes({type:"subflow:"+subflow.id}).forEach(function(n) {
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
                    for (i=0;i<ev.nodes.length;i++) {
                        RED.nodes.add(ev.nodes[i]);
                        modifiedTabs[ev.nodes[i].z] = true;
                    }
                }
                if (ev.links) {
                    for (i=0;i<ev.links.length;i++) {
                        RED.nodes.addLink(ev.links[i]);
                    }
                }
                if (ev.changes) {
                    for (i in ev.changes) {
                        if (ev.changes.hasOwnProperty(i)) {
                            node = RED.nodes.node(i);
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
                for (i=0;i<ev.nodes.length;i++) {
                    var n = ev.nodes[i];
                    n.n.x = n.ox;
                    n.n.y = n.oy;
                    n.n.dirty = true;
                    n.n.moved = n.moved;
                }
                // A move could have caused a link splice
                if (ev.links) {
                    for (i=0;i<ev.links.length;i++) {
                        RED.nodes.removeLink(ev.links[i]);
                    }
                }
                if (ev.removedLinks) {
                    for (i=0;i<ev.removedLinks.length;i++) {
                        RED.nodes.addLink(ev.removedLinks[i]);
                    }
                }
            } else if (ev.t == "edit") {
                for (i in ev.changes) {
                    if (ev.changes.hasOwnProperty(i)) {
                        if (ev.node._def.defaults[i] && ev.node._def.defaults[i].type) {
                            // This is a config node property
                            var currentConfigNode = RED.nodes.node(ev.node[i]);
                            if (currentConfigNode) {
                                currentConfigNode.users.splice(currentConfigNode.users.indexOf(ev.node),1);
                            }
                            var newConfigNode = RED.nodes.node(ev.changes[i]);
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
                        ev.subflow.instances.forEach(function(n) {
                            var node = RED.nodes.node(n.id);
                            if (node) {
                                node.changed = n.changed;
                                node.dirty = true;
                            }
                        });
                    }
                    RED.nodes.filterNodes({type:"subflow:"+ev.node.id}).forEach(function(n) {
                        n.inputs = ev.node.in.length;
                        n.outputs = ev.node.out.length;
                        RED.editor.updateNodeProperties(n);
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
                    RED.editor.updateNodeProperties(ev.node,outputMap);
                    RED.editor.validateNode(ev.node);
                }
                if (ev.links) {
                    for (i=0;i<ev.links.length;i++) {
                        RED.nodes.addLink(ev.links[i]);
                    }
                }
                ev.node.dirty = true;
                ev.node.changed = ev.changed;
            } else if (ev.t == "createSubflow") {
                if (ev.nodes) {
                    RED.nodes.filterNodes({z:ev.subflow.subflow.id}).forEach(function(n) {
                        n.z = ev.activeWorkspace;
                        n.dirty = true;
                    });
                    for (i=0;i<ev.nodes.length;i++) {
                        RED.nodes.remove(ev.nodes[i]);
                    }
                }
                if (ev.links) {
                    for (i=0;i<ev.links.length;i++) {
                        RED.nodes.removeLink(ev.links[i]);
                    }
                }

                RED.nodes.removeSubflow(ev.subflow.subflow);
                RED.workspaces.remove(ev.subflow.subflow);

                if (ev.removedLinks) {
                    for (i=0;i<ev.removedLinks.length;i++) {
                        RED.nodes.addLink(ev.removedLinks[i]);
                    }
                }
            } else if (ev.t == "reorder") {
                if (ev.order) {
                    RED.workspaces.order(ev.order);
                }
            }
            Object.keys(modifiedTabs).forEach(function(id) {
                var subflow = RED.nodes.subflow(id);
                if (subflow) {
                    RED.editor.validateNode(subflow);
                }
            });

            RED.nodes.dirty(ev.dirty);
            RED.view.redraw(true);
            RED.palette.refresh();
            RED.workspaces.refresh();
            RED.sidebar.config.refresh();
        }

    }

    return {
        //TODO: this function is a placeholder until there is a 'save' event that can be listened to
        markAllDirty: function() {
            for (var i=0;i<undo_history.length;i++) {
                undo_history[i].dirty = true;
            }
        },
        list: function() {
            return undo_history
        },
        depth: function() {
            return undo_history.length;
        },
        push: function(ev) {
            undo_history.push(ev);
        },
        pop: function() {
            var ev = undo_history.pop();
            undoEvent(ev);
        },
        peek: function() {
            return undo_history[undo_history.length-1];
        }
    }

})();
