import {
  stext
}
from './stext'

class Custom {
  format(text, args, isRtl, isHtml, locale, parseOnly) {
    var hArgs = {};
    var prop = "";
    var sArgs = Array.isArray(args) ? args[0] : args;
    for (prop in sArgs) {
      if (sArgs.hasOwnProperty(prop)) {
        hArgs[prop] = sArgs[prop];
      }
    }
    hArgs.guiDir = isRtl ? "rtl" : "ltr";
    hArgs.dir = hArgs.dir ? hArgs.dir : hArgs.guiDir;
    if (!parseOnly) {
      return stext.parseAndDisplayStructure(text, hArgs, !!isHtml, locale);
    } else {
      return stext.parseStructure(text, hArgs, !!isHtml, locale);
    }
  }
}

export const custom = new Custom()
