class Underscore {
  format(text, args, isRtl, isHtml, locale, parseOnly) {
    var fArgs = {
      guiDir: isRtl ? "rtl" : "ltr",
      dir: "ltr",
      points: "_"
    };
    if (!parseOnly) {
      return stext.parseAndDisplayStructure(text, fArgs, !!isHtml, locale);
    } else {
      return stext.parseStructure(text, fArgs, !!isHtml, locale);
    }
  }
}

export const underscore = new Underscore()
