import {
  stext
}
from './stext'

class Sql {
  format(text, args, isRtl, isHtml, locale, parseOnly) {
    var fArgs = {
      guiDir: isRtl ? "rtl" : "ltr",
      dir: "ltr",
      points: "\t!#%&()*+,-./:;<=>?|[]{}",
      cases: [{
          handler: common,
          args: {
            bounds: [{
                startAfter: "/*",
                endBefore: "*/"
              },
              {
                startAfter: "--",
                end: "\n"
              },
              {
                startAfter: "--"
              }
            ]
          }
        },
        {
          handler: common,
          args: {
            subs: {
              content: " ",
              continued: true
            }
          }
        },
        {
          handler: common,
          args: {
            bounds: [{
                startAfter: "'",
                endBefore: "'"
              },
              {
                startAfter: "\"",
                endBefore: "\""
              }
            ]
          }
        }
      ]
    };
    if (!parseOnly) {
      return stext.parseAndDisplayStructure(text, fArgs, !!isHtml, locale);
    } else {
      return stext.parseStructure(text, fArgs, !!isHtml, locale);
    }
  }
}

export const sql = new Sql()
