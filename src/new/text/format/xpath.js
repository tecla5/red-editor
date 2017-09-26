class XPath {
  format(text, args, isRtl, isHtml, locale, parseOnly) {
    var fArgs = {
      guiDir: isRtl ? "rtl" : "ltr",
      dir: "ltr",
      points: " /[]<>=!:@.|()+-*",
      cases: [{
        handler: common,
        args: {
          bounds: [{
              startAfter: "\"",
              endBefore: "\""
            },
            {
              startAfter: "'",
              endBefore: "'"
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

export const xpath = new XPath()
