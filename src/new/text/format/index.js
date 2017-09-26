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

// TODO:
// must likely used more within each utility function than here or externally ;)
import {
    breadcrumb
}
from './breadcrumb'
import {
    comma
}
from './comma'
import {
    common
}
from './common'
import {
    custom
}
from './custom'
import {
    email
}
from './email'
import {
    filepath
}
from './filepath'
import {
    formula
}
from './formula'
import {
    message
}
from './message'
import {
    misc
}
from './misc'
import {
    sql
}
from './sql'
import {
    stext
}
from './stext'
import {
    underscore
}
from './underscore'
import {
    url
}
from './url'
import {
    word
}
from './word'
import {
    xpath
}
from './xpath'

export {
    TextFormat
}
from './text-format'

export const format = {
    breadcrumb,
    comma,
    common,
    custom,
    email,
    filepath,
    formula,
    message,
    misc,
    sql,
    stext,
    underscore,
    url,
    word,
    xpath
}

import {
    getHandler,
    attachElement
} from './_utils'

var event = null;

// FIX: used to be a return
export default {
    /**
     * Returns the HTML representation of a given structured text
     * @param text - the structured text
     * @param type - could be one of filepath, url, email
     * @param args - pass additional arguments to the handler. generally null.
     * @param isRtl - indicates if the GUI is mirrored
     * @param locale - the browser locale
     */
    getHtml: function (text, type, args, isRtl, locale) {
        return getHandler(type).format(text, args, isRtl, true, locale);
    },
    /**
     * Handle Structured text correct display for a given HTML element.
     * @param element - the element  : should be of type div contenteditable=true
     * @param type - could be one of filepath, url, email
     * @param args - pass additional arguments to the handler. generally null.
     * @param isRtl - indicates if the GUI is mirrored
     * @param locale - the browser locale
     */
    attach: function (element, type, args, isRtl, locale) {
        return attachElement(element, type, args, isRtl, locale);
    }
}
