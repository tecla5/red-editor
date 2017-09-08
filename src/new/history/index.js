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

export class History {
    constructor(ctx) {
        this.ctx = ctx;
        this.undo_history = [];
        this.undoEvent = createUndoEvent(ctx).bind(this)
    }

    //TODO: this function is a placeholder until there is a 'save' event that can be listened to
    markAllDirty() {
        for (var i = 0; i < this.undo_history.length; i++) {
            this.undo_history[i].dirty = true;
        }
    }

    list() {
        return undo_history
    }

    depth() {
        return undo_history.length;
    }

    push(ev) {
        undo_history.push(ev);
    }

    pop() {
        var ev = undo_history.pop();
        this.undoEvent(ev);
    }

    peek() {
        return undo_history[undo_history.length - 1];
    }
}
