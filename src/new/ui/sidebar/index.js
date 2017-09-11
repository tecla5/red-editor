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

export {
    SidebarTabConfig
}
from './tab-config'
export {
    SidebarTabInfo
}
from './tab-info'

export class Sidebar extends Context {
    constructor(ctx) {
        super(ctx)

        this.sidebarSeparator = {};
        this.knownTabs = {};
        //$('#sidebar').tabs();
        this.sidebar_tabs = ctx.tabs.create({
            id: "sidebar-tabs",
            onchange: (tab) => {
                $("#sidebar-content").children().hide();
                $("#sidebar-footer").children().hide();
                if (tab.onchange) {
                    tab.onchange.call(tab);
                }
                $(tab.wrapper).show();
                if (tab.toolbar) {
                    $(tab.toolbar).show();
                }
            },
            onremove: (tab) => {
                $(tab.wrapper).hide();
                if (tab.onremove) {
                    tab.onremove.call(tab);
                }
            },
            minimumActiveTabWidth: 110
        });

        $("#sidebar-separator").draggable({
            axis: "x",
            start: (event, ui) => {
                sidebarSeparator.closing = false;
                sidebarSeparator.opening = false;
                var winWidth = $(window).width();
                sidebarSeparator.start = ui.position.left;
                sidebarSeparator.chartWidth = $("#workspace").width();
                sidebarSeparator.chartRight = winWidth - $("#workspace").width() - $("#workspace").offset().left - 2;

                if (!ctx.menu.isSelected("menu-item-sidebar")) {
                    sidebarSeparator.opening = true;
                    var newChartRight = 7;
                    $("#sidebar").addClass("closing");
                    $("#workspace").css("right", newChartRight);
                    $("#editor-stack").css("right", newChartRight + 1);
                    $("#sidebar").width(0);
                    ctx.menu.setSelected("menu-item-sidebar", true);
                    ctx.events.emit("sidebar:resize");
                }
                sidebarSeparator.width = $("#sidebar").width();
            },
            drag: (event, ui) => {
                var d = ui.position.left - sidebarSeparator.start;
                var newSidebarWidth = sidebarSeparator.width - d;
                if (sidebarSeparator.opening) {
                    newSidebarWidth -= 3;
                }

                if (newSidebarWidth > 150) {
                    if (sidebarSeparator.chartWidth + d < 200) {
                        ui.position.left = 200 + sidebarSeparator.start - sidebarSeparator.chartWidth;
                        d = ui.position.left - sidebarSeparator.start;
                        newSidebarWidth = sidebarSeparator.width - d;
                    }
                }

                if (newSidebarWidth < 150) {
                    if (!sidebarSeparator.closing) {
                        $("#sidebar").addClass("closing");
                        sidebarSeparator.closing = true;
                    }
                    if (!sidebarSeparator.opening) {
                        newSidebarWidth = 150;
                        ui.position.left = sidebarSeparator.width - (150 - sidebarSeparator.start);
                        d = ui.position.left - sidebarSeparator.start;
                    }
                } else if (newSidebarWidth > 150 && (sidebarSeparator.closing || sidebarSeparator.opening)) {
                    sidebarSeparator.closing = false;
                    $("#sidebar").removeClass("closing");
                }

                var newChartRight = sidebarSeparator.chartRight - d;
                $("#workspace").css("right", newChartRight);
                $("#editor-stack").css("right", newChartRight + 1);
                $("#sidebar").width(newSidebarWidth);

                this.sidebar_tabs.resize();
                ctx.events.emit("sidebar:resize");
            },
            stop: (event, ui) => {
                if (sidebarSeparator.closing) {
                    $("#sidebar").removeClass("closing");
                    ctx.menu.setSelected("menu-item-sidebar", false);
                    if ($("#sidebar").width() < 180) {
                        $("#sidebar").width(180);
                        $("#workspace").css("right", 187);
                        $("#editor-stack").css("right", 188);
                    }
                }
                $("#sidebar-separator").css("left", "auto");
                $("#sidebar-separator").css("right", ($("#sidebar").width() + 2) + "px");
                ctx.events.emit("sidebar:resize");
            }
        });

        ctx.actions.add("core:toggle-sidebar", (state) => {
            if (state === undefined) {
                ctx.menu.toggleSelected("menu-item-sidebar");
            } else {
                toggleSidebar(state);
            }
        });
        this.showSidebar();
        ctx.sidebar.info = new SidebarTabInfo(ctx);
        ctx.sidebar.config = new SidebarTabConfig(ctx);
        // hide info bar at start if screen rather narrow...
        if ($(window).width() < 600) {
            ctx.menu.setSelected("menu-item-sidebar", false);
        }

    }

    addTab(title, content, closeable, visible) {
        let sidebar_tabs = this.sidebar_tabs
        let knownTabs = this.knownTabs
        let ctx = this.ctx

        var options;
        if (typeof title === "string") {
            // TODO: legacy support in case anyone uses this...
            options = {
                id: content.id,
                label: title,
                name: title,
                content: content,
                closeable: closeable,
                visible: visible
            }
        } else if (typeof title === "object") {
            options = title;
        }

        options.wrapper = $('<div>', {
            style: "height:100%"
        }).appendTo("#sidebar-content")
        options.wrapper.append(options.content);
        options.wrapper.hide();

        if (!options.enableOnEdit) {
            options.shade = $('<div>', {
                class: "sidebar-shade hide"
            }).appendTo(options.wrapper);
        }

        if (options.toolbar) {
            $("#sidebar-footer").append(options.toolbar);
            $(options.toolbar).hide();
        }
        var id = options.id;

        ctx.menu.addItem("menu-item-view-menu", {
            id: "menu-item-view-menu-" + options.id,
            label: options.name,
            onselect: () => {
                this.showSidebar(options.id);
            },
            group: "sidebar-tabs"
        });

        knownTabs[options.id] = options;

        if (options.visible !== false) {
            sidebar_tabs.addTab(knownTabs[options.id]);
        }
    }

    removeTab(id) {
        let ctx = this.ctx
        let sidebar_tabs = this.sidebar_tabs
        let knownTabs = this.knownTabs

        sidebar_tabs.removeTab(id);
        $(knownTabs[id].wrapper).remove();
        if (knownTabs[id].footer) {
            knownTabs[id].footer.remove();
        }
        delete knownTabs[id];
        ctx.menu.removeItem("menu-item-view-menu-" + id);
    }

    toggleSidebar(state) {
        let sidebar_tabs = this.sidebar_tabs
        let ctx = this.ctx

        if (!state) {
            $("#main-container").addClass("sidebar-closed");
        } else {
            $("#main-container").removeClass("sidebar-closed");
            sidebar_tabs.resize();
        }
        ctx.events.emit("sidebar:resize");
    }

    showSidebar(id) {
        let sidebar_tabs = this.sidebar_tabs
        let ctx = this.ctx
        if (id) {
            if (!containsTab(id)) {
                sidebar_tabs.addTab(knownTabs[id]);
            }
            sidebar_tabs.activateTab(id);
            if (!ctx.menu.isSelected("menu-item-sidebar")) {
                ctx.menu.setSelected("menu-item-sidebar", true);
            }
        }
    }

    containsTab(id) {
        let sidebar_tabs = this.sidebar_tabs
        return sidebar_tabs.contains(id);
    }
}
