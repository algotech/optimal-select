"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = match;

var _utilities = require("./utilities");

/**
 * # Match
 *
 * Retrieve selector for a node.
 */
var defaultIgnore = {
  attribute: function attribute(attributeName) {
    return ['style', 'data-reactid', 'data-react-checksum'].indexOf(attributeName) > -1;
  }
};
/**
 * Get the path of the element
 *
 * @param  {HTMLElement} node    - [description]
 * @param  {Object}      options - [description]
 * @return {string}              - [description]
 */

function match(node, options) {
  var _options$root = options.root,
      root = _options$root === void 0 ? document : _options$root,
      _options$skip = options.skip,
      skip = _options$skip === void 0 ? null : _options$skip,
      _options$priority = options.priority,
      priority = _options$priority === void 0 ? ['id', 'class', 'href', 'src'] : _options$priority,
      _options$ignore = options.ignore,
      ignore = _options$ignore === void 0 ? {} : _options$ignore;
  var path = [];
  var element = node;
  var length = path.length;
  var skipCompare = skip && (Array.isArray(skip) ? skip : [skip]).map(function (entry) {
    if (typeof entry !== 'function') {
      return function (element) {
        return element === entry;
      };
    }

    return entry;
  });

  var skipChecks = function skipChecks(element) {
    return skip && skipCompare.some(function (compare) {
      return compare(element);
    });
  };

  Object.keys(ignore).forEach(function (type) {
    var predicate = ignore[type];
    if (typeof predicate === 'function') return;

    if (typeof predicate === 'number') {
      predicate = predicate.toString();
    }

    if (typeof predicate === 'string') {
      predicate = new RegExp((0, _utilities.escapeValue)(predicate).replace(/\\/g, '\\\\'));
    }

    if (typeof predicate === 'boolean') {
      predicate = predicate ? /(?:)/ : /.^/;
    } // check class-/attributename for regex


    ignore[type] = function (name, value) {
      return predicate.test(value);
    };
  });
  var ignoreAttribute = ignore.attribute;

  ignore.attribute = function (name, value, defaultPredicate) {
    return ignoreAttribute && ignoreAttribute(name, value, defaultPredicate);
  };

  while (element !== root) {
    if (skipChecks(element) !== true) {
      // ~ global
      if (checkAttributes(priority, element, ignore, path, root)) break;
      if (checkTag(element, ignore, path, root)) break; // ~ local

      checkAttributes(priority, element, ignore, path);

      if (path.length === length) {
        checkTag(element, ignore, path);
      } // define only one part each iteration


      if (path.length === length) {
        checkChilds(priority, element, ignore, path);
      }
    }

    element = element.parentNode;
    length = path.length;
  }

  if (element === root) {
    var pattern = findPattern(priority, element, ignore);
    path.unshift(pattern);
  }

  return path.join(' ');
}
/**
 * Extend path with attribute identifier
 *
 * @param  {Array.<string>} priority - [description]
 * @param  {HTMLElement}    element  - [description]
 * @param  {Object}         ignore   - [description]
 * @param  {Array.<string>} path     - [description]
 * @param  {HTMLElement}    parent   - [description]
 * @return {boolean}                 - [description]
 */


function checkAttributes(priority, element, ignore, path) {
  var parent = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : element.parentNode;
  var pattern = findAttributesPattern(priority, element, ignore);

  if (pattern) {
    var matches = parent.querySelectorAll(pattern);

    if (matches.length === 1) {
      path.unshift(pattern);
      return true;
    }
  }

  return false;
}
/**
 * Lookup attribute identifier
 *
 * @param  {Array.<string>} priority - [description]
 * @param  {HTMLElement}    element  - [description]
 * @param  {Object}         ignore   - [description]
 * @return {string?}                 - [description]
 */


function findAttributesPattern(priority, element, ignore) {
  var attributes = element.attributes;
  var sortedKeys = Object.keys(attributes).sort(function (curr, next) {
    var currPos = priority.indexOf(attributes[curr].name);
    var nextPos = priority.indexOf(attributes[next].name);

    if (nextPos === -1) {
      if (currPos === -1) {
        return 0;
      }

      return -1;
    }

    return currPos - nextPos;
  });

  for (var i = 0, l = sortedKeys.length; i < l; i++) {
    var key = sortedKeys[i];
    var attribute = attributes[key];
    var attributeName = attribute.name;
    var attributeValue = (0, _utilities.escapeValue)(attribute.value);
    var currentIgnore = ignore[attributeName] || ignore.attribute;
    var currentDefaultIgnore = defaultIgnore[attributeName] || defaultIgnore.attribute;

    if (checkIgnore(currentIgnore, attributeName, attributeValue, currentDefaultIgnore)) {
      continue;
    }

    var pattern = "[".concat(attributeName, "=\"").concat(attributeValue, "\"]");

    if (/\b\d/.test(attributeValue) === false) {
      if (attributeName === 'id') {
        pattern = "#".concat(attributeValue);
      }

      if (attributeName === 'class') {
        var className = attributeValue.trim().replace(/\s+/g, '.');
        pattern = ".".concat(className);
      }
    }

    return pattern;
  }

  return null;
}
/**
 * Extend path with tag identifier
 *
 * @param  {HTMLElement}    element - [description]
 * @param  {Object}         ignore  - [description]
 * @param  {Array.<string>} path    - [description]
 * @param  {HTMLElement}    parent  - [description]
 * @return {boolean}                - [description]
 */


function checkTag(element, ignore, path) {
  var parent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : element.parentNode;
  var pattern = findTagPattern(element, ignore);

  if (pattern) {
    var matches = parent.getElementsByTagName(pattern);

    if (matches.length === 1) {
      path.unshift(pattern);
      return true;
    }
  }

  return false;
}
/**
 * Lookup tag identifier
 *
 * @param  {HTMLElement} element - [description]
 * @param  {Object}      ignore  - [description]
 * @return {boolean}             - [description]
 */


function findTagPattern(element, ignore) {
  var tagName = element.tagName.toLowerCase();

  if (checkIgnore(ignore.tag, null, tagName)) {
    return null;
  }

  return tagName;
}
/**
 * Extend path with specific child identifier
 *
 * NOTE: 'childTags' is a custom property to use as a view filter for tags using 'adapter.js'
 *
 * @param  {Array.<string>} priority - [description]
 * @param  {HTMLElement}    element  - [description]
 * @param  {Object}         ignore   - [description]
 * @param  {Array.<string>} path     - [description]
 * @return {boolean}                 - [description]
 */


function checkChilds(priority, element, ignore, path) {
  var parent = element.parentNode;
  var children = parent.childTags || parent.children;

  for (var i = 0, l = children.length; i < l; i++) {
    var child = children[i];

    if (child === element) {
      var childPattern = findPattern(priority, child, ignore);

      if (!childPattern) {
        return console.warn("\n          Element couldn't be matched through strict ignore pattern!\n        ", child, ignore, childPattern);
      }

      var pattern = "> ".concat(childPattern, ":nth-child(").concat(i + 1, ")");
      path.unshift(pattern);
      return true;
    }
  }

  return false;
}
/**
 * Lookup identifier
 *
 * @param  {Array.<string>} priority - [description]
 * @param  {HTMLElement}    element  - [description]
 * @param  {Object}         ignore   - [description]
 * @return {string}                  - [description]
 */


function findPattern(priority, element, ignore) {
  var pattern = findAttributesPattern(priority, element, ignore);

  if (!pattern) {
    pattern = findTagPattern(element, ignore);
  }

  return pattern;
}
/**
 * Validate with custom and default functions
 *
 * @param  {Function} predicate        - [description]
 * @param  {string?}  name             - [description]
 * @param  {string}   value            - [description]
 * @param  {Function} defaultPredicate - [description]
 * @return {boolean}                   - [description]
 */


function checkIgnore(predicate, name, value, defaultPredicate) {
  if (!value) {
    return true;
  }

  var check = predicate || defaultPredicate;

  if (!check) {
    return false;
  }

  return check(name, value, defaultPredicate);
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hdGNoLmpzIl0sIm5hbWVzIjpbImRlZmF1bHRJZ25vcmUiLCJhdHRyaWJ1dGUiLCJhdHRyaWJ1dGVOYW1lIiwiaW5kZXhPZiIsIm1hdGNoIiwibm9kZSIsIm9wdGlvbnMiLCJyb290IiwiZG9jdW1lbnQiLCJza2lwIiwicHJpb3JpdHkiLCJpZ25vcmUiLCJwYXRoIiwiZWxlbWVudCIsImxlbmd0aCIsInNraXBDb21wYXJlIiwiQXJyYXkiLCJpc0FycmF5IiwibWFwIiwiZW50cnkiLCJza2lwQ2hlY2tzIiwic29tZSIsImNvbXBhcmUiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsInR5cGUiLCJwcmVkaWNhdGUiLCJ0b1N0cmluZyIsIlJlZ0V4cCIsInJlcGxhY2UiLCJuYW1lIiwidmFsdWUiLCJ0ZXN0IiwiaWdub3JlQXR0cmlidXRlIiwiZGVmYXVsdFByZWRpY2F0ZSIsImNoZWNrQXR0cmlidXRlcyIsImNoZWNrVGFnIiwiY2hlY2tDaGlsZHMiLCJwYXJlbnROb2RlIiwicGF0dGVybiIsImZpbmRQYXR0ZXJuIiwidW5zaGlmdCIsImpvaW4iLCJwYXJlbnQiLCJmaW5kQXR0cmlidXRlc1BhdHRlcm4iLCJtYXRjaGVzIiwicXVlcnlTZWxlY3RvckFsbCIsImF0dHJpYnV0ZXMiLCJzb3J0ZWRLZXlzIiwic29ydCIsImN1cnIiLCJuZXh0IiwiY3VyclBvcyIsIm5leHRQb3MiLCJpIiwibCIsImtleSIsImF0dHJpYnV0ZVZhbHVlIiwiY3VycmVudElnbm9yZSIsImN1cnJlbnREZWZhdWx0SWdub3JlIiwiY2hlY2tJZ25vcmUiLCJjbGFzc05hbWUiLCJ0cmltIiwiZmluZFRhZ1BhdHRlcm4iLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsInRhZyIsImNoaWxkcmVuIiwiY2hpbGRUYWdzIiwiY2hpbGQiLCJjaGlsZFBhdHRlcm4iLCJjb25zb2xlIiwid2FybiIsImNoZWNrIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBTUE7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QU82QixPQUFQO0FBQ0Q7QUFFRDs7Ozs7Ozs7Ozs7QUFTQSxTQUFTcUIsV0FBVCxDQUFzQmxDLFNBQXRCLEVBQWlDSSxJQUFqQyxFQUF1Q0MsS0FBdkMsRUFBOENHLGdCQUE5QyxFQUFnRTtBQUM5RCxNQUFJLENBQUNILEtBQUwsRUFBWTtBQUNWLFdBQU8sSUFBUDtBQUNEOztBQUNELE1BQU0yQyxLQUFLLEdBQUdoRCxTQUFTLElBQUlRLGdCQUEzQjs7QUFDQSxNQUFJLENBQUN3QyxLQUFMLEVBQVk7QUFDVixXQUFPLEtBQVA7QUFDRDs7QUFDRCxTQUFPQSxLQUFLLENBQUM1QyxJQUFELEVBQU9DLEtBQVAsRUFBY0csZ0JBQWQsQ0FBWjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAjIE1hdGNoXG4gKlxuICogUmV0cmlldmUgc2VsZWN0b3IgZm9yIGEgbm9kZS5cbiAqL1xuXG5pbXBvcnQgeyBlc2NhcGVWYWx1ZSB9IGZyb20gJy4vdXRpbGl0aWVzJ1xuXG5jb25zdCBkZWZhdWx0SWdub3JlID0ge1xuICBhdHRyaWJ1dGUgKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJ3N0eWxlJyxcbiAgICAgICdkYXRhLXJlYWN0aWQnLFxuICAgICAgJ2RhdGEtcmVhY3QtY2hlY2tzdW0nXG4gICAgXS5pbmRleE9mKGF0dHJpYnV0ZU5hbWUpID4gLTFcbiAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgcGF0aCBvZiB0aGUgZWxlbWVudFxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBub2RlICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIG9wdGlvbnMgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbWF0Y2ggKG5vZGUsIG9wdGlvbnMpIHtcblxuICBjb25zdCB7XG4gICAgcm9vdCA9IGRvY3VtZW50LFxuICAgIHNraXAgPSBudWxsLFxuICAgIHByaW9yaXR5ID0gWydpZCcsICdjbGFzcycsICdocmVmJywgJ3NyYyddLFxuICAgIGlnbm9yZSA9IHt9XG4gIH0gPSBvcHRpb25zXG5cbiAgY29uc3QgcGF0aCA9IFtdXG4gIHZhciBlbGVtZW50ID0gbm9kZVxuICB2YXIgbGVuZ3RoID0gcGF0aC5sZW5ndGhcblxuICBjb25zdCBza2lwQ29tcGFyZSA9IHNraXAgJiYgKEFycmF5LmlzQXJyYXkoc2tpcCkgPyBza2lwIDogW3NraXBdKS5tYXAoKGVudHJ5KSA9PiB7XG4gICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIChlbGVtZW50KSA9PiBlbGVtZW50ID09PSBlbnRyeVxuICAgIH1cbiAgICByZXR1cm4gZW50cnlcbiAgfSlcblxuICBjb25zdCBza2lwQ2hlY2tzID0gKGVsZW1lbnQpID0+IHtcbiAgICByZXR1cm4gc2tpcCAmJiBza2lwQ29tcGFyZS5zb21lKChjb21wYXJlKSA9PiBjb21wYXJlKGVsZW1lbnQpKVxuICB9XG5cbiAgT2JqZWN0LmtleXMoaWdub3JlKS5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgdmFyIHByZWRpY2F0ZSA9IGlnbm9yZVt0eXBlXVxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnZnVuY3Rpb24nKSByZXR1cm5cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHByZWRpY2F0ZSA9IHByZWRpY2F0ZS50b1N0cmluZygpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgcHJlZGljYXRlID0gbmV3IFJlZ0V4cChlc2NhcGVWYWx1ZShwcmVkaWNhdGUpLnJlcGxhY2UoL1xcXFwvZywgJ1xcXFxcXFxcJykpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnYm9vbGVhbicpIHtcbiAgICAgIHByZWRpY2F0ZSA9IHByZWRpY2F0ZSA/IC8oPzopLyA6IC8uXi9cbiAgICB9XG4gICAgLy8gY2hlY2sgY2xhc3MtL2F0dHJpYnV0ZW5hbWUgZm9yIHJlZ2V4XG4gICAgaWdub3JlW3R5cGVdID0gKG5hbWUsIHZhbHVlKSA9PiBwcmVkaWNhdGUudGVzdCh2YWx1ZSlcbiAgfSlcblxuICB2YXIgaWdub3JlQXR0cmlidXRlID0gaWdub3JlLmF0dHJpYnV0ZTtcbiAgaWdub3JlLmF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSkge1xuICAgIHJldHVybiBpZ25vcmVBdHRyaWJ1dGUgJiYgaWdub3JlQXR0cmlidXRlKG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKTtcbiAgfTtcblxuICB3aGlsZSAoZWxlbWVudCAhPT0gcm9vdCkge1xuICAgIGlmIChza2lwQ2hlY2tzKGVsZW1lbnQpICE9PSB0cnVlKSB7XG4gICAgICAvLyB+IGdsb2JhbFxuICAgICAgaWYgKGNoZWNrQXR0cmlidXRlcyhwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBwYXRoLCByb290KSkgYnJlYWtcbiAgICAgIGlmIChjaGVja1RhZyhlbGVtZW50LCBpZ25vcmUsIHBhdGgsIHJvb3QpKSBicmVha1xuXG4gICAgICAvLyB+IGxvY2FsXG4gICAgICBjaGVja0F0dHJpYnV0ZXMocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgcGF0aClcbiAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgIGNoZWNrVGFnKGVsZW1lbnQsIGlnbm9yZSwgcGF0aClcbiAgICAgIH1cblxuICAgICAgLy8gZGVmaW5lIG9ubHkgb25lIHBhcnQgZWFjaCBpdGVyYXRpb25cbiAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgIGNoZWNrQ2hpbGRzKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIHBhdGgpXG4gICAgICB9XG4gICAgfVxuXG4gICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZVxuICAgIGxlbmd0aCA9IHBhdGgubGVuZ3RoXG4gIH1cblxuICBpZiAoZWxlbWVudCA9PT0gcm9vdCkge1xuICAgIGNvbnN0IHBhdHRlcm4gPSBmaW5kUGF0dGVybihwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlKVxuICAgIHBhdGgudW5zaGlmdChwYXR0ZXJuKVxuICB9XG5cbiAgcmV0dXJuIHBhdGguam9pbignICcpXG59XG5cbi8qKlxuICogRXh0ZW5kIHBhdGggd2l0aCBhdHRyaWJ1dGUgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwYXRoICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBwYXJlbnQgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tBdHRyaWJ1dGVzIChwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBwYXRoLCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgY29uc3QgcGF0dGVybiA9IGZpbmRBdHRyaWJ1dGVzUGF0dGVybihwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlKVxuICBpZiAocGF0dGVybikge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBMb29rdXAgYXR0cmlidXRlIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcHJpb3JpdHkgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgaWdub3JlICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmc/fSAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGZpbmRBdHRyaWJ1dGVzUGF0dGVybiAocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSkge1xuICBjb25zdCBhdHRyaWJ1dGVzID0gZWxlbWVudC5hdHRyaWJ1dGVzXG4gIGNvbnN0IHNvcnRlZEtleXMgPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5zb3J0KChjdXJyLCBuZXh0KSA9PiB7XG4gICAgY29uc3QgY3VyclBvcyA9IHByaW9yaXR5LmluZGV4T2YoYXR0cmlidXRlc1tjdXJyXS5uYW1lKVxuICAgIGNvbnN0IG5leHRQb3MgPSBwcmlvcml0eS5pbmRleE9mKGF0dHJpYnV0ZXNbbmV4dF0ubmFtZSlcbiAgICBpZiAobmV4dFBvcyA9PT0gLTEpIHtcbiAgICAgIGlmIChjdXJyUG9zID09PSAtMSkge1xuICAgICAgICByZXR1cm4gMFxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBjdXJyUG9zIC0gbmV4dFBvc1xuICB9KVxuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gc29ydGVkS2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBrZXkgPSBzb3J0ZWRLZXlzW2ldXG4gICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1trZXldXG4gICAgY29uc3QgYXR0cmlidXRlTmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgY29uc3QgYXR0cmlidXRlVmFsdWUgPSBlc2NhcGVWYWx1ZShhdHRyaWJ1dGUudmFsdWUpXG5cbiAgICBjb25zdCBjdXJyZW50SWdub3JlID0gaWdub3JlW2F0dHJpYnV0ZU5hbWVdIHx8IGlnbm9yZS5hdHRyaWJ1dGVcbiAgICBjb25zdCBjdXJyZW50RGVmYXVsdElnbm9yZSA9IGRlZmF1bHRJZ25vcmVbYXR0cmlidXRlTmFtZV0gfHwgZGVmYXVsdElnbm9yZS5hdHRyaWJ1dGVcbiAgICBpZiAoY2hlY2tJZ25vcmUoY3VycmVudElnbm9yZSwgYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWUsIGN1cnJlbnREZWZhdWx0SWdub3JlKSkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICB2YXIgcGF0dGVybiA9IGBbJHthdHRyaWJ1dGVOYW1lfT1cIiR7YXR0cmlidXRlVmFsdWV9XCJdYFxuXG4gICAgaWYgKCgvXFxiXFxkLykudGVzdChhdHRyaWJ1dGVWYWx1ZSkgPT09IGZhbHNlKSB7XG4gICAgICBpZiAoYXR0cmlidXRlTmFtZSA9PT0gJ2lkJykge1xuICAgICAgICBwYXR0ZXJuID0gYCMke2F0dHJpYnV0ZVZhbHVlfWBcbiAgICAgIH1cblxuICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUgPT09ICdjbGFzcycpIHtcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gYXR0cmlidXRlVmFsdWUudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJy4nKVxuICAgICAgICBwYXR0ZXJuID0gYC4ke2NsYXNzTmFtZX1gXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdHRlcm5cbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG4vKipcbiAqIEV4dGVuZCBwYXRoIHdpdGggdGFnIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgcGFyZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja1RhZyAoZWxlbWVudCwgaWdub3JlLCBwYXRoLCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgY29uc3QgcGF0dGVybiA9IGZpbmRUYWdQYXR0ZXJuKGVsZW1lbnQsIGlnbm9yZSlcbiAgaWYgKHBhdHRlcm4pIHtcbiAgICBjb25zdCBtYXRjaGVzID0gcGFyZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHBhdHRlcm4pXG4gICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICBwYXRoLnVuc2hpZnQocGF0dGVybilcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIExvb2t1cCB0YWcgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gZmluZFRhZ1BhdHRlcm4gKGVsZW1lbnQsIGlnbm9yZSkge1xuICBjb25zdCB0YWdOYW1lID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS50YWcsIG51bGwsIHRhZ05hbWUpKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICByZXR1cm4gdGFnTmFtZVxufVxuXG4vKipcbiAqIEV4dGVuZCBwYXRoIHdpdGggc3BlY2lmaWMgY2hpbGQgaWRlbnRpZmllclxuICpcbiAqIE5PVEU6ICdjaGlsZFRhZ3MnIGlzIGEgY3VzdG9tIHByb3BlcnR5IHRvIHVzZSBhcyBhIHZpZXcgZmlsdGVyIGZvciB0YWdzIHVzaW5nICdhZGFwdGVyLmpzJ1xuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwYXRoICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDaGlsZHMgKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIHBhdGgpIHtcbiAgY29uc3QgcGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlXG4gIGNvbnN0IGNoaWxkcmVuID0gcGFyZW50LmNoaWxkVGFncyB8fCBwYXJlbnQuY2hpbGRyZW5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgaWYgKGNoaWxkID09PSBlbGVtZW50KSB7XG4gICAgICBjb25zdCBjaGlsZFBhdHRlcm4gPSBmaW5kUGF0dGVybihwcmlvcml0eSwgY2hpbGQsIGlnbm9yZSlcbiAgICAgIGlmICghY2hpbGRQYXR0ZXJuKSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oYFxuICAgICAgICAgIEVsZW1lbnQgY291bGRuXFwndCBiZSBtYXRjaGVkIHRocm91Z2ggc3RyaWN0IGlnbm9yZSBwYXR0ZXJuIVxuICAgICAgICBgLCBjaGlsZCwgaWdub3JlLCBjaGlsZFBhdHRlcm4pXG4gICAgICB9XG4gICAgICBjb25zdCBwYXR0ZXJuID0gYD4gJHtjaGlsZFBhdHRlcm59Om50aC1jaGlsZCgke2krMX0pYFxuICAgICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBMb29rdXAgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gZmluZFBhdHRlcm4gKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUpIHtcbiAgdmFyIHBhdHRlcm4gPSBmaW5kQXR0cmlidXRlc1BhdHRlcm4ocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSlcbiAgaWYgKCFwYXR0ZXJuKSB7XG4gICAgcGF0dGVybiA9IGZpbmRUYWdQYXR0ZXJuKGVsZW1lbnQsIGlnbm9yZSlcbiAgfVxuICByZXR1cm4gcGF0dGVyblxufVxuXG4vKipcbiAqIFZhbGlkYXRlIHdpdGggY3VzdG9tIGFuZCBkZWZhdWx0IGZ1bmN0aW9uc1xuICpcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBwcmVkaWNhdGUgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7c3RyaW5nP30gIG5hbWUgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgdmFsdWUgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBkZWZhdWx0UHJlZGljYXRlIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrSWdub3JlIChwcmVkaWNhdGUsIG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKSB7XG4gIGlmICghdmFsdWUpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIGNvbnN0IGNoZWNrID0gcHJlZGljYXRlIHx8IGRlZmF1bHRQcmVkaWNhdGVcbiAgaWYgKCFjaGVjaykge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiBjaGVjayhuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSlcbn1cbiJdLCJmaWxlIjoibWF0Y2guanMifQ==
