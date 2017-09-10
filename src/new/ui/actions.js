import {
    Context
} from '../context'

export class Actions extends Context {
    constructor(ctx) {
        super(ctx)
        this.actions = {}
    }

    addAction(name, handler) {
        actions[name] = handler;
    }

    removeAction(name) {
        delete actions[name];
    }

    getAction(name) {
        return actions[name];
    }

    invokeAction(name) {
        if (actions.hasOwnProperty(name)) {
            actions[name]();
        }
    }

    listActions() {
        var RED = this.ctx;

        var result = [];
        Object.keys(actions).forEach(function (action) {
            var shortcut = RED.keyboard.getShortcut(action);
            result.push({
                id: action,
                scope: shortcut ? shortcut.scope : undefined,
                key: shortcut ? shortcut.key : undefined,
                user: shortcut ? shortcut.user : undefined
            })
        })
        return result;
    }
}
