export function getHandler(type) {
  switch (type) {
    case "breadcrumb":
      return breadcrumb;
    case "comma":
      return comma;
    case "email":
      return email;
    case "filepath":
      return filepath;
    case "formula":
      return formula;
    case "sql":
      return sql;
    case "underscore":
      return underscore;
    case "url":
      return url;
    case "word":
      return word;
    case "xpath":
      return xpath;
    default:
      return custom;
  }
}

export function isInputEventSupported(element) {
  var agent = window.navigator.userAgent;
  if (agent.indexOf("MSIE") >= 0 || agent.indexOf("Trident") >= 0 || agent.indexOf("Edge") >= 0) {
    return false;
  }
  var checked = document.createElement(element.tagName);
  checked.contentEditable = true;
  var isSupported = ("oninput" in checked);
  if (!isSupported) {
    checked.setAttribute('oninput', 'return;');
    isSupported = typeof checked['oninput'] == 'function';
  }
  checked = null;
  return isSupported;
}

export function attachElement(element, type, args, isRtl, locale) {
  //if (!element || element.nodeType != 1 || !element.isContentEditable)
  if (!element || element.nodeType != 1) {
    return false;
  }
  if (!event) {
    event = document.createEvent('Event');
    event.initEvent('TF', true, true);
  }
  element.setAttribute("data-tf-type", type);
  var sArgs = args === "undefined" ? "{}" : JSON.stringify(Array.isArray(args) ? args[0] : args);
  element.setAttribute("data-tf-args", sArgs);
  var dir = "ltr";
  if (isRtl === "undefined") {
    if (element.dir) {
      dir = element.dir;
    } else if (element.style && element.style.direction) {
      dir = element.style.direction;
    }
    isRtl = dir.toLowerCase() === "rtl";
  }
  element.setAttribute("data-tf-dir", isRtl);
  element.setAttribute("data-tf-locale", misc.getLocaleDetails(locale).lang);
  if (isInputEventSupported(element)) {
    var ehandler = element.oninput;
    element.oninput = function (event) {
      displayWithStructure(event.target);
    };
  } else {
    element.onkeyup = function (e) {
      displayWithStructure(e.target);
      element.dispatchEvent(event);
    };
    element.onmouseup = function (e) {
      displayWithStructure(e.target);
      element.dispatchEvent(event);
    };
  }
  displayWithStructure(element);

  return true;
}

export function detachElement(element) {
  if (!element || element.nodeType != 1) {
    return;
  }
  element.removeAttribute("data-tf-type");
  element.removeAttribute("data-tf-args");
  element.removeAttribute("data-tf-dir");
  element.removeAttribute("data-tf-locale");
  element.innerHTML = element.textContent || "";
}

export function displayWithStructure(element) {
  var txt = element.textContent || "";
  var selection = document.getSelection();
  if (txt.length === 0 || !selection || selection.rangeCount <= 0) {
    element.dispatchEvent(event);
    return;
  }

  var range = selection.getRangeAt(0);
  var tempRange = range.cloneRange(),
    startNode, startOffset;
  startNode = range.startContainer;
  startOffset = range.startOffset;
  var textOffset = 0;
  if (startNode.nodeType === 3) {
    textOffset += startOffset;
  }
  tempRange.setStart(element, 0);
  tempRange.setEndBefore(startNode);
  var div = document.createElement('div');
  div.appendChild(tempRange.cloneContents());
  textOffset += div.textContent.length;

  element.innerHTML = getHandler(element.getAttribute("data-tf-type")).
  format(txt, JSON.parse(element.getAttribute("data-tf-args")), (element.getAttribute("data-tf-dir") === "true" ? true : false),
    true, element.getAttribute("data-tf-locale"));
  var parent = element;
  var node = element;
  var newOffset = 0;
  var inEnd = false;
  selection.removeAllRanges();
  range.setStart(element, 0);
  range.setEnd(element, 0);
  while (node) {
    if (node.nodeType === 3) {
      if (newOffset + node.nodeValue.length >= textOffset) {
        range.setStart(node, textOffset - newOffset);
        break;
      } else {
        newOffset += node.nodeValue.length;
        node = node.nextSibling;
      }
    } else if (node.hasChildNodes()) {
      parent = node;
      node = parent.firstChild;
      continue;
    } else {
      node = node.nextSibling;
    }
    while (!node) {
      if (parent === element) {
        inEnd = true;
        break;
      }
      node = parent.nextSibling;
      parent = parent.parentNode;
    }
    if (inEnd) {
      break;
    }
  }

  selection.addRange(range);
  element.dispatchEvent(event);
}
