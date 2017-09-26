import {
  tools
} from './tools'

class Common {
  handle(content, segments, args, locale) {
    var cases = [];
    if (Array.isArray(args.cases)) {
      cases = args.cases;
    }
    var points = [];
    if (typeof (args.points) !== "undefined") {
      if (Array.isArray(args.points)) {
        points = args.points;
      } else if (typeof (args.points) === "string") {
        points = args.points.split("");
      }
    }
    var subs = {};
    if (typeof (args.subs) === "object") {
      subs = args.subs;
    }
    var aBounds = [];
    if (Array.isArray(args.bounds)) {
      aBounds = args.bounds;
    }

    tools.handleBounds(segments, args, aBounds, content, locale);
    tools.handleSubcontents(segments, args, subs, content, locale);
    tools.handleCases(segments, args, cases, content, locale);
    tools.handlePoints(segments, args, points, content, locale);
    return segments;
  }
}

export const common = new Common()
