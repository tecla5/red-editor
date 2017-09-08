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


RED.view = (function() {
    var space_width = 5000,
        space_height = 5000,
        lineCurveScale = 0.75,
        scaleFactor = 1,
        node_width = 100,
        node_height = 30;

    var touchLongPressTimeout = 1000,
        startTouchDistance = 0,
        startTouchCenter = [],
        moveTouchCenter = [],
        touchStartTime = 0;

    var workspaceScrollPositions = {};

    var gridSize = 20;
    var snapGrid = false;

    var activeSpliceLink;
    var spliceActive = false;
    var spliceTimer;

    var activeSubflow = null;
    var activeNodes = [];
    var activeLinks = [];
    var activeFlowLinks = [];

    var selected_link = null,
        mousedown_link = null,
        mousedown_node = null,
        mousedown_port_type = null,
        mousedown_port_index = 0,
        mouseup_node = null,
        mouse_offset = [0,0],
        mouse_position = null,
        mouse_mode = 0,
        moving_set = [],
        lasso = null,
        showStatus = false,
        lastClickNode = null,
        dblClickPrimed = null,
        clickTime = 0,
        clickElapsed = 0;

    var clipboard = "";

    var status_colours = {
        "red":    "#c00",
        "green":  "#5a8",
        "yellow": "#F9DF31",
        "blue":   "#53A3F3",
        "grey":   "#d3d3d3"
    }

    var PORT_TYPE_INPUT = 1;
    var PORT_TYPE_OUTPUT = 0;

    var outer = d3.select("#chart")
        .append("svg:svg")
        .attr("width", space_width)
        .attr("height", space_height)
        .attr("pointer-events", "all")
        .style("cursor","crosshair")
        .on("mousedown", function() {
            focusView();
        });

    var vis = outer
        .append("svg:g")
        .on("dblclick.zoom", null)
        .append("svg:g")
        .attr('class','innerCanvas')
        .on("mousemove", canvasMouseMove)
        .on("mousedown", canvasMouseDown)
        .on("mouseup", canvasMouseUp)
        .on("touchend", function() {
            clearTimeout(touchStartTime);
            touchStartTime = null;
            if  (RED.touch.radialMenu.active()) {
                return;
            }
            if (lasso) {
                outer_background.attr("fill","#fff");
            }
            canvasMouseUp.call(this);
        })
        .on("touchcancel", canvasMouseUp)
        .on("touchstart", function() {
            var touch0;
            if (d3.event.touches.length>1) {
                clearTimeout(touchStartTime);
                touchStartTime = null;
                d3.event.preventDefault();
                touch0 = d3.event.touches.item(0);
                var touch1 = d3.event.touches.item(1);
                var a = touch0["pageY"]-touch1["pageY"];
                var b = touch0["pageX"]-touch1["pageX"];

                var offset = $("#chart").offset();
                var scrollPos = [$("#chart").scrollLeft(),$("#chart").scrollTop()];
                startTouchCenter = [
                    (touch1["pageX"]+(b/2)-offset.left+scrollPos[0])/scaleFactor,
                    (touch1["pageY"]+(a/2)-offset.top+scrollPos[1])/scaleFactor
                ];
                moveTouchCenter = [
                    touch1["pageX"]+(b/2),
                    touch1["pageY"]+(a/2)
                ]
                startTouchDistance = Math.sqrt((a*a)+(b*b));
            } else {
                var obj = d3.select(document.body);
                touch0 = d3.event.touches.item(0);
                var pos = [touch0.pageX,touch0.pageY];
                startTouchCenter = [touch0.pageX,touch0.pageY];
                startTouchDistance = 0;
                var point = d3.touches(this)[0];
                touchStartTime = setTimeout(function() {
                    touchStartTime = null;
                    showTouchMenu(obj,pos);
                    //lasso = vis.append("rect")
                    //    .attr("ox",point[0])
                    //    .attr("oy",point[1])
                    //    .attr("rx",2)
                    //    .attr("ry",2)
                    //    .attr("x",point[0])
                    //    .attr("y",point[1])
                    //    .attr("width",0)
                    //    .attr("height",0)
                    //    .attr("class","lasso");
                    //outer_background.attr("fill","#e3e3f3");
                },touchLongPressTimeout);
            }
        })
        .on("touchmove", function(){
                if  (RED.touch.radialMenu.active()) {
                    d3.event.preventDefault();
                    return;
                }
                var touch0;
                if (d3.event.touches.length<2) {
                    if (touchStartTime) {
                        touch0 = d3.event.touches.item(0);
                        var dx = (touch0.pageX-startTouchCenter[0]);
                        var dy = (touch0.pageY-startTouchCenter[1]);
                        var d = Math.abs(dx*dx+dy*dy);
                        if (d > 64) {
                            clearTimeout(touchStartTime);
                            touchStartTime = null;
                        }
                    } else if (lasso) {
                        d3.event.preventDefault();
                    }
                    canvasMouseMove.call(this);
                } else {
                    touch0 = d3.event.touches.item(0);
                    var touch1 = d3.event.touches.item(1);
                    var a = touch0["pageY"]-touch1["pageY"];
                    var b = touch0["pageX"]-touch1["pageX"];
                    var offset = $("#chart").offset();
                    var scrollPos = [$("#chart").scrollLeft(),$("#chart").scrollTop()];
                    var moveTouchDistance = Math.sqrt((a*a)+(b*b));
                    var touchCenter = [
                        touch1["pageX"]+(b/2),
                        touch1["pageY"]+(a/2)
                    ];

                    if (!isNaN(moveTouchDistance)) {
                        oldScaleFactor = scaleFactor;
                        scaleFactor = Math.min(2,Math.max(0.3, scaleFactor + (Math.floor(((moveTouchDistance*100)-(startTouchDistance*100)))/10000)));

                        var deltaTouchCenter = [                             // Try to pan whilst zooming - not 100%
                            startTouchCenter[0]*(scaleFactor-oldScaleFactor),//-(touchCenter[0]-moveTouchCenter[0]),
                            startTouchCenter[1]*(scaleFactor-oldScaleFactor) //-(touchCenter[1]-moveTouchCenter[1])
                        ];

                        startTouchDistance = moveTouchDistance;
                        moveTouchCenter = touchCenter;

                        $("#chart").scrollLeft(scrollPos[0]+deltaTouchCenter[0]);
                        $("#chart").scrollTop(scrollPos[1]+deltaTouchCenter[1]);
                        redraw();
                    }
                }
        });

    var outer_background = vis.append("svg:rect")
        .attr("width", space_width)
        .attr("height", space_height)
        .attr("fill","#fff");

    var grid = vis.append("g");
    updateGrid();

    function updateGrid() {
        var gridTicks = [];
        for (var i=0;i<space_width;i+=+gridSize) {
            gridTicks.push(i);
        }
        grid.selectAll("line.horizontal").remove();
        grid.selectAll("line.horizontal").data(gridTicks).enter()
            .append("line")
            .attr(
                {
                    "class":"horizontal",
                    "x1" : 0,
                    "x2" : space_width,
                    "y1" : function(d){ return d;},
                    "y2" : function(d){ return d;},
                    "fill" : "none",
                    "shape-rendering" : "crispEdges",
                    "stroke" : "#eee",
                    "stroke-width" : "1px"
                });
        grid.selectAll("line.vertical").remove();
        grid.selectAll("line.vertical").data(gridTicks).enter()
            .append("line")
            .attr(
                {
                    "class":"vertical",
                    "y1" : 0,
                    "y2" : space_width,
                    "x1" : function(d){ return d;},
                    "x2" : function(d){ return d;},
                    "fill" : "none",
                    "shape-rendering" : "crispEdges",
                    "stroke" : "#eee",
                    "stroke-width" : "1px"
                });
    }

    var dragGroup = vis.append("g");
    var drag_lines = [];

    function showDragLines(nodes) {
        for (var i=0;i<nodes.length;i++) {
            var node = nodes[i];
            node.el = dragGroup.append("svg:path").attr("class", "drag_line");
            drag_lines.push(node);
        }

    }
    function hideDragLines() {
        while(drag_lines.length) {
            var line = drag_lines.pop();
            if (line.el) {
                line.el.remove();
            }
        }
    }

    function updateActiveNodes() {
        var activeWorkspace = RED.workspaces.active();

        activeNodes = RED.nodes.filterNodes({z:activeWorkspace});

        activeLinks = RED.nodes.filterLinks({
            source:{z:activeWorkspace},
            target:{z:activeWorkspace}
        });
    }

    function init() {

        RED.events.on("workspace:change",function(event) {
            var chart = $("#chart");
            if (event.old !== 0) {
                workspaceScrollPositions[event.old] = {
                    left:chart.scrollLeft(),
                    top:chart.scrollTop()
                };
            }
            var scrollStartLeft = chart.scrollLeft();
            var scrollStartTop = chart.scrollTop();

            activeSubflow = RED.nodes.subflow(event.workspace);

            RED.menu.setDisabled("menu-item-workspace-edit", activeSubflow);
            RED.menu.setDisabled("menu-item-workspace-delete",RED.workspaces.count() == 1 || activeSubflow);

            if (workspaceScrollPositions[event.workspace]) {
                chart.scrollLeft(workspaceScrollPositions[event.workspace].left);
                chart.scrollTop(workspaceScrollPositions[event.workspace].top);
            } else {
                chart.scrollLeft(0);
                chart.scrollTop(0);
            }
            var scrollDeltaLeft = chart.scrollLeft() - scrollStartLeft;
            var scrollDeltaTop = chart.scrollTop() - scrollStartTop;
            if (mouse_position != null) {
                mouse_position[0] += scrollDeltaLeft;
                mouse_position[1] += scrollDeltaTop;
            }
            clearSelection();
            RED.nodes.eachNode(function(n) {
                n.dirty = true;
            });
            updateSelection();
            updateActiveNodes();
            redraw();
        });

        $("#btn-zoom-out").click(function() {zoomOut();});
        $("#btn-zoom-zero").click(function() {zoomZero();});
        $("#btn-zoom-in").click(function() {zoomIn();});
        $("#chart").on("DOMMouseScroll mousewheel", function (evt) {
            if ( evt.altKey ) {
                evt.preventDefault();
                evt.stopPropagation();
                var move = -(evt.originalEvent.detail) || evt.originalEvent.wheelDelta;
                if (move <= 0) { zoomOut(); }
                else { zoomIn(); }
            }
        });

        // Handle nodes dragged from the palette
        $("#chart").droppable({
            accept:".palette_node",
            drop: function( event, ui ) {
                d3.event = event;
                var selected_tool = ui.draggable[0].type;
                var result = addNode(selected_tool);
                if (!result) {
                    return;
                }
                var historyEvent = result.historyEvent;
                var nn = result.node;

                var helperOffset = d3.touches(ui.helper.get(0))[0]||d3.mouse(ui.helper.get(0));
                var mousePos = d3.touches(this)[0]||d3.mouse(this);

                mousePos[1] += this.scrollTop + ((nn.h/2)-helperOffset[1]);
                mousePos[0] += this.scrollLeft + ((nn.w/2)-helperOffset[0]);
                mousePos[1] /= scaleFactor;
                mousePos[0] /= scaleFactor;

                if (snapGrid) {
                    mousePos[0] = gridSize*(Math.ceil(mousePos[0]/gridSize));
                    mousePos[1] = gridSize*(Math.ceil(mousePos[1]/gridSize));
                }
                nn.x = mousePos[0];
                nn.y = mousePos[1];

                var spliceLink = $(ui.helper).data("splice");
                if (spliceLink) {
                    // TODO: DRY - droppable/nodeMouseDown/canvasMouseUp
                    RED.nodes.removeLink(spliceLink);
                    var link1 = {
                        source:spliceLink.source,
                        sourcePort:spliceLink.sourcePort,
                        target: nn
                    };
                    var link2 = {
                        source:nn,
                        sourcePort:0,
                        target: spliceLink.target
                    };
                    RED.nodes.addLink(link1);
                    RED.nodes.addLink(link2);
                    historyEvent.links = [link1,link2];
                    historyEvent.removedLinks = [spliceLink];
                }

                RED.history.push(historyEvent);
                RED.nodes.add(nn);
                RED.editor.validateNode(nn);
                RED.nodes.dirty(true);
                // auto select dropped node - so info shows (if visible)
                clearSelection();
                nn.selected = true;
                moving_set.push({n:nn});
                updateActiveNodes();
                updateSelection();
                redraw();

                if (nn._def.autoedit) {
                    RED.editor.edit(nn);
                }
            }
        });
        $("#chart").focus(function() {
            $("#workspace-tabs").addClass("workspace-focussed")
        });
        $("#chart").blur(function() {
            $("#workspace-tabs").removeClass("workspace-focussed")
        });

        RED.actions.add("core:copy-selection-to-internal-clipboard",copySelection);
        RED.actions.add("core:cut-selection-to-internal-clipboard",function(){copySelection();deleteSelection();});
        RED.actions.add("core:paste-from-internal-clipboard",function(){importNodes(clipboard);});
        RED.actions.add("core:delete-selection",deleteSelection);
        RED.actions.add("core:edit-selected-node",editSelection);
        RED.actions.add("core:undo",RED.history.pop);
        RED.actions.add("core:select-all-nodes",selectAll);
        RED.actions.add("core:zoom-in",zoomIn);
        RED.actions.add("core:zoom-out",zoomOut);
        RED.actions.add("core:zoom-reset",zoomZero);

        RED.actions.add("core:toggle-show-grid",function(state) {
            if (state === undefined) {
                RED.userSettings.toggle("view-show-grid");
            } else {
                toggleShowGrid(state);
            }
        });
        RED.actions.add("core:toggle-snap-grid",function(state) {
            if (state === undefined) {
                RED.userSettings.toggle("view-snap-grid");
            } else {
                toggleSnapGrid(state);
            }
        });
        RED.actions.add("core:toggle-status",function(state) {
            if (state === undefined) {
                RED.userSettings.toggle("view-node-status");
            } else {
                toggleStatus(state);
            }
        });

        RED.actions.add("core:move-selection-up", function() { moveSelection(0,-1);});
        RED.actions.add("core:step-selection-up", function() { moveSelection(0,-20);});
        RED.actions.add("core:move-selection-right", function() { moveSelection(1,0);});
        RED.actions.add("core:step-selection-right", function() { moveSelection(20,0);});
        RED.actions.add("core:move-selection-down", function() { moveSelection(0,1);});
        RED.actions.add("core:step-selection-down", function() { moveSelection(0,20);});
        RED.actions.add("core:move-selection-left", function() { moveSelection(-1,0);});
        RED.actions.add("core:step-selection-left", function() { moveSelection(-20,0);});
    }


    function addNode(type,x,y) {
        var m = /^subflow:(.+)$/.exec(type);

        if (activeSubflow && m) {
            var subflowId = m[1];
            if (subflowId === activeSubflow.id) {
                RED.notify(RED._("notification.error",{message: RED._("notification.errors.cannotAddSubflowToItself")}),"error");
                return;
            }
            if (RED.nodes.subflowContains(m[1],activeSubflow.id)) {
                RED.notify(RED._("notification.error",{message: RED._("notification.errors.cannotAddCircularReference")}),"error");
                return;
            }
        }

        var nn = { id:RED.nodes.id(),z:RED.workspaces.active()};

        nn.type = type;
        nn._def = RED.nodes.getType(nn.type);

        if (!m) {
            nn.inputs = nn._def.inputs || 0;
            nn.outputs = nn._def.outputs;

            for (var d in nn._def.defaults) {
                if (nn._def.defaults.hasOwnProperty(d)) {
                    if (nn._def.defaults[d].value !== undefined) {
                        nn[d] = JSON.parse(JSON.stringify(nn._def.defaults[d].value));
                    }
                }
            }

            if (nn._def.onadd) {
                try {
                    nn._def.onadd.call(nn);
                } catch(err) {
                    console.log("Definition error: "+nn.type+".onadd:",err);
                }
            }
        } else {
            var subflow = RED.nodes.subflow(m[1]);
            nn.inputs = subflow.in.length;
            nn.outputs = subflow.out.length;
        }

        nn.changed = true;
        nn.moved = true;

        nn.w = node_width;
        nn.h = Math.max(node_height,(nn.outputs||0) * 15);

        var historyEvent = {
            t:"add",
            nodes:[nn.id],
            dirty:RED.nodes.dirty()
        }
        if (activeSubflow) {
            var subflowRefresh = RED.subflow.refresh(true);
            if (subflowRefresh) {
                historyEvent.subflow = {
                    id:activeSubflow.id,
                    changed: activeSubflow.changed,
                    instances: subflowRefresh.instances
                }
            }
        }
        return {
            node: nn,
            historyEvent: historyEvent
        }

    }

    function canvasMouseDown() {
        var point;

        if (!mousedown_node && !mousedown_link) {
            selected_link = null;
            updateSelection();
        }
        if (mouse_mode === 0) {
            if (lasso) {
                lasso.remove();
                lasso = null;
            }
        }
        if (mouse_mode === 0 || mouse_mode === RED.state.QUICK_JOINING) {
            if (d3.event.metaKey || d3.event.ctrlKey) {
                point = d3.mouse(this);
                d3.event.stopPropagation();
                var mainPos = $("#main-container").position();

                if (mouse_mode !== RED.state.QUICK_JOINING) {
                    mouse_mode = RED.state.QUICK_JOINING;
                    $(window).on('keyup',disableQuickJoinEventHandler);
                }

                RED.typeSearch.show({
                    x:d3.event.clientX-mainPos.left-node_width/2,
                    y:d3.event.clientY-mainPos.top-node_height/2,
                    add: function(type) {
                        var result = addNode(type);
                        if (!result) {
                            return;
                        }
                        var nn = result.node;
                        var historyEvent = result.historyEvent;
                        nn.x = point[0];
                        nn.y = point[1];
                        if (mouse_mode === RED.state.QUICK_JOINING) {
                            if (drag_lines.length > 0) {
                                var drag_line = drag_lines[0];
                                var src = null,dst,src_port;

                                if (drag_line.portType === PORT_TYPE_OUTPUT && nn.inputs > 0) {
                                    src = drag_line.node;
                                    src_port = drag_line.port;
                                    dst = nn;
                                } else if (drag_line.portType === PORT_TYPE_INPUT && nn.outputs > 0) {
                                    src = nn;
                                    dst = drag_line.node;
                                    src_port = 0;
                                }
                                if (src !== null) {
                                    var link = {source: src, sourcePort:src_port, target: dst};
                                    RED.nodes.addLink(link);
                                    historyEvent.links = [link];
                                    hideDragLines();
                                    if (drag_line.portType === PORT_TYPE_OUTPUT && nn.outputs > 0) {
                                        showDragLines([{node:nn,port:0,portType:PORT_TYPE_OUTPUT}]);
                                    } else if (drag_line.portType === PORT_TYPE_INPUT && nn.inputs > 0) {
                                        showDragLines([{node:nn,port:0,portType:PORT_TYPE_INPUT}]);
                                    } else {
                                        resetMouseVars();
                                    }
                                } else {
                                    hideDragLines();
                                    resetMouseVars();
                                }
                            } else {
                                if (nn.outputs > 0) {
                                    showDragLines([{node:nn,port:0,portType:PORT_TYPE_OUTPUT}]);
                                } else if (nn.inputs > 0) {
                                    showDragLines([{node:nn,port:0,portType:PORT_TYPE_INPUT}]);
                                } else {
                                    resetMouseVars();
                                }
                            }
                        }


                        RED.history.push(historyEvent);
                        RED.nodes.add(nn);
                        RED.editor.validateNode(nn);
                        RED.nodes.dirty(true);
                        // auto select dropped node - so info shows (if visible)
                        clearSelection();
                        nn.selected = true;
                        moving_set.push({n:nn});
                        updateActiveNodes();
                        updateSelection();
                        redraw();
                    }
                });

                updateActiveNodes();
                updateSelection();
                redraw();
            }
        }
        if (mouse_mode === 0 && !(d3.event.metaKey || d3.event.ctrlKey)) {
            if (!touchStartTime) {
                point = d3.mouse(this);
                lasso = vis.append("rect")
                .attr("ox",point[0])
                .attr("oy",point[1])
                .attr("rx",1)
                .attr("ry",1)
                .attr("x",point[0])
                .attr("y",point[1])
                .attr("width",0)
                .attr("height",0)
                .attr("class","lasso");
                d3.event.preventDefault();
            }
        }
    }

    function canvasMouseMove() {
        var i;
        var node;
        mouse_position = d3.touches(this)[0]||d3.mouse(this);
        // Prevent touch scrolling...
        //if (d3.touches(this)[0]) {
        //    d3.event.preventDefault();
        //}

        // TODO: auto scroll the container
        //var point = d3.mouse(this);
        //if (point[0]-container.scrollLeft < 30 && container.scrollLeft > 0) { container.scrollLeft -= 15; }
        //console.log(d3.mouse(this),container.offsetWidth,container.offsetHeight,container.scrollLeft,container.scrollTop);

        if (lasso) {
            var ox = parseInt(lasso.attr("ox"));
            var oy = parseInt(lasso.attr("oy"));
            var x = parseInt(lasso.attr("x"));
            var y = parseInt(lasso.attr("y"));
            var w;
            var h;
            if (mouse_position[0] < ox) {
                x = mouse_position[0];
                w = ox-x;
            } else {
                w = mouse_position[0]-x;
            }
            if (mouse_position[1] < oy) {
                y = mouse_position[1];
                h = oy-y;
            } else {
                h = mouse_position[1]-y;
            }
            lasso
                .attr("x",x)
                .attr("y",y)
                .attr("width",w)
                .attr("height",h)
            ;
            return;
        }

        if (mouse_mode != RED.state.QUICK_JOINING && mouse_mode != RED.state.IMPORT_DRAGGING && !mousedown_node && selected_link == null) {
            return;
        }

        var mousePos;
        if (mouse_mode == RED.state.JOINING || mouse_mode === RED.state.QUICK_JOINING) {
            // update drag line
            if (drag_lines.length === 0) {
                if (d3.event.shiftKey) {
                    // Get all the wires we need to detach.
                    var links = [];
                    var existingLinks = [];
                    if (selected_link &&
                        ((mousedown_port_type === PORT_TYPE_OUTPUT &&
                            selected_link.source === mousedown_node &&
                            selected_link.sourcePort === mousedown_port_index
                        ) ||
                        (mousedown_port_type === PORT_TYPE_INPUT &&
                            selected_link.target === mousedown_node
                        ))
                    ) {
                        existingLinks = [selected_link];
                    } else {
                        var filter;
                        if (mousedown_port_type === PORT_TYPE_OUTPUT) {
                            filter = {
                                source:mousedown_node,
                                sourcePort: mousedown_port_index
                            }
                        } else {
                            filter = {
                                target: mousedown_node
                            }
                        }
                        existingLinks = RED.nodes.filterLinks(filter);
                    }
                    for (i=0;i<existingLinks.length;i++) {
                        var link = existingLinks[i];
                        RED.nodes.removeLink(link);
                        links.push({
                            link:link,
                            node: (mousedown_port_type===PORT_TYPE_OUTPUT)?link.target:link.source,
                            port: (mousedown_port_type===PORT_TYPE_OUTPUT)?0:link.sourcePort,
                            portType: (mousedown_port_type===PORT_TYPE_OUTPUT)?PORT_TYPE_INPUT:PORT_TYPE_OUTPUT
                        })
                    }
                    if (links.length === 0) {
                        resetMouseVars();
                        redraw();
                    } else {
                        showDragLines(links);
                        mouse_mode = 0;
                        updateActiveNodes();
                        redraw();
                        mouse_mode = RED.state.JOINING;
                    }
                } else if (mousedown_node) {
                    showDragLines([{node:mousedown_node,port:mousedown_port_index,portType:mousedown_port_type}]);
                }
                selected_link = null;
            }
            mousePos = mouse_position;
            for (i=0;i<drag_lines.length;i++) {
                var drag_line = drag_lines[i];
                var numOutputs = (drag_line.portType === PORT_TYPE_OUTPUT)?(drag_line.node.outputs || 1):1;
                var sourcePort = drag_line.port;
                var portY = -((numOutputs-1)/2)*13 +13*sourcePort;

                var sc = (drag_line.portType === PORT_TYPE_OUTPUT)?1:-1;

                var dy = mousePos[1]-(drag_line.node.y+portY);
                var dx = mousePos[0]-(drag_line.node.x+sc*drag_line.node.w/2);
                var delta = Math.sqrt(dy*dy+dx*dx);
                var scale = lineCurveScale;
                var scaleY = 0;

                if (delta < node_width) {
                    scale = 0.75-0.75*((node_width-delta)/node_width);
                }
                if (dx*sc < 0) {
                    scale += 2*(Math.min(5*node_width,Math.abs(dx))/(5*node_width));
                    if (Math.abs(dy) < 3*node_height) {
                        scaleY = ((dy>0)?0.5:-0.5)*(((3*node_height)-Math.abs(dy))/(3*node_height))*(Math.min(node_width,Math.abs(dx))/(node_width)) ;
                    }
                }

                drag_line.el.attr("d",
                    "M "+(drag_line.node.x+sc*drag_line.node.w/2)+" "+(drag_line.node.y+portY)+
                    " C "+(drag_line.node.x+sc*(drag_line.node.w/2+node_width*scale))+" "+(drag_line.node.y+portY+scaleY*node_height)+" "+
                    (mousePos[0]-sc*(scale)*node_width)+" "+(mousePos[1]-scaleY*node_height)+" "+
                    mousePos[0]+" "+mousePos[1]
                    );
            }
            d3.event.preventDefault();
        } else if (mouse_mode == RED.state.MOVING) {
            mousePos = d3.mouse(document.body);
            if (isNaN(mousePos[0])) {
                mousePos = d3.touches(document.body)[0];
            }
            var d = (mouse_offset[0]-mousePos[0])*(mouse_offset[0]-mousePos[0]) + (mouse_offset[1]-mousePos[1])*(mouse_offset[1]-mousePos[1]);
            if (d > 3) {
                mouse_mode = RED.state.MOVING_ACTIVE;
                clickElapsed = 0;
                spliceActive = false;
                if (moving_set.length === 1) {
                    node = moving_set[0];
                    spliceActive = node.n.hasOwnProperty("_def") &&
                                   node.n._def.inputs > 0 &&
                                   node.n._def.outputs > 0 &&
                                   RED.nodes.filterLinks({ source: node.n }).length === 0 &&
                                   RED.nodes.filterLinks({ target: node.n }).length === 0;
                }
            }
        } else if (mouse_mode == RED.state.MOVING_ACTIVE || mouse_mode == RED.state.IMPORT_DRAGGING) {
            mousePos = mouse_position;
            var minX = 0;
            var minY = 0;
            var maxX = space_width;
            var maxY = space_height;
            for (var n = 0; n<moving_set.length; n++) {
                node = moving_set[n];
                if (d3.event.shiftKey) {
                    node.n.ox = node.n.x;
                    node.n.oy = node.n.y;
                }
                node.n.x = mousePos[0]+node.dx;
                node.n.y = mousePos[1]+node.dy;
                node.n.dirty = true;
                minX = Math.min(node.n.x-node.n.w/2-5,minX);
                minY = Math.min(node.n.y-node.n.h/2-5,minY);
                maxX = Math.max(node.n.x+node.n.w/2+5,maxX);
                maxY = Math.max(node.n.y+node.n.h/2+5,maxY);
            }
            if (minX !== 0 || minY !== 0) {
                for (i = 0; i<moving_set.length; i++) {
                    node = moving_set[i];
                    node.n.x -= minX;
                    node.n.y -= minY;
                }
            }
            if (maxX !== space_width || maxY !== space_height) {
                for (i = 0; i<moving_set.length; i++) {
                    node = moving_set[i];
                    node.n.x -= (maxX - space_width);
                    node.n.y -= (maxY - space_height);
                }
            }
            if (snapGrid != d3.event.shiftKey && moving_set.length > 0) {
                var gridOffset = [0,0];
                node = moving_set[0];
                gridOffset[0] = node.n.x-(gridSize*Math.floor((node.n.x-node.n.w/2)/gridSize)+node.n.w/2);
                gridOffset[1] = node.n.y-(gridSize*Math.floor(node.n.y/gridSize));
                if (gridOffset[0] !== 0 || gridOffset[1] !== 0) {
                    for (i = 0; i<moving_set.length; i++) {
                        node = moving_set[i];
                        node.n.x -= gridOffset[0];
                        node.n.y -= gridOffset[1];
                        if (node.n.x == node.n.ox && node.n.y == node.n.oy) {
                            node.dirty = false;
                        }
                    }
                }
            }
            if ((mouse_mode == RED.state.MOVING_ACTIVE || mouse_mode == RED.state.IMPORT_DRAGGING) && moving_set.length === 1) {
                node = moving_set[0];
                if (spliceActive) {
                    if (!spliceTimer) {
                        spliceTimer = setTimeout(function() {
                            var nodes = [];
                            var bestDistance = Infinity;
                            var bestLink = null;
                            var mouseX = node.n.x;
                            var mouseY = node.n.y;
                            if (outer[0][0].getIntersectionList) {
                                var svgRect = outer[0][0].createSVGRect();
                                svgRect.x = mouseX;
                                svgRect.y = mouseY;
                                svgRect.width = 1;
                                svgRect.height = 1;
                                nodes = outer[0][0].getIntersectionList(svgRect, outer[0][0]);
                            } else {
                                // Firefox doesn"t do getIntersectionList and that
                                // makes us sad
                                nodes = RED.view.getLinksAtPoint(mouseX,mouseY);
                            }
                            for (var i=0;i<nodes.length;i++) {
                                if (d3.select(nodes[i]).classed("link_background")) {
                                    var length = nodes[i].getTotalLength();
                                    for (var j=0;j<length;j+=10) {
                                        var p = nodes[i].getPointAtLength(j);
                                        var d2 = ((p.x-mouseX)*(p.x-mouseX))+((p.y-mouseY)*(p.y-mouseY));
                                        if (d2 < 200 && d2 < bestDistance) {
                                            bestDistance = d2;
                                            bestLink = nodes[i];
                                        }
                                    }
                                }
                            }
                            if (activeSpliceLink && activeSpliceLink !== bestLink) {
                                d3.select(activeSpliceLink.parentNode).classed("link_splice",false);
                            }
                            if (bestLink) {
                                d3.select(bestLink.parentNode).classed("link_splice",true)
                            } else {
                                d3.select(".link_splice").classed("link_splice",false);
                            }
                            activeSpliceLink = bestLink;
                            spliceTimer = null;
                        },100);
                    }
                }
            }


        }
        if (mouse_mode !== 0) {
            redraw();
        }
    }

    function canvasMouseUp() {
        var i;
        var historyEvent;
        if (mouse_mode === RED.state.QUICK_JOINING) {
            return;
        }
        if (mousedown_node && mouse_mode == RED.state.JOINING) {
            var removedLinks = [];
            for (i=0;i<drag_lines.length;i++) {
                if (drag_lines[i].link) {
                    removedLinks.push(drag_lines[i].link)
                }
            }
            historyEvent = {
                t:"delete",
                links: removedLinks,
                dirty:RED.nodes.dirty()
            };
            RED.history.push(historyEvent);
            hideDragLines();
        }
        if (lasso) {
            var x = parseInt(lasso.attr("x"));
            var y = parseInt(lasso.attr("y"));
            var x2 = x+parseInt(lasso.attr("width"));
            var y2 = y+parseInt(lasso.attr("height"));
            if (!d3.event.ctrlKey) {
                clearSelection();
            }
            RED.nodes.eachNode(function(n) {
                if (n.z == RED.workspaces.active() && !n.selected) {
                    n.selected = (n.x > x && n.x < x2 && n.y > y && n.y < y2);
                    if (n.selected) {
                        n.dirty = true;
                        moving_set.push({n:n});
                    }
                }
            });
            if (activeSubflow) {
                activeSubflow.in.forEach(function(n) {
                    n.selected = (n.x > x && n.x < x2 && n.y > y && n.y < y2);
                    if (n.selected) {
                        n.dirty = true;
                        moving_set.push({n:n});
                    }
                });
                activeSubflow.out.forEach(function(n) {
                    n.selected = (n.x > x && n.x < x2 && n.y > y && n.y < y2);
                    if (n.selected) {
                        n.dirty = true;
                        moving_set.push({n:n});
                    }
                });
            }
            updateSelection();
            lasso.remove();
            lasso = null;
        } else if (mouse_mode == RED.state.DEFAULT && mousedown_link == null && !d3.event.ctrlKey&& !d3.event.metaKey ) {
            clearSelection();
            updateSelection();
        }
        if (mouse_mode == RED.state.MOVING_ACTIVE) {
            if (moving_set.length > 0) {
                var ns = [];
                for (var j=0;j<moving_set.length;j++) {
                    var n = moving_set[j];
                    if (n.ox !== n.n.x || n.oy !== n.n.y) {
                        ns.push({n:n.n,ox:n.ox,oy:n.oy,moved:n.n.moved});
                        n.n.dirty = true;
                        n.n.moved = true;
                    }
                }
                if (ns.length > 0) {
                    historyEvent = {t:"move",nodes:ns,dirty:RED.nodes.dirty()};
                    if (activeSpliceLink) {
                        // TODO: DRY - droppable/nodeMouseDown/canvasMouseUp
                        var spliceLink = d3.select(activeSpliceLink).data()[0];
                        RED.nodes.removeLink(spliceLink);
                        var link1 = {
                            source:spliceLink.source,
                            sourcePort:spliceLink.sourcePort,
                            target: moving_set[0].n
                        };
                        var link2 = {
                            source:moving_set[0].n,
                            sourcePort:0,
                            target: spliceLink.target
                        };
                        RED.nodes.addLink(link1);
                        RED.nodes.addLink(link2);
                        historyEvent.links = [link1,link2];
                        historyEvent.removedLinks = [spliceLink];
                        updateActiveNodes();
                    }
                    RED.nodes.dirty(true);
                    RED.history.push(historyEvent);
                }
            }
        }
        if (mouse_mode == RED.state.MOVING || mouse_mode == RED.state.MOVING_ACTIVE) {
            for (i=0;i<moving_set.length;i++) {
                delete moving_set[i].ox;
                delete moving_set[i].oy;
            }
        }
        if (mouse_mode == RED.state.IMPORT_DRAGGING) {
            RED.keyboard.remove("escape");
            updateActiveNodes();
            RED.nodes.dirty(true);
        }
        resetMouseVars();
        redraw();
    }

    function zoomIn() {
        if (scaleFactor < 2) {
            scaleFactor += 0.1;
            redraw();
        }
    }
    function zoomOut() {
        if (scaleFactor > 0.3) {
            scaleFactor -= 0.1;
            redraw();
        }
    }
    function zoomZero() {
        scaleFactor = 1;
        redraw();
    }

    function selectAll() {
        RED.nodes.eachNode(function(n) {
            if (n.z == RED.workspaces.active()) {
                if (!n.selected) {
                    n.selected = true;
                    n.dirty = true;
                    moving_set.push({n:n});
                }
            }
        });
        if (activeSubflow) {
            activeSubflow.in.forEach(function(n) {
                if (!n.selected) {
                    n.selected = true;
                    n.dirty = true;
                    moving_set.push({n:n});
                }
            });
            activeSubflow.out.forEach(function(n) {
                if (!n.selected) {
                    n.selected = true;
                    n.dirty = true;
                    moving_set.push({n:n});
                }
            });
        }

        selected_link = null;
        updateSelection();
        redraw();
    }

    function clearSelection() {
        for (var i=0;i<moving_set.length;i++) {
            var n = moving_set[i];
            n.n.dirty = true;
            n.n.selected = false;
        }
        moving_set = [];
        selected_link = null;
    }

    var lastSelection = null;
    function updateSelection() {
        var selection = {};

        if (moving_set.length > 0) {
            selection.nodes = moving_set.map(function(n) { return n.n;});
        }
        if (selected_link != null) {
            selection.link = selected_link;
        }
        var activeWorkspace = RED.workspaces.active();
        activeLinks = RED.nodes.filterLinks({
            source:{z:activeWorkspace},
            target:{z:activeWorkspace}
        });
        var tabOrder = RED.nodes.getWorkspaceOrder();
        var currentLinks = activeLinks;
        var addedLinkLinks = {};
        activeFlowLinks = [];
        for (var i=0;i<moving_set.length;i++) {
            if (moving_set[i].n.type === "link out" || moving_set[i].n.type === "link in") {
                var linkNode = moving_set[i].n;
                var offFlowLinks = {};
                linkNode.links.forEach(function(id) {
                    var target = RED.nodes.node(id);
                    if (target) {
                        if (linkNode.type === "link out") {
                            if (target.z === linkNode.z) {
                                if (!addedLinkLinks[linkNode.id+":"+target.id]) {
                                    activeLinks.push({
                                        source:linkNode,
                                        sourcePort:0,
                                        target: target,
                                        link: true
                                    });
                                    addedLinkLinks[linkNode.id+":"+target.id] = true;
                                }
                            } else {
                                offFlowLinks[target.z] = offFlowLinks[target.z]||[];
                                offFlowLinks[target.z].push(target);
                            }
                        } else {
                            if (target.z === linkNode.z) {
                                if (!addedLinkLinks[target.id+":"+linkNode.id]) {
                                    activeLinks.push({
                                        source:target,
                                        sourcePort:0,
                                        target: linkNode,
                                        link: true
                                    });
                                    addedLinkLinks[target.id+":"+linkNode.id] = true;
                                }
                            } else {
                                offFlowLinks[target.z] = offFlowLinks[target.z]||[];
                                offFlowLinks[target.z].push(target);
                            }
                        }
                    }
                });
                var offFlows = Object.keys(offFlowLinks);
                // offFlows.sort(function(A,B) {
                //     return tabOrder.indexOf(A) - tabOrder.indexOf(B);
                // });
                if (offFlows.length > 0) {
                    activeFlowLinks.push({
                        refresh: Math.floor(Math.random()*10000),
                        node: linkNode,
                        links: offFlowLinks//offFlows.map(function(i) { return {id:i,links:offFlowLinks[i]};})
                    });
                }
            }
        }

        var selectionJSON = activeWorkspace+":"+JSON.stringify(selection,function(key,value) {
            if (key === 'nodes') {
                return value.map(function(n) { return n.id })
            } else if (key === 'link') {
                return value.source.id+":"+value.sourcePort+":"+value.target.id;
            }
            return value;
        });
        if (selectionJSON !== lastSelection) {
            lastSelection = selectionJSON;
            RED.events.emit("view:selection-changed",selection);
        }
    }

    function endKeyboardMove() {
        endMoveSet = false;
        if (moving_set.length > 0) {
            var ns = [];
            for (var i=0;i<moving_set.length;i++) {
                ns.push({n:moving_set[i].n,ox:moving_set[i].ox,oy:moving_set[i].oy,moved:moving_set[i].n.moved});
                moving_set[i].n.moved = true;
                moving_set[i].n.dirty = true;
                delete moving_set[i].ox;
                delete moving_set[i].oy;
            }
            redraw();
            RED.history.push({t:"move",nodes:ns,dirty:RED.nodes.dirty()});
            RED.nodes.dirty(true);
        }
    }
    var endMoveSet = false;
    function moveSelection(dx,dy) {
        if (moving_set.length > 0) {
            if (!endMoveSet) {
                $(document).one('keyup',endKeyboardMove);
                endMoveSet = true;
            }
            var minX = 0;
            var minY = 0;
            var node;

            for (var i=0;i<moving_set.length;i++) {
                node = moving_set[i];
                node.n.moved = true;
                node.n.dirty = true;
                if (node.ox == null && node.oy == null) {
                    node.ox = node.n.x;
                    node.oy = node.n.y;
                }
                node.n.x += dx;
                node.n.y += dy;
                node.n.dirty = true;
                minX = Math.min(node.n.x-node.n.w/2-5,minX);
                minY = Math.min(node.n.y-node.n.h/2-5,minY);
            }

            if (minX !== 0 || minY !== 0) {
                for (var n = 0; n<moving_set.length; n++) {
                    node = moving_set[n];
                    node.n.x -= minX;
                    node.n.y -= minY;
                }
            }

            redraw();
        }
    }
    function editSelection() {
        if (moving_set.length > 0) {
            var node = moving_set[0].n;
            if (node.type === "subflow") {
                RED.editor.editSubflow(activeSubflow);
            } else {
                RED.editor.edit(node);
            }
        }
    }
    function deleteSelection() {
        if (moving_set.length > 0 || selected_link != null) {
            var result;
            var removedNodes = [];
            var removedLinks = [];
            var removedSubflowOutputs = [];
            var removedSubflowInputs = [];
            var subflowInstances = [];

            var startDirty = RED.nodes.dirty();
            var startChanged = false;
            if (moving_set.length > 0) {
                for (var i=0;i<moving_set.length;i++) {
                    var node = moving_set[i].n;
                    node.selected = false;
                    if (node.type != "subflow") {
                        if (node.x < 0) {
                            node.x = 25
                        }
                        var removedEntities = RED.nodes.remove(node.id);
                        removedNodes.push(node);
                        removedNodes = removedNodes.concat(removedEntities.nodes);
                        removedLinks = removedLinks.concat(removedEntities.links);
                    } else {
                        if (node.direction === "out") {
                            removedSubflowOutputs.push(node);
                        } else if (node.direction === "in") {
                            removedSubflowInputs.push(node);
                        }
                        node.dirty = true;
                    }
                }
                if (removedSubflowOutputs.length > 0) {
                    result = RED.subflow.removeOutput(removedSubflowOutputs);
                    if (result) {
                        removedLinks = removedLinks.concat(result.links);
                    }
                }
                // Assume 0/1 inputs
                if (removedSubflowInputs.length == 1) {
                    result = RED.subflow.removeInput();
                    if (result) {
                        removedLinks = removedLinks.concat(result.links);
                    }
                }
                var instances = RED.subflow.refresh(true);
                if (instances) {
                    subflowInstances = instances.instances;
                }
                moving_set = [];
                if (removedNodes.length > 0 || removedSubflowOutputs.length > 0 || removedSubflowInputs.length > 0) {
                    RED.nodes.dirty(true);
                }
            }
            if (selected_link) {
                RED.nodes.removeLink(selected_link);
                removedLinks.push(selected_link);
                RED.nodes.dirty(true);
            }
            var historyEvent = {
                t:"delete",
                nodes:removedNodes,
                links:removedLinks,
                subflowOutputs:removedSubflowOutputs,
                subflowInputs:removedSubflowInputs,
                subflow: {
                    instances: subflowInstances
                },
                dirty:startDirty
            };
            RED.history.push(historyEvent);

            selected_link = null;
            updateActiveNodes();
            updateSelection();
            redraw();
        }
    }

    function copySelection() {
        if (moving_set.length > 0) {
            var nns = [];
            for (var n=0;n<moving_set.length;n++) {
                var node = moving_set[n].n;
                // The only time a node.type == subflow can be selected is the
                // input/output "proxy" nodes. They cannot be copied.
                if (node.type != "subflow") {
                    for (var d in node._def.defaults) {
                        if (node._def.defaults.hasOwnProperty(d)) {
                            if (node._def.defaults[d].type) {
                                var configNode = RED.nodes.node(node[d]);
                                if (configNode && configNode._def.exclusive) {
                                    nns.push(RED.nodes.convertNode(configNode));
                                }
                            }
                        }
                    }
                    nns.push(RED.nodes.convertNode(node));
                    //TODO: if the node has an exclusive config node, it should also be copied, to ensure it remains exclusive...
                }
            }
            clipboard = JSON.stringify(nns);
            RED.notify(RED._("clipboard.nodeCopied",{count:nns.length}));
        }
    }


    function calculateTextWidth(str, className, offset) {
        return calculateTextDimensions(str,className,offset,0)[0];
    }

    function calculateTextDimensions(str,className,offsetW,offsetH) {
        var sp = document.createElement("span");
        sp.className = className;
        sp.style.position = "absolute";
        sp.style.top = "-1000px";
        sp.textContent = (str||"");
        document.body.appendChild(sp);
        var w = sp.offsetWidth;
        var h = sp.offsetHeight;
        document.body.removeChild(sp);
        return [offsetW+w,offsetH+h];
    }

    function resetMouseVars() {
        mousedown_node = null;
        mouseup_node = null;
        mousedown_link = null;
        mouse_mode = 0;
        mousedown_port_type = PORT_TYPE_OUTPUT;
        activeSpliceLink = null;
        spliceActive = false;
        d3.select(".link_splice").classed("link_splice",false);
        if (spliceTimer) {
            clearTimeout(spliceTimer);
            spliceTimer = null;
        }
    }

    function disableQuickJoinEventHandler(evt) {
        // Check for ctrl (all browsers), "Meta" (Chrome/FF), keyCode 91 (Safari)
        if (evt.keyCode === 17 || evt.key === "Meta" || evt.keyCode === 91) {
            resetMouseVars();
            hideDragLines();
            redraw();
            $(window).off('keyup',disableQuickJoinEventHandler);
        }
    }

    function portMouseDown(d,portType,portIndex) {
        //console.log(d,portType,portIndex);
        // disable zoom
        //vis.call(d3.behavior.zoom().on("zoom"), null);
        mousedown_node = d;
        mousedown_port_type = portType;
        mousedown_port_index = portIndex || 0;
        if (mouse_mode !== RED.state.QUICK_JOINING) {
            mouse_mode = RED.state.JOINING;
            document.body.style.cursor = "crosshair";
            if (d3.event.ctrlKey || d3.event.metaKey) {
                mouse_mode = RED.state.QUICK_JOINING;
                showDragLines([{node:mousedown_node,port:mousedown_port_index,portType:mousedown_port_type}]);
                $(window).on('keyup',disableQuickJoinEventHandler);
            }
        }
        d3.event.stopPropagation();
        d3.event.preventDefault();
    }

    function portMouseUp(d,portType,portIndex) {
        var i;
        if (mouse_mode === RED.state.QUICK_JOINING) {
            if (drag_lines[0].node===d) {
                return
            }
        }
        document.body.style.cursor = "";
        if (mouse_mode == RED.state.JOINING || mouse_mode == RED.state.QUICK_JOINING) {
            if (typeof TouchEvent != "undefined" && d3.event instanceof TouchEvent) {
                RED.nodes.eachNode(function(n) {
                    if (n.z == RED.workspaces.active()) {
                        var hw = n.w/2;
                        var hh = n.h/2;
                        if (n.x-hw<mouse_position[0] && n.x+hw> mouse_position[0] &&
                            n.y-hh<mouse_position[1] && n.y+hh>mouse_position[1]) {
                                mouseup_node = n;
                                portType = mouseup_node.inputs>0?PORT_TYPE_INPUT:PORT_TYPE_OUTPUT;
                                portIndex = 0;
                        }
                    }
                });
            } else {
                mouseup_node = d;
            }
            var addedLinks = [];
            var removedLinks = [];

            for (i=0;i<drag_lines.length;i++) {
                if (drag_lines[i].link) {
                    removedLinks.push(drag_lines[i].link)
                }
            }
            for (i=0;i<drag_lines.length;i++) {
                if (portType != drag_lines[i].portType && mouseup_node !== drag_lines[i].node) {
                    var drag_line = drag_lines[i];
                    var src,dst,src_port;
                    if (drag_line.portType === PORT_TYPE_OUTPUT) {
                        src = drag_line.node;
                        src_port = drag_line.port;
                        dst = mouseup_node;
                    } else if (drag_line.portType === PORT_TYPE_INPUT) {
                        src = mouseup_node;
                        dst = drag_line.node;
                        src_port = portIndex;
                    }
                    var existingLink = RED.nodes.filterLinks({source:src,target:dst,sourcePort: src_port}).length !== 0;
                    if (!existingLink) {
                        var link = {source: src, sourcePort:src_port, target: dst};
                        RED.nodes.addLink(link);
                        addedLinks.push(link);
                    }
                }
            }
            if (addedLinks.length > 0 || removedLinks.length > 0) {
                var historyEvent = {
                    t:"add",
                    links:addedLinks,
                    removedLinks: removedLinks,
                    dirty:RED.nodes.dirty()
                };
                if (activeSubflow) {
                    var subflowRefresh = RED.subflow.refresh(true);
                    if (subflowRefresh) {
                        historyEvent.subflow = {
                            id:activeSubflow.id,
                            changed: activeSubflow.changed,
                            instances: subflowRefresh.instances
                        }
                    }
                }
                RED.history.push(historyEvent);
                updateActiveNodes();
                RED.nodes.dirty(true);
            }
            if (mouse_mode === RED.state.QUICK_JOINING) {
                if (addedLinks.length > 0) {
                    hideDragLines();
                    if (portType === PORT_TYPE_INPUT && d.outputs > 0) {
                        showDragLines([{node:d,port:0,portType:PORT_TYPE_OUTPUT}]);
                    } else if (portType === PORT_TYPE_OUTPUT && d.inputs > 0) {
                        showDragLines([{node:d,port:0,portType:PORT_TYPE_INPUT}]);
                    } else {
                        resetMouseVars();
                    }
                }
                redraw();
                return;
            }

            resetMouseVars();
            hideDragLines();
            selected_link = null;
            redraw();
        }
    }

    var portLabelHoverTimeout = null;
    var portLabelHover = null;


    function getElementPosition(node) {
        var d3Node = d3.select(node);
        if (d3Node.attr('class') === 'innerCanvas') {
            return [0,0];
        }
        var result = [];
        var localPos = [0,0];
        if (node.nodeName.toLowerCase() === 'g') {
            var transform = d3Node.attr("transform");
            if (transform) {
                localPos = d3.transform(transform).translate;
            }
        } else {
            localPos = [d3Node.attr("x")||0,d3Node.attr("y")||0];
        }
        var parentPos = getElementPosition(node.parentNode);
        return [localPos[0]+parentPos[0],localPos[1]+parentPos[1]]

    }

    function getPortLabel(node,portType,portIndex) {
        var result;
        var nodePortLabels = (portType === PORT_TYPE_INPUT)?node.inputLabels:node.outputLabels;
        if (nodePortLabels && nodePortLabels[portIndex]) {
            return nodePortLabels[portIndex];
        }
        var portLabels = (portType === PORT_TYPE_INPUT)?node._def.inputLabels:node._def.outputLabels;
        if (typeof portLabels === 'string') {
            result = portLabels;
        } else if (typeof portLabels === 'function') {
            try {
                result = portLabels.call(node,portIndex);
            } catch(err) {
                console.log("Definition error: "+node.type+"."+((portType === PORT_TYPE_INPUT)?"inputLabels":"outputLabels"),err);
                result = null;
            }
        } else if ($.isArray(portLabels)) {
            result = portLabels[portIndex];
        }
        return result;
    }
    function portMouseOver(port,d,portType,portIndex) {
        clearTimeout(portLabelHoverTimeout);
        var active = (mouse_mode!=RED.state.JOINING || (drag_lines.length > 0 && drag_lines[0].portType !== portType));
        if (active && ((portType === PORT_TYPE_INPUT && ((d._def && d._def.inputLabels)||d.inputLabels)) || (portType === PORT_TYPE_OUTPUT && ((d._def && d._def.outputLabels)||d.outputLabels)))) {
            portLabelHoverTimeout = setTimeout(function() {
                var tooltip = getPortLabel(d,portType,portIndex);
                if (!tooltip) {
                    return;
                }
                var pos = getElementPosition(port.node());
                portLabelHoverTimeout = null;
                portLabelHover = vis.append("g")
                    .attr("transform","translate("+(pos[0]+(portType===PORT_TYPE_INPUT?-2:12))+","+(pos[1]+5)+")")
                    .attr("class","port_tooltip");
                var lines = tooltip.split("\n");
                var labelWidth = 0;
                var labelHeight = 4;
                var labelHeights = [];
                lines.forEach(function(l) {
                    var labelDimensions = calculateTextDimensions(l, "port_tooltip_label", 8,0);
                    labelWidth = Math.max(labelWidth,labelDimensions[0]);
                    labelHeights.push(0.8*labelDimensions[1]);
                    labelHeight += 0.8*labelDimensions[1];
                });

                var labelHeight1 = (labelHeight/2)-5-2;
                var labelHeight2 = labelHeight - 4;
                portLabelHover.append("path").attr("d",
                    portType===PORT_TYPE_INPUT?
                        "M0 0 l -5 -5 v -"+(labelHeight1)+" q 0 -2 -2 -2 h -"+labelWidth+" q -2 0 -2 2 v "+(labelHeight2)+" q 0 2 2 2 h "+labelWidth+" q 2 0 2 -2 v -"+(labelHeight1)+" l 5 -5"
                        :
                        "M0 0 l 5 -5 v -"+(labelHeight1)+" q 0 -2 2 -2 h "+labelWidth+" q 2 0 2 2 v "+(labelHeight2)+" q 0 2 -2 2 h -"+labelWidth+" q -2 0 -2 -2 v -"+(labelHeight1)+" l -5 -5"
                    );
                var y = -labelHeight/2-2;
                lines.forEach(function(l,i) {
                    y += labelHeights[i];
                    portLabelHover.append("svg:text").attr("class","port_tooltip_label")
                        .attr("x", portType===PORT_TYPE_INPUT?-10:10)
                        .attr("y", y)
                        .attr("text-anchor",portType===PORT_TYPE_INPUT?"end":"start")
                        .text(l)
                });
            },500);
        }
        port.classed("port_hovered",active);
    }
    function portMouseOut(port,d,portType,portIndex) {
        clearTimeout(portLabelHoverTimeout);
        if (portLabelHover) {
            portLabelHover.remove();
            portLabelHover = null;
        }
        port.classed("port_hovered",false);
    }

    function nodeMouseUp(d) {
        if (dblClickPrimed && mousedown_node == d && clickElapsed > 0 && clickElapsed < 750) {
            mouse_mode = RED.state.DEFAULT;
            if (d.type != "subflow") {
                RED.editor.edit(d);
            } else {
                RED.editor.editSubflow(activeSubflow);
            }
            clickElapsed = 0;
            d3.event.stopPropagation();
            return;
        }
        var direction = d._def? (d.inputs > 0 ? 1: 0) : (d.direction == "in" ? 0: 1)
        portMouseUp(d, direction, 0);
    }

    function nodeMouseDown(d) {
        focusView();
        //var touch0 = d3.event;
        //var pos = [touch0.pageX,touch0.pageY];
        //RED.touch.radialMenu.show(d3.select(this),pos);
        if (mouse_mode == RED.state.IMPORT_DRAGGING) {
            RED.keyboard.remove("escape");

            if (activeSpliceLink) {
                // TODO: DRY - droppable/nodeMouseDown/canvasMouseUp
                var spliceLink = d3.select(activeSpliceLink).data()[0];
                RED.nodes.removeLink(spliceLink);
                var link1 = {
                    source:spliceLink.source,
                    sourcePort:spliceLink.sourcePort,
                    target: moving_set[0].n
                };
                var link2 = {
                    source:moving_set[0].n,
                    sourcePort:0,
                    target: spliceLink.target
                };
                RED.nodes.addLink(link1);
                RED.nodes.addLink(link2);
                var historyEvent = RED.history.peek();
                historyEvent.links = [link1,link2];
                historyEvent.removedLinks = [spliceLink];
                updateActiveNodes();
            }

            updateSelection();
            RED.nodes.dirty(true);
            redraw();
            resetMouseVars();
            d3.event.stopPropagation();
            return;
        } else if (mouse_mode == RED.state.QUICK_JOINING) {
            d3.event.stopPropagation();
            return;
        }
        mousedown_node = d;
        var now = Date.now();
        clickElapsed = now-clickTime;
        clickTime = now;

        dblClickPrimed = (lastClickNode == mousedown_node);
        lastClickNode = mousedown_node;

        var i;

        if (d.selected && (d3.event.ctrlKey||d3.event.metaKey)) {
            mousedown_node.selected = false;
            for (i=0;i<moving_set.length;i+=1) {
                if (moving_set[i].n === mousedown_node) {
                    moving_set.splice(i,1);
                    break;
                }
            }
        } else {
            if (d3.event.shiftKey) {
                clearSelection();
                var cnodes = RED.nodes.getAllFlowNodes(mousedown_node);
                for (var n=0;n<cnodes.length;n++) {
                    cnodes[n].selected = true;
                    cnodes[n].dirty = true;
                    moving_set.push({n:cnodes[n]});
                }
            } else if (!d.selected) {
                if (!d3.event.ctrlKey && !d3.event.metaKey) {
                    clearSelection();
                }
                mousedown_node.selected = true;
                moving_set.push({n:mousedown_node});
            }
            selected_link = null;
            if (d3.event.button != 2) {
                mouse_mode = RED.state.MOVING;
                var mouse = d3.touches(this)[0]||d3.mouse(this);
                mouse[0] += d.x-d.w/2;
                mouse[1] += d.y-d.h/2;
                for (i=0;i<moving_set.length;i++) {
                    moving_set[i].ox = moving_set[i].n.x;
                    moving_set[i].oy = moving_set[i].n.y;
                    moving_set[i].dx = moving_set[i].n.x-mouse[0];
                    moving_set[i].dy = moving_set[i].n.y-mouse[1];
                }
                mouse_offset = d3.mouse(document.body);
                if (isNaN(mouse_offset[0])) {
                    mouse_offset = d3.touches(document.body)[0];
                }
            }
        }
        d.dirty = true;
        updateSelection();
        redraw();
        d3.event.stopPropagation();
    }

    function isButtonEnabled(d) {
        var buttonEnabled = true;
        if (d._def.button.hasOwnProperty('enabled')) {
            if (typeof d._def.button.enabled === "function") {
                buttonEnabled = d._def.button.enabled.call(d);
            } else {
                buttonEnabled = d._def.button.enabled;
            }
        }
        return buttonEnabled;
    }

    function nodeButtonClicked(d) {
        if (!activeSubflow) {
            if (d._def.button.toggle) {
                d[d._def.button.toggle] = !d[d._def.button.toggle];
                d.dirty = true;
            }
            if (d._def.button.onclick) {
                try {
                    d._def.button.onclick.call(d);
                } catch(err) {
                    console.log("Definition error: "+d.type+".onclick",err);
                }
            }
            if (d.dirty) {
                redraw();
            }
        } else {
            RED.notify(RED._("notification.warning", {message:RED._("notification.warnings.nodeActionDisabled")}),"warning");
        }
        d3.event.preventDefault();
    }

    function showTouchMenu(obj,pos) {
        var mdn = mousedown_node;
        var options = [];
        options.push({name:"delete",disabled:(moving_set.length===0 && selected_link === null),onselect:function() {deleteSelection();}});
        options.push({name:"cut",disabled:(moving_set.length===0),onselect:function() {copySelection();deleteSelection();}});
        options.push({name:"copy",disabled:(moving_set.length===0),onselect:function() {copySelection();}});
        options.push({name:"paste",disabled:(clipboard.length===0),onselect:function() {importNodes(clipboard,false,true);}});
        options.push({name:"edit",disabled:(moving_set.length != 1),onselect:function() { RED.editor.edit(mdn);}});
        options.push({name:"select",onselect:function() {selectAll();}});
        options.push({name:"undo",disabled:(RED.history.depth() === 0),onselect:function() {RED.history.pop();}});

        RED.touch.radialMenu.show(obj,pos,options);
        resetMouseVars();
    }
    function redraw() {
        vis.attr("transform","scale("+scaleFactor+")");
        outer.attr("width", space_width*scaleFactor).attr("height", space_height*scaleFactor);

        // Don't bother redrawing nodes if we're drawing links
        if (mouse_mode != RED.state.JOINING) {

            var dirtyNodes = {};

            if (activeSubflow) {
                var subflowOutputs = vis.selectAll(".subflowoutput").data(activeSubflow.out,function(d,i){ return d.id;});
                subflowOutputs.exit().remove();
                var outGroup = subflowOutputs.enter().insert("svg:g").attr("class","node subflowoutput").attr("transform",function(d) { return "translate("+(d.x-20)+","+(d.y-20)+")"});
                outGroup.each(function(d,i) {
                    d.w=40;
                    d.h=40;
                });
                outGroup.append("rect").attr("class","subflowport").attr("rx",8).attr("ry",8).attr("width",40).attr("height",40)
                    // TODO: This is exactly the same set of handlers used for regular nodes - DRY
                    .on("mouseup",nodeMouseUp)
                    .on("mousedown",nodeMouseDown)
                    .on("touchstart",function(d) {
                            var obj = d3.select(this);
                            var touch0 = d3.event.touches.item(0);
                            var pos = [touch0.pageX,touch0.pageY];
                            startTouchCenter = [touch0.pageX,touch0.pageY];
                            startTouchDistance = 0;
                            touchStartTime = setTimeout(function() {
                                    showTouchMenu(obj,pos);
                            },touchLongPressTimeout);
                            nodeMouseDown.call(this,d)
                    })
                    .on("touchend", function(d) {
                            clearTimeout(touchStartTime);
                            touchStartTime = null;
                            if  (RED.touch.radialMenu.active()) {
                                d3.event.stopPropagation();
                                return;
                            }
                            nodeMouseUp.call(this,d);
                    });

                outGroup.append("g").attr('transform','translate(-5,15)').append("rect").attr("class","port").attr("rx",3).attr("ry",3).attr("width",10).attr("height",10)
                    .on("mousedown", function(d,i){portMouseDown(d,PORT_TYPE_INPUT,0);} )
                    .on("touchstart", function(d,i){portMouseDown(d,PORT_TYPE_INPUT,0);} )
                    .on("mouseup", function(d,i){portMouseUp(d,PORT_TYPE_INPUT,0);})
                    .on("touchend",function(d,i){portMouseUp(d,PORT_TYPE_INPUT,0);} )
                    .on("mouseover",function(d){portMouseOver(d3.select(this),d,PORT_TYPE_INPUT,0);})
                    .on("mouseout",function(d){portMouseOut(d3.select(this),d,PORT_TYPE_INPUT,0);});

                outGroup.append("svg:text").attr("class","port_label").attr("x",20).attr("y",8).style("font-size","10px").text("output");
                outGroup.append("svg:text").attr("class","port_label port_index").attr("x",20).attr("y",24).text(function(d,i){ return i+1});

                var subflowInputs = vis.selectAll(".subflowinput").data(activeSubflow.in,function(d,i){ return d.id;});
                subflowInputs.exit().remove();
                var inGroup = subflowInputs.enter().insert("svg:g").attr("class","node subflowinput").attr("transform",function(d) { return "translate("+(d.x-20)+","+(d.y-20)+")"});
                inGroup.each(function(d,i) {
                    d.w=40;
                    d.h=40;
                });
                inGroup.append("rect").attr("class","subflowport").attr("rx",8).attr("ry",8).attr("width",40).attr("height",40)
                    // TODO: This is exactly the same set of handlers used for regular nodes - DRY
                    .on("mouseup",nodeMouseUp)
                    .on("mousedown",nodeMouseDown)
                    .on("touchstart",function(d) {
                            var obj = d3.select(this);
                            var touch0 = d3.event.touches.item(0);
                            var pos = [touch0.pageX,touch0.pageY];
                            startTouchCenter = [touch0.pageX,touch0.pageY];
                            startTouchDistance = 0;
                            touchStartTime = setTimeout(function() {
                                    showTouchMenu(obj,pos);
                            },touchLongPressTimeout);
                            nodeMouseDown.call(this,d)
                    })
                    .on("touchend", function(d) {
                            clearTimeout(touchStartTime);
                            touchStartTime = null;
                            if  (RED.touch.radialMenu.active()) {
                                d3.event.stopPropagation();
                                return;
                            }
                            nodeMouseUp.call(this,d);
                    });

                inGroup.append("g").attr('transform','translate(35,15)').append("rect").attr("class","port").attr("rx",3).attr("ry",3).attr("width",10).attr("height",10)
                    .on("mousedown", function(d,i){portMouseDown(d,PORT_TYPE_OUTPUT,i);} )
                    .on("touchstart", function(d,i){portMouseDown(d,PORT_TYPE_OUTPUT,i);} )
                    .on("mouseup", function(d,i){portMouseUp(d,PORT_TYPE_OUTPUT,i);})
                    .on("touchend",function(d,i){portMouseUp(d,PORT_TYPE_OUTPUT,i);} )
                    .on("mouseover",function(d){portMouseOver(d3.select(this),d,PORT_TYPE_OUTPUT,0);})
                    .on("mouseout",function(d) {portMouseOut(d3.select(this),d,PORT_TYPE_OUTPUT,0);});


                inGroup.append("svg:text").attr("class","port_label").attr("x",18).attr("y",20).style("font-size","10px").text("input");



                subflowOutputs.each(function(d,i) {
                    if (d.dirty) {
                        var output = d3.select(this);
                        output.selectAll(".subflowport").classed("node_selected",function(d) { return d.selected; })
                        output.selectAll(".port_index").text(function(d){ return d.i+1});
                        output.attr("transform", function(d) { return "translate(" + (d.x-d.w/2) + "," + (d.y-d.h/2) + ")"; });
                        dirtyNodes[d.id] = d;
                        d.dirty = false;
                    }
                });
                subflowInputs.each(function(d,i) {
                    if (d.dirty) {
                        var input = d3.select(this);
                        input.selectAll(".subflowport").classed("node_selected",function(d) { return d.selected; })
                        input.attr("transform", function(d) { return "translate(" + (d.x-d.w/2) + "," + (d.y-d.h/2) + ")"; });
                        dirtyNodes[d.id] = d;
                        d.dirty = false;
                    }
                });
            } else {
                vis.selectAll(".subflowoutput").remove();
                vis.selectAll(".subflowinput").remove();
            }

            var node = vis.selectAll(".nodegroup").data(activeNodes,function(d){return d.id});
            node.exit().remove();

            var nodeEnter = node.enter().insert("svg:g")
                .attr("class", "node nodegroup")
                .classed("node_subflow",function(d) { return activeSubflow != null; })
                .classed("node_link",function(d) { return d.type === "link in" || d.type === "link out" });

            nodeEnter.each(function(d,i) {
                    var node = d3.select(this);
                    var isLink = d.type === "link in" || d.type === "link out";
                    node.attr("id",d.id);
                    var l = RED.utils.getNodeLabel(d);
                    if (isLink) {
                        d.w = node_height;
                    } else {
                        d.w = Math.max(node_width,20*(Math.ceil((calculateTextWidth(l, "node_label", 50)+(d._def.inputs>0?7:0))/20)) );
                    }
                    d.h = Math.max(node_height,(d.outputs||0) * 15);

                    if (d._def.badge) {
                        var badge = node.append("svg:g").attr("class","node_badge_group");
                        var badgeRect = badge.append("rect").attr("class","node_badge").attr("rx",5).attr("ry",5).attr("width",40).attr("height",15);
                        badge.append("svg:text").attr("class","node_badge_label").attr("x",35).attr("y",11).attr("text-anchor","end").text(d._def.badge());
                        if (d._def.onbadgeclick) {
                            badgeRect.attr("cursor","pointer")
                                .on("click",function(d) { d._def.onbadgeclick.call(d);d3.event.preventDefault();});
                        }
                    }

                    if (d._def.button) {
                        var nodeButtonGroup = node.append("svg:g")
                            .attr("transform",function(d) { return "translate("+((d._def.align == "right") ? 94 : -25)+",2)"; })
                            .attr("class",function(d) { return "node_button "+((d._def.align == "right") ? "node_right_button" : "node_left_button"); });
                        nodeButtonGroup.append("rect")
                            .attr("rx",5)
                            .attr("ry",5)
                            .attr("width",32)
                            .attr("height",node_height-4)
                            .attr("fill","#eee");//function(d) { return d._def.color;})
                        nodeButtonGroup.append("rect")
                            .attr("class","node_button_button")
                            .attr("x",function(d) { return d._def.align == "right"? 11:5})
                            .attr("y",4)
                            .attr("rx",4)
                            .attr("ry",4)
                            .attr("width",16)
                            .attr("height",node_height-12)
                            .attr("fill",function(d) { return d._def.color;})
                            .attr("cursor","pointer")
                            .on("mousedown",function(d) {if (!lasso && isButtonEnabled(d)) {focusView();d3.select(this).attr("fill-opacity",0.2);d3.event.preventDefault(); d3.event.stopPropagation();}})
                            .on("mouseup",function(d) {if (!lasso && isButtonEnabled(d)) { d3.select(this).attr("fill-opacity",0.4);d3.event.preventDefault();d3.event.stopPropagation();}})
                            .on("mouseover",function(d) {if (!lasso && isButtonEnabled(d)) { d3.select(this).attr("fill-opacity",0.4);}})
                            .on("mouseout",function(d) {if (!lasso && isButtonEnabled(d)) {
                                var op = 1;
                                if (d._def.button.toggle) {
                                    op = d[d._def.button.toggle]?1:0.2;
                                }
                                d3.select(this).attr("fill-opacity",op);
                            }})
                            .on("click",nodeButtonClicked)
                            .on("touchstart",nodeButtonClicked)
                    }

                    var mainRect = node.append("rect")
                        .attr("class", "node")
                        .classed("node_unknown",function(d) { return d.type == "unknown"; })
                        .attr("rx", 5)
                        .attr("ry", 5)
                        .attr("fill",function(d) { return d._def.color;})
                        .on("mouseup",nodeMouseUp)
                        .on("mousedown",nodeMouseDown)
                        .on("touchstart",function(d) {
                            var obj = d3.select(this);
                            var touch0 = d3.event.touches.item(0);
                            var pos = [touch0.pageX,touch0.pageY];
                            startTouchCenter = [touch0.pageX,touch0.pageY];
                            startTouchDistance = 0;
                            touchStartTime = setTimeout(function() {
                                showTouchMenu(obj,pos);
                            },touchLongPressTimeout);
                            nodeMouseDown.call(this,d)
                        })
                        .on("touchend", function(d) {
                            clearTimeout(touchStartTime);
                            touchStartTime = null;
                            if  (RED.touch.radialMenu.active()) {
                                d3.event.stopPropagation();
                                return;
                            }
                            nodeMouseUp.call(this,d);
                        })
                        .on("mouseover",function(d) {
                            if (mouse_mode === 0) {
                                var node = d3.select(this);
                                node.classed("node_hovered",true);
                            }
                        })
                        .on("mouseout",function(d) {
                            var node = d3.select(this);
                            node.classed("node_hovered",false);
                        });

                   //node.append("rect").attr("class", "node-gradient-top").attr("rx", 6).attr("ry", 6).attr("height",30).attr("stroke","none").attr("fill","url(#gradient-top)").style("pointer-events","none");
                   //node.append("rect").attr("class", "node-gradient-bottom").attr("rx", 6).attr("ry", 6).attr("height",30).attr("stroke","none").attr("fill","url(#gradient-bottom)").style("pointer-events","none");

                    if (d._def.icon) {
                        var icon_url = RED.utils.getNodeIcon(d._def,d);
                        var icon_group = node.append("g")
                            .attr("class","node_icon_group")
                            .attr("x",0).attr("y",0);

                        var icon_shade = icon_group.append("rect")
                            .attr("x",0).attr("y",0)
                            .attr("class","node_icon_shade")
                            .attr("width","30")
                            .attr("stroke","none")
                            .attr("fill","#000")
                            .attr("fill-opacity","0.05")
                            .attr("height",function(d){return Math.min(50,d.h-4);});

                        var icon = icon_group.append("image")
                            .attr("xlink:href",icon_url)
                            .attr("class","node_icon")
                            .attr("x",0)
                            .attr("width","30")
                            .attr("height","30");

                        var icon_shade_border = icon_group.append("path")
                            .attr("d",function(d) { return "M 30 1 l 0 "+(d.h-2)})
                            .attr("class","node_icon_shade_border")
                            .attr("stroke-opacity","0.1")
                            .attr("stroke","#000")
                            .attr("stroke-width","1");

                        if ("right" == d._def.align) {
                            icon_group.attr("class","node_icon_group node_icon_group_"+d._def.align);
                            icon_shade_border.attr("d",function(d) { return "M 0 1 l 0 "+(d.h-2)})
                            //icon.attr("class","node_icon node_icon_"+d._def.align);
                            //icon.attr("class","node_icon_shade node_icon_shade_"+d._def.align);
                            //icon.attr("class","node_icon_shade_border node_icon_shade_border_"+d._def.align);
                        }

                        //if (d.inputs > 0 && d._def.align == null) {
                        //    icon_shade.attr("width",35);
                        //    icon.attr("transform","translate(5,0)");
                        //    icon_shade_border.attr("transform","translate(5,0)");
                        //}
                        //if (d._def.outputs > 0 && "right" == d._def.align) {
                        //    icon_shade.attr("width",35); //icon.attr("x",5);
                        //}

                        var img = new Image();
                        img.src = icon_url;
                        img.onload = function() {
                            icon.attr("width",Math.min(img.width,30));
                            icon.attr("height",Math.min(img.height,30));
                            icon.attr("x",15-Math.min(img.width,30)/2);
                            //if ("right" == d._def.align) {
                            //    icon.attr("x",function(d){return d.w-img.width-1-(d.outputs>0?5:0);});
                            //    icon_shade.attr("x",function(d){return d.w-30});
                            //    icon_shade_border.attr("d",function(d){return "M "+(d.w-30)+" 1 l 0 "+(d.h-2);});
                            //}
                        }

                        //icon.style("pointer-events","none");
                        icon_group.style("pointer-events","none");
                    }
                    if (!isLink) {
                        var text = node.append("svg:text").attr("class","node_label").attr("x", 38).attr("dy", ".35em").attr("text-anchor","start");
                        if (d._def.align) {
                            text.attr("class","node_label node_label_"+d._def.align);
                            if (d._def.align === "right") {
                                text.attr("text-anchor","end");
                            }
                        }

                        var status = node.append("svg:g").attr("class","node_status_group").style("display","none");

                        var statusRect = status.append("rect").attr("class","node_status")
                                            .attr("x",6).attr("y",1).attr("width",9).attr("height",9)
                                            .attr("rx",2).attr("ry",2).attr("stroke-width","3");

                        var statusLabel = status.append("svg:text")
                            .attr("class","node_status_label")
                            .attr("x",20).attr("y",9);
                    }
                    //node.append("circle").attr({"class":"centerDot","cx":0,"cy":0,"r":5});

                    //node.append("path").attr("class","node_error").attr("d","M 3,-3 l 10,0 l -5,-8 z");

                    //TODO: these ought to be SVG
                    node.append("image").attr("class","node_error hidden").attr("xlink:href","icons/node-red/node-error.png").attr("x",0).attr("y",-6).attr("width",10).attr("height",9);
                    node.append("image").attr("class","node_changed hidden").attr("xlink:href","icons/node-red/node-changed.png").attr("x",12).attr("y",-6).attr("width",10).attr("height",10);
            });

            node.each(function(d,i) {
                    if (d.dirty) {
                        var isLink = d.type === "link in" || d.type === "link out";
                        dirtyNodes[d.id] = d;
                        //if (d.x < -50) deleteSelection();  // Delete nodes if dragged back to palette
                        if (!isLink && d.resize) {
                            var l = RED.utils.getNodeLabel(d);
                            var ow = d.w;
                            d.w = Math.max(node_width,20*(Math.ceil((calculateTextWidth(l, "node_label", 50)+(d._def.inputs>0?7:0))/20)) );
                            d.h = Math.max(node_height,(d.outputs||0) * 15);
                            d.x += (d.w-ow)/2;
                            d.resize = false;
                        }
                        var thisNode = d3.select(this);
                        //thisNode.selectAll(".centerDot").attr({"cx":function(d) { return d.w/2;},"cy":function(d){return d.h/2}});
                        thisNode.attr("transform", function(d) { return "translate(" + (d.x-d.w/2) + "," + (d.y-d.h/2) + ")"; });

                        if (mouse_mode != RED.state.MOVING_ACTIVE) {
                            thisNode.selectAll(".node")
                                .attr("width",function(d){return d.w})
                                .attr("height",function(d){return d.h})
                                .classed("node_selected",function(d) { return d.selected; })
                                .classed("node_highlighted",function(d) { return d.highlighted; })
                            ;
                            //thisNode.selectAll(".node-gradient-top").attr("width",function(d){return d.w});
                            //thisNode.selectAll(".node-gradient-bottom").attr("width",function(d){return d.w}).attr("y",function(d){return d.h-30});

                            thisNode.selectAll(".node_icon_group_right").attr("transform", function(d){return "translate("+(d.w-30)+",0)"});
                            thisNode.selectAll(".node_label_right").attr("x", function(d){return d.w-38});
                            //thisNode.selectAll(".node_icon_right").attr("x",function(d){return d.w-d3.select(this).attr("width")-1-(d.outputs>0?5:0);});
                            //thisNode.selectAll(".node_icon_shade_right").attr("x",function(d){return d.w-30;});
                            //thisNode.selectAll(".node_icon_shade_border_right").attr("d",function(d){return "M "+(d.w-30)+" 1 l 0 "+(d.h-2)});

                            var inputPorts = thisNode.selectAll(".port_input");
                            if (d.inputs === 0 && !inputPorts.empty()) {
                                inputPorts.remove();
                                //nodeLabel.attr("x",30);
                            } else if (d.inputs === 1 && inputPorts.empty()) {
                                var inputGroup = thisNode.append("g").attr("class","port_input");
                                inputGroup.append("rect").attr("class","port").attr("rx",3).attr("ry",3).attr("width",10).attr("height",10)
                                    .on("mousedown",function(d){portMouseDown(d,PORT_TYPE_INPUT,0);})
                                    .on("touchstart",function(d){portMouseDown(d,PORT_TYPE_INPUT,0);})
                                    .on("mouseup",function(d){portMouseUp(d,PORT_TYPE_INPUT,0);} )
                                    .on("touchend",function(d){portMouseUp(d,PORT_TYPE_INPUT,0);} )
                                    .on("mouseover",function(d){portMouseOver(d3.select(this),d,PORT_TYPE_INPUT,0);})
                                    .on("mouseout",function(d) {portMouseOut(d3.select(this),d,PORT_TYPE_INPUT,0);});
                            }

                            var numOutputs = d.outputs;
                            var y = (d.h/2)-((numOutputs-1)/2)*13;
                            d.ports = d.ports || d3.range(numOutputs);
                            d._ports = thisNode.selectAll(".port_output").data(d.ports);
                            var output_group = d._ports.enter().append("g").attr("class","port_output");

                            output_group.append("rect").attr("class","port").attr("rx",3).attr("ry",3).attr("width",10).attr("height",10)
                                .on("mousedown",(function(){var node = d; return function(d,i){portMouseDown(node,PORT_TYPE_OUTPUT,i);}})() )
                                .on("touchstart",(function(){var node = d; return function(d,i){portMouseDown(node,PORT_TYPE_OUTPUT,i);}})() )
                                .on("mouseup",(function(){var node = d; return function(d,i){portMouseUp(node,PORT_TYPE_OUTPUT,i);}})() )
                                .on("touchend",(function(){var node = d; return function(d,i){portMouseUp(node,PORT_TYPE_OUTPUT,i);}})() )
                                .on("mouseover",(function(){var node = d; return function(d,i){portMouseOver(d3.select(this),node,PORT_TYPE_OUTPUT,i);}})())
                                .on("mouseout",(function(){var node = d; return function(d,i) {portMouseOut(d3.select(this),node,PORT_TYPE_OUTPUT,i);}})());

                            d._ports.exit().remove();
                            if (d._ports) {
                                numOutputs = d.outputs || 1;
                                y = (d.h/2)-((numOutputs-1)/2)*13;
                                var x = d.w - 5;
                                d._ports.each(function(d,i) {
                                        var port = d3.select(this);
                                        //port.attr("y",(y+13*i)-5).attr("x",x);
                                        port.attr("transform", function(d) { return "translate("+x+","+((y+13*i)-5)+")";});
                                });
                            }
                            thisNode.selectAll("text.node_label").text(function(d,i){
                                    var l = "";
                                    if (d._def.label) {
                                        l = d._def.label;
                                        try {
                                            l = (typeof l === "function" ? l.call(d) : l)||"";
                                            l = RED.text.bidi.enforceTextDirectionWithUCC(l);
                                        } catch(err) {
                                            console.log("Definition error: "+d.type+".label",err);
                                            l = d.type;
                                        }
                                    }
                                    return l;
                                })
                                .attr("y", function(d){return (d.h/2)-1;})
                                .attr("class",function(d){
                                    var s = "";
                                    if (d._def.labelStyle) {
                                        s = d._def.labelStyle;
                                        try {
                                            s = (typeof s === "function" ? s.call(d) : s)||"";
                                        } catch(err) {
                                            console.log("Definition error: "+d.type+".labelStyle",err);
                                            s = "";
                                        }
                                        s = " "+s;
                                    }
                                    return "node_label"+
                                    (d._def.align?" node_label_"+d._def.align:"")+s;
                            });

                            if (d._def.icon) {
                                icon = thisNode.select(".node_icon");
                                var current_url = icon.attr("xlink:href");
                                var new_url = RED.utils.getNodeIcon(d._def,d);
                                if (new_url !== current_url) {
                                    icon.attr("xlink:href",new_url);
                                    var img = new Image();
                                    img.src = new_url;
                                    img.onload = function() {
                                        icon.attr("width",Math.min(img.width,30));
                                        icon.attr("height",Math.min(img.height,30));
                                        icon.attr("x",15-Math.min(img.width,30)/2);
                                    }
                                }
                            }


                            thisNode.selectAll(".node_tools").attr("x",function(d){return d.w-35;}).attr("y",function(d){return d.h-20;});

                            thisNode.selectAll(".node_changed")
                                .attr("x",function(d){return d.w-10})
                                .classed("hidden",function(d) { return !(d.changed||d.moved); });

                            thisNode.selectAll(".node_error")
                                .attr("x",function(d){return d.w-10-((d.changed||d.moved)?13:0)})
                                .classed("hidden",function(d) { return d.valid; });

                            thisNode.selectAll(".port_input").each(function(d,i) {
                                    var port = d3.select(this);
                                    port.attr("transform",function(d){return "translate(-5,"+((d.h/2)-5)+")";})
                            });

                            thisNode.selectAll(".node_icon").attr("y",function(d){return (d.h-d3.select(this).attr("height"))/2;});
                            thisNode.selectAll(".node_icon_shade").attr("height",function(d){return d.h;});
                            thisNode.selectAll(".node_icon_shade_border").attr("d",function(d){ return "M "+(("right" == d._def.align) ?0:30)+" 1 l 0 "+(d.h-2)});

                            thisNode.selectAll(".node_button").attr("opacity",function(d) {
                                return (activeSubflow||!isButtonEnabled(d))?0.4:1
                            });
                            thisNode.selectAll(".node_button_button").attr("cursor",function(d) {
                                return (activeSubflow||!isButtonEnabled(d))?"":"pointer";
                            });
                            thisNode.selectAll(".node_right_button").attr("transform",function(d){
                                    var x = d.w-6;
                                    if (d._def.button.toggle && !d[d._def.button.toggle]) {
                                        x = x - 8;
                                    }
                                    return "translate("+x+",2)";
                            });
                            thisNode.selectAll(".node_right_button rect").attr("fill-opacity",function(d){
                                    if (d._def.button.toggle) {
                                        return d[d._def.button.toggle]?1:0.2;
                                    }
                                    return 1;
                            });

                            //thisNode.selectAll(".node_right_button").attr("transform",function(d){return "translate("+(d.w - d._def.button.width.call(d))+","+0+")";}).attr("fill",function(d) {
                            //         return typeof d._def.button.color  === "function" ? d._def.button.color.call(d):(d._def.button.color != null ? d._def.button.color : d._def.color)
                            //});

                            thisNode.selectAll(".node_badge_group").attr("transform",function(d){return "translate("+(d.w-40)+","+(d.h+3)+")";});
                            thisNode.selectAll("text.node_badge_label").text(function(d,i) {
                                if (d._def.badge) {
                                    if (typeof d._def.badge == "function") {
                                        try {
                                            return d._def.badge.call(d);
                                        } catch(err) {
                                            console.log("Definition error: "+d.type+".badge",err);
                                            return "";
                                        }
                                    } else {
                                        return d._def.badge;
                                    }
                                }
                                return "";
                            });
                        }

                        if (!showStatus || !d.status) {
                            thisNode.selectAll(".node_status_group").style("display","none");
                        } else {
                            thisNode.selectAll(".node_status_group").style("display","inline").attr("transform","translate(3,"+(d.h+3)+")");
                            var fill = status_colours[d.status.fill]; // Only allow our colours for now
                            if (d.status.shape == null && fill == null) {
                                thisNode.selectAll(".node_status").style("display","none");
                            } else {
                                var style;
                                if (d.status.shape == null || d.status.shape == "dot") {
                                    style = {
                                        display: "inline",
                                        fill: fill,
                                        stroke: fill
                                    };
                                } else if (d.status.shape == "ring" ){
                                    style = {
                                        display: "inline",
                                        fill: "#fff",
                                        stroke: fill
                                    }
                                }
                                thisNode.selectAll(".node_status").style(style);
                            }
                            if (d.status.text) {
                                thisNode.selectAll(".node_status_label").text(d.status.text);
                            } else {
                                thisNode.selectAll(".node_status_label").text("");
                            }
                        }

                        d.dirty = false;
                    }
            });

            var link = vis.selectAll(".link").data(
                activeLinks,
                function(d) {
                    return d.source.id+":"+d.sourcePort+":"+d.target.id+":"+d.target.i;
                }
            );
            var linkEnter = link.enter().insert("g",".node").attr("class","link");

            linkEnter.each(function(d,i) {
                var l = d3.select(this);
                d.added = true;
                l.append("svg:path").attr("class","link_background link_path")
                   .on("mousedown",function(d) {
                        mousedown_link = d;
                        clearSelection();
                        selected_link = mousedown_link;
                        updateSelection();
                        redraw();
                        focusView();
                        d3.event.stopPropagation();
                    })
                    .on("touchstart",function(d) {
                        mousedown_link = d;
                        clearSelection();
                        selected_link = mousedown_link;
                        updateSelection();
                        redraw();
                        focusView();
                        d3.event.stopPropagation();

                        var obj = d3.select(document.body);
                        var touch0 = d3.event.touches.item(0);
                        var pos = [touch0.pageX,touch0.pageY];
                        touchStartTime = setTimeout(function() {
                            touchStartTime = null;
                            showTouchMenu(obj,pos);
                        },touchLongPressTimeout);
                    })
                l.append("svg:path").attr("class","link_outline link_path");
                l.append("svg:path").attr("class","link_line link_path")
                    .classed("link_link", function(d) { return d.link })
                    .classed("link_subflow", function(d) { return !d.link && activeSubflow });
            });

            link.exit().remove();
            var links = vis.selectAll(".link_path");
            links.each(function(d) {
                var link = d3.select(this);
                if (d.added || d===selected_link || d.selected || dirtyNodes[d.source.id] || dirtyNodes[d.target.id]) {
                    link.attr("d",function(d){
                        var numOutputs = d.source.outputs || 1;
                        var sourcePort = d.sourcePort || 0;
                        var y = -((numOutputs-1)/2)*13 +13*sourcePort;

                        var dy = d.target.y-(d.source.y+y);
                        var dx = (d.target.x-d.target.w/2)-(d.source.x+d.source.w/2);
                        var delta = Math.sqrt(dy*dy+dx*dx);
                        var scale = lineCurveScale;
                        var scaleY = 0;
                        if (delta < node_width) {
                            scale = 0.75-0.75*((node_width-delta)/node_width);
                        }

                        if (dx < 0) {
                            scale += 2*(Math.min(5*node_width,Math.abs(dx))/(5*node_width));
                            if (Math.abs(dy) < 3*node_height) {
                                scaleY = ((dy>0)?0.5:-0.5)*(((3*node_height)-Math.abs(dy))/(3*node_height))*(Math.min(node_width,Math.abs(dx))/(node_width)) ;
                            }
                        }

                        d.x1 = d.source.x+d.source.w/2;
                        d.y1 = d.source.y+y;
                        d.x2 = d.target.x-d.target.w/2;
                        d.y2 = d.target.y;

                        return "M "+d.x1+" "+d.y1+
                            " C "+(d.x1+scale*node_width)+" "+(d.y1+scaleY*node_height)+" "+
                            (d.x2-scale*node_width)+" "+(d.y2-scaleY*node_height)+" "+
                            d.x2+" "+d.y2;
                    });
                }
            })

            link.classed("link_selected", function(d) { return d === selected_link || d.selected; });
            link.classed("link_unknown",function(d) {
                delete d.added;
                return d.target.type == "unknown" || d.source.type == "unknown"
            });
            var offLinks = vis.selectAll(".link_flow_link_g").data(
                activeFlowLinks,
                function(d) {
                    return d.node.id+":"+d.refresh
                }
            );

            var offLinksEnter = offLinks.enter().insert("g",".node").attr("class","link_flow_link_g");
            offLinksEnter.each(function(d,i) {
                var g = d3.select(this);
                var s = 1;
                var labelAnchor = "start";
                if (d.node.type === "link in") {
                    s = -1;
                    labelAnchor = "end";
                }
                var stemLength = s*30;
                var branchLength = s*20;
                var l = g.append("svg:path").attr("class","link_flow_link")
                        .attr("class","link_link").attr("d","M 0 0 h "+stemLength);
                var links = d.links;
                var flows = Object.keys(links);
                var tabOrder = RED.nodes.getWorkspaceOrder();
                flows.sort(function(A,B) {
                    return tabOrder.indexOf(A) - tabOrder.indexOf(B);
                });
                var linkWidth = 10;
                var h = node_height;
                var y = -(flows.length-1)*h/2;
                var linkGroups = g.selectAll(".link_group").data(flows);
                var enterLinkGroups = linkGroups.enter().append("g").attr("class","link_group")
                        .on('mouseover', function() { d3.select(this).classed('link_group_active',true)})
                        .on('mouseout', function() { d3.select(this).classed('link_group_active',false)})
                        .on('mousedown', function() { d3.event.preventDefault(); d3.event.stopPropagation(); })
                        .on('mouseup', function(f) {
                            d3.event.stopPropagation();
                            var targets = d.links[f];
                            RED.workspaces.show(f);
                            targets.forEach(function(n) {
                                n.selected = true;
                                n.dirty = true;
                                moving_set.push({n:n});
                            });
                            updateSelection();
                            redraw();
                        });
                enterLinkGroups.each(function(f) {
                    var linkG = d3.select(this);
                    linkG.append("svg:path").attr("class","link_flow_link")
                        .attr("class","link_link")
                        .attr("d",
                            "M "+stemLength+" 0 "+
                            "C "+(stemLength+(1.7*branchLength))+" "+0+
                            " "+(stemLength+(0.1*branchLength))+" "+y+" "+
                            (stemLength+branchLength*1.5)+" "+y+" "
                        );
                    linkG.append("svg:path")
                        .attr("class","link_port")
                        .attr("d",
                            "M "+(stemLength+branchLength*1.5+s*(linkWidth+7))+" "+(y-12)+" "+
                            "h "+(-s*linkWidth)+" "+
                            "a 3 3 45 0 "+(s===1?"0":"1")+" "+(s*-3)+" 3 "+
                            "v 18 "+
                            "a 3 3 45 0 "+(s===1?"0":"1")+" "+(s*3)+" 3 "+
                            "h "+(s*linkWidth)
                        );
                    linkG.append("svg:path")
                        .attr("class","link_port")
                        .attr("d",
                            "M "+(stemLength+branchLength*1.5+s*(linkWidth+10))+" "+(y-12)+" "+
                            "h "+(s*(linkWidth*3))+" "+
                            "M "+(stemLength+branchLength*1.5+s*(linkWidth+10))+" "+(y+12)+" "+
                            "h "+(s*(linkWidth*3))
                        ).style("stroke-dasharray","12 3 8 4 3");
                    linkG.append("rect").attr("class","port link_port")
                        .attr("x",stemLength+branchLength*1.5-4+(s*4))
                        .attr("y",y-4)
                        .attr("rx",2)
                        .attr("ry",2)
                        .attr("width",8)
                        .attr("height",8);
                    linkG.append("rect")
                        .attr("x",stemLength+branchLength*1.5-(s===-1?node_width:0))
                        .attr("y",y-12)
                        .attr("width",node_width)
                        .attr("height",24)
                        .style("stroke","none")
                        .style("fill","transparent")
                    var tab = RED.nodes.workspace(f);
                    var label;
                    if (tab) {
                        label = tab.label || tab.id;
                    }
                    linkG.append("svg:text")
                        .attr("class","port_label")
                        .attr("x",stemLength+branchLength*1.5+(s*15))
                        .attr("y",y+1)
                        .style("font-size","10px")
                        .style("text-anchor",labelAnchor)
                        .text(label);

                    y += h;
                });
                linkGroups.exit().remove();
            });
            offLinks.exit().remove();
            offLinks = vis.selectAll(".link_flow_link_g");
            offLinks.each(function(d) {
                var s = 1;
                if (d.node.type === "link in") {
                    s = -1;
                }
                var link = d3.select(this);
                link.attr("transform", function(d) { return "translate(" + (d.node.x+(s*d.node.w/2)) + "," + (d.node.y) + ")"; });

            })

        } else {
            // JOINING - unselect any selected links
            vis.selectAll(".link_selected").data(
                activeLinks,
                function(d) {
                    return d.source.id+":"+d.sourcePort+":"+d.target.id+":"+d.target.i;
                }
            ).classed("link_selected", false);
        }

        if (d3.event) {
            d3.event.preventDefault();
        }

    }

    function focusView() {
        try {
            // Workaround for browser unexpectedly scrolling iframe into full
            // view - record the parent scroll position and restore it after
            // setting the focus
            var scrollX = window.parent.window.scrollX;
            var scrollY = window.parent.window.scrollY;
            $("#chart").focus();
            window.parent.window.scrollTo(scrollX,scrollY);
        } catch(err) {
            // In case we're iframed into a page of a different origin, just focus
            // the view following the inevitable DOMException
            $("#chart").focus();
        }
    }

    /**
     * Imports a new collection of nodes from a JSON String.
     *  - all get new IDs assigned
     *  - all "selected"
     *  - attached to mouse for placing - "IMPORT_DRAGGING"
     */
    function importNodes(newNodesStr,addNewFlow,touchImport) {
        try {
            var activeSubflowChanged;
            if (activeSubflow) {
                activeSubflowChanged = activeSubflow.changed;
            }
            var result = RED.nodes.import(newNodesStr,true,addNewFlow);
            if (result) {
                var new_nodes = result[0];
                var new_links = result[1];
                var new_workspaces = result[2];
                var new_subflows = result[3];
                var new_default_workspace = result[4];
                if (addNewFlow && new_default_workspace) {
                    RED.workspaces.show(new_default_workspace.id);
                }
                var new_ms = new_nodes.filter(function(n) { return n.hasOwnProperty("x") && n.hasOwnProperty("y") && n.z == RED.workspaces.active() }).map(function(n) { return {n:n};});
                var new_node_ids = new_nodes.map(function(n){ return n.id; });

                // TODO: pick a more sensible root node
                if (new_ms.length > 0) {
                    var root_node = new_ms[0].n;
                    var dx = root_node.x;
                    var dy = root_node.y;

                    if (mouse_position == null) {
                        mouse_position = [0,0];
                    }

                    var minX = 0;
                    var minY = 0;
                    var i;
                    var node;

                    for (i=0;i<new_ms.length;i++) {
                        node = new_ms[i];
                        node.n.selected = true;
                        node.n.changed = true;
                        node.n.moved = true;
                        node.n.x -= dx - mouse_position[0];
                        node.n.y -= dy - mouse_position[1];
                        node.dx = node.n.x - mouse_position[0];
                        node.dy = node.n.y - mouse_position[1];
                        minX = Math.min(node.n.x-node_width/2-5,minX);
                        minY = Math.min(node.n.y-node_height/2-5,minY);
                    }
                    for (i=0;i<new_ms.length;i++) {
                        node = new_ms[i];
                        node.n.x -= minX;
                        node.n.y -= minY;
                        node.dx -= minX;
                        node.dy -= minY;
                        if (node.n._def.onadd) {
                            try {
                                node.n._def.onadd.call(node.n);
                            } catch(err) {
                                console.log("Definition error: "+node.n.type+".onadd:",err);
                            }
                        }

                    }
                    if (!touchImport) {
                        mouse_mode = RED.state.IMPORT_DRAGGING;
                        spliceActive = false;
                        if (new_ms.length === 1) {
                            node = new_ms[0];
                            spliceActive = node.n.hasOwnProperty("_def") &&
                                           node.n._def.inputs > 0 &&
                                           node.n._def.outputs > 0;
                        }
                    }
                    RED.keyboard.add("*","escape",function(){
                            RED.keyboard.remove("escape");
                            clearSelection();
                            RED.history.pop();
                            mouse_mode = 0;
                    });
                    clearSelection();
                    moving_set = new_ms;
                }

                var historyEvent = {
                    t:"add",
                    nodes:new_node_ids,
                    links:new_links,
                    workspaces:new_workspaces,
                    subflows:new_subflows,
                    dirty:RED.nodes.dirty()
                };
                if (new_ms.length === 0) {
                    RED.nodes.dirty(true);
                }
                if (activeSubflow) {
                    var subflowRefresh = RED.subflow.refresh(true);
                    if (subflowRefresh) {
                        historyEvent.subflow = {
                            id:activeSubflow.id,
                            changed: activeSubflowChanged,
                            instances: subflowRefresh.instances
                        }
                    }
                }
                RED.history.push(historyEvent);

                updateActiveNodes();
                redraw();
            }
        } catch(error) {
            if (error.code != "NODE_RED") {
                console.log(error.stack);
                RED.notify(RED._("notification.error",{message:error.toString()}),"error");
            } else {
                RED.notify(RED._("notification.error",{message:error.message}),"error");
            }
        }
    }

    function toggleShowGrid(state) {
        if (state) {
            grid.style("visibility","visible");
        } else {
            grid.style("visibility","hidden");
        }
    }
    function toggleSnapGrid(state) {
        snapGrid = state;
        redraw();
    }
    function toggleStatus(s) {
        showStatus = s;
        RED.nodes.eachNode(function(n) { n.dirty = true;});
        //TODO: subscribe/unsubscribe here
        redraw();
    }

    return {
        init: init,
        state:function(state) {
            if (state == null) {
                return mouse_mode
            } else {
                mouse_mode = state;
            }
        },

        redraw: function(updateActive) {
            if (updateActive) {
                updateActiveNodes();
                updateSelection();
            }
            redraw();
        },
        focus: focusView,
        importNodes: importNodes,
        calculateTextWidth: calculateTextWidth,
        select: function(selection) {
            if (typeof selection !== "undefined") {
                clearSelection();
                if (typeof selection == "string") {
                    var selectedNode = RED.nodes.node(selection);
                    if (selectedNode) {
                        selectedNode.selected = true;
                        selectedNode.dirty = true;
                        moving_set = [{n:selectedNode}];
                    }
                }
            }
            updateSelection();
            redraw();
        },
        selection: function() {
            var selection = {};
            if (moving_set.length > 0) {
                selection.nodes = moving_set.map(function(n) { return n.n;});
            }
            if (selected_link != null) {
                selection.link = selected_link;
            }
            return selection;
        },
        scale: function() {
            return scaleFactor;
        },
        getLinksAtPoint: function(x,y) {
            var result = [];
            var links = outer.selectAll(".link_background")[0];
            for (var i=0;i<links.length;i++) {
                var bb = links[i].getBBox();
                if (x >= bb.x && y >= bb.y && x <= bb.x+bb.width && y <= bb.y+bb.height) {
                    result.push(links[i])
                }
            }
            return result;
        },
        reveal: function(id) {
            if (RED.nodes.workspace(id) || RED.nodes.subflow(id)) {
                RED.workspaces.show(id);
            } else {
                var node = RED.nodes.node(id);
                if (node._def.category !== 'config' && node.z) {
                    node.highlighted = true;
                    node.dirty = true;
                    RED.workspaces.show(node.z);

                    var screenSize = [$("#chart").width(),$("#chart").height()];
                    var scrollPos = [$("#chart").scrollLeft(),$("#chart").scrollTop()];

                    if (node.x < scrollPos[0] || node.y < scrollPos[1] || node.x > screenSize[0]+scrollPos[0] || node.y > screenSize[1]+scrollPos[1]) {
                        var deltaX = '-='+((scrollPos[0] - node.x) + screenSize[0]/2);
                        var deltaY = '-='+((scrollPos[1] - node.y) + screenSize[1]/2);
                        $("#chart").animate({
                            scrollLeft: deltaX,
                            scrollTop: deltaY
                        },200);
                    }

                    if (!node._flashing) {
                        node._flashing = true;
                        var flash = 22;
                        var flashFunc = function() {
                            flash--;
                            node.dirty = true;
                            if (flash >= 0) {
                                node.highlighted = !node.highlighted;
                                setTimeout(flashFunc,100);
                            } else {
                                node.highlighted = false;
                                delete node._flashing;
                            }
                            RED.view.redraw();
                        }
                        flashFunc();
                    }
                } else if (node._def.category === 'config') {
                    RED.sidebar.config.show(id);
                }
            }
        },
        gridSize: function(v) {
            if (v === undefined) {
                return gridSize;
            } else {
                gridSize = v;
                updateGrid();
            }
        }

    };
})();
