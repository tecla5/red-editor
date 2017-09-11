import {
    Context
} from '../context'

export class Actions extends Context {
    constructor(ctx) {
        super(ctx)
        this.actions = {}
    }

    addAction(name, handler) {
        this.actions[name] = handler;
    }

    removeAction(name) {
        delete this.actions[name];
    }

    getAction(name) {
        return this.actions[name];
    }

    invokeAction(name) {
        if (this.actions.hasOwnProperty(name)) {
            this.actions[name]();
        }
    }

    listActions() {
        var RED = this.ctx;

        var result = [];
        Object.keys(this.actions).forEach((action) => {
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
