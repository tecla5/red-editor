// NOTE: this is likely a factory function
export function registry() {
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
}

export class NodesRegistry extends Context {
  constructor(ctx) {
    super(ctx)
  }

  setModulePendingUpdated(module, version) {
    this.moduleList[module].pending_version = version;
    RED.events.emit("registry:module-updated", {
      module: module,
      version: version
    });
  }

  getModule(module) {
    return this.moduleList[module];
  }

  getNodeSetForType(nodeType) {
    return exports.getNodeSet(this.typeToId[nodeType]);
  }

  getModuleList() {
    return this.moduleList;
  }

  getNodeList() {
    return this.nodeList;
  }

  getNodeTypes() {
    return Object.keys(this.nodeDefinitions);
  }

  setNodeList(list) {
    this.nodeList = [];
    for (var i = 0; i < list.length; i++) {
      var ns = list[i];
      exports.addNodeSet(ns);
    }
  }

  addNodeSet(ns) {
    ns.added = false;
    this.nodeSets[ns.id] = ns;
    for (var j = 0; j < ns.types.length; j++) {
      this.typeToId[ns.types[j]] = ns.id;
    }
    this.nodeList.push(ns);

    this.moduleList[ns.module] = this.moduleList[ns.module] || {
      name: ns.module,
      version: ns.version,
      local: ns.local,
      sets: {}
    };
    if (ns.pending_version) {
      this.moduleList[ns.module].pending_version = ns.pending_version;
    }
    this.moduleList[ns.module].sets[ns.name] = ns;
    RED.events.emit("registry:node-set-added", ns);
  }

  removeNodeSet(id) {
    var ns = this.nodeSets[id];
    for (var j = 0; j < ns.types.length; j++) {
      delete this.typeToId[ns.types[j]];
    }
    delete this.nodeSets[id];
    for (var i = 0; i < this.nodeList.length; i++) {
      if (this.nodeList[i].id === id) {
        this.nodeList.splice(i, 1);
        break;
      }
    }
    delete this.moduleList[ns.module].sets[ns.name];
    if (Object.keys(this.moduleList[ns.module].sets).length === 0) {
      delete this.moduleList[ns.module];
    }
    RED.events.emit("registry:node-set-removed", ns);
    return ns;
  }

  getNodeSet(id) {
    return this.nodeSets[id];
  }

  enableNodeSet(id) {
    var ns = this.nodeSets[id];
    ns.enabled = true;
    RED.events.emit("registry:node-set-enabled", ns);
  }

  disableNodeSet(id) {
    var ns = this.nodeSets[id];
    ns.enabled = false;
    RED.events.emit("registry:node-set-disabled", ns);
  }

  registerNodeType(nt, def) {
    this.nodeDefinitions[nt] = def;
    def.type = nt;
    if (def.category != "subflows") {
      def.set = this.nodeSets[typeToId[nt]];
      this.nodeSets[typeToId[nt]].added = true;
      this.nodeSets[typeToId[nt]].enabled = true;

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
  }

  removeNodeType(nt) {
    if (nt.substring(0, 8) != "subflow:") {
      // NON-NLS - internal debug message
      throw new Error("this api is subflow only. called with:", nt);
    }
    delete this.nodeDefinitions[nt];
    RED.events.emit("registry:node-type-removed", nt);
  }

  getNodeType(nt) {
    return this.nodeDefinitions[nt];
  }
}
