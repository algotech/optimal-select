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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1hdGNoLmpzIl0sIm5hbWVzIjpbImRlZmF1bHRJZ25vcmUiLCJhdHRyaWJ1dGUiLCJhdHRyaWJ1dGVOYW1lIiwiaW5kZXhPZiIsIm1hdGNoIiwibm9kZSIsIm9wdGlvbnMiLCJyb290IiwiZG9jdW1lbnQiLCJza2lwIiwicHJpb3JpdHkiLCJpZ25vcmUiLCJleGNsdWRlIiwicGF0aCIsImVsZW1lbnQiLCJsZW5ndGgiLCJza2lwQ29tcGFyZSIsIkFycmF5IiwiaXNBcnJheSIsIm1hcCIsImVudHJ5Iiwic2tpcENoZWNrcyIsInNvbWUiLCJjb21wYXJlIiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJ0eXBlIiwicHJlZGljYXRlIiwidG9TdHJpbmciLCJSZWdFeHAiLCJyZXBsYWNlIiwibmFtZSIsInZhbHVlIiwidGVzdCIsImlnbm9yZUF0dHJpYnV0ZSIsImRlZmF1bHRQcmVkaWNhdGUiLCJjaGVja0F0dHJpYnV0ZXMiLCJjaGVja1RhZyIsImNoZWNrQ2hpbGRzIiwicGFyZW50Tm9kZSIsInBhdHRlcm4iLCJmaW5kUGF0dGVybiIsInVuc2hpZnQiLCJqb2luIiwicGFyZW50IiwiZmluZEF0dHJpYnV0ZXNQYXR0ZXJuIiwibWF0Y2hlcyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJhdHRyaWJ1dGVzIiwic29ydGVkS2V5cyIsInNvcnQiLCJjdXJyIiwibmV4dCIsImN1cnJQb3MiLCJuZXh0UG9zIiwiaSIsImwiLCJrZXkiLCJhdHRyaWJ1dGVWYWx1ZSIsImN1cnJlbnRJZ25vcmUiLCJjdXJyZW50RGVmYXVsdElnbm9yZSIsImNoZWNrSWdub3JlIiwiY2xhc3NOYW1lQWZ0ZXJFeGNsdXNpb24iLCJleGNsdWRlQ2xhc3NOYW1lUGFydHMiLCJjbGFzc05hbWUiLCJ0cmltIiwic2hvdWxkRXhjbHVkZSIsImNsYXNzTmFtZXMiLCJzcGxpdCIsImZpbHRlciIsImZpbmRUYWdQYXR0ZXJuIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJ0YWdOYW1lIiwidG9Mb3dlckNhc2UiLCJ0YWciLCJjaGlsZHJlbiIsImNoaWxkVGFncyIsImNoaWxkIiwiY2hpbGRQYXR0ZXJuIiwiY29uc29sZSIsIndhcm4iLCJjaGVjayJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQU1BOztBQU5BOzs7OztBQVFBLElBQU1BLGFBQWEsR0FBRztBQUNwQkMsRUFBQUEsU0FEb0IscUJBQ1RDLGFBRFMsRUFDTTtBQUN4QixXQUFPLENBQ0wsT0FESyxFQUVMLGNBRkssRUFHTCxxQkFISyxFQUlMQyxPQUpLLENBSUdELGFBSkgsSUFJb0IsQ0FBQyxDQUo1QjtBQUtEO0FBUG1CLENBQXRCO0FBVUE7Ozs7Ozs7O0FBT2UsU0FBU0UsS0FBVCxDQUFnQkMsSUFBaEIsRUFBc0JDLE9BQXRCLEVBQStCO0FBQUEsc0JBUXhDQSxPQVJ3QyxDQUcxQ0MsSUFIMEM7QUFBQSxNQUcxQ0EsSUFIMEMsOEJBR25DQyxRQUhtQztBQUFBLHNCQVF4Q0YsT0FSd0MsQ0FJMUNHLElBSjBDO0FBQUEsTUFJMUNBLElBSjBDLDhCQUluQyxJQUptQztBQUFBLDBCQVF4Q0gsT0FSd0MsQ0FLMUNJLFFBTDBDO0FBQUEsTUFLMUNBLFFBTDBDLGtDQUsvQixDQUFDLElBQUQsRUFBTyxPQUFQLEVBQWdCLE1BQWhCLEVBQXdCLEtBQXhCLENBTCtCO0FBQUEsd0JBUXhDSixPQVJ3QyxDQU0xQ0ssTUFOMEM7QUFBQSxNQU0xQ0EsTUFOMEMsZ0NBTWpDLEVBTmlDO0FBQUEseUJBUXhDTCxPQVJ3QyxDQU8xQ00sT0FQMEM7QUFBQSxNQU8xQ0EsT0FQMEMsaUNBT2hDLEVBUGdDO0FBVTVDLE1BQU1DLElBQUksR0FBRyxFQUFiO0FBQ0EsTUFBSUMsT0FBTyxHQUFHVCxJQUFkO0FBQ0EsTUFBSVUsTUFBTSxHQUFHRixJQUFJLENBQUNFLE1BQWxCO0FBRUEsTUFBTUMsV0FBVyxHQUFHUCxJQUFJLElBQUksQ0FBQ1EsS0FBSyxDQUFDQyxPQUFOLENBQWNULElBQWQsSUFBc0JBLElBQXRCLEdBQTZCLENBQUNBLElBQUQsQ0FBOUIsRUFBc0NVLEdBQXRDLENBQTBDLFVBQUNDLEtBQUQsRUFBVztBQUMvRSxRQUFJLE9BQU9BLEtBQVAsS0FBaUIsVUFBckIsRUFBaUM7QUFDL0IsYUFBTyxVQUFDTixPQUFEO0FBQUEsZUFBYUEsT0FBTyxLQUFLTSxLQUF6QjtBQUFBLE9BQVA7QUFDRDs7QUFDRCxXQUFPQSxLQUFQO0FBQ0QsR0FMMkIsQ0FBNUI7O0FBT0EsTUFBTUMsVUFBVSxHQUFHLFNBQWJBLFVBQWEsQ0FBQ1AsT0FBRCxFQUFhO0FBQzlCLFdBQU9MLElBQUksSUFBSU8sV0FBVyxDQUFDTSxJQUFaLENBQWlCLFVBQUNDLE9BQUQ7QUFBQSxhQUFhQSxPQUFPLENBQUNULE9BQUQsQ0FBcEI7QUFBQSxLQUFqQixDQUFmO0FBQ0QsR0FGRDs7QUFJQVUsRUFBQUEsTUFBTSxDQUFDQyxJQUFQLENBQVlkLE1BQVosRUFBb0JlLE9BQXBCLENBQTRCLFVBQUNDLElBQUQsRUFBVTtBQUNwQyxRQUFJQyxTQUFTLEdBQUdqQixNQUFNLENBQUNnQixJQUFELENBQXRCO0FBQ0EsUUFBSSxPQUFPQyxTQUFQLEtBQXFCLFVBQXpCLEVBQXFDOztBQUNyQyxRQUFJLE9BQU9BLFNBQVAsS0FBcUIsUUFBekIsRUFBbUM7QUFDakNBLE1BQUFBLFNBQVMsR0FBR0EsU0FBUyxDQUFDQyxRQUFWLEVBQVo7QUFDRDs7QUFDRCxRQUFJLE9BQU9ELFNBQVAsS0FBcUIsUUFBekIsRUFBbUM7QUFDakNBLE1BQUFBLFNBQVMsR0FBRyxJQUFJRSxNQUFKLENBQVcsNEJBQVlGLFNBQVosRUFBdUJHLE9BQXZCLENBQStCLEtBQS9CLEVBQXNDLE1BQXRDLENBQVgsQ0FBWjtBQUNEOztBQUNELFFBQUksT0FBT0gsU0FBUCxLQUFxQixTQUF6QixFQUFvQztBQUNsQ0EsTUFBQUEsU0FBUyxHQUFHQSxTQUFTLEdBQUcsTUFBSCxHQUFZLElBQWpDO0FBQ0QsS0FYbUMsQ0FZcEM7OztBQUNBakIsSUFBQUEsTUFBTSxDQUFDZ0IsSUFBRCxDQUFOLEdBQWUsVUFBQ0ssSUFBRCxFQUFPQyxLQUFQO0FBQUEsYUFBaUJMLFNBQVMsQ0FBQ00sSUFBVixDQUFlRCxLQUFmLENBQWpCO0FBQUEsS0FBZjtBQUNELEdBZEQ7QUFnQkEsTUFBSUUsZUFBZSxHQUFHeEIsTUFBTSxDQUFDVixTQUE3Qjs7QUFDQVUsRUFBQUEsTUFBTSxDQUFDVixTQUFQLEdBQW1CLFVBQVUrQixJQUFWLEVBQWdCQyxLQUFoQixFQUF1QkcsZ0JBQXZCLEVBQXlDO0FBQzFELFdBQU9ELGVBQWUsSUFBSUEsZUFBZSxDQUFDSCxJQUFELEVBQU9DLEtBQVAsRUFBY0csZ0JBQWQsQ0FBekM7QUFDRCxHQUZEOztBQUlBLFNBQU90QixPQUFPLEtBQUtQLElBQW5CLEVBQXlCO0FBQ3ZCLFFBQUljLFVBQVUsQ0FBQ1AsT0FBRCxDQUFWLEtBQXdCLElBQTVCLEVBQWtDO0FBQ2hDO0FBQ0EsVUFBSXVCLGVBQWUsQ0FBQzNCLFFBQUQsRUFBV0ksT0FBWCxFQUFvQkgsTUFBcEIsRUFBNEJDLE9BQTVCLEVBQXFDQyxJQUFyQyxFQUEyQ04sSUFBM0MsQ0FBbkIsRUFBcUU7QUFDckUsVUFBSStCLFFBQVEsQ0FBQ3hCLE9BQUQsRUFBVUgsTUFBVixFQUFrQkUsSUFBbEIsRUFBd0JOLElBQXhCLENBQVosRUFBMkMsTUFIWCxDQUtoQzs7QUFDQThCLE1BQUFBLGVBQWUsQ0FBQzNCLFFBQUQsRUFBV0ksT0FBWCxFQUFvQkgsTUFBcEIsRUFBNEJDLE9BQTVCLEVBQXFDQyxJQUFyQyxDQUFmOztBQUNBLFVBQUlBLElBQUksQ0FBQ0UsTUFBTCxLQUFnQkEsTUFBcEIsRUFBNEI7QUFDMUJ1QixRQUFBQSxRQUFRLENBQUN4QixPQUFELEVBQVVILE1BQVYsRUFBa0JFLElBQWxCLENBQVI7QUFDRCxPQVQrQixDQVdoQzs7O0FBQ0EsVUFBSUEsSUFBSSxDQUFDRSxNQUFMLEtBQWdCQSxNQUFwQixFQUE0QjtBQUMxQndCLFFBQUFBLFdBQVcsQ0FBQzdCLFFBQUQsRUFBV0ksT0FBWCxFQUFvQkgsTUFBcEIsRUFBNEJDLE9BQTVCLEVBQXFDQyxJQUFyQyxDQUFYO0FBQ0Q7QUFDRjs7QUFFREMsSUFBQUEsT0FBTyxHQUFHQSxPQUFPLENBQUMwQixVQUFsQjtBQUNBekIsSUFBQUEsTUFBTSxHQUFHRixJQUFJLENBQUNFLE1BQWQ7QUFDRDs7QUFFRCxNQUFJRCxPQUFPLEtBQUtQLElBQWhCLEVBQXNCO0FBQ3BCLFFBQU1rQyxPQUFPLEdBQUdDLFdBQVcsQ0FBQ2hDLFFBQUQsRUFBV0ksT0FBWCxFQUFvQkgsTUFBcEIsRUFBNEJDLE9BQTVCLENBQTNCO0FBQ0FDLElBQUFBLElBQUksQ0FBQzhCLE9BQUwsQ0FBYUYsT0FBYjtBQUNEOztBQUVELFNBQU81QixJQUFJLENBQUMrQixJQUFMLENBQVUsR0FBVixDQUFQO0FBQ0Q7QUFFRDs7Ozs7Ozs7Ozs7OztBQVdBLFNBQVNQLGVBQVQsQ0FBMEIzQixRQUExQixFQUFvQ0ksT0FBcEMsRUFBNkNILE1BQTdDLEVBQXFEQyxPQUFyRCxFQUE4REMsSUFBOUQsRUFBaUc7QUFBQSxNQUE3QmdDLE1BQTZCLHVFQUFwQi9CLE9BQU8sQ0FBQzBCLFVBQVk7QUFDL0YsTUFBTUMsT0FBTyxHQUFHSyxxQkFBcUIsQ0FBQ3BDLFFBQUQsRUFBV0ksT0FBWCxFQUFvQkgsTUFBcEIsRUFBNEJDLE9BQTVCLENBQXJDOztBQUNBLE1BQUk2QixPQUFKLEVBQWE7QUFDWCxRQUFNTSxPQUFPLEdBQUdGLE1BQU0sQ0FBQ0csZ0JBQVAsQ0FBd0JQLE9BQXhCLENBQWhCOztBQUNBLFFBQUlNLE9BQU8sQ0FBQ2hDLE1BQVIsS0FBbUIsQ0FBdkIsRUFBMEI7QUFDeEJGLE1BQUFBLElBQUksQ0FBQzhCLE9BQUwsQ0FBYUYsT0FBYjtBQUNBLGFBQU8sSUFBUDtBQUNEO0FBQ0Y7O0FBQ0QsU0FBTyxLQUFQO0FBQ0Q7QUFFRDs7Ozs7Ozs7Ozs7QUFTQSxTQUFTSyxxQkFBVCxDQUFnQ3BDLFFBQWhDLEVBQTBDSSxPQUExQyxFQUFtREgsTUFBbkQsRUFBMkRDLE9BQTNELEVBQW9FO0FBQ2xFLE1BQU1xQyxVQUFVLEdBQUduQyxPQUFPLENBQUNtQyxVQUEzQjtBQUNBLE1BQU1DLFVBQVUsR0FBRzFCLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZd0IsVUFBWixFQUF3QkUsSUFBeEIsQ0FBNkIsVUFBQ0MsSUFBRCxFQUFPQyxJQUFQLEVBQWdCO0FBQzlELFFBQU1DLE9BQU8sR0FBRzVDLFFBQVEsQ0FBQ1AsT0FBVCxDQUFpQjhDLFVBQVUsQ0FBQ0csSUFBRCxDQUFWLENBQWlCcEIsSUFBbEMsQ0FBaEI7QUFDQSxRQUFNdUIsT0FBTyxHQUFHN0MsUUFBUSxDQUFDUCxPQUFULENBQWlCOEMsVUFBVSxDQUFDSSxJQUFELENBQVYsQ0FBaUJyQixJQUFsQyxDQUFoQjs7QUFDQSxRQUFJdUIsT0FBTyxLQUFLLENBQUMsQ0FBakIsRUFBb0I7QUFDbEIsVUFBSUQsT0FBTyxLQUFLLENBQUMsQ0FBakIsRUFBb0I7QUFDbEIsZUFBTyxDQUFQO0FBQ0Q7O0FBQ0QsYUFBTyxDQUFDLENBQVI7QUFDRDs7QUFDRCxXQUFPQSxPQUFPLEdBQUdDLE9BQWpCO0FBQ0QsR0FWa0IsQ0FBbkI7O0FBWUEsT0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBUixFQUFXQyxDQUFDLEdBQUdQLFVBQVUsQ0FBQ25DLE1BQS9CLEVBQXVDeUMsQ0FBQyxHQUFHQyxDQUEzQyxFQUE4Q0QsQ0FBQyxFQUEvQyxFQUFtRDtBQUNqRCxRQUFNRSxHQUFHLEdBQUdSLFVBQVUsQ0FBQ00sQ0FBRCxDQUF0QjtBQUNBLFFBQU12RCxTQUFTLEdBQUdnRCxVQUFVLENBQUNTLEdBQUQsQ0FBNUI7QUFDQSxRQUFNeEQsYUFBYSxHQUFHRCxTQUFTLENBQUMrQixJQUFoQztBQUNBLFFBQU0yQixjQUFjLEdBQUcsNEJBQVkxRCxTQUFTLENBQUNnQyxLQUF0QixDQUF2QjtBQUVBLFFBQU0yQixhQUFhLEdBQUdqRCxNQUFNLENBQUNULGFBQUQsQ0FBTixJQUF5QlMsTUFBTSxDQUFDVixTQUF0RDtBQUNBLFFBQU00RCxvQkFBb0IsR0FBRzdELGFBQWEsQ0FBQ0UsYUFBRCxDQUFiLElBQWdDRixhQUFhLENBQUNDLFNBQTNFOztBQUVBLFFBQUk2RCxXQUFXLENBQUNGLGFBQUQsRUFBZ0IxRCxhQUFoQixFQUErQnlELGNBQS9CLEVBQStDRSxvQkFBL0MsQ0FBZixFQUFxRjtBQUNuRjtBQUNEOztBQUVELFFBQUlwQixPQUFPLGNBQU92QyxhQUFQLGdCQUF5QnlELGNBQXpCLFFBQVgsQ0FiaUQsQ0FlakQ7QUFDQTtBQUNBOztBQUNBLFFBQUl6RCxhQUFhLEtBQUssSUFBdEIsRUFBNEI7QUFDMUJ1QyxNQUFBQSxPQUFPLGNBQU9rQixjQUFQLENBQVA7QUFDRDs7QUFFRCxRQUFJekQsYUFBYSxLQUFLLE9BQXRCLEVBQStCO0FBQzdCLFVBQUk2RCx1QkFBdUIsR0FBR0MscUJBQXFCLENBQUNMLGNBQUQsRUFBaUIvQyxPQUFPLENBQUNxRCxTQUF6QixDQUFuRDtBQUNBRixNQUFBQSx1QkFBdUIsR0FBR0EsdUJBQXVCLENBQUNHLElBQXhCLEdBQStCbkMsT0FBL0IsQ0FBdUMsTUFBdkMsRUFBK0MsR0FBL0MsQ0FBMUI7QUFDQVUsTUFBQUEsT0FBTyxHQUFHc0IsdUJBQXVCLENBQUNoRCxNQUF4QixjQUFxQ2dELHVCQUFyQyxJQUFpRSxJQUEzRTtBQUNELEtBMUJnRCxDQTJCakQ7OztBQUVBLFdBQU90QixPQUFQO0FBQ0Q7O0FBRUQsU0FBTyxJQUFQO0FBQ0Q7QUFDRDs7Ozs7Ozs7OztBQVFBLFNBQVN1QixxQkFBVCxDQUErQkMsU0FBL0IsRUFBMENFLGFBQTFDLEVBQXlEO0FBQ3ZELE1BQU1DLFVBQVUsR0FBR0gsU0FBUyxDQUFDSSxLQUFWLENBQWdCLEdBQWhCLENBQW5CO0FBRUEsU0FBT0QsVUFBVSxDQUFDRSxNQUFYLENBQWtCLFVBQUF0QyxJQUFJLEVBQUk7QUFDL0IsUUFBSSxDQUFDQSxJQUFJLENBQUNqQixNQUFWLEVBQWtCO0FBQ2hCLGFBQU8sSUFBUDtBQUNEOztBQUVELFdBQU8sQ0FBQ29ELGFBQWEsQ0FBQ25DLElBQUQsQ0FBckI7QUFDRCxHQU5NLEVBTUpZLElBTkksQ0FNQyxHQU5ELENBQVA7QUFPRDtBQUVEOzs7Ozs7Ozs7OztBQVNBLFNBQVNOLFFBQVQsQ0FBbUJ4QixPQUFuQixFQUE0QkgsTUFBNUIsRUFBb0NFLElBQXBDLEVBQXVFO0FBQUEsTUFBN0JnQyxNQUE2Qix1RUFBcEIvQixPQUFPLENBQUMwQixVQUFZO0FBQ3JFLE1BQU1DLE9BQU8sR0FBRzhCLGNBQWMsQ0FBQ3pELE9BQUQsRUFBVUgsTUFBVixDQUE5Qjs7QUFDQSxNQUFJOEIsT0FBSixFQUFhO0FBQ1gsUUFBTU0sT0FBTyxHQUFHRixNQUFNLENBQUMyQixvQkFBUCxDQUE0Qi9CLE9BQTVCLENBQWhCOztBQUNBLFFBQUlNLE9BQU8sQ0FBQ2hDLE1BQVIsS0FBbUIsQ0FBdkIsRUFBMEI7QUFDeEJGLE1BQUFBLElBQUksQ0FBQzhCLE9BQUwsQ0FBYUYsT0FBYjtBQUNBLGFBQU8sSUFBUDtBQUNEO0FBQ0Y7O0FBQ0QsU0FBTyxLQUFQO0FBQ0Q7QUFFRDs7Ozs7Ozs7O0FBT0EsU0FBUzhCLGNBQVQsQ0FBeUJ6RCxPQUF6QixFQUFrQ0gsTUFBbEMsRUFBMEM7QUFDeEMsTUFBTThELE9BQU8sR0FBRzNELE9BQU8sQ0FBQzJELE9BQVIsQ0FBZ0JDLFdBQWhCLEVBQWhCOztBQUNBLE1BQUlaLFdBQVcsQ0FBQ25ELE1BQU0sQ0FBQ2dFLEdBQVIsRUFBYSxJQUFiLEVBQW1CRixPQUFuQixDQUFmLEVBQTRDO0FBQzFDLFdBQU8sSUFBUDtBQUNEOztBQUNELFNBQU9BLE9BQVA7QUFDRDtBQUVEOzs7Ozs7Ozs7Ozs7O0FBV0EsU0FBU2xDLFdBQVQsQ0FBc0I3QixRQUF0QixFQUFnQ0ksT0FBaEMsRUFBeUNILE1BQXpDLEVBQWlEQyxPQUFqRCxFQUEwREMsSUFBMUQsRUFBZ0U7QUFDOUQsTUFBTWdDLE1BQU0sR0FBRy9CLE9BQU8sQ0FBQzBCLFVBQXZCO0FBQ0EsTUFBTW9DLFFBQVEsR0FBRy9CLE1BQU0sQ0FBQ2dDLFNBQVAsSUFBb0JoQyxNQUFNLENBQUMrQixRQUE1Qzs7QUFDQSxPQUFLLElBQUlwQixDQUFDLEdBQUcsQ0FBUixFQUFXQyxDQUFDLEdBQUdtQixRQUFRLENBQUM3RCxNQUE3QixFQUFxQ3lDLENBQUMsR0FBR0MsQ0FBekMsRUFBNENELENBQUMsRUFBN0MsRUFBaUQ7QUFDL0MsUUFBTXNCLEtBQUssR0FBR0YsUUFBUSxDQUFDcEIsQ0FBRCxDQUF0Qjs7QUFDQSxRQUFJc0IsS0FBSyxLQUFLaEUsT0FBZCxFQUF1QjtBQUNyQixVQUFNaUUsWUFBWSxHQUFHckMsV0FBVyxDQUFDaEMsUUFBRCxFQUFXb0UsS0FBWCxFQUFrQm5FLE1BQWxCLEVBQTBCQyxPQUExQixDQUFoQzs7QUFDQSxVQUFJLENBQUNtRSxZQUFMLEVBQW1CO0FBQ2pCLGVBQU9DLE9BQU8sQ0FBQ0MsSUFBUixxRkFFSkgsS0FGSSxFQUVHbkUsTUFGSCxFQUVXb0UsWUFGWCxDQUFQO0FBR0Q7O0FBQ0QsVUFBTXRDLE9BQU8sZUFBUXNDLFlBQVIsd0JBQWtDdkIsQ0FBQyxHQUFDLENBQXBDLE1BQWI7QUFDQTNDLE1BQUFBLElBQUksQ0FBQzhCLE9BQUwsQ0FBYUYsT0FBYjtBQUNBLGFBQU8sSUFBUDtBQUNEO0FBQ0Y7O0FBQ0QsU0FBTyxLQUFQO0FBQ0Q7QUFFRDs7Ozs7Ozs7OztBQVFBLFNBQVNDLFdBQVQsQ0FBc0JoQyxRQUF0QixFQUFnQ0ksT0FBaEMsRUFBeUNILE1BQXpDLEVBQWlEQyxPQUFqRCxFQUEwRDtBQUN4RCxNQUFJNkIsT0FBTyxHQUFHSyxxQkFBcUIsQ0FBQ3BDLFFBQUQsRUFBV0ksT0FBWCxFQUFvQkgsTUFBcEIsRUFBNEJDLE9BQTVCLENBQW5DOztBQUNBLE1BQUksQ0FBQzZCLE9BQUwsRUFBYztBQUNaQSxJQUFBQSxPQUFPLEdBQUc4QixjQUFjLENBQUN6RCxPQUFELEVBQVVILE1BQVYsQ0FBeEI7QUFDRDs7QUFDRCxTQUFPOEIsT0FBUDtBQUNEO0FBRUQ7Ozs7Ozs7Ozs7O0FBU0EsU0FBU3FCLFdBQVQsQ0FBc0JsQyxTQUF0QixFQUFpQ0ksSUFBakMsRUFBdUNDLEtBQXZDLEVBQThDRyxnQkFBOUMsRUFBZ0U7QUFDOUQsTUFBSSxDQUFDSCxLQUFMLEVBQVk7QUFDVixXQUFPLElBQVA7QUFDRDs7QUFDRCxNQUFNaUQsS0FBSyxHQUFHdEQsU0FBUyxJQUFJUSxnQkFBM0I7O0FBQ0EsTUFBSSxDQUFDOEMsS0FBTCxFQUFZO0FBQ1YsV0FBTyxLQUFQO0FBQ0Q7O0FBQ0QsU0FBT0EsS0FBSyxDQUFDbEQsSUFBRCxFQUFPQyxLQUFQLEVBQWNHLGdCQUFkLENBQVo7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogIyBNYXRjaFxuICpcbiAqIFJldHJpZXZlIHNlbGVjdG9yIGZvciBhIG5vZGUuXG4gKi9cblxuaW1wb3J0IHsgZXNjYXBlVmFsdWUgfSBmcm9tICcuL3V0aWxpdGllcydcblxuY29uc3QgZGVmYXVsdElnbm9yZSA9IHtcbiAgYXR0cmlidXRlIChhdHRyaWJ1dGVOYW1lKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICdzdHlsZScsXG4gICAgICAnZGF0YS1yZWFjdGlkJyxcbiAgICAgICdkYXRhLXJlYWN0LWNoZWNrc3VtJ1xuICAgIF0uaW5kZXhPZihhdHRyaWJ1dGVOYW1lKSA+IC0xXG4gIH1cbn1cblxuLyoqXG4gKiBHZXQgdGhlIHBhdGggb2YgdGhlIGVsZW1lbnRcbiAqXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gbm9kZSAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBvcHRpb25zIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG1hdGNoIChub2RlLCBvcHRpb25zKSB7XG5cbiAgY29uc3Qge1xuICAgIHJvb3QgPSBkb2N1bWVudCxcbiAgICBza2lwID0gbnVsbCxcbiAgICBwcmlvcml0eSA9IFsnaWQnLCAnY2xhc3MnLCAnaHJlZicsICdzcmMnXSxcbiAgICBpZ25vcmUgPSB7fSxcbiAgICBleGNsdWRlID0ge30sXG4gIH0gPSBvcHRpb25zXG5cbiAgY29uc3QgcGF0aCA9IFtdXG4gIHZhciBlbGVtZW50ID0gbm9kZVxuICB2YXIgbGVuZ3RoID0gcGF0aC5sZW5ndGhcblxuICBjb25zdCBza2lwQ29tcGFyZSA9IHNraXAgJiYgKEFycmF5LmlzQXJyYXkoc2tpcCkgPyBza2lwIDogW3NraXBdKS5tYXAoKGVudHJ5KSA9PiB7XG4gICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIChlbGVtZW50KSA9PiBlbGVtZW50ID09PSBlbnRyeVxuICAgIH1cbiAgICByZXR1cm4gZW50cnlcbiAgfSlcblxuICBjb25zdCBza2lwQ2hlY2tzID0gKGVsZW1lbnQpID0+IHtcbiAgICByZXR1cm4gc2tpcCAmJiBza2lwQ29tcGFyZS5zb21lKChjb21wYXJlKSA9PiBjb21wYXJlKGVsZW1lbnQpKVxuICB9XG5cbiAgT2JqZWN0LmtleXMoaWdub3JlKS5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgdmFyIHByZWRpY2F0ZSA9IGlnbm9yZVt0eXBlXVxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnZnVuY3Rpb24nKSByZXR1cm5cbiAgICBpZiAodHlwZW9mIHByZWRpY2F0ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHByZWRpY2F0ZSA9IHByZWRpY2F0ZS50b1N0cmluZygpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgcHJlZGljYXRlID0gbmV3IFJlZ0V4cChlc2NhcGVWYWx1ZShwcmVkaWNhdGUpLnJlcGxhY2UoL1xcXFwvZywgJ1xcXFxcXFxcJykpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJlZGljYXRlID09PSAnYm9vbGVhbicpIHtcbiAgICAgIHByZWRpY2F0ZSA9IHByZWRpY2F0ZSA/IC8oPzopLyA6IC8uXi9cbiAgICB9XG4gICAgLy8gY2hlY2sgY2xhc3MtL2F0dHJpYnV0ZW5hbWUgZm9yIHJlZ2V4XG4gICAgaWdub3JlW3R5cGVdID0gKG5hbWUsIHZhbHVlKSA9PiBwcmVkaWNhdGUudGVzdCh2YWx1ZSlcbiAgfSlcblxuICB2YXIgaWdub3JlQXR0cmlidXRlID0gaWdub3JlLmF0dHJpYnV0ZTtcbiAgaWdub3JlLmF0dHJpYnV0ZSA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSkge1xuICAgIHJldHVybiBpZ25vcmVBdHRyaWJ1dGUgJiYgaWdub3JlQXR0cmlidXRlKG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKTtcbiAgfTtcblxuICB3aGlsZSAoZWxlbWVudCAhPT0gcm9vdCkge1xuICAgIGlmIChza2lwQ2hlY2tzKGVsZW1lbnQpICE9PSB0cnVlKSB7XG4gICAgICAvLyB+IGdsb2JhbFxuICAgICAgaWYgKGNoZWNrQXR0cmlidXRlcyhwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlLCBwYXRoLCByb290KSkgYnJlYWtcbiAgICAgIGlmIChjaGVja1RhZyhlbGVtZW50LCBpZ25vcmUsIHBhdGgsIHJvb3QpKSBicmVha1xuXG4gICAgICAvLyB+IGxvY2FsXG4gICAgICBjaGVja0F0dHJpYnV0ZXMocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSwgcGF0aClcbiAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgIGNoZWNrVGFnKGVsZW1lbnQsIGlnbm9yZSwgcGF0aClcbiAgICAgIH1cblxuICAgICAgLy8gZGVmaW5lIG9ubHkgb25lIHBhcnQgZWFjaCBpdGVyYXRpb25cbiAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgIGNoZWNrQ2hpbGRzKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUsIHBhdGgpXG4gICAgICB9XG4gICAgfVxuXG4gICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZVxuICAgIGxlbmd0aCA9IHBhdGgubGVuZ3RoXG4gIH1cblxuICBpZiAoZWxlbWVudCA9PT0gcm9vdCkge1xuICAgIGNvbnN0IHBhdHRlcm4gPSBmaW5kUGF0dGVybihwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlKVxuICAgIHBhdGgudW5zaGlmdChwYXR0ZXJuKVxuICB9XG5cbiAgcmV0dXJuIHBhdGguam9pbignICcpXG59XG5cbi8qKlxuICogRXh0ZW5kIHBhdGggd2l0aCBhdHRyaWJ1dGUgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBleGNsdWRlICAtIEV4Y2x1ZGUgZnVuY3Rpb25zIGZvciBwYXJ0cyBvZiBhdHRyaWJ1dGVzXG4gKiBAcGFyYW0gIHtBcnJheS48c3RyaW5nPn0gcGF0aCAgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgcGFyZW50ICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQXR0cmlidXRlcyAocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSwgcGF0aCwgcGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gIGNvbnN0IHBhdHRlcm4gPSBmaW5kQXR0cmlidXRlc1BhdHRlcm4ocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSlcbiAgaWYgKHBhdHRlcm4pIHtcbiAgICBjb25zdCBtYXRjaGVzID0gcGFyZW50LnF1ZXJ5U2VsZWN0b3JBbGwocGF0dGVybilcbiAgICBpZiAobWF0Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHBhdGgudW5zaGlmdChwYXR0ZXJuKVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbi8qKlxuICogTG9va3VwIGF0dHJpYnV0ZSBpZGVudGlmaWVyXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHByaW9yaXR5IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9ICAgIGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGlnbm9yZSAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgIGV4Y2x1ZGUgIC0gRXhjbHVkZSBmdW5jdGlvbnMgZm9yIHBhcnRzIG9mIGF0dHJpYnV0ZXNcbiAqIEByZXR1cm4ge3N0cmluZz99ICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gZmluZEF0dHJpYnV0ZXNQYXR0ZXJuIChwcmlvcml0eSwgZWxlbWVudCwgaWdub3JlLCBleGNsdWRlKSB7XG4gIGNvbnN0IGF0dHJpYnV0ZXMgPSBlbGVtZW50LmF0dHJpYnV0ZXNcbiAgY29uc3Qgc29ydGVkS2V5cyA9IE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLnNvcnQoKGN1cnIsIG5leHQpID0+IHtcbiAgICBjb25zdCBjdXJyUG9zID0gcHJpb3JpdHkuaW5kZXhPZihhdHRyaWJ1dGVzW2N1cnJdLm5hbWUpXG4gICAgY29uc3QgbmV4dFBvcyA9IHByaW9yaXR5LmluZGV4T2YoYXR0cmlidXRlc1tuZXh0XS5uYW1lKVxuICAgIGlmIChuZXh0UG9zID09PSAtMSkge1xuICAgICAgaWYgKGN1cnJQb3MgPT09IC0xKSB7XG4gICAgICAgIHJldHVybiAwXG4gICAgICB9XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gICAgcmV0dXJuIGN1cnJQb3MgLSBuZXh0UG9zXG4gIH0pXG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBzb3J0ZWRLZXlzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IGtleSA9IHNvcnRlZEtleXNbaV1cbiAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2tleV1cbiAgICBjb25zdCBhdHRyaWJ1dGVOYW1lID0gYXR0cmlidXRlLm5hbWVcbiAgICBjb25zdCBhdHRyaWJ1dGVWYWx1ZSA9IGVzY2FwZVZhbHVlKGF0dHJpYnV0ZS52YWx1ZSlcblxuICAgIGNvbnN0IGN1cnJlbnRJZ25vcmUgPSBpZ25vcmVbYXR0cmlidXRlTmFtZV0gfHwgaWdub3JlLmF0dHJpYnV0ZVxuICAgIGNvbnN0IGN1cnJlbnREZWZhdWx0SWdub3JlID0gZGVmYXVsdElnbm9yZVthdHRyaWJ1dGVOYW1lXSB8fCBkZWZhdWx0SWdub3JlLmF0dHJpYnV0ZVxuXG4gICAgaWYgKGNoZWNrSWdub3JlKGN1cnJlbnRJZ25vcmUsIGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlLCBjdXJyZW50RGVmYXVsdElnbm9yZSkpIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgdmFyIHBhdHRlcm4gPSBgWyR7YXR0cmlidXRlTmFtZX09XCIke2F0dHJpYnV0ZVZhbHVlfVwiXWBcblxuICAgIC8vIHRoaXMgaWYgaXMgY29tbWVudGVkIGJlY2F1c2Ugd2UgaGF2ZSBhIGJldHRlciB2YWxpZGF0aW9uIGZvciB0aGlzIGNhc2VzLlxuICAgIC8vIHRoaXMgc2hvdWxkIHNvbHZlIHRoZSBvcHRpbWlzYXRpb24vaWdub3JlIGlzc3VlcyBmb3IgY2xhc3MgbmFtZXMgdGhhdCB3ZXJlIGxlZnQgYXMgW2NsYXNzPVwiYWxsIGNsYXNzZXMgaGVyZVwiXVxuICAgIC8vIGlmICgoL1xcYlxcZC8pLnRlc3QoYXR0cmlidXRlVmFsdWUpID09PSBmYWxzZSkge1xuICAgIGlmIChhdHRyaWJ1dGVOYW1lID09PSAnaWQnKSB7XG4gICAgICBwYXR0ZXJuID0gYCMke2F0dHJpYnV0ZVZhbHVlfWBcbiAgICB9XG5cbiAgICBpZiAoYXR0cmlidXRlTmFtZSA9PT0gJ2NsYXNzJykge1xuICAgICAgbGV0IGNsYXNzTmFtZUFmdGVyRXhjbHVzaW9uID0gZXhjbHVkZUNsYXNzTmFtZVBhcnRzKGF0dHJpYnV0ZVZhbHVlLCBleGNsdWRlLmNsYXNzTmFtZSk7XG4gICAgICBjbGFzc05hbWVBZnRlckV4Y2x1c2lvbiA9IGNsYXNzTmFtZUFmdGVyRXhjbHVzaW9uLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcuJyk7XG4gICAgICBwYXR0ZXJuID0gY2xhc3NOYW1lQWZ0ZXJFeGNsdXNpb24ubGVuZ3RoID8gYC4ke2NsYXNzTmFtZUFmdGVyRXhjbHVzaW9ufWAgOiBudWxsO1xuICAgIH1cbiAgICAvLyB9XG5cbiAgICByZXR1cm4gcGF0dGVyblxuICB9XG5cbiAgcmV0dXJuIG51bGxcbn1cbi8qKlxuKiBUYWtlcyBwYXJ0cyB0aGF0IHNob3VsZCBiZSBleGNsdWRlZCBvdXQgb2YgdGhlIGNsYXNzbmFtZSBiYXNlZCBvbiBzaG91bGRFeGNsdWRlIGNhbGwgcmVzdWx0LlxuKiBBIFwicGFydFwiIGlzIGEgc3Vic3RyaW5nIG9mIHRoZSBjbGFzcyBhdHRyaWJ1dGUgdmFsdWUgZGVsaW1pdGVkIGJ5IHNwYWNlcy5cbipcbiogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgIGNsYXNzTmFtZSAgICAgIEEgcGFydCBvZiBhIGNsYXNzIGF0dHJpYnV0ZSB2YWx1ZVxuKiBAcGFyYW0gIHtGdW5jdGlvbn0gICAgICAgc2hvdWxkRXhjbHVkZSAgRGVjaWRlcyBpZiBuYW1lIGlzIGFjY2VwdGVkIG9yIG5vdFxuKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lIHdpdGggdW53YW50ZWQgcGFydHMobmFtZXMpIGV4Y2x1ZGVkXG4qL1xuZnVuY3Rpb24gZXhjbHVkZUNsYXNzTmFtZVBhcnRzKGNsYXNzTmFtZSwgc2hvdWxkRXhjbHVkZSkge1xuICBjb25zdCBjbGFzc05hbWVzID0gY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG5cbiAgcmV0dXJuIGNsYXNzTmFtZXMuZmlsdGVyKG5hbWUgPT4ge1xuICAgIGlmICghbmFtZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiAhc2hvdWxkRXhjbHVkZShuYW1lKTtcbiAgfSkuam9pbignICcpO1xufVxuXG4vKipcbiAqIEV4dGVuZCBwYXRoIHdpdGggdGFnIGlkZW50aWZpZXJcbiAqXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXkuPHN0cmluZz59IHBhdGggICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gICAgcGFyZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjaGVja1RhZyAoZWxlbWVudCwgaWdub3JlLCBwYXRoLCBwYXJlbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgY29uc3QgcGF0dGVybiA9IGZpbmRUYWdQYXR0ZXJuKGVsZW1lbnQsIGlnbm9yZSlcbiAgaWYgKHBhdHRlcm4pIHtcbiAgICBjb25zdCBtYXRjaGVzID0gcGFyZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHBhdHRlcm4pXG4gICAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICBwYXRoLnVuc2hpZnQocGF0dGVybilcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG4vKipcbiAqIExvb2t1cCB0YWcgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIGlnbm9yZSAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gZmluZFRhZ1BhdHRlcm4gKGVsZW1lbnQsIGlnbm9yZSkge1xuICBjb25zdCB0YWdOYW1lID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgaWYgKGNoZWNrSWdub3JlKGlnbm9yZS50YWcsIG51bGwsIHRhZ05hbWUpKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuICByZXR1cm4gdGFnTmFtZVxufVxuXG4vKipcbiAqIEV4dGVuZCBwYXRoIHdpdGggc3BlY2lmaWMgY2hpbGQgaWRlbnRpZmllclxuICpcbiAqIE5PVEU6ICdjaGlsZFRhZ3MnIGlzIGEgY3VzdG9tIHByb3BlcnR5IHRvIHVzZSBhcyBhIHZpZXcgZmlsdGVyIGZvciB0YWdzIHVzaW5nICdhZGFwdGVyLmpzJ1xuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwYXRoICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY2hlY2tDaGlsZHMgKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUsIHBhdGgpIHtcbiAgY29uc3QgcGFyZW50ID0gZWxlbWVudC5wYXJlbnROb2RlXG4gIGNvbnN0IGNoaWxkcmVuID0gcGFyZW50LmNoaWxkVGFncyB8fCBwYXJlbnQuY2hpbGRyZW5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgaWYgKGNoaWxkID09PSBlbGVtZW50KSB7XG4gICAgICBjb25zdCBjaGlsZFBhdHRlcm4gPSBmaW5kUGF0dGVybihwcmlvcml0eSwgY2hpbGQsIGlnbm9yZSwgZXhjbHVkZSlcbiAgICAgIGlmICghY2hpbGRQYXR0ZXJuKSB7XG4gICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oYFxuICAgICAgICAgIEVsZW1lbnQgY291bGRuXFwndCBiZSBtYXRjaGVkIHRocm91Z2ggc3RyaWN0IGlnbm9yZSBwYXR0ZXJuIVxuICAgICAgICBgLCBjaGlsZCwgaWdub3JlLCBjaGlsZFBhdHRlcm4pXG4gICAgICB9XG4gICAgICBjb25zdCBwYXR0ZXJuID0gYD4gJHtjaGlsZFBhdHRlcm59Om50aC1jaGlsZCgke2krMX0pYFxuICAgICAgcGF0aC51bnNoaWZ0KHBhdHRlcm4pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBMb29rdXAgaWRlbnRpZmllclxuICpcbiAqIEBwYXJhbSAge0FycmF5LjxzdHJpbmc+fSBwcmlvcml0eSAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgICBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICBpZ25vcmUgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gZmluZFBhdHRlcm4gKHByaW9yaXR5LCBlbGVtZW50LCBpZ25vcmUsIGV4Y2x1ZGUpIHtcbiAgdmFyIHBhdHRlcm4gPSBmaW5kQXR0cmlidXRlc1BhdHRlcm4ocHJpb3JpdHksIGVsZW1lbnQsIGlnbm9yZSwgZXhjbHVkZSlcbiAgaWYgKCFwYXR0ZXJuKSB7XG4gICAgcGF0dGVybiA9IGZpbmRUYWdQYXR0ZXJuKGVsZW1lbnQsIGlnbm9yZSlcbiAgfVxuICByZXR1cm4gcGF0dGVyblxufVxuXG4vKipcbiAqIFZhbGlkYXRlIHdpdGggY3VzdG9tIGFuZCBkZWZhdWx0IGZ1bmN0aW9uc1xuICpcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBwcmVkaWNhdGUgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7c3RyaW5nP30gIG5hbWUgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgdmFsdWUgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBkZWZhdWx0UHJlZGljYXRlIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNoZWNrSWdub3JlIChwcmVkaWNhdGUsIG5hbWUsIHZhbHVlLCBkZWZhdWx0UHJlZGljYXRlKSB7XG4gIGlmICghdmFsdWUpIHtcbiAgICByZXR1cm4gdHJ1ZVxuICB9XG4gIGNvbnN0IGNoZWNrID0gcHJlZGljYXRlIHx8IGRlZmF1bHRQcmVkaWNhdGVcbiAgaWYgKCFjaGVjaykge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiBjaGVjayhuYW1lLCB2YWx1ZSwgZGVmYXVsdFByZWRpY2F0ZSlcbn1cbiJdLCJmaWxlIjoibWF0Y2guanMifQ==
