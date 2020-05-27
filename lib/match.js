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
      ignore = _options$ignore === void 0 ? {} : _options$ignore,
      _options$exclude = options.exclude,
      exclude = _options$exclude === void 0 ? {} : _options$exclude;
  console.log('match op', options, exclude.className && exclude.className('jss251 markdown-body'));
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hdGNoLmpzIl0sIm5hbWVzIjpbImRlZmF1bHRJZ25vcmUiLCJhdHRyaWJ1dGUiLCJhdHRyaWJ1dGVOYW1lIiwiaW5kZXhPZiIsIm1hdGNoIiwibm9kZSIsIm9wdGlvbnMiLCJyb290IiwiZG9jdW1lbnQiLCJza2lwIiwicHJpb3JpdHkiLCJpZ25vcmUiLCJleGNsdWRlIiwiY29uc29sZSIsImxvZyIsImNsYXNzTmFtZSIsInBhdGgiLCJlbGVtZW50IiwibGVuZ3RoIiwic2tpcENvbXBhcmUiLCJBcnJheSIsImlzQXJyYXkiLCJtYXAiLCJlbnRyeSIsInNraXBDaGVja3MiLCJzb21lIiwiY29tcGFyZSIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwidHlwZSIsInByZWRpY2F0ZSIsInRvU3RyaW5nIiwiUmVnRXhwIiwicmVwbGFjZSIsIm5hbWUiLCJ2YWx1ZSIsInRlc3QiLCJpZ25vcmVBdHRyaWJ1dGUiLCJkZWZhdWx0UHJlZGljYXRlIiwiY2hlY2tBdHRyaWJ1dGVzIiwiY2hlY2tUYWciLCJjaGVja0NoaWxkcyIsInBhcmVudE5vZGUiLCJwYXR0ZXJuIiwiZmluZFBhdHRlcm4iLCJ1bnNoaWZ0Iiwiam9pbiIsInBhcmVudCIsImZpbmRBdHRyaWJ1dGVzUGF0dGVybiIsIm1hdGNoZXMiLCJxdWVyeVNlbGVjdG9yQWxsIiwiYXR0cmlidXRlcyIsInNvcnRlZEtleXMiLCJzb3J0IiwiY3VyciIsIm5leHQiLCJjdXJyUG9zIiwibmV4dFBvcyIsImkiLCJsIiwia2V5IiwiYXR0cmlidXRlVmFsdWUiLCJjdXJyZW50SWdub3JlIiwiY3VycmVudERlZmF1bHRJZ25vcmUiLCJjaGVja0lnbm9yZSIsInRyaW0iLCJmaW5kVGFnUGF0dGVybiIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwidGFnTmFtZSIsInRvTG93ZXJDYXNlIiwidGFnIiwiY2hpbGRyZW4iLCJjaGlsZFRhZ3MiLCJjaGlsZCIsImNoaWxkUGF0dGVybiIsIndhcm4iLCJjaGVjayJdLCJtYXBwaW5n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T0FBaEMsRUFBeUNOLE1BQXpDLEVBQWlEO0FBQy9DLE1BQUlpQyxPQUFPLEdBQUdLLHFCQUFxQixDQUFDdkMsUUFBRCxFQUFXTyxPQUFYLEVBQW9CTixNQUFwQixDQUFuQzs7QUFDQSxNQUFJLENBQUNpQyxPQUFMLEVBQWM7QUFDWkEsSUFBQUEsT0FBTyxHQUFHdUIsY0FBYyxDQUFDbEQsT0FBRCxFQUFVTixNQUFWLENBQXhCO0FBQ0Q7O0FBQ0QsU0FBT2lDLE9BQVA7QUFDRDtBQUVEOzs7Ozs7Ozs7OztBQVNBLFNBQVNxQixXQUFULENBQXNCbEMsU0FBdEIsRUFBaUNJLElBQWpDLEVBQXVDQyxLQUF2QyxFQUE4Q0csZ0JBQTlDLEVBQWdFO0FBQzlELE1BQUksQ0FBQ0gsS0FBTCxFQUFZO0FBQ1YsV0FBTyxJQUFQO0FBQ0Q7O0FBQ0QsTUFBTXlDLEtBQUssR0FBRzlDLFNBQVMsSUFBSVEsZ0JBQTNCOztBQUNBLE1BQUksQ0FBQ3NDLEtBQUwsRUFBWTtBQUNWLFdBQU8sS0FBUDtBQUNEOztBQUNELFNBQU9BLEtBQUssQ0FBQzFDLElBQUQsRUFBT0MsS0FBUCxFQUFjRyxnQkFBZCxDQUFaO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqICMgTWF0Y2hcbiAqXG4gKiBSZXRyaWV2ZSBzZWxlY3RvciBmb3IgYSBub2RlLlxuICovXG5cbmltcG9ydCB7IGVzY2FwZVZhbHVlIH0gZnJvbSAnLi91dGlsaXRpZXMnXG5cbmNvbnN0IGRlZmF1bHRJZ25vcmUgPSB7XG4gIGF0dHJpYnV0ZSAoYXR0cmlidXRlTmFtZSkge1xuICAgIHJldHVybiBbXG4gICAgICAnc3R5bGUnLFxuICAgICAgJ2RhdGEtcmVhY3RpZCcsXG4gICAgICAnZGF0YS1yZWFjdC1jaGVja3N1bSdcbiAgICBdLmluZGV4T2YoYXR0cmlidXRlTmFtZSkgPiAtMVxuICB9XG59XG5cbi8qKlxuICogR2V0IHRoZSBwYXRoIG9mIHRoZSBlbGVtZW50XG4gKlxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IG5vZGUgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgb3B0aW9ucyAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtYXRjaCAobm9kZSwgb3B0aW9ucykge1xuXG4gIGNvbnN0IHtcbiAgICByb290ID0gZG9jdW1lbnQsXG4gICAgc2tpcCA9IG51bGwsXG4gICAgcHJpb3JpdHkgPSBbJ2lkJywgJ2NsYXNzJywgJ2hyZWYnLCAnc3JjJ10sXG4gICAgaWdub3JlID0ge30sXG4gICAgZXhjbHVkZSA9IHt9LFxuICB9ID0gb3B0aW9uc1xuICBjb25zb2xlLmxvZyhcbiAgICAnbWF0Y2ggb3AnLFxuICAgIG9wdGlvbnMsXG4gICAgZXhjbHVkZS5jbGFzc05hbWUgJiYgZXhjbHVkZS5jbGFzc05hbWUoJ2pzczI1MSBtYXJrZG93bi1ib2R5JylcbiAgKTtcbiAgY29uc3QgcGF0aCA9IFtdXG4gIHZhciBlbGVtZW50ID0gbm9kZVxuICB2YXIgbGVuZ3RoID0gcGF0aC5sZW5ndGhcblxuICBjb25zdCBza2lwQ29tcGFyZSA9IHNraXAgJiYgKEFycmF5LmlzQXJyYXkoc2tpcCkgPyBza2lwIDogW3NraXBdKS5tYXAoKGVudHJ5KSA9PiB7XG4gICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIChlbGVtZW50KSA9PiBlbGVtZW50ID09PSBlbnRyeVxuICAgIH1cbiAgICByZXR1cm4gZW50cnlcbiAgfSlcblxuICBjb25zdCBza2lwQ2hlY2tzID0gKGVsZW1lbnQpID0+IHtcbiAgICByZXR1cm4gc2tpcCAmJiBza2lwQ29tcGFyZS5zb21lKChjb21wYXJlKSA9PiBjb21wYXJlKGVsZW1lbnQpKVxuICB9XG5cbiAgT2JqZWN0LmtleXMoaWdub3JlKS5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgdmFyIHByZWRpY2F0ZSA9IGlnbm9yZVt0eXBlXVxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnZnVuY3Rpb24nKSByZXR1cm5cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHByZWRpY2F0ZSA9IHByZWRpY2F0ZS50b1N0cmluZygpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgcHJlZGljYXRlID0gbmV3IFJlZ0V4cChlc2NhcGVWYWx1ZShwcmVkaWNhdGUpLnJlcGxhY2UoL1xcXFwvZywgJ1xcXFxcXFxcJykpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnYm9vbGVhbicpIHtcbiAgICAgIHByZWRpY2F0ZSA9IHByZWRpY2F0ZSA/IC8oPzopLyA6IC8uXi9cbiAgICB9XG4gICAgLy8gY2hlY2sgY2xhc3MtL2F0dHJpYnV0ZW5hbWUgZm9yIHJlZ2V4XG4gICAgaWdub3JlW3R5cGVdID0gKG5hbWUsIHZhbHVlKSA9PiBwcmVkaWNhdGUudGVzdCh2YWx1ZSlcbiAgfSlcblxuICB2YXIgaWdub3JlQXR0cmlidXRlID0gaWdub3JlLmF0dHJpYnV0ZTtcbiAgaWdub3JlLmF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSkge1xuICAgIHJldHVybiBpZ25vcmVBdHRyaWJ1dGUgJiYgaWdub3JlQXR0cmlidXRlKG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKTtcbiAgfTtcblxuICB3aGlsZSAoZWxlbWVudCAhPT0gcm9vdCkge1xuICAgIGlmIChza2lwQ2hlY2tzKGVsZW1lbnQpICE9PSB0cnVlKSB7XG4gICAgICAvLyB+IGdsb2JhbFxuICAgICAgaWYgKGNoZWNrQXR0cmlidXRlcyhwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBwYXRoLCByb290KSkgYnJlYWtcbiAgICAgIGlmIChjaGVja1RhZyhlbGVtZW50LCBpZ25vcmUsIHBhdGgsIHJvb3QpKSBicmVha1xuXG4gICAgICAvLyB+IGxvY2FsXG4gICAgICBjaGVja0F0dHJpYnV0ZXMocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgcGF0aClcbiAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgIGNoZWNrVGFnKGVsZW1lbnQsIGlnbm9yZSwgcGF0aClcbiAgICAgIH1cblxuICAgICAgLy8gZGVmaW5lIG9ubHkgb25lIHBhcnQgZWFjaCBpdGVyYXRpb25cbiAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgIGNoZWNrQ2hpbGRzKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIHBhdGgpXG4gICAgICB9XG4gICAgfVxuXG4gICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZVxuICAgIGxlbmd0aCA9IHBhdGgubGVuZ3RoXG4gIH1cblxuICBpZiAoZWxlbWVudCA9PT0gcm9vdCkge1xuICAgIGNvbnN0IHBhdHRlcm4gPSBmaW5kUGF0dGVybihwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlKVxuICAgIHBhdGgudW5zaGlmdChwYXR0ZXJuKVxuICB9XG5cbiAgcmV0dXJuIHBhdGguam9pbignICcpXG59XG5cbi8qKlxuICogRXh0ZW5kIHBhdGggd2l0aCBhdHRyaWJ1dGUgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwYXRoICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBwYXJlbnQgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tBdHRyaWJ1dGVzIChwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBwYXRoLCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgY29uc3QgcGF0dGVybiA9IGZpbmRBdHRyaWJ1dGVzUGF0dGVybihwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlKVxuICBpZiAocGF0dGVybikge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBMb29rdXAgYXR0cmlidXRlIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcHJpb3JpdHkgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgaWdub3JlICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmc/fSAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGZpbmRBdHRyaWJ1dGVzUGF0dGVybiAocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSkge1xuICBjb25zdCBhdHRyaWJ1dGVzID0gZWxlbWVudC5hdHRyaWJ1dGVzXG4gIGNvbnN0IHNvcnRlZEtleXMgPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5zb3J0KChjdXJyLCBuZXh0KSA9PiB7XG4gICAgY29uc3QgY3VyclBvcyA9IHByaW9yaXR5LmluZGV4T2YoYXR0cmlidXRlc1tjdXJyXS5uYW1lKVxuICAgIGNvbnN0IG5leHRQb3MgPSBwcmlvcml0eS5pbmRleE9mKGF0dHJpYnV0ZXNbbmV4dF0ubmFtZSlcbiAgICBpZiAobmV4dFBvcyA9PT0gLTEpIHtcbiAgICAgIGlmIChjdXJyUG9zID09PSAtMSkge1xuICAgICAgICByZXR1cm4gMFxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBjdXJyUG9zIC0gbmV4dFBvc1xuICB9KVxuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gc29ydGVkS2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBrZXkgPSBzb3J0ZWRLZXlzW2ldXG4gICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1trZXldXG4gICAgY29uc3QgYXR0cmlidXRlTmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgY29uc3QgYXR0cmlidXRlVmFsdWUgPSBlc2NhcGVWYWx1ZShhdHRyaWJ1dGUudmFsdWUpXG5cbiAgICBjb25zdCBjdXJyZW50SWdub3JlID0gaWdub3JlW2F0dHJpYnV0ZU5hbWVdIHx8IGlnbm9yZS5hdHRyaWJ1dGVcbiAgICBjb25zdCBjdXJyZW50RGVmYXVsdElnbm9yZSA9IGRlZmF1bHRJZ25vcmVbYXR0cmlidXRlTmFtZV0gfHwgZGVmYXVsdElnbm9yZS5hdHRyaWJ1dGVcbiAgICBpZiAoY2hlY2tJZ25vcmUoY3VycmVudElnbm9yZSwgYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWUsIGN1cnJlbnREZWZhdWx0SWdub3JlKSkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICB2YXIgcGF0dGVybiA9IGBbJHthdHRyaWJ1dGVOYW1lfT1cIiR7YXR0cmlidXRlVmFsdWV9XCJdYFxuXG4gICAgaWYgKCgvXFxiXFxkLykudGVzdChhdHRyaWJ1dGVWYWx1ZSkgPT09IGZhbHNlKSB7XG4gICAgICBpZiAoYXR0cmlidXRlTmFtZSA9PT0gJ2lkJykge1xuICAgICAgICBwYXR0ZXJuID0gYCMke2F0dHJpYnV0ZVZhbHVlfWBcbiAgICAgIH1cblxuICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUgPT09ICdjbGFzcycpIHtcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gYXR0cmlidXRlVmFsdWUudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJy4nKVxuICAgICAgICBwYXR0ZXJuID0gYC4ke2NsYXNzTmFtZX1gXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdHRlcm5cbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG4vKipcbiAqIEV4dGVuZCBwYXRoIHdpdGggdGFnIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgcGFyZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja1RhZyAoZWxlbWVudCwgaWdub3JlLCBwYXRoLCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgY29uc3QgcGF0dGVybiA9IGZpbmRUYWdQYXR0ZXJuKGVsZW1lbnQsIGlnbm9yZSlcbiAgaWYgKHBhdHRlcm4pIHtcbiAgICBjb25zdCBtYXRjaGVzID0gcGFyZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHBhdHRlcm4pXG4gICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICBwYXRoLnVuc2hpZnQocGF0dGVybilcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIExvb2t1cCB0YWcgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gZmluZFRhZ1BhdHRlcm4gKGVsZW1lbnQsIGlnbm9yZSkge1xuICBjb25zdCB0YWdOYW1lID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS50YWcsIG51bGwsIHRhZ05hbWUpKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICByZXR1cm4gdGFnTmFtZVxufVxuXG4vKipcbiAqIEV4dGVuZCBwYXRoIHdpdGggc3BlY2lmaWMgY2hpbGQgaWRlbnRpZmllclxuICpcbiAqIE5PVEU6ICdjaGlsZFRhZ3MnIGlzIGEgY3VzdG9tIHByb3BlcnR5IHRvIHVzZSBhcyBhIHZpZXcgZmlsdGVyIGZvciB0YWdzIHVzaW5nICdhZGFwdGVyLmpzJ1xuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwYXRoICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDaGlsZHMgKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIHBhdGgpIHtcbiAgY29uc3QgcGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlXG4gIGNvbnN0IGNoaWxkcmVuID0gcGFyZW50LmNoaWxkVGFncyB8fCBwYXJlbnQuY2hpbGRyZW5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgaWYgKGNoaWxkID09PSBlbGVtZW50KSB7XG4gICAgICBjb25zdCBjaGlsZFBhdHRlcm4gPSBmaW5kUGF0dGVybihwcmlvcml0eSwgY2hpbGQsIGlnbm9yZSlcbiAgICAgIGlmICghY2hpbGRQYXR0ZXJuKSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oYFxuICAgICAgICAgIEVsZW1lbnQgY291bGRuXFwndCBiZSBtYXRjaGVkIHRocm91Z2ggc3RyaWN0IGlnbm9yZSBwYXR0ZXJuIVxuICAgICAgICBgLCBjaGlsZCwgaWdub3JlLCBjaGlsZFBhdHRlcm4pXG4gICAgICB9XG4gICAgICBjb25zdCBwYXR0ZXJuID0gYD4gJHtjaGlsZFBhdHRlcm59Om50aC1jaGlsZCgke2krMX0pYFxuICAgICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBMb29rdXAgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gZmluZFBhdHRlcm4gKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUpIHtcbiAgdmFyIHBhdHRlcm4gPSBmaW5kQXR0cmlidXRlc1BhdHRlcm4ocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSlcbiAgaWYgKCFwYXR0ZXJuKSB7XG4gICAgcGF0dGVybiA9IGZpbmRUYWdQYXR0ZXJuKGVsZW1lbnQsIGlnbm9yZSlcbiAgfVxuICByZXR1cm4gcGF0dGVyblxufVxuXG4vKipcbiAqIFZhbGlkYXRlIHdpdGggY3VzdG9tIGFuZCBkZWZhdWx0IGZ1bmN0aW9uc1xuICpcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBwcmVkaWNhdGUgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7c3RyaW5nP30gIG5hbWUgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgdmFsdWUgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBkZWZhdWx0UHJlZGljYXRlIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrSWdub3JlIChwcmVkaWNhdGUsIG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKSB7XG4gIGlmICghdmFsdWUpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIGNvbnN0IGNoZWNrID0gcHJlZGljYXRlIHx8IGRlZmF1bHRQcmVkaWNhdGVcbiAgaWYgKCFjaGVjaykge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiBjaGVjayhuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSlcbn1cbiJdLCJmaWxlIjoibWF0Y2guanMifQ==
