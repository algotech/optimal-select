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

    if (nextPos === -1 && currPos === -1) {
      return 0;
    }

    if (nextPos === -1 && currPos !== -1) {
      return -1;
    }

    if (nextPos !== -1 && currPos === -1) {
      return 1;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hdGNoLmpzIl0sIm5hbWVzIjpbImRlZmF1bHRJZ25vcmUiLCJhdHRyaWJ1dGUiLCJhdHRyaWJ1dGVOYW1lIiwiaW5kZXhPZiIsIm1hdGNoIiwibm9kZSIsIm9wdGlvbnMiLCJyb290IiwiZG9jdW1lbnQiLCJza2lwIiwicHJpb3JpdHkiLCJpZ25vcmUiLCJleGNsdWRlIiwicGF0aCIsImVsZW1lbnQiLCJsZW5ndGgiLCJza2lwQ29tcGFyZSIsIkFycmF5IiwiaXNBcnJheSIsIm1hcCIsImVudHJ5Iiwic2tpcENoZWNrcyIsInNvbWUiLCJjb21wYXJlIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJ0eXBlIiwicHJlZGljYXRlIiwidG9TdHJpbmciLCJSZWdFeHAiLCJyZXBsYWNlIiwibmFtZSIsInZhbHVlIiwidGVzdCIsImlnbm9yZUF0dHJpYnV0ZSIsImRlZmF1bHRQcmVkaWNhdGUiLCJjaGVja0F0dHJpYnV0ZXMiLCJjaGVja1RhZyIsImNoZWNrQ2hpbGRzIiwicGFyZW50Tm9kZSIsInBhdHRlcm4iLCJmaW5kUGF0dGVybiIsInVuc2hpZnQiLCJqb2luIiwicGFyZW50IiwiZmluZEF0dHJpYnV0ZXNQYXR0ZXJuIiwibWF0Y2hlcyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJhdHRyaWJ1dGVzIiwic29ydGVkS2V5cyIsInNvcnQiLCJjdXJyIiwibmV4dCIsImN1cnJQb3MiLCJuZXh0UG9zIiwiaSIsImwiLCJrZXkiLCJhdHRyaWJ1dGVWYWx1ZSIsImN1cnJlbnRJZ25vcmUiLCJjdXJyZW50RGVmYXVsdElnbm9yZSIsImNoZWNrSWdub3JlIiwiY2xhc3NOYW1lQWZ0ZXJFeGNsdXNpb24iLCJleGNsdWRlQ2xhc3NOYW1lUGFydHMiLCJjbGFzc05hbWUiLCJ0cmltIiwic2hvdWxkRXhjbHVkZSIsImNsYXNzTmFtZXMiLCJzcGxpdCIsImZpbHRlciIsImZpbmRUYWdQYXR0ZXJuIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJ0YWdOYW1lIiwidG9Mb3dlckNhc2UiLCJ0YWciLCJjaGlsZHJlbiIsImNoaWxkVGFncyIsImNoaWxkIiwiY2hpbGRQYXR0ZXJuIiwiY29uc29sZSIsIndhcm4iLCJjaGVjayJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQU1BOztBQU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFJQSxJQUFNQSxhQUFhLEdBQUc7QUFDcEJDLEVBQUFBLFNBRG9CLHFCQUNUQyxhQURTLEVBQ007QUFDeEIsV0FBTyxDQUNMLE9BREssRUFFTCxjQUZLLEVBR0wscUJBSEssRUFJTEMsT0FKSyxDQUlHRCxhQUpILElBSW9CLENBQUMsQ0FKNUI7QUFLRDtBQVBtQixDQUF0QjtBQVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNlLFNBQVNFLEtBQVQsQ0FBZ0JDLElBQWhCLEVBQXNCQyxPQUF0QixFQUErQjtBQUFBLHNCQVF4Q0EsT0FSd0MsQ0FHMUNDLElBSDBDO0FBQUEsTUFHMUNBLElBSDBDLDhCQUduQ0MsUUFIbUM7QUFBQSxzQkFReENGLE9BUndDLENBSTFDRyxJQUowQztBQUFBLE1BSTFDQSxJQUowQyw4QkFJbkMsSUFKbUM7QUFBQSwwQkFReENILE9BUndDLENBSzFDSSxRQUwwQztBQUFBLE1BSzFDQSxRQUwwQyxrQ0FLL0IsQ0FBQyxJQUFELEVBQU8sT0FBUCxFQUFnQixNQUFoQixFQUF3QixLQUF4QixDQUwrQjtBQUFBLHdCQVF4Q0osT0FSd0MsQ0FNMUNLLE1BTjBDO0FBQUEsTUFNMUNBLE1BTjBDLGdDQU1qQyxFQU5pQztBQUFBLHlCQVF4Q0wsT0FSd0MsQ0FPMUNNLE9BUDBDO0FBQUEsTUFPMUNBLE9BUDBDLGlDQU9oQyxFQVBnQztBQVU1QyxNQUFNQyxJQUFJLEdBQUcsRUFBYjtBQUNBLE1BQUlDLE9BQU8sR0FBR1QsSUFBZDtBQUNBLE1BQUlVLE1BQU0sR0FBR0YsSUFBSSxDQUFDRSxNQUFsQjtBQUVBLE1BQU1DLFdBQVcsR0FBR1AsSUFBSSxJQUFJLENBQUNRLEtBQUssQ0FBQ0MsT0FBTixDQUFjVCxJQUFkLElBQXNCQSxJQUF0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LEVBQWdDSSxPQUFoQyxFQUF5Q0gsTUFBekMsRUFBaURDLE9BQWpELEVBQTBEO0FBQ3hELE1BQUk2QixPQUFPLEdBQUdLLHFCQUFxQixDQUFDcEMsUUFBRCxFQUFXSSxPQUFYLEVBQW9CSCxNQUFwQixFQUE0QkMsT0FBNUIsQ0FBbkM7O0FBQ0EsTUFBSSxDQUFDNkIsT0FBTCxFQUFjO0FBQ1pBLElBQUFBLE9BQU8sR0FBRzhCLGNBQWMsQ0FBQ3pELE9BQUQsRUFBVUgsTUFBVixDQUF4QjtBQUNEOztBQUNELFNBQU84QixPQUFQO0FBQ0Q7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUNBLFNBQVNxQixXQUFULENBQXNCbEMsU0FBdEIsRUFBaUNJLElBQWpDLEVBQXVDQyxLQUF2QyxFQUE4Q0csZ0JBQTlDLEVBQWdFO0FBQzlELE1BQUksQ0FBQ0gsS0FBTCxFQUFZO0FBQ1YsV0FBTyxJQUFQO0FBQ0Q7O0FBQ0QsTUFBTWlELEtBQUssR0FBR3RELFNBQVMsSUFBSVEsZ0JBQTNCOztBQUNBLE1BQUksQ0FBQzhDLEtBQUwsRUFBWTtBQUNWLFdBQU8sS0FBUDtBQUNEOztBQUNELFNBQU9BLEtBQUssQ0FBQ2xELElBQUQsRUFBT0MsS0FBUCxFQUFjRyxnQkFBZCxDQUFaO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqICMgTWF0Y2hcbiAqXG4gKiBSZXRyaWV2ZSBzZWxlY3RvciBmb3IgYSBub2RlLlxuICovXG5cbmltcG9ydCB7IGVzY2FwZVZhbHVlIH0gZnJvbSAnLi91dGlsaXRpZXMnXG5cbmNvbnN0IGRlZmF1bHRJZ25vcmUgPSB7XG4gIGF0dHJpYnV0ZSAoYXR0cmlidXRlTmFtZSkge1xuICAgIHJldHVybiBbXG4gICAgICAnc3R5bGUnLFxuICAgICAgJ2RhdGEtcmVhY3RpZCcsXG4gICAgICAnZGF0YS1yZWFjdC1jaGVja3N1bSdcbiAgICBdLmluZGV4T2YoYXR0cmlidXRlTmFtZSkgPiAtMVxuICB9XG59XG5cbi8qKlxuICogR2V0IHRoZSBwYXRoIG9mIHRoZSBlbGVtZW50XG4gKlxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IG5vZGUgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgb3B0aW9ucyAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtYXRjaCAobm9kZSwgb3B0aW9ucykge1xuXG4gIGNvbnN0IHtcbiAgICByb290ID0gZG9jdW1lbnQsXG4gICAgc2tpcCA9IG51bGwsXG4gICAgcHJpb3JpdHkgPSBbJ2lkJywgJ2NsYXNzJywgJ2hyZWYnLCAnc3JjJ10sXG4gICAgaWdub3JlID0ge30sXG4gICAgZXhjbHVkZSA9IHt9LFxuICB9ID0gb3B0aW9uc1xuXG4gIGNvbnN0IHBhdGggPSBbXVxuICB2YXIgZWxlbWVudCA9IG5vZGVcbiAgdmFyIGxlbmd0aCA9IHBhdGgubGVuZ3RoXG5cbiAgY29uc3Qgc2tpcENvbXBhcmUgPSBza2lwICYmIChBcnJheS5pc0FycmF5KHNraXApID8gc2tpcCA6IFtza2lwXSkubWFwKChlbnRyeSkgPT4ge1xuICAgIGlmICh0eXBlb2YgZW50cnkgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiAoZWxlbWVudCkgPT4gZWxlbWVudCA9PT0gZW50cnlcbiAgICB9XG4gICAgcmV0dXJuIGVudHJ5XG4gIH0pXG5cbiAgY29uc3Qgc2tpcENoZWNrcyA9IChlbGVtZW50KSA9PiB7XG4gICAgcmV0dXJuIHNraXAgJiYgc2tpcENvbXBhcmUuc29tZSgoY29tcGFyZSkgPT4gY29tcGFyZShlbGVtZW50KSlcbiAgfVxuXG4gIE9iamVjdC5rZXlzKGlnbm9yZSkuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgIHZhciBwcmVkaWNhdGUgPSBpZ25vcmVbdHlwZV1cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuXG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdudW1iZXInKSB7XG4gICAgICBwcmVkaWNhdGUgPSBwcmVkaWNhdGUudG9TdHJpbmcoKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHByZWRpY2F0ZSA9IG5ldyBSZWdFeHAoZXNjYXBlVmFsdWUocHJlZGljYXRlKS5yZXBsYWNlKC9cXFxcL2csICdcXFxcXFxcXCcpKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBwcmVkaWNhdGUgPSBwcmVkaWNhdGUgPyAvKD86KS8gOiAvLl4vXG4gICAgfVxuICAgIC8vIGNoZWNrIGNsYXNzLS9hdHRyaWJ1dGVuYW1lIGZvciByZWdleFxuICAgIGlnbm9yZVt0eXBlXSA9IChuYW1lLCB2YWx1ZSkgPT4gcHJlZGljYXRlLnRlc3QodmFsdWUpXG4gIH0pXG5cbiAgdmFyIGlnbm9yZUF0dHJpYnV0ZSA9IGlnbm9yZS5hdHRyaWJ1dGU7XG4gIGlnbm9yZS5hdHRyaWJ1dGUgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpIHtcbiAgICByZXR1cm4gaWdub3JlQXR0cmlidXRlICYmIGlnbm9yZUF0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSk7XG4gIH07XG5cbiAgd2hpbGUgKGVsZW1lbnQgIT09IHJvb3QpIHtcbiAgICBpZiAoc2tpcENoZWNrcyhlbGVtZW50KSAhPT0gdHJ1ZSkge1xuICAgICAgLy8gfiBnbG9iYWxcbiAgICAgIGlmIChjaGVja0F0dHJpYnV0ZXMocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSwgcGF0aCwgcm9vdCkpIGJyZWFrXG4gICAgICBpZiAoY2hlY2tUYWcoZWxlbWVudCwgaWdub3JlLCBwYXRoLCByb290KSkgYnJlYWtcblxuICAgICAgLy8gfiBsb2NhbFxuICAgICAgY2hlY2tBdHRyaWJ1dGVzKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUsIHBhdGgpXG4gICAgICBpZiAocGF0aC5sZW5ndGggPT09IGxlbmd0aCkge1xuICAgICAgICBjaGVja1RhZyhlbGVtZW50LCBpZ25vcmUsIHBhdGgpXG4gICAgICB9XG5cbiAgICAgIC8vIGRlZmluZSBvbmx5IG9uZSBwYXJ0IGVhY2ggaXRlcmF0aW9uXG4gICAgICBpZiAocGF0aC5sZW5ndGggPT09IGxlbmd0aCkge1xuICAgICAgICBjaGVja0NoaWxkcyhwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlLCBwYXRoKVxuICAgICAgfVxuICAgIH1cblxuICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGVcbiAgICBsZW5ndGggPSBwYXRoLmxlbmd0aFxuICB9XG5cbiAgaWYgKGVsZW1lbnQgPT09IHJvb3QpIHtcbiAgICBjb25zdCBwYXR0ZXJuID0gZmluZFBhdHRlcm4ocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSlcbiAgICBwYXRoLnVuc2hpZnQocGF0dGVybilcbiAgfVxuXG4gIHJldHVybiBwYXRoLmpvaW4oJyAnKVxufVxuXG4vKipcbiAqIEV4dGVuZCBwYXRoIHdpdGggYXR0cmlidXRlIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcHJpb3JpdHkgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgaWdub3JlICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgZXhjbHVkZSAgLSBFeGNsdWRlIGZ1bmN0aW9ucyBmb3IgcGFydHMgb2YgYXR0cmlidXRlc1xuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHBhdGggICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIHBhcmVudCAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0F0dHJpYnV0ZXMgKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUsIHBhdGgsIHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSkge1xuICBjb25zdCBwYXR0ZXJuID0gZmluZEF0dHJpYnV0ZXNQYXR0ZXJuKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUpXG4gIGlmIChwYXR0ZXJuKSB7XG4gICAgY29uc3QgbWF0Y2hlcyA9IHBhcmVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICBwYXRoLnVuc2hpZnQocGF0dGVybilcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIExvb2t1cCBhdHRyaWJ1dGUgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBleGNsdWRlICAtIEV4Y2x1ZGUgZnVuY3Rpb25zIGZvciBwYXJ0cyBvZiBhdHRyaWJ1dGVzXG4gKiBAcmV0dXJuIHtzdHJpbmc/fSAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGZpbmRBdHRyaWJ1dGVzUGF0dGVybiAocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSkge1xuICBjb25zdCBhdHRyaWJ1dGVzID0gZWxlbWVudC5hdHRyaWJ1dGVzXG4gIGNvbnN0IHNvcnRlZEtleXMgPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5zb3J0KChjdXJyLCBuZXh0KSA9PiB7XG4gICAgY29uc3QgY3VyclBvcyA9IHByaW9yaXR5LmluZGV4T2YoYXR0cmlidXRlc1tjdXJyXS5uYW1lKVxuICAgIGNvbnN0IG5leHRQb3MgPSBwcmlvcml0eS5pbmRleE9mKGF0dHJpYnV0ZXNbbmV4dF0ubmFtZSlcblxuICAgIGlmIChuZXh0UG9zID09PSAtMSAmJiBjdXJyUG9zID09PSAtMSkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgaWYgKG5leHRQb3MgPT09IC0xICYmIGN1cnJQb3MgIT09IC0xKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG4gICAgaWYgKG5leHRQb3MgIT09IC0xICYmIGN1cnJQb3MgPT09IC0xKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3VyclBvcyAtIG5leHRQb3M7XG4gIH0pXG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBzb3J0ZWRLZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IGtleSA9IHNvcnRlZEtleXNbaV1cbiAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2tleV1cbiAgICBjb25zdCBhdHRyaWJ1dGVOYW1lID0gYXR0cmlidXRlLm5hbWVcbiAgICBjb25zdCBhdHRyaWJ1dGVWYWx1ZSA9IGVzY2FwZVZhbHVlKGF0dHJpYnV0ZS52YWx1ZSlcblxuICAgIGNvbnN0IGN1cnJlbnRJZ25vcmUgPSBpZ25vcmVbYXR0cmlidXRlTmFtZV0gfHwgaWdub3JlLmF0dHJpYnV0ZVxuICAgIGNvbnN0IGN1cnJlbnREZWZhdWx0SWdub3JlID0gZGVmYXVsdElnbm9yZVthdHRyaWJ1dGVOYW1lXSB8fCBkZWZhdWx0SWdub3JlLmF0dHJpYnV0ZVxuXG4gICAgaWYgKGNoZWNrSWdub3JlKGN1cnJlbnRJZ25vcmUsIGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlLCBjdXJyZW50RGVmYXVsdElnbm9yZSkpIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgdmFyIHBhdHRlcm4gPSBgWyR7YXR0cmlidXRlTmFtZX09XCIke2F0dHJpYnV0ZVZhbHVlfVwiXWBcblxuICAgIC8vIHRoaXMgaWYgaXMgY29tbWVudGVkIGJlY2F1c2Ugd2UgaGF2ZSBhIGJldHRlciB2YWxpZGF0aW9uIGZvciB0aGlzIGNhc2VzLlxuICAgIC8vIHRoaXMgc2hvdWxkIHNvbHZlIHRoZSBvcHRpbWlzYXRpb24vaWdub3JlIGlzc3VlcyBmb3IgY2xhc3MgbmFtZXMgdGhhdCB3ZXJlIGxlZnQgYXMgW2NsYXNzPVwiYWxsIGNsYXNzZXMgaGVyZVwiXVxuICAgIC8vIGlmICgoL1xcYlxcZC8pLnRlc3QoYXR0cmlidXRlVmFsdWUpID09PSBmYWxzZSkge1xuICAgIGlmIChhdHRyaWJ1dGVOYW1lID09PSAnaWQnKSB7XG4gICAgICBwYXR0ZXJuID0gYCMke2F0dHJpYnV0ZVZhbHVlfWBcbiAgICB9XG5cbiAgICBpZiAoYXR0cmlidXRlTmFtZSA9PT0gJ2NsYXNzJykge1xuICAgICAgbGV0IGNsYXNzTmFtZUFmdGVyRXhjbHVzaW9uID0gZXhjbHVkZUNsYXNzTmFtZVBhcnRzKGF0dHJpYnV0ZVZhbHVlLCBleGNsdWRlLmNsYXNzTmFtZSk7XG4gICAgICBjbGFzc05hbWVBZnRlckV4Y2x1c2lvbiA9IGNsYXNzTmFtZUFmdGVyRXhjbHVzaW9uLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcuJyk7XG4gICAgICBwYXR0ZXJuID0gY2xhc3NOYW1lQWZ0ZXJFeGNsdXNpb24ubGVuZ3RoID8gYC4ke2NsYXNzTmFtZUFmdGVyRXhjbHVzaW9ufWAgOiBudWxsO1xuICAgIH1cbiAgICAvLyB9XG5cbiAgICByZXR1cm4gcGF0dGVyblxuICB9XG5cbiAgcmV0dXJuIG51bGxcbn1cbi8qKlxuKiBUYWtlcyBwYXJ0cyB0aGF0IHNob3VsZCBiZSBleGNsdWRlZCBvdXQgb2YgdGhlIGNsYXNzbmFtZSBiYXNlZCBvbiBzaG91bGRFeGNsdWRlIGNhbGwgcmVzdWx0LlxuKiBBIFwicGFydFwiIGlzIGEgc3Vic3RyaW5nIG9mIHRoZSBjbGFzcyBhdHRyaWJ1dGUgdmFsdWUgZGVsaW1pdGVkIGJ5IHNwYWNlcy5cbipcbiogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgIGNsYXNzTmFtZSAgICAgIEEgcGFydCBvZiBhIGNsYXNzIGF0dHJpYnV0ZSB2YWx1ZVxuKiBAcGFyYW0gIHtGdW5jdGlvbn0gICAgICAgc2hvdWxkRXhjbHVkZSAgRGVjaWRlcyBpZiBuYW1lIGlzIGFjY2VwdGVkIG9yIG5vdFxuKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lIHdpdGggdW53YW50ZWQgcGFydHMobmFtZXMpIGV4Y2x1ZGVkXG4qL1xuZnVuY3Rpb24gZXhjbHVkZUNsYXNzTmFtZVBhcnRzKGNsYXNzTmFtZSwgc2hvdWxkRXhjbHVkZSkge1xuICBjb25zdCBjbGFzc05hbWVzID0gY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG5cbiAgcmV0dXJuIGNsYXNzTmFtZXMuZmlsdGVyKG5hbWUgPT4ge1xuICAgIGlmICghbmFtZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiAhc2hvdWxkRXhjbHVkZShuYW1lKTtcbiAgfSkuam9pbignICcpO1xufVxuXG4vKipcbiAqIEV4dGVuZCBwYXRoIHdpdGggdGFnIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgcGFyZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja1RhZyAoZWxlbWVudCwgaWdub3JlLCBwYXRoLCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgY29uc3QgcGF0dGVybiA9IGZpbmRUYWdQYXR0ZXJuKGVsZW1lbnQsIGlnbm9yZSlcbiAgaWYgKHBhdHRlcm4pIHtcbiAgICBjb25zdCBtYXRjaGVzID0gcGFyZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHBhdHRlcm4pXG4gICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICBwYXRoLnVuc2hpZnQocGF0dGVybilcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIExvb2t1cCB0YWcgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gZmluZFRhZ1BhdHRlcm4gKGVsZW1lbnQsIGlnbm9yZSkge1xuICBjb25zdCB0YWdOYW1lID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS50YWcsIG51bGwsIHRhZ05hbWUpKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICByZXR1cm4gdGFnTmFtZVxufVxuXG4vKipcbiAqIEV4dGVuZCBwYXRoIHdpdGggc3BlY2lmaWMgY2hpbGQgaWRlbnRpZmllclxuICpcbiAqIE5PVEU6ICdjaGlsZFRhZ3MnIGlzIGEgY3VzdG9tIHByb3BlcnR5IHRvIHVzZSBhcyBhIHZpZXcgZmlsdGVyIGZvciB0YWdzIHVzaW5nICdhZGFwdGVyLmpzJ1xuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwYXRoICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDaGlsZHMgKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUsIHBhdGgpIHtcbiAgY29uc3QgcGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlXG4gIGNvbnN0IGNoaWxkcmVuID0gcGFyZW50LmNoaWxkVGFncyB8fCBwYXJlbnQuY2hpbGRyZW5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgaWYgKGNoaWxkID09PSBlbGVtZW50KSB7XG4gICAgICBjb25zdCBjaGlsZFBhdHRlcm4gPSBmaW5kUGF0dGVybihwcmlvcml0eSwgY2hpbGQsIGlnbm9yZSwgZXhjbHVkZSlcbiAgICAgIGlmICghY2hpbGRQYXR0ZXJuKSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oYFxuICAgICAgICAgIEVsZW1lbnQgY291bGRuXFwndCBiZSBtYXRjaGVkIHRocm91Z2ggc3RyaWN0IGlnbm9yZSBwYXR0ZXJuIVxuICAgICAgICBgLCBjaGlsZCwgaWdub3JlLCBjaGlsZFBhdHRlcm4pXG4gICAgICB9XG4gICAgICBjb25zdCBwYXR0ZXJuID0gYD4gJHtjaGlsZFBhdHRlcm59Om50aC1jaGlsZCgke2krMX0pYFxuICAgICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBMb29rdXAgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gZmluZFBhdHRlcm4gKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUpIHtcbiAgdmFyIHBhdHRlcm4gPSBmaW5kQXR0cmlidXRlc1BhdHRlcm4ocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSlcbiAgaWYgKCFwYXR0ZXJuKSB7XG4gICAgcGF0dGVybiA9IGZpbmRUYWdQYXR0ZXJuKGVsZW1lbnQsIGlnbm9yZSlcbiAgfVxuICByZXR1cm4gcGF0dGVyblxufVxuXG4vKipcbiAqIFZhbGlkYXRlIHdpdGggY3VzdG9tIGFuZCBkZWZhdWx0IGZ1bmN0aW9uc1xuICpcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBwcmVkaWNhdGUgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7c3RyaW5nP30gIG5hbWUgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgdmFsdWUgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBkZWZhdWx0UHJlZGljYXRlIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrSWdub3JlIChwcmVkaWNhdGUsIG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKSB7XG4gIGlmICghdmFsdWUpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIGNvbnN0IGNoZWNrID0gcHJlZGljYXRlIHx8IGRlZmF1bHRQcmVkaWNhdGVcbiAgaWYgKCFjaGVjaykge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiBjaGVjayhuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSlcbn1cbiJdLCJmaWxlIjoibWF0Y2guanMifQ==
