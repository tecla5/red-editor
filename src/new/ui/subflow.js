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

export class Subflow extends Context {
    constructor(ctx) {
        super(ctx)

        ctx.events.on("workspace:change", function (event) {
            var activeSubflow = ctx.nodes.subflow(event.workspace);
            if (activeSubflow) {
                showWorkspaceToolbar(activeSubflow);
            } else {
                hideWorkspaceToolbar();
            }
        });
        ctx.events.on("view:selection-changed", function (selection) {
            if (!selection.nodes) {
                ctx.menu.setDisabled("menu-item-subflow-convert", true);
            } else {
                ctx.menu.setDisabled("menu-item-subflow-convert", false);
            }
        });

        ctx.actions.add("core:create-subflow", createSubflow);
        ctx.actions.add("core:convert-to-subflow", convertToSubflow);
    }

    getSubflow() {
        return ctx.nodes.subflow(ctx.workspaces.active());
    }

    findAvailableSubflowIOPosition(subflow, isInput) {
        var pos = {
            x: 50,
            y: 30
        };
        if (!isInput) {
            pos.x += 110;
        }
        for (var i = 0; i < subflow.out.length + subflow.in.length; i++) {
            var port;
            if (i < subflow.out.length) {
                port = subflow.out[i];
            } else {
                port = subflow.in[i - subflow.out.length];
            }
            if (port.x == pos.x && port.y == pos.y) {
                pos.x += 55;
                i = 0;
            }
        }
        return pos;
    }

    addSubflowInput() {
        var subflow = ctx.nodes.subflow(ctx.workspaces.active());
        if (subflow.in.length === 1) {
            return;
        }
        var position = findAvailableSubflowIOPosition(subflow, true);
        var newInput = {
            type: "subflow",
            direction: "in",
            z: subflow.id,
            i: subflow.in.length,
            x: position.x,
            y: position.y,
            id: ctx.nodes.id()
        };
        var oldInCount = subflow.in.length;
        subflow.in.push(newInput);
        subflow.dirty = true;
        var wasDirty = ctx.nodes.dirty();
        var wasChanged = subflow.changed;
        subflow.changed = true;
        var result = refresh(true);
        var historyEvent = {
            t: 'edit',
            node: subflow,
            dirty: wasDirty,
            changed: wasChanged,
            subflow: {
                inputCount: oldInCount,
                instances: result.instances
            }
        };
        ctx.history.push(historyEvent);
        ctx.view.select();
        ctx.nodes.dirty(true);
        ctx.view.redraw();
        $("#workspace-subflow-input-add").addClass("active");
        $("#workspace-subflow-input-remove").removeClass("active");
    }

    removeSubflowInput() {
        var activeSubflow = ctx.nodes.subflow(ctx.workspaces.active());
        if (activeSubflow.in.length === 0) {
            return;
        }
        var removedInput = activeSubflow.in[0];
        var removedInputLinks = [];
        ctx.nodes.eachLink(function (l) {
            if (l.source.type == "subflow" && l.source.z == activeSubflow.id && l.source.i == removedInput.i) {
                removedInputLinks.push(l);
            } else if (l.target.type == "subflow:" + activeSubflow.id) {
                removedInputLinks.push(l);
            }
        });
        removedInputLinks.forEach(function (l) {
            ctx.nodes.removeLink(l)
        });
        activeSubflow.in = [];
        $("#workspace-subflow-input-add").removeClass("active");
        $("#workspace-subflow-input-remove").addClass("active");
        activeSubflow.changed = true;
        return {
            subflowInputs: [removedInput],
            links: removedInputLinks
        };
    }

    addSubflowOutput(id) {
        var subflow = ctx.nodes.subflow(ctx.workspaces.active());
        var position = findAvailableSubflowIOPosition(subflow, false);

        var newOutput = {
            type: "subflow",
            direction: "out",
            z: subflow.id,
            i: subflow.out.length,
            x: position.x,
            y: position.y,
            id: ctx.nodes.id()
        };
        var oldOutCount = subflow.out.length;
        subflow.out.push(newOutput);
        subflow.dirty = true;
        var wasDirty = ctx.nodes.dirty();
        var wasChanged = subflow.changed;
        subflow.changed = true;

        var result = refresh(true);

        var historyEvent = {
            t: 'edit',
            node: subflow,
            dirty: wasDirty,
            changed: wasChanged,
            subflow: {
                outputCount: oldOutCount,
                instances: result.instances
            }
        };
        ctx.history.push(historyEvent);
        ctx.view.select();
        ctx.nodes.dirty(true);
        ctx.view.redraw();
        $("#workspace-subflow-output .spinner-value").html(subflow.out.length);
    }

    removeSubflowOutput(removedSubflowOutputs) {
        var activeSubflow = ctx.nodes.subflow(ctx.workspaces.active());
        if (activeSubflow.out.length === 0) {
            return;
        }
        if (typeof removedSubflowOutputs === "undefined") {
            removedSubflowOutputs = [activeSubflow.out[activeSubflow.out.length - 1]];
        }
        var removedLinks = [];
        removedSubflowOutputs.sort(function (a, b) {
            return b.i - a.i
        });
        for (i = 0; i < removedSubflowOutputs.length; i++) {
            var output = removedSubflowOutputs[i];
            activeSubflow.out.splice(output.i, 1);
            var subflowRemovedLinks = [];
            var subflowMovedLinks = [];
            ctx.nodes.eachLink(function (l) {
                if (l.target.type == "subflow" && l.target.z == activeSubflow.id && l.target.i == output.i) {
                    subflowRemovedLinks.push(l);
                }
                if (l.source.type == "subflow:" + activeSubflow.id) {
                    if (l.sourcePort == output.i) {
                        subflowRemovedLinks.push(l);
                    } else if (l.sourcePort > output.i) {
                        subflowMovedLinks.push(l);
                    }
                }
            });
            subflowRemovedLinks.forEach(function (l) {
                ctx.nodes.removeLink(l)
            });
            subflowMovedLinks.forEach(function (l) {
                l.sourcePort--;
            });

            removedLinks = removedLinks.concat(subflowRemovedLinks);
            for (var j = output.i; j < activeSubflow.out.length; j++) {
                activeSubflow.out[j].i--;
                activeSubflow.out[j].dirty = true;
            }
        }
        activeSubflow.changed = true;

        return {
            subflowOutputs: removedSubflowOutputs,
            links: removedLinks
        }
    }

    refresh(markChange) {
        var activeSubflow = ctx.nodes.subflow(ctx.workspaces.active());
        refreshToolbar(activeSubflow);
        var subflowInstances = [];
        if (activeSubflow) {
            ctx.nodes.filterNodes({
                type: "subflow:" + activeSubflow.id
            }).forEach(function (n) {
                subflowInstances.push({
                    id: n.id,
                    changed: n.changed
                });
                if (markChange) {
                    n.changed = true;
                }
                n.inputs = activeSubflow.in.length;
                n.outputs = activeSubflow.out.length;
                while (n.outputs < n.ports.length) {
                    n.ports.pop();
                }
                n.resize = true;
                n.dirty = true;
                ctx.editor.updateNodeProperties(n);
            });
            ctx.editor.validateNode(activeSubflow);
            return {
                instances: subflowInstances
            }
        }
    }

    refreshToolbar(activeSubflow) {
        if (activeSubflow) {
            $("#workspace-subflow-input-add").toggleClass("active", activeSubflow.in.length !== 0);
            $("#workspace-subflow-input-remove").toggleClass("active", activeSubflow.in.length === 0);

            $("#workspace-subflow-output .spinner-value").html(activeSubflow.out.length);
        }
    }

    showWorkspaceToolbar(activeSubflow) {
        var toolbar = $("#workspace-toolbar");
        toolbar.empty();

        $('<a class="button" id="workspace-subflow-edit" href="#" data-i18n="[append]subflow.editSubflowProperties"><i class="fa fa-pencil"></i> </a>').appendTo(toolbar);
        $('<span style="margin-left: 5px;" data-i18n="subflow.input"></span> ' +
            '<div style="display: inline-block;" class="button-group">' +
            '<a id="workspace-subflow-input-remove" class="button active" href="#">0</a>' +
            '<a id="workspace-subflow-input-add" class="button" href="#">1</a>' +
            '</div>').appendTo(toolbar);

        $('<span style="margin-left: 5px;" data-i18n="subflow.output"></span> <div id="workspace-subflow-output" style="display: inline-block;" class="button-group spinner-group">' +
            '<a id="workspace-subflow-output-remove" class="button" href="#"><i class="fa fa-minus"></i></a>' +
            '<div class="spinner-value">3</div>' +
            '<a id="workspace-subflow-output-add" class="button" href="#"><i class="fa fa-plus"></i></a>' +
            '</div>').appendTo(toolbar);

        // $('<a class="button disabled" id="workspace-subflow-add-input" href="#" data-i18n="[append]subflow.input"><i class="fa fa-plus"></i> </a>').appendTo(toolbar);
        // $('<a class="button" id="workspace-subflow-add-output" href="#" data-i18n="[append]subflow.output"><i class="fa fa-plus"></i> </a>').appendTo(toolbar);
        $('<a class="button" id="workspace-subflow-delete" href="#" data-i18n="[append]subflow.deleteSubflow"><i class="fa fa-trash"></i> </a>').appendTo(toolbar);
        toolbar.i18n();


        $("#workspace-subflow-output-remove").click(function (event) {
            event.preventDefault();
            var wasDirty = ctx.nodes.dirty();
            var wasChanged = activeSubflow.changed;
            var result = removeSubflowOutput();
            if (result) {
                var inst = refresh(true);
                ctx.history.push({
                    t: 'delete',
                    links: result.links,
                    subflowOutputs: result.subflowOutputs,
                    changed: wasChanged,
                    dirty: wasDirty,
                    subflow: {
                        instances: inst.instances
                    }
                });

                ctx.view.select();
                ctx.nodes.dirty(true);
                ctx.view.redraw(true);
            }
        });
        $("#workspace-subflow-output-add").click(function (event) {
            event.preventDefault();
            addSubflowOutput();
        });

        $("#workspace-subflow-input-add").click(function (event) {
            event.preventDefault();
            addSubflowInput();
        });
        $("#workspace-subflow-input-remove").click(function (event) {
            event.preventDefault();
            var wasDirty = ctx.nodes.dirty();
            var wasChanged = activeSubflow.changed;
            activeSubflow.changed = true;
            var result = removeSubflowInput();
            if (result) {
                var inst = refresh(true);
                ctx.history.push({
                    t: 'delete',
                    links: result.links,
                    changed: wasChanged,
                    subflowInputs: result.subflowInputs,
                    dirty: wasDirty,
                    subflow: {
                        instances: inst.instances
                    }
                });
                ctx.view.select();
                ctx.nodes.dirty(true);
                ctx.view.redraw(true);
            }
        });

        $("#workspace-subflow-edit").click(function (event) {
            ctx.editor.editSubflow(ctx.nodes.subflow(ctx.workspaces.active()));
            event.preventDefault();
        });

        $("#workspace-subflow-delete").click(function (event) {
            event.preventDefault();
            var startDirty = ctx.nodes.dirty();
            var historyEvent = removeSubflow(ctx.workspaces.active());
            historyEvent.t = 'delete';
            historyEvent.dirty = startDirty;

            ctx.history.push(historyEvent);

        });

        refreshToolbar(activeSubflow);

        $("#chart").css({
            "margin-top": "40px"
        });
        $("#workspace-toolbar").show();
    }

    hideWorkspaceToolbar() {
        $("#workspace-toolbar").hide().empty();
        $("#chart").css({
            "margin-top": "0"
        });
    }

    removeSubflow(id) {
        var removedNodes = [];
        var removedLinks = [];

        var activeSubflow = ctx.nodes.subflow(id);

        ctx.nodes.eachNode(function (n) {
            if (n.type == "subflow:" + activeSubflow.id) {
                removedNodes.push(n);
            }
            if (n.z == activeSubflow.id) {
                removedNodes.push(n);
            }
        });
        ctx.nodes.eachConfig(function (n) {
            if (n.z == activeSubflow.id) {
                removedNodes.push(n);
            }
        });

        var removedConfigNodes = [];
        for (var i = 0; i < removedNodes.length; i++) {
            var removedEntities = ctx.nodes.remove(removedNodes[i].id);
            removedLinks = removedLinks.concat(removedEntities.links);
            removedConfigNodes = removedConfigNodes.concat(removedEntities.nodes);
        }
        // TODO: this whole delete logic should be in ctx.nodes.removeSubflow..
        removedNodes = removedNodes.concat(removedConfigNodes);

        ctx.nodes.removeSubflow(activeSubflow);
        ctx.workspaces.remove(activeSubflow);
        ctx.nodes.dirty(true);
        ctx.view.redraw();

        return {
            nodes: removedNodes,
            links: removedLinks,
            subflow: {
                subflow: activeSubflow
            }
        }
    }

    createSubflow() {
        var lastIndex = 0;
        ctx.nodes.eachSubflow(function (sf) {
            var m = (new RegExp("^Subflow (\\d+)$")).exec(sf.name);
            if (m) {
                lastIndex = Math.max(lastIndex, m[1]);
            }
        });

        var name = "Subflow " + (lastIndex + 1);

        var subflowId = ctx.nodes.id();
        var subflow = {
            type: "subflow",
            id: subflowId,
            name: name,
            info: "",
            in: [],
            out: []
        };
        ctx.nodes.addSubflow(subflow);
        ctx.history.push({
            t: 'createSubflow',
            subflow: {
                subflow: subflow
            },
            dirty: ctx.nodes.dirty()
        });
        ctx.workspaces.show(subflowId);
        ctx.nodes.dirty(true);
    }

    convertToSubflow() {
        var selection = ctx.view.selection();
        if (!selection.nodes) {
            ctx.notify(ctx._("subflow.errors.noNodesSelected"), "error");
            return;
        }
        var i, n;
        var nodes = {};
        var new_links = [];
        var removedLinks = [];

        var candidateInputs = [];
        var candidateOutputs = [];
        var candidateInputNodes = {};


        var boundingBox = [selection.nodes[0].x,
            selection.nodes[0].y,
            selection.nodes[0].x,
            selection.nodes[0].y
        ];

        for (i = 0; i < selection.nodes.length; i++) {
            n = selection.nodes[i];
            nodes[n.id] = {
                n: n,
                outputs: {}
            };
            boundingBox = [
                Math.min(boundingBox[0], n.x),
                Math.min(boundingBox[1], n.y),
                Math.max(boundingBox[2], n.x),
                Math.max(boundingBox[3], n.y)
            ]
        }

        var center = [(boundingBox[2] + boundingBox[0]) / 2, (boundingBox[3] + boundingBox[1]) / 2];

        ctx.nodes.eachLink(function (link) {
            if (nodes[link.source.id] && nodes[link.target.id]) {
                // A link wholely within the selection
            }

            if (nodes[link.source.id] && !nodes[link.target.id]) {
                // An outbound link from the selection
                candidateOutputs.push(link);
                removedLinks.push(link);
            }
            if (!nodes[link.source.id] && nodes[link.target.id]) {
                // An inbound link
                candidateInputs.push(link);
                candidateInputNodes[link.target.id] = link.target;
                removedLinks.push(link);
            }
        });

        var outputs = {};
        candidateOutputs = candidateOutputs.filter(function (v) {
            if (outputs[v.source.id + ":" + v.sourcePort]) {
                outputs[v.source.id + ":" + v.sourcePort].targets.push(v.target);
                return false;
            }
            v.targets = [];
            v.targets.push(v.target);
            outputs[v.source.id + ":" + v.sourcePort] = v;
            return true;
        });
        candidateOutputs.sort(function (a, b) {
            return a.source.y - b.source.y
        });

        if (Object.keys(candidateInputNodes).length > 1) {
            ctx.notify(ctx._("subflow.errors.multipleInputsToSelection"), "error");
            return;
        }

        var lastIndex = 0;
        ctx.nodes.eachSubflow(function (sf) {
            var m = (new RegExp("^Subflow (\\d+)$")).exec(sf.name);
            if (m) {
                lastIndex = Math.max(lastIndex, m[1]);
            }
        });

        var name = "Subflow " + (lastIndex + 1);

        var subflowId = ctx.nodes.id();
        var subflow = {
            type: "subflow",
            id: subflowId,
            name: name,
            info: "",
            in: Object.keys(candidateInputNodes).map(function (v, i) {
                var index = i;
                return {
                    type: "subflow",
                    direction: "in",
                    x: candidateInputNodes[v].x - (candidateInputNodes[v].w / 2) - 80,
                    y: candidateInputNodes[v].y,
                    z: subflowId,
                    i: index,
                    id: ctx.nodes.id(),
                    wires: [{
                        id: candidateInputNodes[v].id
                    }]
                }
            }),
            out: candidateOutputs.map(function (v, i) {
                var index = i;
                return {
                    type: "subflow",
                    direction: "in",
                    x: v.source.x + (v.source.w / 2) + 80,
                    y: v.source.y,
                    z: subflowId,
                    i: index,
                    id: ctx.nodes.id(),
                    wires: [{
                        id: v.source.id,
                        port: v.sourcePort
                    }]
                }
            })
        };

        ctx.nodes.addSubflow(subflow);

        var subflowInstance = {
            id: ctx.nodes.id(),
            type: "subflow:" + subflow.id,
            x: center[0],
            y: center[1],
            z: ctx.workspaces.active(),
            inputs: subflow.in.length,
            outputs: subflow.out.length,
            h: Math.max(30 /*node_height*/ , (subflow.out.length || 0) * 15),
            changed: true
        }
        subflowInstance._def = ctx.nodes.getType(subflowInstance.type);
        ctx.editor.validateNode(subflowInstance);
        ctx.nodes.add(subflowInstance);

        candidateInputs.forEach(function (l) {
            var link = {
                source: l.source,
                sourcePort: l.sourcePort,
                target: subflowInstance
            };
            new_links.push(link);
            ctx.nodes.addLink(link);
        });

        candidateOutputs.forEach(function (output, i) {
            output.targets.forEach(function (target) {
                var link = {
                    source: subflowInstance,
                    sourcePort: i,
                    target: target
                };
                new_links.push(link);
                ctx.nodes.addLink(link);
            });
        });

        subflow.in.forEach(function (input) {
            input.wires.forEach(function (wire) {
                var link = {
                    source: input,
                    sourcePort: 0,
                    target: ctx.nodes.node(wire.id)
                }
                new_links.push(link);
                ctx.nodes.addLink(link);
            });
        });
        subflow.out.forEach(function (output, i) {
            output.wires.forEach(function (wire) {
                var link = {
                    source: ctx.nodes.node(wire.id),
                    sourcePort: wire.port,
                    target: output
                }
                new_links.push(link);
                ctx.nodes.addLink(link);
            });
        });

        for (i = 0; i < removedLinks.length; i++) {
            ctx.nodes.removeLink(removedLinks[i]);
        }

        for (i = 0; i < selection.nodes.length; i++) {
            n = selection.nodes[i];
            if (/^link /.test(n.type)) {
                n.links = n.links.filter(function (id) {
                    var isLocalLink = nodes.hasOwnProperty(id);
                    if (!isLocalLink) {
                        var otherNode = ctx.nodes.node(id);
                        if (otherNode && otherNode.links) {
                            var i = otherNode.links.indexOf(n.id);
                            if (i > -1) {
                                otherNode.links.splice(i, 1);
                            }
                        }
                    }
                    return isLocalLink;
                });
            }
            n.z = subflow.id;
        }

        ctx.history.push({
            t: 'createSubflow',
            nodes: [subflowInstance.id],
            links: new_links,
            subflow: {
                subflow: subflow
            },

            activeWorkspace: ctx.workspaces.active(),
            removedLinks: removedLinks,

            dirty: ctx.nodes.dirty()
        });
        ctx.view.select(null);
        ctx.editor.validateNode(subflow);
        ctx.nodes.dirty(true);
        ctx.view.redraw(true);
    }
}
