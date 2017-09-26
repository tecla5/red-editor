import {
  stext
}
from './stext'

export const comma = (function () {
  return {
    format: function (text, args, isRtl, isHtml, locale, parseOnly) {
      var fArgs = {
        guiDir: isRtl ? "rtl" : "ltr",
        dir: "ltr",
        points: ","
      };
      if (!parseOnly) {
        return stext.parseAndDisplayStructure(text, fArgs, !!isHtml, locale);
      } else {
        return stext.parseStructure(text, fArgs, !!isHtml, locale);
      }
    }
  };
})();
