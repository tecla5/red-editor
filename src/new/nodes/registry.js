export const registry = (function () {
  var moduleList = {};
  var nodeList = [];
  var nodeSets = {};
  var typeToId = {};
  var nodeDefinitions = {};

  nodeDefinitions['tab'] = {
    defaults: {
      label: {
        value: ""
      },
      disabled: {
        value: false
      },
      info: {
        value: ""
      }
    }
  };


  var exports = {
    setModulePendingUpdated: function (module, version) {
      moduleList[module].pending_version = version;
      RED.events.emit("registry:module-updated", {
        module: module,
        version: version
      });
    },
    getModule: function (module) {
      return moduleList[module];
    },
    getNodeSetForType: function (nodeType) {
      return exports.getNodeSet(typeToId[nodeType]);
    },
    getModuleList: function () {
      return moduleList;
    },
    getNodeList: function () {
      return nodeList;
    },
    getNodeTypes: function () {
      return Object.keys(nodeDefinitions);
    },
    setNodeList: function (list) {
      nodeList = [];
      for (var i = 0; i < list.length; i++) {
        var ns = list[i];
        exports.addNodeSet(ns);
      }
    },
    addNodeSet: function (ns) {
      ns.added = false;
      nodeSets[ns.id] = ns;
      for (var j = 0; j < ns.types.length; j++) {
        typeToId[ns.types[j]] = ns.id;
      }
      nodeList.push(ns);

      moduleList[ns.module] = moduleList[ns.module] || {
        name: ns.module,
        version: ns.version,
        local: ns.local,
        sets: {}
      };
      if (ns.pending_version) {
        moduleList[ns.module].pending_version = ns.pending_version;
      }
      moduleList[ns.module].sets[ns.name] = ns;
      RED.events.emit("registry:node-set-added", ns);
    },
    removeNodeSet: function (id) {
      var ns = nodeSets[id];
      for (var j = 0; j < ns.types.length; j++) {
        delete typeToId[ns.types[j]];
      }
      delete nodeSets[id];
      for (var i = 0; i < nodeList.length; i++) {
        if (nodeList[i].id === id) {
          nodeList.splice(i, 1);
          break;
        }
      }
      delete moduleList[ns.module].sets[ns.name];
      if (Object.keys(moduleList[ns.module].sets).length === 0) {
        delete moduleList[ns.module];
      }
      RED.events.emit("registry:node-set-removed", ns);
      return ns;
    },
    getNodeSet: function (id) {
      return nodeSets[id];
    },
    enableNodeSet: function (id) {
      var ns = nodeSets[id];
      ns.enabled = true;
      RED.events.emit("registry:node-set-enabled", ns);
    },
    disableNodeSet: function (id) {
      var ns = nodeSets[id];
      ns.enabled = false;
      RED.events.emit("registry:node-set-disabled", ns);
    },
    registerNodeType: function (nt, def) {
      nodeDefinitions[nt] = def;
      def.type = nt;
      if (def.category != "subflows") {
        def.set = nodeSets[typeToId[nt]];
        nodeSets[typeToId[nt]].added = true;
        nodeSets[typeToId[nt]].enabled = true;

        var ns;
        if (def.set.module === "node-red") {
          ns = "node-red";
        } else {
          ns = def.set.id;
        }
        def["_"] = function () {
          var args = Array.prototype.slice.call(arguments, 0);
          var original = args[0];
          if (args[0].indexOf(":") === -1) {
            args[0] = ns + ":" + args[0];
          }
          var result = RED._.apply(null, args);
          if (result === args[0]) {
            result = original;
          }
          return result;
        }

        // TODO: too tightly coupled into palette UI
      }
      RED.events.emit("registry:node-type-added", nt);
    },
    removeNodeType: function (nt) {
      if (nt.substring(0, 8) != "subflow:") {
        // NON-NLS - internal debug message
        throw new Error("this api is subflow only. called with:", nt);
      }
      delete nodeDefinitions[nt];
      RED.events.emit("registry:node-type-removed", nt);
    },
    getNodeType: function (nt) {
      return nodeDefinitions[nt];
    }
  };
  return exports;
})();
