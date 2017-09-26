import {
  stext
}
from './stext'

class Message {
  constructor() {
    this.params = {
      msgLang: "en",
      msgDir: "",
      phLang: "",
      phDir: "",
      phPacking: ["{", "}"],
      phStt: {
        type: "none",
        args: {}
      },
      guiDir: ""
    };
    this.parametersChecked = false;
  }

  getDirectionOfLanguage(lang) {
    if (lang === "he" || lang === "iw" || lang === "ar") {
      return "rtl";
    }
    return "ltr";
  }

  checkParameters(obj) {
    if (obj.msgDir.length === 0) {
      obj.msgDir = getDirectionOfLanguage(obj.msgLang);
    }
    obj.msgDir = obj.msgDir !== "ltr" && obj.msgDir !== "rtl" && obj.msgDir != "auto" ? "ltr" : obj.msgDir;
    if (obj.guiDir.length === 0) {
      obj.guiDir = obj.msgDir;
    }
    obj.guiDir = obj.guiDir !== "rtl" ? "ltr" : "rtl";
    if (obj.phDir.length === 0) {
      obj.phDir = obj.phLang.length === 0 ? obj.msgDir : getDirectionOfLanguage(obj.phLang);
    }
    obj.phDir = obj.phDir !== "ltr" && obj.phDir !== "rtl" && obj.phDir != "auto" ? "ltr" : obj.phDir;
    if (typeof (obj.phPacking) === "string") {
      obj.phPacking = obj.phPacking.split("");
    }
    if (obj.phPacking.length < 2) {
      obj.phPacking = ["{", "}"];
    }
  }

  setDefaults(args) {
    var {
      params,
      parametersChecked
    } = this

    for (var prop in args) {
      if (params.hasOwnProperty(prop)) {
        params[prop] = args[prop];
      }
    }
    checkParameters(params);
    parametersChecked = true;
  }

  format(text) {
    var {
      params,
      parametersChecked
    } = this

    if (!parametersChecked) {
      checkParameters(params);
      parametersChecked = true;
    }
    var isHtml = false;
    var hasHtmlArg = false;
    var spLength = params.phPacking[0].length;
    var epLength = params.phPacking[1].length;
    if (arguments.length > 0) {
      var last = arguments[arguments.length - 1];
      if (typeof (last) === "boolean") {
        isHtml = last;
        hasHtmlArg = true;
      }
    }
    //Message
    var re = new RegExp(params.phPacking[0] + "\\d+" + params.phPacking[1]);
    var m;
    var tSegments = [];
    var offset = 0;
    var txt = text;
    while ((m = re.exec(txt)) != null) {
      var lastIndex = txt.indexOf(m[0]) + m[0].length;
      if (lastIndex > m[0].length) {
        tSegments.push({
          text: txt.substring(0, lastIndex - m[0].length),
          ph: false
        });
      }
      tSegments.push({
        text: m[0],
        ph: true
      });
      offset += lastIndex;
      txt = txt.substring(lastIndex, txt.length);
    }
    if (offset < text.length) {
      tSegments.push({
        text: text.substring(offset, text.length),
        ph: false
      });
    }
    //Parameters
    var tArgs = [];
    for (var i = 1; i < arguments.length - (hasHtmlArg ? 1 : 0); i++) {
      var arg = arguments[i];
      var checkArr = arg;
      var inLoop = false;
      var indArr = 0;
      if (Array.isArray(checkArr)) {
        arg = checkArr[0];
        if (typeof (arg) === "undefined") {
          continue;
        }
        inLoop = true;
      }
      do {
        if (typeof (arg) === "string") {
          tArgs.push({
            text: arg,
            dir: params.phDir,
            stt: params.stt
          });
        } else if (typeof (arg) === "boolean") {
          isHtml = arg;
        } else if (typeof (arg) === "object") {
          tArgs.push(arg);
          if (!arg.hasOwnProperty("text")) {
            tArgs[tArgs.length - 1].text = "{???}";
          }
          if (!arg.hasOwnProperty("dir") || arg.dir.length === 0) {
            tArgs[tArgs.length - 1].dir = params.phDir;
          }
          if (!arg.hasOwnProperty("stt") || (typeof (arg.stt) === "string" && arg.stt.length === 0) ||
            (typeof (arg.stt) === "object" && Object.keys(arg.stt).length === 0)) {
            tArgs[tArgs.length - 1].stt = params.phStt;
          }
        } else {
          tArgs.push({
            text: "" + arg,
            dir: params.phDir,
            stt: params.phStt
          });
        }
        if (inLoop) {
          indArr++;
          if (indArr == checkArr.length) {
            inLoop = false;
          } else {
            arg = checkArr[indArr];
          }
        }
      } while (inLoop);
    }
    //Indexing
    var segments = [];
    for (i = 0; i < tSegments.length; i++) {
      var t = tSegments[i];
      if (!t.ph) {
        segments.push(new TextSegment({
          content: t.text,
          textDirection: params.msgDir
        }));
      } else {
        var ind = parseInt(t.text.substring(spLength, t.text.length - epLength));
        if (isNaN(ind) || ind >= tArgs.length) {
          segments.push(new TextSegment({
            content: t.text,
            textDirection: params.msgDir
          }));
          continue;
        }
        var sttType = "none";
        if (!tArgs[ind].stt) {
          tArgs[ind].stt = params.phStt;
        }
        if (tArgs[ind].stt) {
          if (typeof (tArgs[ind].stt) === "string") {
            sttType = tArgs[ind].stt;
          } else if (tArgs[ind].stt.hasOwnProperty("type")) {
            sttType = tArgs[ind].stt.type;
          }
        }
        if (sttType.toLowerCase() !== "none") {
          var sttSegs = getHandler(sttType).format(tArgs[ind].text, tArgs[ind].stt.args || {},
            params.msgDir === "rtl", false, params.msgLang, true);
          for (var j = 0; j < sttSegs.length; j++) {
            segments.push(sttSegs[j]);
          }
          segments.push(new TextSegment({
            isVisible: false
          }));
        } else {
          segments.push(new TextSegment({
            content: tArgs[ind].text,
            textDirection: (tArgs[ind].dir ? tArgs[ind].dir : params.phDir)
          }));
        }
      }
    }
    var result = stext.displayStructure(segments, {
      guiDir: params.guiDir,
      dir: params.msgDir
    }, isHtml);
    return result;
  }
}

export const message = new Message()
