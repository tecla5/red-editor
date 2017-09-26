import {
  common
}
from './stext'
import {
  misc
}
from './stext'

class SText {
  // args
  //   handler: main handler (default - dbidi/stt/handlers/common)
  //   guiDir: GUI direction (default - "ltr")
  //   dir: main stt direction (default - guiDir)
  //   subDir: direction of subsegments
  //   points: array of delimiters (default - [])
  //   bounds: array of definitions of bounds in which handler works
  //   subs: object defines special handling for some substring if found
  //   cases: array of additional modules with their args for handling special cases (default - [])
  parseAndDisplayStructure(content, fArgs, isHtml, locale) {
    if (!content || !fArgs) {
      return content;
    }
    return this.displayStructure(parseStructure(content, fArgs, locale), fArgs, isHtml);
  }

  checkArguments(fArgs, fullCheck) {
    var args = Array.isArray(fArgs) ? fArgs[0] : fArgs;
    if (!args.guiDir) {
      args.guiDir = "ltr";
    }
    if (!args.dir) {
      args.dir = args.guiDir;
    }
    if (!fullCheck) {
      return args;
    }
    if (typeof (args.points) === "undefined") {
      args.points = [];
    }
    if (!args.cases) {
      args.cases = [];
    }
    if (!args.bounds) {
      args.bounds = [];
    }
    args.commonHandler = common;
    return args;
  }

  parseStructure(content, fArgs, locale) {
    if (!content || !fArgs) {
      return new TextSegment({
        content: ""
      });
    }
    var args = this.checkArguments(fArgs, true);
    var segments = [new TextSegment({
      content: content,
      actual: content,
      localGui: args.dir
    })];
    var parse = common.handle;
    if (args.handler && typeof (args.handler) === "function") {
      parse = args.handler.handle;
    }
    parse(content, segments, args, locale);
    return segments;
  }

  displayStructure(segments, fArgs, isHtml) {
    var args = this.checkArguments(fArgs, false);
    if (isHtml) {
      return this.getResultWithHtml(segments, args);
    } else {
      return this.getResultWithUcc(segments, args);
    }
  }

  getResultWithUcc(segments, args, isHtml) {
    var result = "";
    var checkedDir = "";
    var prevDir = "";
    var stop = false;
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].isVisible) {
        var dir = segments[i].textDirection;
        var lDir = segments[i].localGui;
        if (lDir !== "" && prevDir === "") {
          result += (lDir === "rtl" ? misc.RLE : misc.LRE);
        } else if (prevDir !== "" && (lDir === "" || lDir !== prevDir || stop)) {
          result += misc.PDF + (i == segments.length - 1 && lDir !== "" ? "" : args.dir === "rtl" ? misc.RLM : misc.LRM);
          if (lDir !== "") {
            result += (lDir === "rtl" ? misc.RLE : misc.LRE);
          }
        }
        if (dir === "auto") {
          dir = misc.getDirection(segments[i].content, dir, args.guiDir);
        }
        if ((/^(rtl|ltr)$/i).test(dir)) {
          result += (dir === "rtl" ? misc.RLE : misc.LRE) + segments[i].content + misc.PDF;
          checkedDir = dir;
        } else {
          result += segments[i].content;
          checkedDir = misc.getDirection(segments[i].content, dir, args.guiDir, true);
        }
        if (i < segments.length - 1) {
          var locDir = lDir && segments[i + 1].localGui ? lDir : args.dir;
          result += locDir === "rtl" ? misc.RLM : misc.LRM;
        } else if (prevDir !== "") {
          result += misc.PDF;
        }
        prevDir = lDir;
        stop = false;
      } else {
        stop = true;
      }
    }
    var sttDir = args.dir === "auto" ? misc.getDirection(segments[0].actual, args.dir, args.guiDir) : args.dir;
    if (sttDir !== args.guiDir) {
      result = (sttDir === "rtl" ? misc.RLE : misc.LRE) + result + misc.PDF;
    }
    return result;
  }

  getResultWithHtml(segments, args, isHtml) {
    var result = "";
    var checkedDir = "";
    var prevDir = "";
    for (var i = 0; i < segments.length; i++) {
      if (segments[i].isVisible) {
        var dir = segments[i].textDirection;
        var lDir = segments[i].localGui;
        if (lDir !== "" && prevDir === "") {
          result += "<bdi dir='" + (lDir === "rtl" ? "rtl" : "ltr") + "'>";
        } else if (prevDir !== "" && (lDir === "" || lDir !== prevDir || stop)) {
          result += "</bdi>" + (i == segments.length - 1 && lDir !== "" ? "" : "<span style='unicode-bidi: embed; direction: " + (args.dir === "rtl" ? "rtl" : "ltr") + ";'></span>");
          if (lDir !== "") {
            result += "<bdi dir='" + (lDir === "rtl" ? "rtl" : "ltr") + "'>";
          }
        }

        if (dir === "auto") {
          dir = misc.getDirection(segments[i].content, dir, args.guiDir);
        }
        if ((/^(rtl|ltr)$/i).test(dir)) {
          //result += "<span style='unicode-bidi: embed; direction: " + (dir === "rtl" ? "rtl" : "ltr") + ";'>" + segments[i].content + "</span>";
          result += "<bdi dir='" + (dir === "rtl" ? "rtl" : "ltr") + "'>" + segments[i].content + "</bdi>";
          checkedDir = dir;
        } else {
          result += segments[i].content;
          checkedDir = misc.getDirection(segments[i].content, dir, args.guiDir, true);
        }
        if (i < segments.length - 1) {
          var locDir = lDir && segments[i + 1].localGui ? lDir : args.dir;
          result += "<span style='unicode-bidi: embed; direction: " + (locDir === "rtl" ? "rtl" : "ltr") + ";'></span>";
        } else if (prevDir !== "") {
          result += "</bdi>";
        }
        prevDir = lDir;
        stop = false;
      } else {
        stop = true;
      }
    }
    var sttDir = args.dir === "auto" ? misc.getDirection(segments[0].actual, args.dir, args.guiDir) : args.dir;
    if (sttDir !== args.guiDir) {
      result = "<bdi dir='" + (sttDir === "rtl" ? "rtl" : "ltr") + "'>" + result + "</bdi>";
    }
    return result;
  }

  //TBD ?
  restore(text, isHtml) {
    return text;
  }
}

export const stext = new SText()
