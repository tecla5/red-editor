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
    createUndoEvent
} from './undo'

import {
    Context
} from '../context'

export class History extends Context {
    constructor(ctx) {
        super(ctx)
        this.undo_history = [];
        this.undoEvent = this.createUndoEvent(ctx).bind(this)
    }

    //TODO: this function is a placeholder until there is a 'save' event that can be listened to
    markAllDirty() {
        for (var i = 0; i < this.undo_history.length; i++) {
            this.undo_history[i].dirty = true;
        }
    }

    list() {
        return this.undo_history
    }

    depth() {
        return this.undo_history.length;
    }

    push(ev) {
        this.undo_history.push(ev);
    }

    pop() {
        var ev = this.undo_history.pop();
        this.undoEvent(ev);
    }

    peek() {
        let last = this.undo_history.length - 1
        return this.undo_history[last];
    }
}
