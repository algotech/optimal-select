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
        var classNameAfterExclusion = excludeClassNameParts(attributeValue, exclude.className);
        classNameAfterExclusion = classNameAfterExclusion.trim().replace(/\s+/g, '.');
        pattern = classNameAfterExclusion.length ? ".".concat(classNameAfterExclusion) : null;
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hdGNoLmpzIl0sIm5hbWVzIjpbImRlZmF1bHRJZ25vcmUiLCJhdHRyaWJ1dGUiLCJhdHRyaWJ1dGVOYW1lIiwiaW5kZXhPZiIsIm1hdGNoIiwibm9kZSIsIm9wdGlvbnMiLCJyb290IiwiZG9jdW1lbnQiLCJza2lwIiwicHJpb3JpdHkiLCJpZ25vcmUiLCJleGNsdWRlIiwicGF0aCIsImVsZW1lbnQiLCJsZW5ndGgiLCJza2lwQ29tcGFyZSIsIkFycmF5IiwiaXNBcnJheSIsIm1hcCIsImVudHJ5Iiwic2tpcENoZWNrcyIsInNvbWUiLCJjb21wYXJlIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJ0eXBlIiwicHJlZGljYXRlIiwidG9TdHJpbmciLCJSZWdFeHAiLCJyZXBsYWNlIiwibmFtZSIsInZhbHVlIiwidGVzdCIsImlnbm9yZUF0dHJpYnV0ZSIsImRlZmF1bHRQcmVkaWNhdGUiLCJjaGVja0F0dHJpYnV0ZXMiLCJjaGVja1RhZyIsImNoZWNrQ2hpbGRzIiwicGFyZW50Tm9kZSIsInBhdHRlcm4iLCJmaW5kUGF0dGVybiIsInVuc2hpZnQiLCJqb2luIiwicGFyZW50IiwiZmluZEF0dHJpYnV0ZXNQYXR0ZXJuIiwibWF0Y2hlcyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJhdHRyaWJ1dGVzIiwic29ydGVkS2V5cyIsInNvcnQiLCJjdXJyIiwibmV4dCIsImN1cnJQb3MiLCJuZXh0UG9zIiwiaSIsImwiLCJrZXkiLCJhdHRyaWJ1dGVWYWx1ZSIsImN1cnJlbnRJZ25vcmUiLCJjdXJyZW50RGVmYXVsdElnbm9yZSIsImNoZWNrSWdub3JlIiwiY29uc29sZSIsImxvZyIsInNwbGl0IiwiYyIsImV4IiwiY2xhc3NOYW1lIiwiY2xhc3NOYW1lQWZ0ZXJFeGNsdXNpb24iLCJleGNsdWRlQ2xhc3NOYW1lUGFydHMiLCJ0cmltIiwic2hvdWxkRXhjbHVkZSIsImNsYXNzTmFtZXMiLCJmaWx0ZXIiLCJmaW5kVGFnUGF0dGVybiIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwidGFnTmFtZSIsInRvTG93ZXJDYXNlIiwidGFnIiwiY2hpbGRyZW4iLCJjaGlsZFRhZ3MiLCJjaGlsZCIsImNoaWxkUGF0dGVybiIsIndhcm4iLCJjaGVjayJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQU1BOztBQU5BOzs7OztBQVFBLElBQU1BLGFBQWEsR0FBRztBQUNwQkMsRUFBQUEsU0FEb0IscUJBQ1RDLGFBRFMsRUFDTTtBQUN4QixXQUFPLENBQ0wsT0FESyxFQUVMLGNBRkssRUFHTCxxQkFISyxFQUlMQyxPQUpLLENBSUdELGFBSkgsSUFJb0IsQ0FBQyxDQUo1QjtBQUtEO0FBUG1CLENBQXRCO0FBVUE7Ozs7Ozs7O0FBT2UsU0FBU0UsS0FBVCxDQUFnQkMsSUFBaEIsRUFBc0JDLE9BQXRCLEVBQStCO0FBQUEsc0JBUXhDQSxPQVJ3QyxDQUcxQ0MsSUFIMEM7QUFBQSxNQUcxQ0EsSUFIMEMsOEJBR25DQyxRQUhtQztBQUFBLHNCQVF4Q0YsT0FSd0MsQ0FJMUNHLElBSjBDO0FBQUEsTUFJMUNBLElBSjBDLDhCQUluQyxJQUptQztBQUFBLDBCQVF4Q0gsT0FSd0MsQ0FLMUNJLFFBTDBDO0FBQUEsTUFLMUNBLFFBTDBDLGtDQUsvQixDQUFDLElBQUQsRUFBTyxPQUFQLEVBQWdCLE1BQWhCLEVBQXdCLEtBQXhCLENBTCtCO0FBQUEsd0JBUXhDSixPQVJ3QyxDQU0xQ0ssTUFOMEM7QUFBQSxNQU0xQ0EsTUFOMEMsZ0NBTWpDLEVBTmlDO0FBQUEseUJBUXhDTCxPQVJ3QyxDQU8xQ00sT0FQMEM7QUFBQSxNQU8xQ0EsT0FQMEMsaUNBT2hDLEVBUGdDO0FBVTVDLE1BQU1DLElBQUksR0FBRyxFQUFiO0FBQ0EsTUFBSUMsT0FBTyxHQUFHVCxJQUFkO0FBQ0EsTUFBSVUsTUFBTSxHQUFHRixJQUFJLENBQUNFLE1BQWxCO0FBRUEsTUFBTUMsV0FBVyxHQUFHUCxJQUFJLElBQUksQ0FBQ1EsS0FBSyxDQUFDQyxPQUFOLENBQWNULElBQWQsSUFBc0JBLElBQXRCLEdBQTZCLENBQUNBLElBQUQsQ0FBOUIs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QUFELEVBQVdJLE9BQVgsRUFBb0JILE1BQXBCLEVBQTRCQyxPQUE1QixDQUFuQzs7QUFDQSxNQUFJLENBQUM2QixPQUFMLEVBQWM7QUFDWkEsSUFBQUEsT0FBTyxHQUFHa0MsY0FBYyxDQUFDN0QsT0FBRCxFQUFVSCxNQUFWLENBQXhCO0FBQ0Q7O0FBQ0QsU0FBTzhCLE9BQVA7QUFDRDtBQUVEOzs7Ozs7Ozs7OztBQVNBLFNBQVNxQixXQUFULENBQXNCbEMsU0FBdEIsRUFBaUNJLElBQWpDLEVBQXVDQyxLQUF2QyxFQUE4Q0csZ0JBQTlDLEVBQWdFO0FBQzlELE1BQUksQ0FBQ0gsS0FBTCxFQUFZO0FBQ1YsV0FBTyxJQUFQO0FBQ0Q7O0FBQ0QsTUFBTW9ELEtBQUssR0FBR3pELFNBQVMsSUFBSVEsZ0JBQTNCOztBQUNBLE1BQUksQ0FBQ2lELEtBQUwsRUFBWTtBQUNWLFdBQU8sS0FBUDtBQUNEOztBQUNELFNBQU9BLEtBQUssQ0FBQ3JELElBQUQsRUFBT0MsS0FBUCxFQUFjRyxnQkFBZCxDQUFaO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqICMgTWF0Y2hcbiAqXG4gKiBSZXRyaWV2ZSBzZWxlY3RvciBmb3IgYSBub2RlLlxuICovXG5cbmltcG9ydCB7IGVzY2FwZVZhbHVlIH0gZnJvbSAnLi91dGlsaXRpZXMnXG5cbmNvbnN0IGRlZmF1bHRJZ25vcmUgPSB7XG4gIGF0dHJpYnV0ZSAoYXR0cmlidXRlTmFtZSkge1xuICAgIHJldHVybiBbXG4gICAgICAnc3R5bGUnLFxuICAgICAgJ2RhdGEtcmVhY3RpZCcsXG4gICAgICAnZGF0YS1yZWFjdC1jaGVja3N1bSdcbiAgICBdLmluZGV4T2YoYXR0cmlidXRlTmFtZSkgPiAtMVxuICB9XG59XG5cbi8qKlxuICogR2V0IHRoZSBwYXRoIG9mIHRoZSBlbGVtZW50XG4gKlxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IG5vZGUgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgb3B0aW9ucyAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtYXRjaCAobm9kZSwgb3B0aW9ucykge1xuXG4gIGNvbnN0IHtcbiAgICByb290ID0gZG9jdW1lbnQsXG4gICAgc2tpcCA9IG51bGwsXG4gICAgcHJpb3JpdHkgPSBbJ2lkJywgJ2NsYXNzJywgJ2hyZWYnLCAnc3JjJ10sXG4gICAgaWdub3JlID0ge30sXG4gICAgZXhjbHVkZSA9IHt9LFxuICB9ID0gb3B0aW9uc1xuXG4gIGNvbnN0IHBhdGggPSBbXVxuICB2YXIgZWxlbWVudCA9IG5vZGVcbiAgdmFyIGxlbmd0aCA9IHBhdGgubGVuZ3RoXG5cbiAgY29uc3Qgc2tpcENvbXBhcmUgPSBza2lwICYmIChBcnJheS5pc0FycmF5KHNraXApID8gc2tpcCA6IFtza2lwXSkubWFwKChlbnRyeSkgPT4ge1xuICAgIGlmICh0eXBlb2YgZW50cnkgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiAoZWxlbWVudCkgPT4gZWxlbWVudCA9PT0gZW50cnlcbiAgICB9XG4gICAgcmV0dXJuIGVudHJ5XG4gIH0pXG5cbiAgY29uc3Qgc2tpcENoZWNrcyA9IChlbGVtZW50KSA9PiB7XG4gICAgcmV0dXJuIHNraXAgJiYgc2tpcENvbXBhcmUuc29tZSgoY29tcGFyZSkgPT4gY29tcGFyZShlbGVtZW50KSlcbiAgfVxuXG4gIE9iamVjdC5rZXlzKGlnbm9yZSkuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgIHZhciBwcmVkaWNhdGUgPSBpZ25vcmVbdHlwZV1cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuXG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdudW1iZXInKSB7XG4gICAgICBwcmVkaWNhdGUgPSBwcmVkaWNhdGUudG9TdHJpbmcoKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHByZWRpY2F0ZSA9IG5ldyBSZWdFeHAoZXNjYXBlVmFsdWUocHJlZGljYXRlKS5yZXBsYWNlKC9cXFxcL2csICdcXFxcXFxcXCcpKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBwcmVkaWNhdGUgPSBwcmVkaWNhdGUgPyAvKD86KS8gOiAvLl4vXG4gICAgfVxuICAgIC8vIGNoZWNrIGNsYXNzLS9hdHRyaWJ1dGVuYW1lIGZvciByZWdleFxuICAgIGlnbm9yZVt0eXBlXSA9IChuYW1lLCB2YWx1ZSkgPT4gcHJlZGljYXRlLnRlc3QodmFsdWUpXG4gIH0pXG5cbiAgdmFyIGlnbm9yZUF0dHJpYnV0ZSA9IGlnbm9yZS5hdHRyaWJ1dGU7XG4gIGlnbm9yZS5hdHRyaWJ1dGUgPSBmdW5jdGlvbiAobmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpIHtcbiAgICByZXR1cm4gaWdub3JlQXR0cmlidXRlICYmIGlnbm9yZUF0dHJpYnV0ZShuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSk7XG4gIH07XG5cbiAgd2hpbGUgKGVsZW1lbnQgIT09IHJvb3QpIHtcbiAgICBpZiAoc2tpcENoZWNrcyhlbGVtZW50KSAhPT0gdHJ1ZSkge1xuICAgICAgLy8gfiBnbG9iYWxcbiAgICAgIGlmIChjaGVja0F0dHJpYnV0ZXMocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSwgcGF0aCwgcm9vdCkpIGJyZWFrXG4gICAgICBpZiAoY2hlY2tUYWcoZWxlbWVudCwgaWdub3JlLCBwYXRoLCByb290KSkgYnJlYWtcblxuICAgICAgLy8gfiBsb2NhbFxuICAgICAgY2hlY2tBdHRyaWJ1dGVzKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUsIHBhdGgpXG4gICAgICBpZiAocGF0aC5sZW5ndGggPT09IGxlbmd0aCkge1xuICAgICAgICBjaGVja1RhZyhlbGVtZW50LCBpZ25vcmUsIHBhdGgpXG4gICAgICB9XG5cbiAgICAgIC8vIGRlZmluZSBvbmx5IG9uZSBwYXJ0IGVhY2ggaXRlcmF0aW9uXG4gICAgICBpZiAocGF0aC5sZW5ndGggPT09IGxlbmd0aCkge1xuICAgICAgICBjaGVja0NoaWxkcyhwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlLCBwYXRoKVxuICAgICAgfVxuICAgIH1cblxuICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGVcbiAgICBsZW5ndGggPSBwYXRoLmxlbmd0aFxuICB9XG5cbiAgaWYgKGVsZW1lbnQgPT09IHJvb3QpIHtcbiAgICBjb25zdCBwYXR0ZXJuID0gZmluZFBhdHRlcm4ocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSlcbiAgICBwYXRoLnVuc2hpZnQocGF0dGVybilcbiAgfVxuXG4gIHJldHVybiBwYXRoLmpvaW4oJyAnKVxufVxuXG4vKipcbiAqIEV4dGVuZCBwYXRoIHdpdGggYXR0cmlidXRlIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcHJpb3JpdHkgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgaWdub3JlICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgZXhjbHVkZSAgLSBFeGNsdWRlIGZ1bmN0aW9ucyBmb3IgcGFydHMgb2YgYXR0cmlidXRlc1xuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHBhdGggICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIHBhcmVudCAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0F0dHJpYnV0ZXMgKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUsIHBhdGgsIHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSkge1xuICBjb25zdCBwYXR0ZXJuID0gZmluZEF0dHJpYnV0ZXNQYXR0ZXJuKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUpXG4gIGlmIChwYXR0ZXJuKSB7XG4gICAgY29uc3QgbWF0Y2hlcyA9IHBhcmVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICBwYXRoLnVuc2hpZnQocGF0dGVybilcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIExvb2t1cCBhdHRyaWJ1dGUgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBleGNsdWRlICAtIEV4Y2x1ZGUgZnVuY3Rpb25zIGZvciBwYXJ0cyBvZiBhdHRyaWJ1dGVzXG4gKiBAcmV0dXJuIHtzdHJpbmc/fSAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGZpbmRBdHRyaWJ1dGVzUGF0dGVybiAocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSkge1xuICBjb25zdCBhdHRyaWJ1dGVzID0gZWxlbWVudC5hdHRyaWJ1dGVzXG4gIGNvbnN0IHNvcnRlZEtleXMgPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5zb3J0KChjdXJyLCBuZXh0KSA9PiB7XG4gICAgY29uc3QgY3VyclBvcyA9IHByaW9yaXR5LmluZGV4T2YoYXR0cmlidXRlc1tjdXJyXS5uYW1lKVxuICAgIGNvbnN0IG5leHRQb3MgPSBwcmlvcml0eS5pbmRleE9mKGF0dHJpYnV0ZXNbbmV4dF0ubmFtZSlcbiAgICBpZiAobmV4dFBvcyA9PT0gLTEpIHtcbiAgICAgIGlmIChjdXJyUG9zID09PSAtMSkge1xuICAgICAgICByZXR1cm4gMFxuICAgICAgfVxuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBjdXJyUG9zIC0gbmV4dFBvc1xuICB9KVxuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gc29ydGVkS2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBrZXkgPSBzb3J0ZWRLZXlzW2ldXG4gICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1trZXldXG4gICAgY29uc3QgYXR0cmlidXRlTmFtZSA9IGF0dHJpYnV0ZS5uYW1lXG4gICAgY29uc3QgYXR0cmlidXRlVmFsdWUgPSBlc2NhcGVWYWx1ZShhdHRyaWJ1dGUudmFsdWUpXG5cbiAgICBjb25zdCBjdXJyZW50SWdub3JlID0gaWdub3JlW2F0dHJpYnV0ZU5hbWVdIHx8IGlnbm9yZS5hdHRyaWJ1dGVcbiAgICBjb25zdCBjdXJyZW50RGVmYXVsdElnbm9yZSA9IGRlZmF1bHRJZ25vcmVbYXR0cmlidXRlTmFtZV0gfHwgZGVmYXVsdElnbm9yZS5hdHRyaWJ1dGVcbiAgICBpZiAoY2hlY2tJZ25vcmUoY3VycmVudElnbm9yZSwgYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWUsIGN1cnJlbnREZWZhdWx0SWdub3JlKSkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICB2YXIgcGF0dGVybiA9IGBbJHthdHRyaWJ1dGVOYW1lfT1cIiR7YXR0cmlidXRlVmFsdWV9XCJdYFxuXG4gICAgaWYgKCgvXFxiXFxkLykudGVzdChhdHRyaWJ1dGVWYWx1ZSkgPT09IGZhbHNlKSB7XG4gICAgICBpZiAoYXR0cmlidXRlTmFtZSA9PT0gJ2lkJykge1xuICAgICAgICBwYXR0ZXJuID0gYCMke2F0dHJpYnV0ZVZhbHVlfWBcbiAgICAgIH1cblxuICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUgPT09ICdjbGFzcycpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2V4Y2x1ZGU/JywgYXR0cmlidXRlVmFsdWUuc3BsaXQoJyAnKS5tYXAoYyA9PiAoe1xuICAgICAgICAgIGV4OiBleGNsdWRlLmNsYXNzTmFtZShjKSxcbiAgICAgICAgICBjLFxuICAgICAgICB9KSkpO1xuICAgICAgICBsZXQgY2xhc3NOYW1lQWZ0ZXJFeGNsdXNpb24gPSBleGNsdWRlQ2xhc3NOYW1lUGFydHMoYXR0cmlidXRlVmFsdWUsIGV4Y2x1ZGUuY2xhc3NOYW1lKTtcbiAgICAgICAgY2xhc3NOYW1lQWZ0ZXJFeGNsdXNpb24gPSBjbGFzc05hbWVBZnRlckV4Y2x1c2lvbi50cmltKCkucmVwbGFjZSgvXFxzKy9nLCAnLicpO1xuICAgICAgICBwYXR0ZXJuID0gY2xhc3NOYW1lQWZ0ZXJFeGNsdXNpb24ubGVuZ3RoID8gYC4ke2NsYXNzTmFtZUFmdGVyRXhjbHVzaW9ufWAgOiBudWxsO1xuICAgICAgICBjb25zb2xlLmxvZygnYWZ0ZXIgZXhjbHVzaW9uJywgcGF0dGVybik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdHRlcm5cbiAgfVxuICByZXR1cm4gbnVsbFxufVxuLyoqXG4qIEBwYXJhbSAge3N0cmluZ30gICAgICAgICBjbGFzc05hbWUgICAgICBBIHBhcnQgb2YgYSBjbGFzcyBhdHRyaWJ1dGUgdmFsdWVcbiogQHBhcmFtICB7RnVuY3Rpb259ICAgICAgIHNob3VsZEV4Y2x1ZGUgIERlY2lkZXMgaWYgbmFtZSBpcyBhY2NlcHRlZCBvciBub3RcbiogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZSB3aXRoIHVud2FudGVkIHBhcnRzKG5hbWVzKSBleGNsdWRlZFxuKi9cbmZ1bmN0aW9uIGV4Y2x1ZGVDbGFzc05hbWVQYXJ0cyhjbGFzc05hbWUsIHNob3VsZEV4Y2x1ZGUpIHtcbiAgY29uc3QgY2xhc3NOYW1lcyA9IGNsYXNzTmFtZS5zcGxpdCgnICcpO1xuXG4gIHJldHVybiBjbGFzc05hbWVzLmZpbHRlcihuYW1lID0+IHtcbiAgICBpZiAoIW5hbWUubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gIXNob3VsZEV4Y2x1ZGUobmFtZSk7XG4gIH0pLmpvaW4oJyAnKTtcbn1cblxuLyoqXG4gKiBFeHRlbmQgcGF0aCB3aXRoIHRhZyBpZGVudGlmaWVyXG4gKlxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwYXRoICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIHBhcmVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tUYWcgKGVsZW1lbnQsIGlnbm9yZSwgcGF0aCwgcGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gIGNvbnN0IHBhdHRlcm4gPSBmaW5kVGFnUGF0dGVybihlbGVtZW50LCBpZ25vcmUpXG4gIGlmIChwYXR0ZXJuKSB7XG4gICAgY29uc3QgbWF0Y2hlcyA9IHBhcmVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShwYXR0ZXJuKVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBMb29rdXAgdGFnIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGZpbmRUYWdQYXR0ZXJuIChlbGVtZW50LCBpZ25vcmUpIHtcbiAgY29uc3QgdGFnTmFtZSA9IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpXG4gIGlmIChjaGVja0lnbm9yZShpZ25vcmUudGFnLCBudWxsLCB0YWdOYW1lKSkge1xuICAgIHJldHVybiBudWxsXG4gIH1cbiAgcmV0dXJuIHRhZ05hbWVcbn1cblxuLyoqXG4gKiBFeHRlbmQgcGF0aCB3aXRoIHNwZWNpZmljIGNoaWxkIGlkZW50aWZpZXJcbiAqXG4gKiBOT1RFOiAnY2hpbGRUYWdzJyBpcyBhIGN1c3RvbSBwcm9wZXJ0eSB0byB1c2UgYXMgYSB2aWV3IGZpbHRlciBmb3IgdGFncyB1c2luZyAnYWRhcHRlci5qcydcbiAqXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcHJpb3JpdHkgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgaWdub3JlICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcGF0aCAgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQ2hpbGRzIChwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlLCBwYXRoKSB7XG4gIGNvbnN0IHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZVxuICBjb25zdCBjaGlsZHJlbiA9IHBhcmVudC5jaGlsZFRhZ3MgfHwgcGFyZW50LmNoaWxkcmVuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY29uc3QgY2hpbGQgPSBjaGlsZHJlbltpXVxuICAgIGlmIChjaGlsZCA9PT0gZWxlbWVudCkge1xuICAgICAgY29uc3QgY2hpbGRQYXR0ZXJuID0gZmluZFBhdHRlcm4ocHJpb3JpdHksIGNoaWxkLCBpZ25vcmUsIGV4Y2x1ZGUpXG4gICAgICBpZiAoIWNoaWxkUGF0dGVybikge1xuICAgICAgICByZXR1cm4gY29uc29sZS53YXJuKGBcbiAgICAgICAgICBFbGVtZW50IGNvdWxkblxcJ3QgYmUgbWF0Y2hlZCB0aHJvdWdoIHN0cmljdCBpZ25vcmUgcGF0dGVybiFcbiAgICAgICAgYCwgY2hpbGQsIGlnbm9yZSwgY2hpbGRQYXR0ZXJuKVxuICAgICAgfVxuICAgICAgY29uc3QgcGF0dGVybiA9IGA+ICR7Y2hpbGRQYXR0ZXJufTpudGgtY2hpbGQoJHtpKzF9KWBcbiAgICAgIHBhdGgudW5zaGlmdChwYXR0ZXJuKVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogTG9va3VwIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcHJpb3JpdHkgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgaWdub3JlICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGZpbmRQYXR0ZXJuIChwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlKSB7XG4gIHZhciBwYXR0ZXJuID0gZmluZEF0dHJpYnV0ZXNQYXR0ZXJuKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUpXG4gIGlmICghcGF0dGVybikge1xuICAgIHBhdHRlcm4gPSBmaW5kVGFnUGF0dGVybihlbGVtZW50LCBpZ25vcmUpXG4gIH1cbiAgcmV0dXJuIHBhdHRlcm5cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSB3aXRoIGN1c3RvbSBhbmQgZGVmYXVsdCBmdW5jdGlvbnNcbiAqXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gcHJlZGljYXRlICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge3N0cmluZz99ICBuYW1lICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7c3RyaW5nfSAgIHZhbHVlICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gZGVmYXVsdFByZWRpY2F0ZSAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0lnbm9yZSAocHJlZGljYXRlLCBuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSkge1xuICBpZiAoIXZhbHVlKSB7XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuICBjb25zdCBjaGVjayA9IHByZWRpY2F0ZSB8fCBkZWZhdWx0UHJlZGljYXRlXG4gIGlmICghY2hlY2spIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gY2hlY2sobmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpXG59XG4iXSwiZmlsZSI6Im1hdGNoLmpzIn0=
