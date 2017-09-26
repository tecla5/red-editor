import {
  stext
}
from './stext'
import {
  misc
}
from './misc'

class Email {
  getDir(text, locale) {
    if (misc.getLocaleDetails(locale).lang !== "ar") {
      return "ltr";
    }
    var ind = text.indexOf("@");
    if (ind > 0 && ind < text.length - 1) {
      return misc.hasArabicChar(text.substring(ind + 1)) ? "rtl" : "ltr";
    }
    return "ltr";
  }


  format(text, args, isRtl, isHtml, locale, parseOnly) {
    var fArgs = {
      guiDir: isRtl ? "rtl" : "ltr",
      dir: getDir(text, locale),
      points: "<>.:,;@",
      cases: [{
        handler: common,
        args: {
          bounds: [{
              startAfter: "\"",
              endBefore: "\""
            },
            {
              startAfter: "(",
              endBefore: ")"
            }
          ],
          points: ""
        }
      }]
    };
    if (!parseOnly) {
      return stext.parseAndDisplayStructure(text, fArgs, !!isHtml, locale);
    } else {
      return stext.parseStructure(text, fArgs, !!isHtml, locale);
    }
  }
}

export const email = new Email()
