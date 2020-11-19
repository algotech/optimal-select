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
        checkChilds(priority, element, ignore, exclude, path);
      }
    }

    element = element.parentNode;
    length = path.length;
  }

  if (element === root) {
    var pattern = findPattern(priority, element, ignore, exclude);
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

    var pattern = "[".concat(attributeName, "=\"").concat(attributeValue, "\"]"); // this if is commented because we have a better validation for this cases.
    // this should solve the optimisation/ignore issues for class names that were left as [class="all classes here"]
    // if ((/\b\d/).test(attributeValue) === false) {

    if (attributeName === 'id') {
      pattern = "#".concat(attributeValue);
    }

    if (attributeName === 'class') {
      var classNameAfterExclusion = excludeClassNameParts(attributeValue, exclude.className);
      classNameAfterExclusion = classNameAfterExclusion.trim().replace(/\s+/g, '.');
      pattern = classNameAfterExclusion.length ? ".".concat(classNameAfterExclusion) : null;
    } // }


    return pattern;
  }

  return null;
}
/**
* Takes parts that should be excluded out of the classname based on shouldExclude call result.
* A "part" is a substring of the class attribute value delimited by spaces.
*
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


function checkChilds(priority, element, ignore, exclude, path) {
  var parent = element.parentNode;
  var children = parent.childTags || parent.children;

  for (var i = 0, l = children.length; i < l; i++) {
    var child = children[i];

    if (child === element) {
      var childPattern = findPattern(priority, child, ignore, exclude);

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


function findPattern(priority, element, ignore, exclude) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hdGNoLmpzIl0sIm5hbWVzIjpbImRlZmF1bHRJZ25vcmUiLCJhdHRyaWJ1dGUiLCJhdHRyaWJ1dGVOYW1lIiwiaW5kZXhPZiIsIm1hdGNoIiwibm9kZSIsIm9wdGlvbnMiLCJyb290IiwiZG9jdW1lbnQiLCJza2lwIiwicHJpb3JpdHkiLCJpZ25vcmUiLCJleGNsdWRlIiwicGF0aCIsImVsZW1lbnQiLCJsZW5ndGgiLCJza2lwQ29tcGFyZSIsIkFycmF5IiwiaXNBcnJheSIsIm1hcCIsImVudHJ5Iiwic2tpcENoZWNrcyIsInNvbWUiLCJjb21wYXJlIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJ0eXBlIiwicHJlZGljYXRlIiwidG9TdHJpbmciLCJSZWdFeHAiLCJyZXBsYWNlIiwibmFtZSIsInZhbHVlIiwidGVzdCIsImlnbm9yZUF0dHJpYnV0ZSIsImRlZmF1bHRQcmVkaWNhdGUiLCJjaGVja0F0dHJpYnV0ZXMiLCJjaGVja1RhZyIsImNoZWNrQ2hpbGRzIiwicGFyZW50Tm9kZSIsInBhdHRlcm4iLCJmaW5kUGF0dGVybiIsInVuc2hpZnQiLCJqb2luIiwicGFyZW50IiwiZmluZEF0dHJpYnV0ZXNQYXR0ZXJuIiwibWF0Y2hlcyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJhdHRyaWJ1dGVzIiwic29ydGVkS2V5cyIsInNvcnQiLCJjdXJyIiwibmV4dCIsImN1cnJQb3MiLCJuZXh0UG9zIiwiaSIsImwiLCJrZXkiLCJhdHRyaWJ1dGVWYWx1ZSIsImN1cnJlbnRJZ25vcmUiLCJjdXJyZW50RGVmYXVsdElnbm9yZSIsImNoZWNrSWdub3JlIiwiY2xhc3NOYW1lQWZ0ZXJFeGNsdXNpb24iLCJleGNsdWRlQ2xhc3NOYW1lUGFydHMiLCJjbGFzc05hbWUiLCJ0cmltIiwic2hvdWxkRXhjbHVkZSIsImNsYXNzTmFtZXMiLCJzcGxpdCIsImZpbHRlciIsImZpbmRUYWdQYXR0ZXJuIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJ0YWdOYW1lIiwidG9Mb3dlckNhc2UiLCJ0YWciLCJjaGlsZHJlbiIsImNoaWxkVGFncyIsImNoaWxkIiwiY2hpbGRQYXR0ZXJuIiwiY29uc29sZSIsIndhcm4iLCJjaGVjayJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQU1BOztBQU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFJQSxJQUFNQSxhQUFhLEdBQUc7QUFDcEJDLEVBQUFBLFNBRG9CLHFCQUNUQyxhQURTLEVBQ007QUFDeEIsV0FBTyxDQUNMLE9BREssRUFFTCxjQUZLLEVBR0wscUJBSEssRUFJTEMsT0FKSyxDQUlHRCxhQUpILElBSW9CLENBQUMsQ0FKNUI7QUFLRDtBQVBtQixDQUF0QjtBQVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNlLFNBQVNFLEtBQVQsQ0FBZ0JDLElBQWhCLEVBQXNCQyxPQUF0QixFQUErQjtBQUFBLHNCQVF4Q0EsT0FSd0MsQ0FHMUNDLElBSDBDO0FBQUEsTUFHMUNBLElBSDBDLDhCQUduQ0MsUUFIbUM7QUFBQSxzQkFReENGLE9BUndDLENBSTFDRyxJQUowQztBQUFBLE1BSTFDQSxJQUowQyw4QkFJbkMsSUFKbUM7QUFBQSwwQkFReENILE9BUndDLENBSzFDSSxRQUwwQztBQUFBLE1BSzFDQSxRQUwwQyxrQ0FLL0IsQ0FBQyxJQUFELEVBQU8sT0FBUCxFQUFnQixNQUFoQixFQUF3QixLQUF4QixDQUwrQjtBQUFBLHdCQVF4Q0osT0FSd0MsQ0FNMUNLLE1BTjBDO0FBQUEsTUFNMUNBLE1BTjBDLGdDQU1qQyxFQU5pQztBQUFBLHlCQVF4Q0wsT0FSd0MsQ0FPMUNNLE9BUDBDO0FBQUEsTUFPMUNBLE9BUDBDLGlDQU9oQyxFQVBnQztBQVU1QyxNQUFNQyxJQUFJLEdBQUcsRUFBYjtBQUNBLE1BQUlDLE9BQU8sR0FBR1QsSUFBZDtBQUNBLE1BQUlVLE1BQU0sR0FBR0YsSUFBSSxDQUFDRSxNQUFsQjtBQUVBLE1BQU1DLFdBQVcsR0FBR1AsSUFBSSxJQUFJLENBQUNRLEtBQUssQ0FBQ0MsT0FBTixDQUFjVCxJQUFkLElBQXNCQSxJQUF0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Q0FBQzZCLE9BQUwsRUFBYztBQUNaQSxJQUFBQSxPQUFPLEdBQUc4QixjQUFjLENBQUN6RCxPQUFELEVBQVVILE1BQVYsQ0FBeEI7QUFDRDs7QUFDRCxTQUFPOEIsT0FBUDtBQUNEO0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFDQSxTQUFTcUIsV0FBVCxDQUFzQmxDLFNBQXRCLEVBQWlDSSxJQUFqQyxFQUF1Q0MsS0FBdkMsRUFBOENHLGdCQUE5QyxFQUFnRTtBQUM5RCxNQUFJLENBQUNILEtBQUwsRUFBWTtBQUNWLFdBQU8sSUFBUDtBQUNEOztBQUNELE1BQU1pRCxLQUFLLEdBQUd0RCxTQUFTLElBQUlRLGdCQUEzQjs7QUFDQSxNQUFJLENBQUM4QyxLQUFMLEVBQVk7QUFDVixXQUFPLEtBQVA7QUFDRDs7QUFDRCxTQUFPQSxLQUFLLENBQUNsRCxJQUFELEVBQU9DLEtBQVAsRUFBY0csZ0JBQWQsQ0FBWjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAjIE1hdGNoXG4gKlxuICogUmV0cmlldmUgc2VsZWN0b3IgZm9yIGEgbm9kZS5cbiAqL1xuXG5pbXBvcnQgeyBlc2NhcGVWYWx1ZSB9IGZyb20gJy4vdXRpbGl0aWVzJ1xuXG5jb25zdCBkZWZhdWx0SWdub3JlID0ge1xuICBhdHRyaWJ1dGUgKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJ3N0eWxlJyxcbiAgICAgICdkYXRhLXJlYWN0aWQnLFxuICAgICAgJ2RhdGEtcmVhY3QtY2hlY2tzdW0nXG4gICAgXS5pbmRleE9mKGF0dHJpYnV0ZU5hbWUpID4gLTFcbiAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgcGF0aCBvZiB0aGUgZWxlbWVudFxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBub2RlICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIG9wdGlvbnMgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbWF0Y2ggKG5vZGUsIG9wdGlvbnMpIHtcblxuICBjb25zdCB7XG4gICAgcm9vdCA9IGRvY3VtZW50LFxuICAgIHNraXAgPSBudWxsLFxuICAgIHByaW9yaXR5ID0gWydpZCcsICdjbGFzcycsICdocmVmJywgJ3NyYyddLFxuICAgIGlnbm9yZSA9IHt9LFxuICAgIGV4Y2x1ZGUgPSB7fSxcbiAgfSA9IG9wdGlvbnNcblxuICBjb25zdCBwYXRoID0gW11cbiAgdmFyIGVsZW1lbnQgPSBub2RlXG4gIHZhciBsZW5ndGggPSBwYXRoLmxlbmd0aFxuXG4gIGNvbnN0IHNraXBDb21wYXJlID0gc2tpcCAmJiAoQXJyYXkuaXNBcnJheShza2lwKSA/IHNraXAgOiBbc2tpcF0pLm1hcCgoZW50cnkpID0+IHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gKGVsZW1lbnQpID0+IGVsZW1lbnQgPT09IGVudHJ5XG4gICAgfVxuICAgIHJldHVybiBlbnRyeVxuICB9KVxuXG4gIGNvbnN0IHNraXBDaGVja3MgPSAoZWxlbWVudCkgPT4ge1xuICAgIHJldHVybiBza2lwICYmIHNraXBDb21wYXJlLnNvbWUoKGNvbXBhcmUpID0+IGNvbXBhcmUoZWxlbWVudCkpXG4gIH1cblxuICBPYmplY3Qua2V5cyhpZ25vcmUpLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICB2YXIgcHJlZGljYXRlID0gaWdub3JlW3R5cGVdXG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdmdW5jdGlvbicpIHJldHVyblxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnbnVtYmVyJykge1xuICAgICAgcHJlZGljYXRlID0gcHJlZGljYXRlLnRvU3RyaW5nKClcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBwcmVkaWNhdGUgPSBuZXcgUmVnRXhwKGVzY2FwZVZhbHVlKHByZWRpY2F0ZSkucmVwbGFjZSgvXFxcXC9nLCAnXFxcXFxcXFwnKSlcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdib29sZWFuJykge1xuICAgICAgcHJlZGljYXRlID0gcHJlZGljYXRlID8gLyg/OikvIDogLy5eL1xuICAgIH1cbiAgICAvLyBjaGVjayBjbGFzcy0vYXR0cmlidXRlbmFtZSBmb3IgcmVnZXhcbiAgICBpZ25vcmVbdHlwZV0gPSAobmFtZSwgdmFsdWUpID0+IHByZWRpY2F0ZS50ZXN0KHZhbHVlKVxuICB9KVxuXG4gIHZhciBpZ25vcmVBdHRyaWJ1dGUgPSBpZ25vcmUuYXR0cmlidXRlO1xuICBpZ25vcmUuYXR0cmlidXRlID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKSB7XG4gICAgcmV0dXJuIGlnbm9yZUF0dHJpYnV0ZSAmJiBpZ25vcmVBdHRyaWJ1dGUobmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpO1xuICB9O1xuXG4gIHdoaWxlIChlbGVtZW50ICE9PSByb290KSB7XG4gICAgaWYgKHNraXBDaGVja3MoZWxlbWVudCkgIT09IHRydWUpIHtcbiAgICAgIC8vIH4gZ2xvYmFsXG4gICAgICBpZiAoY2hlY2tBdHRyaWJ1dGVzKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUsIHBhdGgsIHJvb3QpKSBicmVha1xuICAgICAgaWYgKGNoZWNrVGFnKGVsZW1lbnQsIGlnbm9yZSwgcGF0aCwgcm9vdCkpIGJyZWFrXG5cbiAgICAgIC8vIH4gbG9jYWxcbiAgICAgIGNoZWNrQXR0cmlidXRlcyhwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlLCBwYXRoKVxuICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgY2hlY2tUYWcoZWxlbWVudCwgaWdub3JlLCBwYXRoKVxuICAgICAgfVxuXG4gICAgICAvLyBkZWZpbmUgb25seSBvbmUgcGFydCBlYWNoIGl0ZXJhdGlvblxuICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgY2hlY2tDaGlsZHMocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSwgcGF0aClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlXG4gICAgbGVuZ3RoID0gcGF0aC5sZW5ndGhcbiAgfVxuXG4gIGlmIChlbGVtZW50ID09PSByb290KSB7XG4gICAgY29uc3QgcGF0dGVybiA9IGZpbmRQYXR0ZXJuKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUpXG4gICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gIH1cblxuICByZXR1cm4gcGF0aC5qb2luKCcgJylcbn1cblxuLyoqXG4gKiBFeHRlbmQgcGF0aCB3aXRoIGF0dHJpYnV0ZSBpZGVudGlmaWVyXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHByaW9yaXR5IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGlnbm9yZSAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGV4Y2x1ZGUgIC0gRXhjbHVkZSBmdW5jdGlvbnMgZm9yIHBhcnRzIG9mIGF0dHJpYnV0ZXNcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwYXRoICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBwYXJlbnQgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tBdHRyaWJ1dGVzIChwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlLCBwYXRoLCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgY29uc3QgcGF0dGVybiA9IGZpbmRBdHRyaWJ1dGVzUGF0dGVybihwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlKVxuICBpZiAocGF0dGVybikge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBMb29rdXAgYXR0cmlidXRlIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcHJpb3JpdHkgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgaWdub3JlICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgZXhjbHVkZSAgLSBFeGNsdWRlIGZ1bmN0aW9ucyBmb3IgcGFydHMgb2YgYXR0cmlidXRlc1xuICogQHJldHVybiB7c3RyaW5nP30gICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBmaW5kQXR0cmlidXRlc1BhdHRlcm4gKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUpIHtcbiAgY29uc3QgYXR0cmlidXRlcyA9IGVsZW1lbnQuYXR0cmlidXRlc1xuICBjb25zdCBzb3J0ZWRLZXlzID0gT2JqZWN0LmtleXMoYXR0cmlidXRlcykuc29ydCgoY3VyciwgbmV4dCkgPT4ge1xuICAgIGNvbnN0IGN1cnJQb3MgPSBwcmlvcml0eS5pbmRleE9mKGF0dHJpYnV0ZXNbY3Vycl0ubmFtZSlcbiAgICBjb25zdCBuZXh0UG9zID0gcHJpb3JpdHkuaW5kZXhPZihhdHRyaWJ1dGVzW25leHRdLm5hbWUpXG4gICAgaWYgKG5leHRQb3MgPT09IC0xKSB7XG4gICAgICBpZiAoY3VyclBvcyA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIDBcbiAgICAgIH1cbiAgICAgIHJldHVybiAtMVxuICAgIH1cbiAgICByZXR1cm4gY3VyclBvcyAtIG5leHRQb3NcbiAgfSlcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IHNvcnRlZEtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY29uc3Qga2V5ID0gc29ydGVkS2V5c1tpXVxuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNba2V5XVxuICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUgPSBhdHRyaWJ1dGUubmFtZVxuICAgIGNvbnN0IGF0dHJpYnV0ZVZhbHVlID0gZXNjYXBlVmFsdWUoYXR0cmlidXRlLnZhbHVlKVxuXG4gICAgY29uc3QgY3VycmVudElnbm9yZSA9IGlnbm9yZVthdHRyaWJ1dGVOYW1lXSB8fCBpZ25vcmUuYXR0cmlidXRlXG4gICAgY29uc3QgY3VycmVudERlZmF1bHRJZ25vcmUgPSBkZWZhdWx0SWdub3JlW2F0dHJpYnV0ZU5hbWVdIHx8IGRlZmF1bHRJZ25vcmUuYXR0cmlidXRlXG5cbiAgICBpZiAoY2hlY2tJZ25vcmUoY3VycmVudElnbm9yZSwgYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWUsIGN1cnJlbnREZWZhdWx0SWdub3JlKSkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICB2YXIgcGF0dGVybiA9IGBbJHthdHRyaWJ1dGVOYW1lfT1cIiR7YXR0cmlidXRlVmFsdWV9XCJdYFxuXG4gICAgLy8gdGhpcyBpZiBpcyBjb21tZW50ZWQgYmVjYXVzZSB3ZSBoYXZlIGEgYmV0dGVyIHZhbGlkYXRpb24gZm9yIHRoaXMgY2FzZXMuXG4gICAgLy8gdGhpcyBzaG91bGQgc29sdmUgdGhlIG9wdGltaXNhdGlvbi9pZ25vcmUgaXNzdWVzIGZvciBjbGFzcyBuYW1lcyB0aGF0IHdlcmUgbGVmdCBhcyBbY2xhc3M9XCJhbGwgY2xhc3NlcyBoZXJlXCJdXG4gICAgLy8gaWYgKCgvXFxiXFxkLykudGVzdChhdHRyaWJ1dGVWYWx1ZSkgPT09IGZhbHNlKSB7XG4gICAgaWYgKGF0dHJpYnV0ZU5hbWUgPT09ICdpZCcpIHtcbiAgICAgIHBhdHRlcm4gPSBgIyR7YXR0cmlidXRlVmFsdWV9YFxuICAgIH1cblxuICAgIGlmIChhdHRyaWJ1dGVOYW1lID09PSAnY2xhc3MnKSB7XG4gICAgICBsZXQgY2xhc3NOYW1lQWZ0ZXJFeGNsdXNpb24gPSBleGNsdWRlQ2xhc3NOYW1lUGFydHMoYXR0cmlidXRlVmFsdWUsIGV4Y2x1ZGUuY2xhc3NOYW1lKTtcbiAgICAgIGNsYXNzTmFtZUFmdGVyRXhjbHVzaW9uID0gY2xhc3NOYW1lQWZ0ZXJFeGNsdXNpb24udHJpbSgpLnJlcGxhY2UoL1xccysvZywgJy4nKTtcbiAgICAgIHBhdHRlcm4gPSBjbGFzc05hbWVBZnRlckV4Y2x1c2lvbi5sZW5ndGggPyBgLiR7Y2xhc3NOYW1lQWZ0ZXJFeGNsdXNpb259YCA6IG51bGw7XG4gICAgfVxuICAgIC8vIH1cblxuICAgIHJldHVybiBwYXR0ZXJuXG4gIH1cblxuICByZXR1cm4gbnVsbFxufVxuLyoqXG4qIFRha2VzIHBhcnRzIHRoYXQgc2hvdWxkIGJlIGV4Y2x1ZGVkIG91dCBvZiB0aGUgY2xhc3NuYW1lIGJhc2VkIG9uIHNob3VsZEV4Y2x1ZGUgY2FsbCByZXN1bHQuXG4qIEEgXCJwYXJ0XCIgaXMgYSBzdWJzdHJpbmcgb2YgdGhlIGNsYXNzIGF0dHJpYnV0ZSB2YWx1ZSBkZWxpbWl0ZWQgYnkgc3BhY2VzLlxuKlxuKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgY2xhc3NOYW1lICAgICAgQSBwYXJ0IG9mIGEgY2xhc3MgYXR0cmlidXRlIHZhbHVlXG4qIEBwYXJhbSAge0Z1bmN0aW9ufSAgICAgICBzaG91bGRFeGNsdWRlICBEZWNpZGVzIGlmIG5hbWUgaXMgYWNjZXB0ZWQgb3Igbm90XG4qIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWUgd2l0aCB1bndhbnRlZCBwYXJ0cyhuYW1lcykgZXhjbHVkZWRcbiovXG5mdW5jdGlvbiBleGNsdWRlQ2xhc3NOYW1lUGFydHMoY2xhc3NOYW1lLCBzaG91bGRFeGNsdWRlKSB7XG4gIGNvbnN0IGNsYXNzTmFtZXMgPSBjbGFzc05hbWUuc3BsaXQoJyAnKTtcblxuICByZXR1cm4gY2xhc3NOYW1lcy5maWx0ZXIobmFtZSA9PiB7XG4gICAgaWYgKCFuYW1lLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuICFzaG91bGRFeGNsdWRlKG5hbWUpO1xuICB9KS5qb2luKCcgJyk7XG59XG5cbi8qKlxuICogRXh0ZW5kIHBhdGggd2l0aCB0YWcgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBwYXJlbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrVGFnIChlbGVtZW50LCBpZ25vcmUsIHBhdGgsIHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSkge1xuICBjb25zdCBwYXR0ZXJuID0gZmluZFRhZ1BhdHRlcm4oZWxlbWVudCwgaWdub3JlKVxuICBpZiAocGF0dGVybikge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUocGF0dGVybilcbiAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHBhdGgudW5zaGlmdChwYXR0ZXJuKVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogTG9va3VwIHRhZyBpZGVudGlmaWVyXG4gKlxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBmaW5kVGFnUGF0dGVybiAoZWxlbWVudCwgaWdub3JlKSB7XG4gIGNvbnN0IHRhZ05hbWUgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKVxuICBpZiAoY2hlY2tJZ25vcmUoaWdub3JlLnRhZywgbnVsbCwgdGFnTmFtZSkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiB0YWdOYW1lXG59XG5cbi8qKlxuICogRXh0ZW5kIHBhdGggd2l0aCBzcGVjaWZpYyBjaGlsZCBpZGVudGlmaWVyXG4gKlxuICogTk9URTogJ2NoaWxkVGFncycgaXMgYSBjdXN0b20gcHJvcGVydHkgdG8gdXNlIGFzIGEgdmlldyBmaWx0ZXIgZm9yIHRhZ3MgdXNpbmcgJ2FkYXB0ZXIuanMnXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHByaW9yaXR5IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGlnbm9yZSAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHBhdGggICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0NoaWxkcyAocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSwgcGF0aCkge1xuICBjb25zdCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGVcbiAgY29uc3QgY2hpbGRyZW4gPSBwYXJlbnQuY2hpbGRUYWdzIHx8IHBhcmVudC5jaGlsZHJlblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV1cbiAgICBpZiAoY2hpbGQgPT09IGVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGNoaWxkUGF0dGVybiA9IGZpbmRQYXR0ZXJuKHByaW9yaXR5LCBjaGlsZCwgaWdub3JlLCBleGNsdWRlKVxuICAgICAgaWYgKCFjaGlsZFBhdHRlcm4pIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUud2FybihgXG4gICAgICAgICAgRWxlbWVudCBjb3VsZG5cXCd0IGJlIG1hdGNoZWQgdGhyb3VnaCBzdHJpY3QgaWdub3JlIHBhdHRlcm4hXG4gICAgICAgIGAsIGNoaWxkLCBpZ25vcmUsIGNoaWxkUGF0dGVybilcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhdHRlcm4gPSBgPiAke2NoaWxkUGF0dGVybn06bnRoLWNoaWxkKCR7aSsxfSlgXG4gICAgICBwYXRoLnVuc2hpZnQocGF0dGVybilcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIExvb2t1cCBpZGVudGlmaWVyXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHByaW9yaXR5IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGlnbm9yZSAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBmaW5kUGF0dGVybiAocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSkge1xuICB2YXIgcGF0dGVybiA9IGZpbmRBdHRyaWJ1dGVzUGF0dGVybihwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlKVxuICBpZiAoIXBhdHRlcm4pIHtcbiAgICBwYXR0ZXJuID0gZmluZFRhZ1BhdHRlcm4oZWxlbWVudCwgaWdub3JlKVxuICB9XG4gIHJldHVybiBwYXR0ZXJuXG59XG5cbi8qKlxuICogVmFsaWRhdGUgd2l0aCBjdXN0b20gYW5kIGRlZmF1bHQgZnVuY3Rpb25zXG4gKlxuICogQHBhcmFtICB7RnVuY3Rpb259IHByZWRpY2F0ZSAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtzdHJpbmc/fSAgbmFtZSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge3N0cmluZ30gICB2YWx1ZSAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7RnVuY3Rpb259IGRlZmF1bHRQcmVkaWNhdGUgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tJZ25vcmUgKHByZWRpY2F0ZSwgbmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpIHtcbiAgaWYgKCF2YWx1ZSkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgY29uc3QgY2hlY2sgPSBwcmVkaWNhdGUgfHwgZGVmYXVsdFByZWRpY2F0ZVxuICBpZiAoIWNoZWNrKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIGNoZWNrKG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKVxufVxuIl0sImZpbGUiOiJtYXRjaC5qcyJ9
