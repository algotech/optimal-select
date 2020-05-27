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
      if (checkAttributes(priority, element, ignore, exclude, path, root)) break;
      if (checkTag(element, ignore, path, root)) break; // ~ local

      checkAttributes(priority, element, ignore, exclude, path);

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
 * @param  {Object}         exclude  - Exclude functions for parts of attributes
 * @param  {Array.<string>} path     - [description]
 * @param  {HTMLElement}    parent   - [description]
 * @return {boolean}                 - [description]
 */


function checkAttributes(priority, element, ignore, exclude, path) {
  var parent = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : element.parentNode;
  var pattern = findAttributesPattern(priority, element, ignore, exclude);

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
 * @param  {Object}         exclude  - Exclude functions for parts of attributes
 * @return {string?}                 - [description]
 */


function findAttributesPattern(priority, element, ignore, exclude) {
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
        console.log('exclude?', attributeValue.split(' ').map(function (c) {
          return {
            ex: exclude.className(c),
            c: c
          };
        }));
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
  var exclude = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var pattern = findAttributesPattern(priority, element, ignore, exclude);

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hdGNoLmpzIl0sIm5hbWVzIjpbImRlZmF1bHRJZ25vcmUiLCJhdHRyaWJ1dGUiLCJhdHRyaWJ1dGVOYW1lIiwiaW5kZXhPZiIsIm1hdGNoIiwibm9kZSIsIm9wdGlvbnMiLCJyb290IiwiZG9jdW1lbnQiLCJza2lwIiwicHJpb3JpdHkiLCJpZ25vcmUiLCJleGNsdWRlIiwiY29uc29sZSIsImxvZyIsImNsYXNzTmFtZSIsInBhdGgiLCJlbGVtZW50IiwibGVuZ3RoIiwic2tpcENvbXBhcmUiLCJBcnJheSIsImlzQXJyYXkiLCJtYXAiLCJlbnRyeSIsInNraXBDaGVja3MiLCJzb21lIiwiY29tcGFyZSIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwidHlwZSIsInByZWRpY2F0ZSIsInRvU3RyaW5nIiwiUmVnRXhwIiwicmVwbGFjZSIsIm5hbWUiLCJ2YWx1ZSIsInRlc3QiLCJpZ25vcmVBdHRyaWJ1dGUiLCJkZWZhdWx0UHJlZGljYXRlIiwiY2hlY2tBdHRyaWJ1dGVzIiwiY2hlY2tUYWciLCJjaGVja0NoaWxkcyIsInBhcmVudE5vZGUiLCJwYXR0ZXJuIiwiZmluZFBhdHRlcm4iLCJ1bnNoaWZ0Iiwiam9pbiIsInBhcmVudCIsImZpbmRBdHRyaWJ1dGVzUGF0dGVybiIsIm1hdGNoZXMiLCJxdWVyeVNlbGVjdG9yQWxsIiwiYXR0cmlidXRlcyIsInNvcnRlZEtleXMiLCJzb3J0IiwiY3VyciIsIm5leHQiLCJjdXJyUG9zIiwibmV4dFBvcyIsImkiLCJsIiwia2V5IiwiYXR0cmlidXRlVmFsdWUiLCJjdXJyZW50SWdub3JlIiwiY3VycmVudERlZmF1bHRJZ25vcmUiLCJjaGVja0lnbm9yZSIsInNwbGl0IiwiYyIsImV4IiwidHJpbSIsImZpbmRUYWdQYXR0ZXJuIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJ0YWdOYW1lIiwidG9Mb3dlckNhc2UiLCJ0YWciLCJjaGlsZHJlbiIsImNoaWxkVGFncyIsImNoaWxkIiwiY2hpbGRQYXR0ZXJuIiwid2FybiIs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ICpcbiAqIFJldHJpZXZlIHNlbGVjdG9yIGZvciBhIG5vZGUuXG4gKi9cblxuaW1wb3J0IHsgZXNjYXBlVmFsdWUgfSBmcm9tICcuL3V0aWxpdGllcydcblxuY29uc3QgZGVmYXVsdElnbm9yZSA9IHtcbiAgYXR0cmlidXRlIChhdHRyaWJ1dGVOYW1lKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICdzdHlsZScsXG4gICAgICAnZGF0YS1yZWFjdGlkJyxcbiAgICAgICdkYXRhLXJlYWN0LWNoZWNrc3VtJ1xuICAgIF0uaW5kZXhPZihhdHRyaWJ1dGVOYW1lKSA+IC0xXG4gIH1cbn1cblxuLyoqXG4gKiBHZXQgdGhlIHBhdGggb2YgdGhlIGVsZW1lbnRcbiAqXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gbm9kZSAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBvcHRpb25zIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG1hdGNoIChub2RlLCBvcHRpb25zKSB7XG5cbiAgY29uc3Qge1xuICAgIHJvb3QgPSBkb2N1bWVudCxcbiAgICBza2lwID0gbnVsbCxcbiAgICBwcmlvcml0eSA9IFsnaWQnLCAnY2xhc3MnLCAnaHJlZicsICdzcmMnXSxcbiAgICBpZ25vcmUgPSB7fSxcbiAgICBleGNsdWRlID0ge30sXG4gIH0gPSBvcHRpb25zXG4gIGNvbnNvbGUubG9nKFxuICAgICdtYXRjaCBvcCcsXG4gICAgb3B0aW9ucyxcbiAgICBleGNsdWRlLmNsYXNzTmFtZSAmJiBleGNsdWRlLmNsYXNzTmFtZSgnanNzMjUxIG1hcmtkb3duLWJvZHknKVxuICApO1xuICBjb25zdCBwYXRoID0gW11cbiAgdmFyIGVsZW1lbnQgPSBub2RlXG4gIHZhciBsZW5ndGggPSBwYXRoLmxlbmd0aFxuXG4gIGNvbnN0IHNraXBDb21wYXJlID0gc2tpcCAmJiAoQXJyYXkuaXNBcnJheShza2lwKSA/IHNraXAgOiBbc2tpcF0pLm1hcCgoZW50cnkpID0+IHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gKGVsZW1lbnQpID0+IGVsZW1lbnQgPT09IGVudHJ5XG4gICAgfVxuICAgIHJldHVybiBlbnRyeVxuICB9KVxuXG4gIGNvbnN0IHNraXBDaGVja3MgPSAoZWxlbWVudCkgPT4ge1xuICAgIHJldHVybiBza2lwICYmIHNraXBDb21wYXJlLnNvbWUoKGNvbXBhcmUpID0+IGNvbXBhcmUoZWxlbWVudCkpXG4gIH1cblxuICBPYmplY3Qua2V5cyhpZ25vcmUpLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICB2YXIgcHJlZGljYXRlID0gaWdub3JlW3R5cGVdXG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdmdW5jdGlvbicpIHJldHVyblxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnbnVtYmVyJykge1xuICAgICAgcHJlZGljYXRlID0gcHJlZGljYXRlLnRvU3RyaW5nKClcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBwcmVkaWNhdGUgPSBuZXcgUmVnRXhwKGVzY2FwZVZhbHVlKHByZWRpY2F0ZSkucmVwbGFjZSgvXFxcXC9nLCAnXFxcXFxcXFwnKSlcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdib29sZWFuJykge1xuICAgICAgcHJlZGljYXRlID0gcHJlZGljYXRlID8gLyg/OikvIDogLy5eL1xuICAgIH1cbiAgICAvLyBjaGVjayBjbGFzcy0vYXR0cmlidXRlbmFtZSBmb3IgcmVnZXhcbiAgICBpZ25vcmVbdHlwZV0gPSAobmFtZSwgdmFsdWUpID0+IHByZWRpY2F0ZS50ZXN0KHZhbHVlKVxuICB9KVxuXG4gIHZhciBpZ25vcmVBdHRyaWJ1dGUgPSBpZ25vcmUuYXR0cmlidXRlO1xuICBpZ25vcmUuYXR0cmlidXRlID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKSB7XG4gICAgcmV0dXJuIGlnbm9yZUF0dHJpYnV0ZSAmJiBpZ25vcmVBdHRyaWJ1dGUobmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpO1xuICB9O1xuXG4gIHdoaWxlIChlbGVtZW50ICE9PSByb290KSB7XG4gICAgaWYgKHNraXBDaGVja3MoZWxlbWVudCkgIT09IHRydWUpIHtcbiAgICAgIC8vIH4gZ2xvYmFsXG4gICAgICBpZiAoY2hlY2tBdHRyaWJ1dGVzKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUsIHBhdGgsIHJvb3QpKSBicmVha1xuICAgICAgaWYgKGNoZWNrVGFnKGVsZW1lbnQsIGlnbm9yZSwgcGF0aCwgcm9vdCkpIGJyZWFrXG5cbiAgICAgIC8vIH4gbG9jYWxcbiAgICAgIGNoZWNrQXR0cmlidXRlcyhwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlLCBwYXRoKVxuICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgY2hlY2tUYWcoZWxlbWVudCwgaWdub3JlLCBwYXRoKVxuICAgICAgfVxuXG4gICAgICAvLyBkZWZpbmUgb25seSBvbmUgcGFydCBlYWNoIGl0ZXJhdGlvblxuICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgY2hlY2tDaGlsZHMocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgcGF0aClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlXG4gICAgbGVuZ3RoID0gcGF0aC5sZW5ndGhcbiAgfVxuXG4gIGlmIChlbGVtZW50ID09PSByb290KSB7XG4gICAgY29uc3QgcGF0dGVybiA9IGZpbmRQYXR0ZXJuKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUpXG4gICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gIH1cblxuICByZXR1cm4gcGF0aC5qb2luKCcgJylcbn1cblxuLyoqXG4gKiBFeHRlbmQgcGF0aCB3aXRoIGF0dHJpYnV0ZSBpZGVudGlmaWVyXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHByaW9yaXR5IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGlnbm9yZSAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGV4Y2x1ZGUgIC0gRXhjbHVkZSBmdW5jdGlvbnMgZm9yIHBhcnRzIG9mIGF0dHJpYnV0ZXNcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwYXRoICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBwYXJlbnQgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tBdHRyaWJ1dGVzIChwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlLCBwYXRoLCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgY29uc3QgcGF0dGVybiA9IGZpbmRBdHRyaWJ1dGVzUGF0dGVybihwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlKVxuICBpZiAocGF0dGVybikge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBMb29rdXAgYXR0cmlidXRlIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcHJpb3JpdHkgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgaWdub3JlICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgZXhjbHVkZSAgLSBFeGNsdWRlIGZ1bmN0aW9ucyBmb3IgcGFydHMgb2YgYXR0cmlidXRlc1xuICogQHJldHVybiB7c3RyaW5nP30gICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBmaW5kQXR0cmlidXRlc1BhdHRlcm4gKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUpIHtcbiAgY29uc3QgYXR0cmlidXRlcyA9IGVsZW1lbnQuYXR0cmlidXRlc1xuICBjb25zdCBzb3J0ZWRLZXlzID0gT2JqZWN0LmtleXMoYXR0cmlidXRlcykuc29ydCgoY3VyciwgbmV4dCkgPT4ge1xuICAgIGNvbnN0IGN1cnJQb3MgPSBwcmlvcml0eS5pbmRleE9mKGF0dHJpYnV0ZXNbY3Vycl0ubmFtZSlcbiAgICBjb25zdCBuZXh0UG9zID0gcHJpb3JpdHkuaW5kZXhPZihhdHRyaWJ1dGVzW25leHRdLm5hbWUpXG4gICAgaWYgKG5leHRQb3MgPT09IC0xKSB7XG4gICAgICBpZiAoY3VyclBvcyA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIDBcbiAgICAgIH1cbiAgICAgIHJldHVybiAtMVxuICAgIH1cbiAgICByZXR1cm4gY3VyclBvcyAtIG5leHRQb3NcbiAgfSlcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IHNvcnRlZEtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY29uc3Qga2V5ID0gc29ydGVkS2V5c1tpXVxuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNba2V5XVxuICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUgPSBhdHRyaWJ1dGUubmFtZVxuICAgIGNvbnN0IGF0dHJpYnV0ZVZhbHVlID0gZXNjYXBlVmFsdWUoYXR0cmlidXRlLnZhbHVlKVxuXG4gICAgY29uc3QgY3VycmVudElnbm9yZSA9IGlnbm9yZVthdHRyaWJ1dGVOYW1lXSB8fCBpZ25vcmUuYXR0cmlidXRlXG4gICAgY29uc3QgY3VycmVudERlZmF1bHRJZ25vcmUgPSBkZWZhdWx0SWdub3JlW2F0dHJpYnV0ZU5hbWVdIHx8IGRlZmF1bHRJZ25vcmUuYXR0cmlidXRlXG4gICAgaWYgKGNoZWNrSWdub3JlKGN1cnJlbnRJZ25vcmUsIGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlLCBjdXJyZW50RGVmYXVsdElnbm9yZSkpIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgdmFyIHBhdHRlcm4gPSBgWyR7YXR0cmlidXRlTmFtZX09XCIke2F0dHJpYnV0ZVZhbHVlfVwiXWBcblxuICAgIGlmICgoL1xcYlxcZC8pLnRlc3QoYXR0cmlidXRlVmFsdWUpID09PSBmYWxzZSkge1xuICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUgPT09ICdpZCcpIHtcbiAgICAgICAgcGF0dGVybiA9IGAjJHthdHRyaWJ1dGVWYWx1ZX1gXG4gICAgICB9XG5cbiAgICAgIGlmIChhdHRyaWJ1dGVOYW1lID09PSAnY2xhc3MnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdleGNsdWRlPycsIGF0dHJpYnV0ZVZhbHVlLnNwbGl0KCcgJykubWFwKGMgPT4gKHtcbiAgICAgICAgICBleDogZXhjbHVkZS5jbGFzc05hbWUoYyksXG4gICAgICAgICAgYyxcbiAgICAgICAgfSkpKTtcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gYXR0cmlidXRlVmFsdWUudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJy4nKVxuICAgICAgICBwYXR0ZXJuID0gYC4ke2NsYXNzTmFtZX1gXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdHRlcm5cbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG4vKipcbiAqIEV4dGVuZCBwYXRoIHdpdGggdGFnIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgcGFyZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja1RhZyAoZWxlbWVudCwgaWdub3JlLCBwYXRoLCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgY29uc3QgcGF0dGVybiA9IGZpbmRUYWdQYXR0ZXJuKGVsZW1lbnQsIGlnbm9yZSlcbiAgaWYgKHBhdHRlcm4pIHtcbiAgICBjb25zdCBtYXRjaGVzID0gcGFyZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHBhdHRlcm4pXG4gICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICBwYXRoLnVuc2hpZnQocGF0dGVybilcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIExvb2t1cCB0YWcgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gZmluZFRhZ1BhdHRlcm4gKGVsZW1lbnQsIGlnbm9yZSkge1xuICBjb25zdCB0YWdOYW1lID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS50YWcsIG51bGwsIHRhZ05hbWUpKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICByZXR1cm4gdGFnTmFtZVxufVxuXG4vKipcbiAqIEV4dGVuZCBwYXRoIHdpdGggc3BlY2lmaWMgY2hpbGQgaWRlbnRpZmllclxuICpcbiAqIE5PVEU6ICdjaGlsZFRhZ3MnIGlzIGEgY3VzdG9tIHByb3BlcnR5IHRvIHVzZSBhcyBhIHZpZXcgZmlsdGVyIGZvciB0YWdzIHVzaW5nICdhZGFwdGVyLmpzJ1xuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwYXRoICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDaGlsZHMgKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIHBhdGgpIHtcbiAgY29uc3QgcGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlXG4gIGNvbnN0IGNoaWxkcmVuID0gcGFyZW50LmNoaWxkVGFncyB8fCBwYXJlbnQuY2hpbGRyZW5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgaWYgKGNoaWxkID09PSBlbGVtZW50KSB7XG4gICAgICBjb25zdCBjaGlsZFBhdHRlcm4gPSBmaW5kUGF0dGVybihwcmlvcml0eSwgY2hpbGQsIGlnbm9yZSlcbiAgICAgIGlmICghY2hpbGRQYXR0ZXJuKSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oYFxuICAgICAgICAgIEVsZW1lbnQgY291bGRuXFwndCBiZSBtYXRjaGVkIHRocm91Z2ggc3RyaWN0IGlnbm9yZSBwYXR0ZXJuIVxuICAgICAgICBgLCBjaGlsZCwgaWdub3JlLCBjaGlsZFBhdHRlcm4pXG4gICAgICB9XG4gICAgICBjb25zdCBwYXR0ZXJuID0gYD4gJHtjaGlsZFBhdHRlcm59Om50aC1jaGlsZCgke2krMX0pYFxuICAgICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBMb29rdXAgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gZmluZFBhdHRlcm4gKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUgPSB7fSkge1xuICB2YXIgcGF0dGVybiA9IGZpbmRBdHRyaWJ1dGVzUGF0dGVybihwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlKVxuICBpZiAoIXBhdHRlcm4pIHtcbiAgICBwYXR0ZXJuID0gZmluZFRhZ1BhdHRlcm4oZWxlbWVudCwgaWdub3JlKVxuICB9XG4gIHJldHVybiBwYXR0ZXJuXG59XG5cbi8qKlxuICogVmFsaWRhdGUgd2l0aCBjdXN0b20gYW5kIGRlZmF1bHQgZnVuY3Rpb25zXG4gKlxuICogQHBhcmFtICB7RnVuY3Rpb259IHByZWRpY2F0ZSAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtzdHJpbmc/fSAgbmFtZSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge3N0cmluZ30gICB2YWx1ZSAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7RnVuY3Rpb259IGRlZmF1bHRQcmVkaWNhdGUgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tJZ25vcmUgKHByZWRpY2F0ZSwgbmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpIHtcbiAgaWYgKCF2YWx1ZSkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgY29uc3QgY2hlY2sgPSBwcmVkaWNhdGUgfHwgZGVmYXVsdFByZWRpY2F0ZVxuICBpZiAoIWNoZWNrKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIGNoZWNrKG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKVxufVxuIl0sImZpbGUiOiJtYXRjaC5qcyJ9
