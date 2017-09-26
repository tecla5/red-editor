export class TextSegment {
  constructor(obj) {
    this.content = "";
    this.actual = "";
    this.textDirection = "";
    this.localGui = "";
    this.isVisible = true;
    this.isSeparator = false;
    this.isParsed = false;
    this.keep = false;
    this.inBounds = false;
    this.inPoints = false;
    var prop = "";
    for (prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        this[prop] = obj[prop];
      }
    }
  }
}

export const textSegment = new TextSegment()
