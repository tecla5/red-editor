import {
  stext
}
from './stext'

class Breadcrumb {
  format(text, args, isRtl, isHtml, locale, parseOnly) {
    var fArgs = {
      guiDir: isRtl ? "rtl" : "ltr",
      dir: args.dir ? args.dir : isRtl ? "rtl" : "ltr",
      subs: {
        content: ">",
        continued: true,
        subDir: isRtl ? "rtl" : "ltr"
      },
      cases: [{
        args: {
          subs: {
            content: "<",
            continued: true,
            subDir: isRtl ? "ltr" : "rtl"
          }
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

export const breadcrumb = new Breadcrumb()
