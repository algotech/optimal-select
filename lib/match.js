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
        var className = excludeClassNameParts(attributeValue, exclude.className);
        className = className.trim().replace(/\s+/g, '.');
        pattern = ".".concat(className);
        console.log('after exclusion', pattern);
      }
    }

    return pattern;
  }

  return null;
}
/**
* @param  {string}         className      A part of a class attribute value
* @param  {Function}       shouldExclude  Decides if name is accepted or not
* @return {string}                        className with unwanted parts(names) excluded
*/


function excludeClassNameParts(className, shouldExclude) {
  var classNames = className.split(' ');
  return classNames.filter(function (name) {
    if (!name.length) {
      return true;
    }

    return !shouldExclude(name);
  }).join(' ');
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hdGNoLmpzIl0sIm5hbWVzIjpbImRlZmF1bHRJZ25vcmUiLCJhdHRyaWJ1dGUiLCJhdHRyaWJ1dGVOYW1lIiwiaW5kZXhPZiIsIm1hdGNoIiwibm9kZSIsIm9wdGlvbnMiLCJyb290IiwiZG9jdW1lbnQiLCJza2lwIiwicHJpb3JpdHkiLCJpZ25vcmUiLCJleGNsdWRlIiwicGF0aCIsImVsZW1lbnQiLCJsZW5ndGgiLCJza2lwQ29tcGFyZSIsIkFycmF5IiwiaXNBcnJheSIsIm1hcCIsImVudHJ5Iiwic2tpcENoZWNrcyIsInNvbWUiLCJjb21wYXJlIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJ0eXBlIiwicHJlZGljYXRlIiwidG9TdHJpbmciLCJSZWdFeHAiLCJyZXBsYWNlIiwibmFtZSIsInZhbHVlIiwidGVzdCIsImlnbm9yZUF0dHJpYnV0ZSIsImRlZmF1bHRQcmVkaWNhdGUiLCJjaGVja0F0dHJpYnV0ZXMiLCJjaGVja1RhZyIsImNoZWNrQ2hpbGRzIiwicGFyZW50Tm9kZSIsInBhdHRlcm4iLCJmaW5kUGF0dGVybiIsInVuc2hpZnQiLCJqb2luIiwicGFyZW50IiwiZmluZEF0dHJpYnV0ZXNQYXR0ZXJuIiwibWF0Y2hlcyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJhdHRyaWJ1dGVzIiwic29ydGVkS2V5cyIsInNvcnQiLCJjdXJyIiwibmV4dCIsImN1cnJQb3MiLCJuZXh0UG9zIiwiaSIsImwiLCJrZXkiLCJhdHRyaWJ1dGVWYWx1ZSIsImN1cnJlbnRJZ25vcmUiLCJjdXJyZW50RGVmYXVsdElnbm9yZSIsImNoZWNrSWdub3JlIiwiY29uc29sZSIsImxvZyIsInNwbGl0IiwiYyIsImV4IiwiY2xhc3NOYW1lIiwiZXhjbHVkZUNsYXNzTmFtZVBhcnRzIiwidHJpbSIsInNob3VsZEV4Y2x1ZGUiLCJjbGFzc05hbWVzIiwiZmlsdGVyIiwiZmluZFRhZ1BhdHRlcm4iLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsInRhZyIsImNoaWxkcmVuIiwiY2hpbGRUYWdzIiwiY2hpbGQiLCJjaGlsZFBhdHRlcm4iLCJ3YXJuIiwiY2hlY2siXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFNQTs7QUFOQTs7Ozs7QUFRQSxJQUFNQSxhQUFhLEdBQUc7QUFDcEJDLEVBQUFBLFNBRG9CLHFCQUNUQyxhQURTLEVBQ007QUFDeEIsV0FBTyxDQUNMLE9BREssRUFFTCxjQUZLLEVBR0wscUJBSEssRUFJTEMsT0FKSyxDQUlHRCxhQUpILElBSW9CLENBQUMsQ0FKNUI7QUFLRDtBQVBtQixDQUF0QjtBQVVBOzs7Ozs7OztBQU9lLFNBQVNFLEtBQVQsQ0FBZ0JDLElBQWhCLEVBQXNCQyxPQUF0QixFQUErQjtBQUFBLHNCQVF4Q0EsT0FSd0MsQ0FHMUNDLElBSDBDO0FBQUEsTUFHMUNBLElBSDBDLDhCQUduQ0MsUUFIbUM7QUFBQSxzQkFReENGLE9BUndDLENBSTFDRyxJQUowQztBQUFBLE1BSTFDQSxJQUowQyw4QkFJbkMsSUFKbUM7QUFBQSwwQkFReENILE9BUndDLENBSzFDSSxRQUwwQztBQUFBLE1BSzFDQSxRQUwwQyxrQ0FLL0IsQ0FBQyxJQUFELEVBQU8sT0FBUCxFQUFnQixNQUFoQixFQUF3QixLQUF4QixDQUwrQjtBQUFBLHdCQVF4Q0osT0FSd0MsQ0FNMUNLLE1BTjBDO0FBQUEsTUFNMUNBLE1BTjBDLGdDQU1qQyxFQU5pQztBQUFBLHlCQVF4Q0wsT0FSd0MsQ0FPMUNNLE9BUDBDO0FBQUEsTUFPMUNBLE9BUDBDLGlDQU9oQyxFQVBnQztBQVU1QyxNQUFNQyxJQUFJLEdBQUcsRUFBYjtBQUNBLE1BQUlDLE9BQU8sR0FBR1QsSUFBZDtBQUNBLE1BQUlVLE1BQU0sR0FBR0YsSUFBSSxDQUFDRSxNQUFsQjtBQUVBLE1BQU1DLFdBQVcsR0FBR1AsSUFBSSxJQUFJLENBQUNRLEtBQUssQ0FBQ0MsT0FBTixDQUFjVCxJQUFkLElBQXNCQSxJQUF0QixHQUE2QixDQUFDQSxJQUFELENBQTlCLEVBQXNDVSxHQUF0QyxDQUEwQyxVQUFDQyxL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LE9BQUQsRUFBVUgsTUFBVixDQUF4QjtBQUNEOztBQUNELFNBQU84QixPQUFQO0FBQ0Q7QUFFRDs7Ozs7Ozs7Ozs7QUFTQSxTQUFTcUIsV0FBVCxDQUFzQmxDLFNBQXRCLEVBQWlDSSxJQUFqQyxFQUF1Q0MsS0FBdkMsRUFBOENHLGdCQUE5QyxFQUFnRTtBQUM5RCxNQUFJLENBQUNILEtBQUwsRUFBWTtBQUNWLFdBQU8sSUFBUDtBQUNEOztBQUNELE1BQU1tRCxLQUFLLEdBQUd4RCxTQUFTLElBQUlRLGdCQUEzQjs7QUFDQSxNQUFJLENBQUNnRCxLQUFMLEVBQVk7QUFDVixXQUFPLEtBQVA7QUFDRDs7QUFDRCxTQUFPQSxLQUFLLENBQUNwRCxJQUFELEVBQU9DLEtBQVAsRUFBY0csZ0JBQWQsQ0FBWjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAjIE1hdGNoXG4gKlxuICogUmV0cmlldmUgc2VsZWN0b3IgZm9yIGEgbm9kZS5cbiAqL1xuXG5pbXBvcnQgeyBlc2NhcGVWYWx1ZSB9IGZyb20gJy4vdXRpbGl0aWVzJ1xuXG5jb25zdCBkZWZhdWx0SWdub3JlID0ge1xuICBhdHRyaWJ1dGUgKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJ3N0eWxlJyxcbiAgICAgICdkYXRhLXJlYWN0aWQnLFxuICAgICAgJ2RhdGEtcmVhY3QtY2hlY2tzdW0nXG4gICAgXS5pbmRleE9mKGF0dHJpYnV0ZU5hbWUpID4gLTFcbiAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgcGF0aCBvZiB0aGUgZWxlbWVudFxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBub2RlICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIG9wdGlvbnMgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbWF0Y2ggKG5vZGUsIG9wdGlvbnMpIHtcblxuICBjb25zdCB7XG4gICAgcm9vdCA9IGRvY3VtZW50LFxuICAgIHNraXAgPSBudWxsLFxuICAgIHByaW9yaXR5ID0gWydpZCcsICdjbGFzcycsICdocmVmJywgJ3NyYyddLFxuICAgIGlnbm9yZSA9IHt9LFxuICAgIGV4Y2x1ZGUgPSB7fSxcbiAgfSA9IG9wdGlvbnNcblxuICBjb25zdCBwYXRoID0gW11cbiAgdmFyIGVsZW1lbnQgPSBub2RlXG4gIHZhciBsZW5ndGggPSBwYXRoLmxlbmd0aFxuXG4gIGNvbnN0IHNraXBDb21wYXJlID0gc2tpcCAmJiAoQXJyYXkuaXNBcnJheShza2lwKSA/IHNraXAgOiBbc2tpcF0pLm1hcCgoZW50cnkpID0+IHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gKGVsZW1lbnQpID0+IGVsZW1lbnQgPT09IGVudHJ5XG4gICAgfVxuICAgIHJldHVybiBlbnRyeVxuICB9KVxuXG4gIGNvbnN0IHNraXBDaGVja3MgPSAoZWxlbWVudCkgPT4ge1xuICAgIHJldHVybiBza2lwICYmIHNraXBDb21wYXJlLnNvbWUoKGNvbXBhcmUpID0+IGNvbXBhcmUoZWxlbWVudCkpXG4gIH1cblxuICBPYmplY3Qua2V5cyhpZ25vcmUpLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICB2YXIgcHJlZGljYXRlID0gaWdub3JlW3R5cGVdXG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdmdW5jdGlvbicpIHJldHVyblxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnbnVtYmVyJykge1xuICAgICAgcHJlZGljYXRlID0gcHJlZGljYXRlLnRvU3RyaW5nKClcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBwcmVkaWNhdGUgPSBuZXcgUmVnRXhwKGVzY2FwZVZhbHVlKHByZWRpY2F0ZSkucmVwbGFjZSgvXFxcXC9nLCAnXFxcXFxcXFwnKSlcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdib29sZWFuJykge1xuICAgICAgcHJlZGljYXRlID0gcHJlZGljYXRlID8gLyg/OikvIDogLy5eL1xuICAgIH1cbiAgICAvLyBjaGVjayBjbGFzcy0vYXR0cmlidXRlbmFtZSBmb3IgcmVnZXhcbiAgICBpZ25vcmVbdHlwZV0gPSAobmFtZSwgdmFsdWUpID0+IHByZWRpY2F0ZS50ZXN0KHZhbHVlKVxuICB9KVxuXG4gIHZhciBpZ25vcmVBdHRyaWJ1dGUgPSBpZ25vcmUuYXR0cmlidXRlO1xuICBpZ25vcmUuYXR0cmlidXRlID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKSB7XG4gICAgcmV0dXJuIGlnbm9yZUF0dHJpYnV0ZSAmJiBpZ25vcmVBdHRyaWJ1dGUobmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpO1xuICB9O1xuXG4gIHdoaWxlIChlbGVtZW50ICE9PSByb290KSB7XG4gICAgaWYgKHNraXBDaGVja3MoZWxlbWVudCkgIT09IHRydWUpIHtcbiAgICAgIC8vIH4gZ2xvYmFsXG4gICAgICBpZiAoY2hlY2tBdHRyaWJ1dGVzKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUsIHBhdGgsIHJvb3QpKSBicmVha1xuICAgICAgaWYgKGNoZWNrVGFnKGVsZW1lbnQsIGlnbm9yZSwgcGF0aCwgcm9vdCkpIGJyZWFrXG5cbiAgICAgIC8vIH4gbG9jYWxcbiAgICAgIGNoZWNrQXR0cmlidXRlcyhwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlLCBwYXRoKVxuICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgY2hlY2tUYWcoZWxlbWVudCwgaWdub3JlLCBwYXRoKVxuICAgICAgfVxuXG4gICAgICAvLyBkZWZpbmUgb25seSBvbmUgcGFydCBlYWNoIGl0ZXJhdGlvblxuICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgY2hlY2tDaGlsZHMocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgcGF0aClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlXG4gICAgbGVuZ3RoID0gcGF0aC5sZW5ndGhcbiAgfVxuXG4gIGlmIChlbGVtZW50ID09PSByb290KSB7XG4gICAgY29uc3QgcGF0dGVybiA9IGZpbmRQYXR0ZXJuKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUpXG4gICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gIH1cblxuICByZXR1cm4gcGF0aC5qb2luKCcgJylcbn1cblxuLyoqXG4gKiBFeHRlbmQgcGF0aCB3aXRoIGF0dHJpYnV0ZSBpZGVudGlmaWVyXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHByaW9yaXR5IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGlnbm9yZSAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGV4Y2x1ZGUgIC0gRXhjbHVkZSBmdW5jdGlvbnMgZm9yIHBhcnRzIG9mIGF0dHJpYnV0ZXNcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwYXRoICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBwYXJlbnQgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tBdHRyaWJ1dGVzIChwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlLCBwYXRoLCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgY29uc3QgcGF0dGVybiA9IGZpbmRBdHRyaWJ1dGVzUGF0dGVybihwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlKVxuICBpZiAocGF0dGVybikge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBMb29rdXAgYXR0cmlidXRlIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcHJpb3JpdHkgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgaWdub3JlICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgZXhjbHVkZSAgLSBFeGNsdWRlIGZ1bmN0aW9ucyBmb3IgcGFydHMgb2YgYXR0cmlidXRlc1xuICogQHJldHVybiB7c3RyaW5nP30gICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBmaW5kQXR0cmlidXRlc1BhdHRlcm4gKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUpIHtcbiAgY29uc3QgYXR0cmlidXRlcyA9IGVsZW1lbnQuYXR0cmlidXRlc1xuICBjb25zdCBzb3J0ZWRLZXlzID0gT2JqZWN0LmtleXMoYXR0cmlidXRlcykuc29ydCgoY3VyciwgbmV4dCkgPT4ge1xuICAgIGNvbnN0IGN1cnJQb3MgPSBwcmlvcml0eS5pbmRleE9mKGF0dHJpYnV0ZXNbY3Vycl0ubmFtZSlcbiAgICBjb25zdCBuZXh0UG9zID0gcHJpb3JpdHkuaW5kZXhPZihhdHRyaWJ1dGVzW25leHRdLm5hbWUpXG4gICAgaWYgKG5leHRQb3MgPT09IC0xKSB7XG4gICAgICBpZiAoY3VyclBvcyA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIDBcbiAgICAgIH1cbiAgICAgIHJldHVybiAtMVxuICAgIH1cbiAgICByZXR1cm4gY3VyclBvcyAtIG5leHRQb3NcbiAgfSlcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IHNvcnRlZEtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY29uc3Qga2V5ID0gc29ydGVkS2V5c1tpXVxuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNba2V5XVxuICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUgPSBhdHRyaWJ1dGUubmFtZVxuICAgIGNvbnN0IGF0dHJpYnV0ZVZhbHVlID0gZXNjYXBlVmFsdWUoYXR0cmlidXRlLnZhbHVlKVxuXG4gICAgY29uc3QgY3VycmVudElnbm9yZSA9IGlnbm9yZVthdHRyaWJ1dGVOYW1lXSB8fCBpZ25vcmUuYXR0cmlidXRlXG4gICAgY29uc3QgY3VycmVudERlZmF1bHRJZ25vcmUgPSBkZWZhdWx0SWdub3JlW2F0dHJpYnV0ZU5hbWVdIHx8IGRlZmF1bHRJZ25vcmUuYXR0cmlidXRlXG4gICAgaWYgKGNoZWNrSWdub3JlKGN1cnJlbnRJZ25vcmUsIGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlLCBjdXJyZW50RGVmYXVsdElnbm9yZSkpIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgdmFyIHBhdHRlcm4gPSBgWyR7YXR0cmlidXRlTmFtZX09XCIke2F0dHJpYnV0ZVZhbHVlfVwiXWBcblxuICAgIGlmICgoL1xcYlxcZC8pLnRlc3QoYXR0cmlidXRlVmFsdWUpID09PSBmYWxzZSkge1xuICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUgPT09ICdpZCcpIHtcbiAgICAgICAgcGF0dGVybiA9IGAjJHthdHRyaWJ1dGVWYWx1ZX1gXG4gICAgICB9XG5cbiAgICAgIGlmIChhdHRyaWJ1dGVOYW1lID09PSAnY2xhc3MnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdleGNsdWRlPycsIGF0dHJpYnV0ZVZhbHVlLnNwbGl0KCcgJykubWFwKGMgPT4gKHtcbiAgICAgICAgICBleDogZXhjbHVkZS5jbGFzc05hbWUoYyksXG4gICAgICAgICAgYyxcbiAgICAgICAgfSkpKTtcbiAgICAgICAgbGV0IGNsYXNzTmFtZSA9IGV4Y2x1ZGVDbGFzc05hbWVQYXJ0cyhhdHRyaWJ1dGVWYWx1ZSwgZXhjbHVkZS5jbGFzc05hbWUpO1xuICAgICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJy4nKTtcbiAgICAgICAgcGF0dGVybiA9IGAuJHtjbGFzc05hbWV9YDtcbiAgICAgICAgY29uc29sZS5sb2coJ2FmdGVyIGV4Y2x1c2lvbicsIHBhdHRlcm4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwYXR0ZXJuXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cbi8qKlxuKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgY2xhc3NOYW1lICAgICAgQSBwYXJ0IG9mIGEgY2xhc3MgYXR0cmlidXRlIHZhbHVlXG4qIEBwYXJhbSAge0Z1bmN0aW9ufSAgICAgICBzaG91bGRFeGNsdWRlICBEZWNpZGVzIGlmIG5hbWUgaXMgYWNjZXB0ZWQgb3Igbm90XG4qIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWUgd2l0aCB1bndhbnRlZCBwYXJ0cyhuYW1lcykgZXhjbHVkZWRcbiovXG5mdW5jdGlvbiBleGNsdWRlQ2xhc3NOYW1lUGFydHMoY2xhc3NOYW1lLCBzaG91bGRFeGNsdWRlKSB7XG4gIGNvbnN0IGNsYXNzTmFtZXMgPSBjbGFzc05hbWUuc3BsaXQoJyAnKTtcblxuICByZXR1cm4gY2xhc3NOYW1lcy5maWx0ZXIobmFtZSA9PiB7XG4gICAgaWYgKCFuYW1lLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuICFzaG91bGRFeGNsdWRlKG5hbWUpO1xuICB9KS5qb2luKCcgJyk7XG59XG5cbi8qKlxuICogRXh0ZW5kIHBhdGggd2l0aCB0YWcgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBwYXJlbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrVGFnIChlbGVtZW50LCBpZ25vcmUsIHBhdGgsIHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSkge1xuICBjb25zdCBwYXR0ZXJuID0gZmluZFRhZ1BhdHRlcm4oZWxlbWVudCwgaWdub3JlKVxuICBpZiAocGF0dGVybikge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUocGF0dGVybilcbiAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHBhdGgudW5zaGlmdChwYXR0ZXJuKVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogTG9va3VwIHRhZyBpZGVudGlmaWVyXG4gKlxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBmaW5kVGFnUGF0dGVybiAoZWxlbWVudCwgaWdub3JlKSB7XG4gIGNvbnN0IHRhZ05hbWUgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKVxuICBpZiAoY2hlY2tJZ25vcmUoaWdub3JlLnRhZywgbnVsbCwgdGFnTmFtZSkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiB0YWdOYW1lXG59XG5cbi8qKlxuICogRXh0ZW5kIHBhdGggd2l0aCBzcGVjaWZpYyBjaGlsZCBpZGVudGlmaWVyXG4gKlxuICogTk9URTogJ2NoaWxkVGFncycgaXMgYSBjdXN0b20gcHJvcGVydHkgdG8gdXNlIGFzIGEgdmlldyBmaWx0ZXIgZm9yIHRhZ3MgdXNpbmcgJ2FkYXB0ZXIuanMnXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHByaW9yaXR5IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGlnbm9yZSAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHBhdGggICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0NoaWxkcyAocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgcGF0aCkge1xuICBjb25zdCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGVcbiAgY29uc3QgY2hpbGRyZW4gPSBwYXJlbnQuY2hpbGRUYWdzIHx8IHBhcmVudC5jaGlsZHJlblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV1cbiAgICBpZiAoY2hpbGQgPT09IGVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGNoaWxkUGF0dGVybiA9IGZpbmRQYXR0ZXJuKHByaW9yaXR5LCBjaGlsZCwgaWdub3JlKVxuICAgICAgaWYgKCFjaGlsZFBhdHRlcm4pIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUud2FybihgXG4gICAgICAgICAgRWxlbWVudCBjb3VsZG5cXCd0IGJlIG1hdGNoZWQgdGhyb3VnaCBzdHJpY3QgaWdub3JlIHBhdHRlcm4hXG4gICAgICAgIGAsIGNoaWxkLCBpZ25vcmUsIGNoaWxkUGF0dGVybilcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhdHRlcm4gPSBgPiAke2NoaWxkUGF0dGVybn06bnRoLWNoaWxkKCR7aSsxfSlgXG4gICAgICBwYXRoLnVuc2hpZnQocGF0dGVybilcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIExvb2t1cCBpZGVudGlmaWVyXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHByaW9yaXR5IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGlnbm9yZSAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBmaW5kUGF0dGVybiAocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSA9IHt9KSB7XG4gIHZhciBwYXR0ZXJuID0gZmluZEF0dHJpYnV0ZXNQYXR0ZXJuKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUpXG4gIGlmICghcGF0dGVybikge1xuICAgIHBhdHRlcm4gPSBmaW5kVGFnUGF0dGVybihlbGVtZW50LCBpZ25vcmUpXG4gIH1cbiAgcmV0dXJuIHBhdHRlcm5cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSB3aXRoIGN1c3RvbSBhbmQgZGVmYXVsdCBmdW5jdGlvbnNcbiAqXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gcHJlZGljYXRlICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge3N0cmluZz99ICBuYW1lICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7c3RyaW5nfSAgIHZhbHVlICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZGVmYXVsdFByZWRpY2F0ZSAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0lnbm9yZSAocHJlZGljYXRlLCBuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSkge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBjb25zdCBjaGVjayA9IHByZWRpY2F0ZSB8fCBkZWZhdWx0UHJlZGljYXRlXG4gIGlmICghY2hlY2spIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gY2hlY2sobmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpXG59XG4iXSwiZmlsZSI6Im1hdGNoLmpzIn0=
