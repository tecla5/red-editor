export const misc = (function () {
  var isBidiLocale = function (locale) {
    var lang = !locale ? "" : locale.split("-")[0];
    if (!lang || lang.length < 2) {
      return false;
    }
    return ["iw", "he", "ar", "fa", "ur"].some(function (bidiLang) {
      return bidiLang === lang;
    });
  };
  var LRE = "\u202A";
  var RLE = "\u202B";
  var PDF = "\u202C";
  var LRM = "\u200E";
  var RLM = "\u200F";
  var LRO = "\u202D";
  var RLO = "\u202E";

  return {
    LRE: LRE,
    RLE: RLE,
    PDF: PDF,
    LRM: LRM,
    RLM: RLM,
    LRO: LRO,
    RLO: RLO,

    getLocaleDetails: function (locale) {
      if (!locale) {
        locale = typeof navigator === "undefined" ? "" :
          (navigator.language ||
            navigator.userLanguage ||
            "");
      }
      locale = locale.toLowerCase();
      if (isBidiLocale(locale)) {
        var full = locale.split("-");
        return {
          lang: full[0],
          country: full[1] ? full[1] : ""
        };
      }
      return {
        lang: "not-bidi"
      };
    },

    removeUcc: function (text) {
      if (text) {
        return text.replace(/[\u200E\u200F\u202A-\u202E]/g, "");
      }
      return text;
    },

    removeTags: function (text) {
      if (text) {
        return text.replace(/<[^<]*>/g, "");
      }
      return text;
    },

    getDirection: function (text, dir, guiDir, checkEnd) {
      if (dir !== "auto" && (/^(rtl|ltr)$/i).test(dir)) {
        return dir;
      }
      guiDir = (/^(rtl|ltr)$/i).test(guiDir) ? guiDir : "ltr";
      var txt = !checkEnd ? text : text.split("").reverse().join("");
      var fdc = /[A-Za-z\u05d0-\u065f\u066a-\u06ef\u06fa-\u07ff\ufb1d-\ufdff\ufe70-\ufefc]/.exec(txt);
      return fdc ? (fdc[0] <= "z" ? "ltr" : "rtl") : guiDir;
    },

    hasArabicChar: function (text) {
      var fdc = /[\u0600-\u065f\u066a-\u06ef\u06fa-\u07ff\ufb1d-\ufdff\ufe70-\ufefc]/.exec(text);
      return !!fdc;
    },

    showMarks: function (text, guiDir) {
      var result = "";
      for (var i = 0; i < text.length; i++) {
        var c = "" + text.charAt(i);
        switch (c) {
          case LRM:
            result += "<LRM>";
            break;
          case RLM:
            result += "<RLM>";
            break;
          case LRE:
            result += "<LRE>";
            break;
          case RLE:
            result += "<RLE>";
            break;
          case LRO:
            result += "<LRO>";
            break;
          case RLO:
            result += "<RLO>";
            break;
          case PDF:
            result += "<PDF>";
            break;
          default:
            result += c;
        }
      }
      var mark = typeof (guiDir) === "undefined" || !((/^(rtl|ltr)$/i).test(guiDir)) ? "" :
        guiDir === "rtl" ? RLO : LRO;
      return mark + result + (mark === "" ? "" : PDF);
    },

    hideMarks: function (text) {
      var txt = text.replace(/<LRM>/g, this.LRM).replace(/<RLM>/g, this.RLM).replace(/<LRE>/g, this.LRE);
      return txt.replace(/<RLE>/g, this.RLE).replace(/<LRO>/g, this.LRO).replace(/<RLO>/g, this.RLO).replace(/<PDF>/g, this.PDF);
    },

    showTags: function (text) {
      return "<xmp>" + text + "</xmp>";
    },

    hideTags: function (text) {
      return text.replace(/<xmp>/g, "").replace(/<\/xmp>/g, "");
    }
  };
})();
