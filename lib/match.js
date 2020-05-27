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
        var classNameAfterExclusion = excludeClassNameParts(attributeValue, exclude.className);
        classNameAfterExclusion = classNameAfterExclusion.trim().replace(/\s+/g, '.');
        pattern = classNameAfterExclusion.length ? ".".concat(classNameAfterExclusion) : null;
      }
    }

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hdGNoLmpzIl0sIm5hbWVzIjpbImRlZmF1bHRJZ25vcmUiLCJhdHRyaWJ1dGUiLCJhdHRyaWJ1dGVOYW1lIiwiaW5kZXhPZiIsIm1hdGNoIiwibm9kZSIsIm9wdGlvbnMiLCJyb290IiwiZG9jdW1lbnQiLCJza2lwIiwicHJpb3JpdHkiLCJpZ25vcmUiLCJleGNsdWRlIiwicGF0aCIsImVsZW1lbnQiLCJsZW5ndGgiLCJza2lwQ29tcGFyZSIsIkFycmF5IiwiaXNBcnJheSIsIm1hcCIsImVudHJ5Iiwic2tpcENoZWNrcyIsInNvbWUiLCJjb21wYXJlIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJ0eXBlIiwicHJlZGljYXRlIiwidG9TdHJpbmciLCJSZWdFeHAiLCJyZXBsYWNlIiwibmFtZSIsInZhbHVlIiwidGVzdCIsImlnbm9yZUF0dHJpYnV0ZSIsImRlZmF1bHRQcmVkaWNhdGUiLCJjaGVja0F0dHJpYnV0ZXMiLCJjaGVja1RhZyIsImNoZWNrQ2hpbGRzIiwicGFyZW50Tm9kZSIsInBhdHRlcm4iLCJmaW5kUGF0dGVybiIsInVuc2hpZnQiLCJqb2luIiwicGFyZW50IiwiZmluZEF0dHJpYnV0ZXNQYXR0ZXJuIiwibWF0Y2hlcyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJhdHRyaWJ1dGVzIiwic29ydGVkS2V5cyIsInNvcnQiLCJjdXJyIiwibmV4dCIsImN1cnJQb3MiLCJuZXh0UG9zIiwiaSIsImwiLCJrZXkiLCJhdHRyaWJ1dGVWYWx1ZSIsImN1cnJlbnRJZ25vcmUiLCJjdXJyZW50RGVmYXVsdElnbm9yZSIsImNoZWNrSWdub3JlIiwiY2xhc3NOYW1lQWZ0ZXJFeGNsdXNpb24iLCJleGNsdWRlQ2xhc3NOYW1lUGFydHMiLCJjbGFzc05hbWUiLCJ0cmltIiwic2hvdWxkRXhjbHVkZSIsImNsYXNzTmFtZXMiLCJzcGxpdCIsImZpbHRlciIsImZpbmRUYWdQYXR0ZXJuIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJ0YWdOYW1lIiwidG9Mb3dlckNhc2UiLCJ0YWciLCJjaGlsZHJlbiIsImNoaWxkVGFncyIsImNoaWxkIiwiY2hpbGRQYXR0ZXJuIiwiY29uc29sZSIsIndhcm4iLCJjaGVjayJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQU1BOztBQU5BOzs7OztBQVFBLElBQU1BLGFBQWEsR0FBRztBQUNwQkMsRUFBQUEsU0FEb0IscUJBQ1RDLGFBRFMsRUFDTTtBQUN4QixXQUFPLENBQ0wsT0FESyxFQUVMLGNBRkssRUFHTCxxQkFISyxFQUlMQyxPQUpLLENBSUdELGFBSkgsSUFJb0IsQ0FBQyxDQUo1QjtBQUtEO0FBUG1CLENBQXRCO0FBVUE7Ozs7Ozs7O0FBT2UsU0FBU0UsS0FBVCxDQUFnQkMsSUFBaEIsRUFBc0JDLE9BQXRCLEVBQStCO0FBQUEsc0JBUXhDQSxPQVJ3QyxDQUcxQ0MsSUFIMEM7QUFBQSxNQUcxQ0EsSUFIMEMsOEJBR25DQyxRQUhtQztBQUFBLHNCQVF4Q0YsT0FSd0MsQ0FJMUNHLElBSjBDO0FBQUEsTUFJMUNBLElBSjBDLDhCQUluQyxJQUptQztBQUFBLDBCQVF4Q0gsT0FSd0MsQ0FLMUNJLFFBTDBDO0FBQUEsTUFLMUNBLFFBTDBDLGtDQUsvQixDQUFDLElBQUQsRUFBTyxPQUFQLEVBQWdCLE1BQWhCLEVBQXdCLEtBQXhCLENBTCtCO0FBQUEsd0JBUXhDSixPQVJ3QyxDQU0xQ0ssTUFOMEM7QUFBQSxNQU0xQ0EsTUFOMEMsZ0NBTWpDLEVBTmlDO0FBQUEseUJBUXhDTCxPQVJ3QyxDQU8xQ00sT0FQMEM7QUFBQSxNQU8xQ0EsT0FQMEMsaUNBT2hDLEVBUGdDO0FBVTVDLE1BQU1DLElBQUksR0FBRyxFQUFiO0FBQ0EsTUFBSUMsT0FBTyxHQUFHVCxJQUFkO0FBQ0EsTUFBSVUsTUFBTSxHQUFHRixJQUFJLENBQUNFLE1BQWxCO0FBRUEsTUFBTUMsV0FBVyxHQUFHUCxJQUFJLElBQUksQ0FBQ1EsS0FBSyxDQUFDQyxPQUFOLENBQWNULElBQWQsSUFBc0JBLElBQXRCLEdBQTZCLENBQUNBLElBQUQsQ0FBOUIsRUFBc0NVLEdBQXRDLENB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QUNEOztBQUNELE1BQU1pRCxLQUFLLEdBQUd0RCxTQUFTLElBQUlRLGdCQUEzQjs7QUFDQSxNQUFJLENBQUM4QyxLQUFMLEVBQVk7QUFDVixXQUFPLEtBQVA7QUFDRDs7QUFDRCxTQUFPQSxLQUFLLENBQUNsRCxJQUFELEVBQU9DLEtBQVAsRUFBY0csZ0JBQWQsQ0FBWjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAjIE1hdGNoXG4gKlxuICogUmV0cmlldmUgc2VsZWN0b3IgZm9yIGEgbm9kZS5cbiAqL1xuXG5pbXBvcnQgeyBlc2NhcGVWYWx1ZSB9IGZyb20gJy4vdXRpbGl0aWVzJ1xuXG5jb25zdCBkZWZhdWx0SWdub3JlID0ge1xuICBhdHRyaWJ1dGUgKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJ3N0eWxlJyxcbiAgICAgICdkYXRhLXJlYWN0aWQnLFxuICAgICAgJ2RhdGEtcmVhY3QtY2hlY2tzdW0nXG4gICAgXS5pbmRleE9mKGF0dHJpYnV0ZU5hbWUpID4gLTFcbiAgfVxufVxuXG4vKipcbiAqIEdldCB0aGUgcGF0aCBvZiB0aGUgZWxlbWVudFxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBub2RlICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIG9wdGlvbnMgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gbWF0Y2ggKG5vZGUsIG9wdGlvbnMpIHtcblxuICBjb25zdCB7XG4gICAgcm9vdCA9IGRvY3VtZW50LFxuICAgIHNraXAgPSBudWxsLFxuICAgIHByaW9yaXR5ID0gWydpZCcsICdjbGFzcycsICdocmVmJywgJ3NyYyddLFxuICAgIGlnbm9yZSA9IHt9LFxuICAgIGV4Y2x1ZGUgPSB7fSxcbiAgfSA9IG9wdGlvbnNcblxuICBjb25zdCBwYXRoID0gW11cbiAgdmFyIGVsZW1lbnQgPSBub2RlXG4gIHZhciBsZW5ndGggPSBwYXRoLmxlbmd0aFxuXG4gIGNvbnN0IHNraXBDb21wYXJlID0gc2tpcCAmJiAoQXJyYXkuaXNBcnJheShza2lwKSA/IHNraXAgOiBbc2tpcF0pLm1hcCgoZW50cnkpID0+IHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gKGVsZW1lbnQpID0+IGVsZW1lbnQgPT09IGVudHJ5XG4gICAgfVxuICAgIHJldHVybiBlbnRyeVxuICB9KVxuXG4gIGNvbnN0IHNraXBDaGVja3MgPSAoZWxlbWVudCkgPT4ge1xuICAgIHJldHVybiBza2lwICYmIHNraXBDb21wYXJlLnNvbWUoKGNvbXBhcmUpID0+IGNvbXBhcmUoZWxlbWVudCkpXG4gIH1cblxuICBPYmplY3Qua2V5cyhpZ25vcmUpLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICB2YXIgcHJlZGljYXRlID0gaWdub3JlW3R5cGVdXG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdmdW5jdGlvbicpIHJldHVyblxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnbnVtYmVyJykge1xuICAgICAgcHJlZGljYXRlID0gcHJlZGljYXRlLnRvU3RyaW5nKClcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBwcmVkaWNhdGUgPSBuZXcgUmVnRXhwKGVzY2FwZVZhbHVlKHByZWRpY2F0ZSkucmVwbGFjZSgvXFxcXC9nLCAnXFxcXFxcXFwnKSlcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgPT09ICdib29sZWFuJykge1xuICAgICAgcHJlZGljYXRlID0gcHJlZGljYXRlID8gLyg/OikvIDogLy5eL1xuICAgIH1cbiAgICAvLyBjaGVjayBjbGFzcy0vYXR0cmlidXRlbmFtZSBmb3IgcmVnZXhcbiAgICBpZ25vcmVbdHlwZV0gPSAobmFtZSwgdmFsdWUpID0+IHByZWRpY2F0ZS50ZXN0KHZhbHVlKVxuICB9KVxuXG4gIHZhciBpZ25vcmVBdHRyaWJ1dGUgPSBpZ25vcmUuYXR0cmlidXRlO1xuICBpZ25vcmUuYXR0cmlidXRlID0gZnVuY3Rpb24gKG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKSB7XG4gICAgcmV0dXJuIGlnbm9yZUF0dHJpYnV0ZSAmJiBpZ25vcmVBdHRyaWJ1dGUobmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpO1xuICB9O1xuXG4gIHdoaWxlIChlbGVtZW50ICE9PSByb290KSB7XG4gICAgaWYgKHNraXBDaGVja3MoZWxlbWVudCkgIT09IHRydWUpIHtcbiAgICAgIC8vIH4gZ2xvYmFsXG4gICAgICBpZiAoY2hlY2tBdHRyaWJ1dGVzKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUsIHBhdGgsIHJvb3QpKSBicmVha1xuICAgICAgaWYgKGNoZWNrVGFnKGVsZW1lbnQsIGlnbm9yZSwgcGF0aCwgcm9vdCkpIGJyZWFrXG5cbiAgICAgIC8vIH4gbG9jYWxcbiAgICAgIGNoZWNrQXR0cmlidXRlcyhwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlLCBwYXRoKVxuICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgY2hlY2tUYWcoZWxlbWVudCwgaWdub3JlLCBwYXRoKVxuICAgICAgfVxuXG4gICAgICAvLyBkZWZpbmUgb25seSBvbmUgcGFydCBlYWNoIGl0ZXJhdGlvblxuICAgICAgaWYgKHBhdGgubGVuZ3RoID09PSBsZW5ndGgpIHtcbiAgICAgICAgY2hlY2tDaGlsZHMocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSwgcGF0aClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlXG4gICAgbGVuZ3RoID0gcGF0aC5sZW5ndGhcbiAgfVxuXG4gIGlmIChlbGVtZW50ID09PSByb290KSB7XG4gICAgY29uc3QgcGF0dGVybiA9IGZpbmRQYXR0ZXJuKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUpXG4gICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gIH1cblxuICByZXR1cm4gcGF0aC5qb2luKCcgJylcbn1cblxuLyoqXG4gKiBFeHRlbmQgcGF0aCB3aXRoIGF0dHJpYnV0ZSBpZGVudGlmaWVyXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHByaW9yaXR5IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGlnbm9yZSAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGV4Y2x1ZGUgIC0gRXhjbHVkZSBmdW5jdGlvbnMgZm9yIHBhcnRzIG9mIGF0dHJpYnV0ZXNcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwYXRoICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBwYXJlbnQgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tBdHRyaWJ1dGVzIChwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlLCBwYXRoLCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgY29uc3QgcGF0dGVybiA9IGZpbmRBdHRyaWJ1dGVzUGF0dGVybihwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlKVxuICBpZiAocGF0dGVybikge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBMb29rdXAgYXR0cmlidXRlIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcHJpb3JpdHkgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgaWdub3JlICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgZXhjbHVkZSAgLSBFeGNsdWRlIGZ1bmN0aW9ucyBmb3IgcGFydHMgb2YgYXR0cmlidXRlc1xuICogQHJldHVybiB7c3RyaW5nP30gICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBmaW5kQXR0cmlidXRlc1BhdHRlcm4gKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUpIHtcbiAgY29uc3QgYXR0cmlidXRlcyA9IGVsZW1lbnQuYXR0cmlidXRlc1xuICBjb25zdCBzb3J0ZWRLZXlzID0gT2JqZWN0LmtleXMoYXR0cmlidXRlcykuc29ydCgoY3VyciwgbmV4dCkgPT4ge1xuICAgIGNvbnN0IGN1cnJQb3MgPSBwcmlvcml0eS5pbmRleE9mKGF0dHJpYnV0ZXNbY3Vycl0ubmFtZSlcbiAgICBjb25zdCBuZXh0UG9zID0gcHJpb3JpdHkuaW5kZXhPZihhdHRyaWJ1dGVzW25leHRdLm5hbWUpXG4gICAgaWYgKG5leHRQb3MgPT09IC0xKSB7XG4gICAgICBpZiAoY3VyclBvcyA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIDBcbiAgICAgIH1cbiAgICAgIHJldHVybiAtMVxuICAgIH1cbiAgICByZXR1cm4gY3VyclBvcyAtIG5leHRQb3NcbiAgfSlcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IHNvcnRlZEtleXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY29uc3Qga2V5ID0gc29ydGVkS2V5c1tpXVxuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNba2V5XVxuICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUgPSBhdHRyaWJ1dGUubmFtZVxuICAgIGNvbnN0IGF0dHJpYnV0ZVZhbHVlID0gZXNjYXBlVmFsdWUoYXR0cmlidXRlLnZhbHVlKVxuXG4gICAgY29uc3QgY3VycmVudElnbm9yZSA9IGlnbm9yZVthdHRyaWJ1dGVOYW1lXSB8fCBpZ25vcmUuYXR0cmlidXRlXG4gICAgY29uc3QgY3VycmVudERlZmF1bHRJZ25vcmUgPSBkZWZhdWx0SWdub3JlW2F0dHJpYnV0ZU5hbWVdIHx8IGRlZmF1bHRJZ25vcmUuYXR0cmlidXRlXG4gICAgaWYgKGNoZWNrSWdub3JlKGN1cnJlbnRJZ25vcmUsIGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlLCBjdXJyZW50RGVmYXVsdElnbm9yZSkpIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgdmFyIHBhdHRlcm4gPSBgWyR7YXR0cmlidXRlTmFtZX09XCIke2F0dHJpYnV0ZVZhbHVlfVwiXWBcblxuICAgIGlmICgoL1xcYlxcZC8pLnRlc3QoYXR0cmlidXRlVmFsdWUpID09PSBmYWxzZSkge1xuICAgICAgaWYgKGF0dHJpYnV0ZU5hbWUgPT09ICdpZCcpIHtcbiAgICAgICAgcGF0dGVybiA9IGAjJHthdHRyaWJ1dGVWYWx1ZX1gXG4gICAgICB9XG5cbiAgICAgIGlmIChhdHRyaWJ1dGVOYW1lID09PSAnY2xhc3MnKSB7XG4gICAgICAgIGxldCBjbGFzc05hbWVBZnRlckV4Y2x1c2lvbiA9IGV4Y2x1ZGVDbGFzc05hbWVQYXJ0cyhhdHRyaWJ1dGVWYWx1ZSwgZXhjbHVkZS5jbGFzc05hbWUpO1xuICAgICAgICBjbGFzc05hbWVBZnRlckV4Y2x1c2lvbiA9IGNsYXNzTmFtZUFmdGVyRXhjbHVzaW9uLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcuJyk7XG4gICAgICAgIHBhdHRlcm4gPSBjbGFzc05hbWVBZnRlckV4Y2x1c2lvbi5sZW5ndGggPyBgLiR7Y2xhc3NOYW1lQWZ0ZXJFeGNsdXNpb259YCA6IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdHRlcm5cbiAgfVxuICByZXR1cm4gbnVsbFxufVxuLyoqXG4qIFRha2VzIHBhcnRzIHRoYXQgc2hvdWxkIGJlIGV4Y2x1ZGVkIG91dCBvZiB0aGUgY2xhc3NuYW1lIGJhc2VkIG9uIHNob3VsZEV4Y2x1ZGUgY2FsbCByZXN1bHQuXG4qIEEgXCJwYXJ0XCIgaXMgYSBzdWJzdHJpbmcgb2YgdGhlIGNsYXNzIGF0dHJpYnV0ZSB2YWx1ZSBkZWxpbWl0ZWQgYnkgc3BhY2VzLlxuKlxuKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgY2xhc3NOYW1lICAgICAgQSBwYXJ0IG9mIGEgY2xhc3MgYXR0cmlidXRlIHZhbHVlXG4qIEBwYXJhbSAge0Z1bmN0aW9ufSAgICAgICBzaG91bGRFeGNsdWRlICBEZWNpZGVzIGlmIG5hbWUgaXMgYWNjZXB0ZWQgb3Igbm90XG4qIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWUgd2l0aCB1bndhbnRlZCBwYXJ0cyhuYW1lcykgZXhjbHVkZWRcbiovXG5mdW5jdGlvbiBleGNsdWRlQ2xhc3NOYW1lUGFydHMoY2xhc3NOYW1lLCBzaG91bGRFeGNsdWRlKSB7XG4gIGNvbnN0IGNsYXNzTmFtZXMgPSBjbGFzc05hbWUuc3BsaXQoJyAnKTtcblxuICByZXR1cm4gY2xhc3NOYW1lcy5maWx0ZXIobmFtZSA9PiB7XG4gICAgaWYgKCFuYW1lLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuICFzaG91bGRFeGNsdWRlKG5hbWUpO1xuICB9KS5qb2luKCcgJyk7XG59XG5cbi8qKlxuICogRXh0ZW5kIHBhdGggd2l0aCB0YWcgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcGF0aCAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBwYXJlbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrVGFnIChlbGVtZW50LCBpZ25vcmUsIHBhdGgsIHBhcmVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSkge1xuICBjb25zdCBwYXR0ZXJuID0gZmluZFRhZ1BhdHRlcm4oZWxlbWVudCwgaWdub3JlKVxuICBpZiAocGF0dGVybikge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBwYXJlbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUocGF0dGVybilcbiAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHBhdGgudW5zaGlmdChwYXR0ZXJuKVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogTG9va3VwIHRhZyBpZGVudGlmaWVyXG4gKlxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsZW1lbnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgaWdub3JlICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBmaW5kVGFnUGF0dGVybiAoZWxlbWVudCwgaWdub3JlKSB7XG4gIGNvbnN0IHRhZ05hbWUgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKVxuICBpZiAoY2hlY2tJZ25vcmUoaWdub3JlLnRhZywgbnVsbCwgdGFnTmFtZSkpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiB0YWdOYW1lXG59XG5cbi8qKlxuICogRXh0ZW5kIHBhdGggd2l0aCBzcGVjaWZpYyBjaGlsZCBpZGVudGlmaWVyXG4gKlxuICogTk9URTogJ2NoaWxkVGFncycgaXMgYSBjdXN0b20gcHJvcGVydHkgdG8gdXNlIGFzIGEgdmlldyBmaWx0ZXIgZm9yIHRhZ3MgdXNpbmcgJ2FkYXB0ZXIuanMnXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHByaW9yaXR5IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGlnbm9yZSAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHBhdGggICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja0NoaWxkcyAocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSwgcGF0aCkge1xuICBjb25zdCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGVcbiAgY29uc3QgY2hpbGRyZW4gPSBwYXJlbnQuY2hpbGRUYWdzIHx8IHBhcmVudC5jaGlsZHJlblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IGNoaWxkID0gY2hpbGRyZW5baV1cbiAgICBpZiAoY2hpbGQgPT09IGVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IGNoaWxkUGF0dGVybiA9IGZpbmRQYXR0ZXJuKHByaW9yaXR5LCBjaGlsZCwgaWdub3JlLCBleGNsdWRlKVxuICAgICAgaWYgKCFjaGlsZFBhdHRlcm4pIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUud2FybihgXG4gICAgICAgICAgRWxlbWVudCBjb3VsZG5cXCd0IGJlIG1hdGNoZWQgdGhyb3VnaCBzdHJpY3QgaWdub3JlIHBhdHRlcm4hXG4gICAgICAgIGAsIGNoaWxkLCBpZ25vcmUsIGNoaWxkUGF0dGVybilcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhdHRlcm4gPSBgPiAke2NoaWxkUGF0dGVybn06bnRoLWNoaWxkKCR7aSsxfSlgXG4gICAgICBwYXRoLnVuc2hpZnQocGF0dGVybilcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIExvb2t1cCBpZGVudGlmaWVyXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHByaW9yaXR5IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGlnbm9yZSAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBmaW5kUGF0dGVybiAocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSkge1xuICB2YXIgcGF0dGVybiA9IGZpbmRBdHRyaWJ1dGVzUGF0dGVybihwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlKVxuICBpZiAoIXBhdHRlcm4pIHtcbiAgICBwYXR0ZXJuID0gZmluZFRhZ1BhdHRlcm4oZWxlbWVudCwgaWdub3JlKVxuICB9XG4gIHJldHVybiBwYXR0ZXJuXG59XG5cbi8qKlxuICogVmFsaWRhdGUgd2l0aCBjdXN0b20gYW5kIGRlZmF1bHQgZnVuY3Rpb25zXG4gKlxuICogQHBhcmFtICB7RnVuY3Rpb259IHByZWRpY2F0ZSAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtzdHJpbmc/fSAgbmFtZSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge3N0cmluZ30gICB2YWx1ZSAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7RnVuY3Rpb259IGRlZmF1bHRQcmVkaWNhdGUgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tJZ25vcmUgKHByZWRpY2F0ZSwgbmFtZSwgdmFsdWUsIGRlZmF1bHRQcmVkaWNhdGUpIHtcbiAgaWYgKCF2YWx1ZSkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cbiAgY29uc3QgY2hlY2sgPSBwcmVkaWNhdGUgfHwgZGVmYXVsdFByZWRpY2F0ZVxuICBpZiAoIWNoZWNrKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIGNoZWNrKG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKVxufVxuIl0sImZpbGUiOiJtYXRjaC5qcyJ9
