export const sql = (function () {
  return {
    format: function (text, args, isRtl, isHtml, locale, parseOnly) {
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
  };
})();
