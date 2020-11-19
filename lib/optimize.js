"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = optimize;

var _adapt = _interopRequireDefault(require("./adapt"));

var _utilities = require("./utilities");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * # Optimize
 *
 * 1.) Improve efficiency through shorter selectors by removing redundancy
 * 2.) Improve robustness through selector transformation
 */

/**
 * Apply different optimization techniques
 *
 * @param  {string}                          selector - [description]
 * @param  {HTMLElement|Array.<HTMLElement>} element  - [description]
 * @param  {Object}                          options  - [description]
 * @return {string}                                   - [description]
 */
function optimize(selector, elements) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  // convert single entry and NodeList
  if (!Array.isArray(elements)) {
    elements = !elements.length ? [elements] : (0, _utilities.convertNodeList)(elements);
  }

  if (!elements.length || elements.some(function (element) {
    return element.nodeType !== 1;
  })) {
    throw new Error("Invalid input - to compare HTMLElements its necessary to provide a reference of the selected node(s)! (missing \"elements\")");
  }

  var globalModified = (0, _adapt["default"])(elements[0], options); // chunk parts outside of quotes (http://stackoverflow.com/a/25663729)

  var path = selector.replace(/> /g, '>').split(/\s+(?=(?:(?:[^"]*"){2})*[^"]*$)/);

  if (path.length < 2) {
    return optimizePart('', selector, '', elements);
  }

  var shortened = [path.pop()];

  while (path.length > 1) {
    var current = path.pop();
    var prePart = path.join(' ');
    var postPart = shortened.join(' ');
    var pattern = "".concat(prePart, " ").concat(postPart);
    var matches = document.querySelectorAll(pattern);

    if (matches.length !== elements.length) {
      shortened.unshift(optimizePart(prePart, current, postPart, elements));
    }
  }

  shortened.unshift(path[0]);
  path = shortened; // optimize start + end

  path[0] = optimizePart('', path[0], path.slice(1).join(' '), elements);
  path[path.length - 1] = optimizePart(path.slice(0, -1).join(' '), path[path.length - 1], '', elements);

  if (globalModified) {
    delete global.document;
  }

  return path.join(' ').replace(/>/g, '> ').trim();
}
/**
 * Improve a chunk of the selector
 *
 * @param  {string}              prePart  - [description]
 * @param  {string}              current  - [description]
 * @param  {string}              postPart - [description]
 * @param  {Array.<HTMLElement>} elements - [description]
 * @return {string}                       - [description]
 */


function optimizePart(prePart, current, postPart, elements) {
  if (prePart.length) prePart = "".concat(prePart, " ");
  if (postPart.length) postPart = " ".concat(postPart); // robustness: attribute without value (generalization)

  if (/\[*\]/.test(current)) {
    var key = current.replace(/=.*$/, ']');
    var pattern = "".concat(prePart).concat(key).concat(postPart);
    var matches = document.querySelectorAll(pattern);

    if (compareResults(matches, elements)) {
      current = key;
    } else {
      // robustness: replace specific key-value with base tag (heuristic)
      var references = document.querySelectorAll("".concat(prePart).concat(key));

      var _loop = function _loop() {
        var reference = references[i];

        if (elements.some(function (element) {
          return reference.contains(element);
        })) {
          var description = reference.tagName.toLowerCase();
          pattern = "".concat(prePart).concat(description).concat(postPart);
          matches = document.querySelectorAll(pattern);

          if (compareResults(matches, elements)) {
            current = description;
          }

          return "break";
        }
      };

      for (var i = 0, l = references.length; i < l; i++) {
        var pattern;
        var matches;

        var _ret = _loop();

        if (_ret === "break") break;
      }
    }
  } // robustness: descendant instead child (heuristic)


  if (/>/.test(current)) {
    var descendant = current.replace(/>/, '');
    var pattern = "".concat(prePart).concat(descendant).concat(postPart);
    var matches = document.querySelectorAll(pattern);

    if (compareResults(matches, elements)) {
      current = descendant;
    }
  } // robustness: 'nth-of-type' instead 'nth-child' (heuristic)


  if (/:nth-child/.test(current)) {
    // TODO: consider complete coverage of 'nth-of-type' replacement
    var type = current.replace(/nth-child/g, 'nth-of-type');
    var pattern = "".concat(prePart).concat(type).concat(postPart);
    var matches = document.querySelectorAll(pattern);

    if (compareResults(matches, elements)) {
      current = type;
    }
  } // efficiency: combinations of classname (partial permutations)


  if (/\.\S+\.\S+/.test(current)) {
    var names = current.trim().split('.').slice(1).map(function (name) {
      return ".".concat(name);
    }).sort(function (curr, next) {
      return curr.length - next.length;
    });

    while (names.length) {
      var partial = current.replace(names.shift(), '').trim();
      var pattern = "".concat(prePart).concat(partial).concat(postPart).trim();

      if (!pattern.length || pattern.charAt(0) === '>' || pattern.charAt(pattern.length - 1) === '>') {
        break;
      }

      var matches = document.querySelectorAll(pattern);

      if (compareResults(matches, elements)) {
        current = partial;
      }
    } // robustness: degrade complex classname (heuristic)


    names = current && current.match(/\./g);

    if (names && names.length > 2) {
      var _references = document.querySelectorAll("".concat(prePart).concat(current));

      var _loop2 = function _loop2() {
        var reference = _references[i];

        if (elements.some(function (element) {
          return reference.contains(element);
        })) {
          // TODO:
          // - check using attributes + regard excludes
          var description = reference.tagName.toLowerCase();
          pattern = "".concat(prePart).concat(description).concat(postPart);
          matches = document.querySelectorAll(pattern);

          if (compareResults(matches, elements)) {
            current = description;
          }

          return "break";
        }
      };

      for (var i = 0, l = _references.length; i < l; i++) {
        var pattern;
        var matches;

        var _ret2 = _loop2();

        if (_ret2 === "break") break;
      }
    }
  }

  return current;
}
/**
 * Evaluate matches with expected elements
 *
 * @param  {Array.<HTMLElement>} matches  - [description]
 * @param  {Array.<HTMLElement>} elements - [description]
 * @return {Boolean}                      - [description]
 */


function compareResults(matches, elements) {
  var length = matches.length;
  return length === elements.length && elements.every(function (element) {
    for (var i = 0; i < length; i++) {
      if (matches[i] === element) {
        return true;
      }
    }

    return false;
  });
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm9wdGltaXplLmpzIl0sIm5hbWVzIjpbIm9wdGltaXplIiwic2VsZWN0b3IiLCJlbGVtZW50cyIsIm9wdGlvbnMiLCJBcnJheSIsImlzQXJyYXkiLCJsZW5ndGgiLCJzb21lIiwiZWxlbWVudCIsIm5vZGVUeXBlIiwiRXJyb3IiLCJnbG9iYWxNb2RpZmllZCIsInBhdGgiLCJyZXBsYWNlIiwic3BsaXQiLCJvcHRpbWl6ZVBhcnQiLCJzaG9ydGVuZWQiLCJwb3AiLCJjdXJyZW50IiwicHJlUGFydCIsImpvaW4iLCJwb3N0UGFydCIsInBhdHRlcm4iLCJtYXRjaGVzIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yQWxsIiwidW5zaGlmdCIsInNsaWNlIiwiZ2xvYmFsIiwidHJpbSIsInRlc3QiLCJrZXkiLCJjb21wYXJlUmVzdWx0cyIsInJlZmVyZW5jZXMiLCJyZWZlcmVuY2UiLCJpIiwiY29udGFpbnMiLCJkZXNjcmlwdGlvbiIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsImwiLCJkZXNjZW5kYW50IiwidHlwZSIsIm5hbWVzIiwibWFwIiwibmFtZSIsInNvcnQiLCJjdXJyIiwibmV4dCIsInBhcnRpYWwiLCJzaGlmdCIsImNoYXJBdCIsIm1hdGNoIiwiZXZlcnkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFPQTs7QUFDQTs7OztBQVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ2UsU0FBU0EsUUFBVCxDQUFtQkMsUUFBbkIsRUFBNkJDLFFBQTdCLEVBQXFEO0FBQUEsTUFBZEMsT0FBYyx1RUFBSixFQUFJOztBQUVsRTtBQUNBLE1BQUksQ0FBQ0MsS0FBSyxDQUFDQyxPQUFOLENBQWNILFFBQWQsQ0FBTCxFQUE4QjtBQUM1QkEsSUFBQUEsUUFBUSxHQUFHLENBQUNBLFFBQVEsQ0FBQ0ksTUFBVixHQUFtQixDQUFDSixRQUFELENBQW5CLEdBQWdDLGdDQUFnQkEsUUFBaEIsQ0FB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ekIsRUFBa0NyQixRQUFsQyxFQUE0QztBQUFBLE1BQ2xDSSxNQURrQyxHQUN2QmlCLE9BRHVCLENBQ2xDakIsTUFEa0M7QUFFMUMsU0FBT0EsTUFBTSxLQUFLSixRQUFRLENBQUNJLE1BQXBCLElBQThCSixRQUFRLENBQUNtRCxLQUFULENBQWUsVUFBQzdDLE9BQUQsRUFBYTtBQUMvRCxTQUFLLElBQUkyQixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHN0IsTUFBcEIsRUFBNEI2QixDQUFDLEVBQTdCLEVBQWlDO0FBQy9CLFVBQUlaLE9BQU8sQ0FBQ1ksQ0FBRCxDQUFQLEtBQWUzQixPQUFuQixFQUE0QjtBQUMxQixlQUFPLElBQVA7QUFDRDtBQUNGOztBQUNELFdBQU8sS0FBUDtBQUNELEdBUG9DLENBQXJDO0FBUUQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqICMgT3B0aW1pemVcbiAqXG4gKiAxLikgSW1wcm92ZSBlZmZpY2llbmN5IHRocm91Z2ggc2hvcnRlciBzZWxlY3RvcnMgYnkgcmVtb3ZpbmcgcmVkdW5kYW5jeVxuICogMi4pIEltcHJvdmUgcm9idXN0bmVzcyB0aHJvdWdoIHNlbGVjdG9yIHRyYW5zZm9ybWF0aW9uXG4gKi9cblxuaW1wb3J0IGFkYXB0IGZyb20gJy4vYWRhcHQnXG5pbXBvcnQgeyBjb252ZXJ0Tm9kZUxpc3QgfSBmcm9tICcuL3V0aWxpdGllcydcblxuLyoqXG4gKiBBcHBseSBkaWZmZXJlbnQgb3B0aW1pemF0aW9uIHRlY2huaXF1ZXNcbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RvciAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fEFycmF5LjxIVE1MRWxlbWVudD59IGVsZW1lbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gb3B0aW1pemUgKHNlbGVjdG9yLCBlbGVtZW50cywgb3B0aW9ucyA9IHt9KSB7XG5cbiAgLy8gY29udmVydCBzaW5nbGUgZW50cnkgYW5kIE5vZGVMaXN0XG4gIGlmICghQXJyYXkuaXNBcnJheShlbGVtZW50cykpIHtcbiAgICBlbGVtZW50cyA9ICFlbGVtZW50cy5sZW5ndGggPyBbZWxlbWVudHNdIDogY29udmVydE5vZGVMaXN0KGVsZW1lbnRzKVxuICB9XG5cbiAgaWYgKCFlbGVtZW50cy5sZW5ndGggfHwgZWxlbWVudHMuc29tZSgoZWxlbWVudCkgPT4gZWxlbWVudC5ub2RlVHlwZSAhPT0gMSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgaW5wdXQgLSB0byBjb21wYXJlIEhUTUxFbGVtZW50cyBpdHMgbmVjZXNzYXJ5IHRvIHByb3ZpZGUgYSByZWZlcmVuY2Ugb2YgdGhlIHNlbGVjdGVkIG5vZGUocykhIChtaXNzaW5nIFwiZWxlbWVudHNcIilgKVxuICB9XG5cbiAgY29uc3QgZ2xvYmFsTW9kaWZpZWQgPSBhZGFwdChlbGVtZW50c1swXSwgb3B0aW9ucylcblxuICAvLyBjaHVuayBwYXJ0cyBvdXRzaWRlIG9mIHF1b3RlcyAoaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjU2NjM3MjkpXG4gIHZhciBwYXRoID0gc2VsZWN0b3IucmVwbGFjZSgvPiAvZywgJz4nKS5zcGxpdCgvXFxzKyg/PSg/Oig/OlteXCJdKlwiKXsyfSkqW15cIl0qJCkvKVxuXG4gIGlmIChwYXRoLmxlbmd0aCA8IDIpIHtcbiAgICByZXR1cm4gb3B0aW1pemVQYXJ0KCcnLCBzZWxlY3RvciwgJycsIGVsZW1lbnRzKVxuICB9XG5cbiAgY29uc3Qgc2hvcnRlbmVkID0gW3BhdGgucG9wKCldXG4gIHdoaWxlIChwYXRoLmxlbmd0aCA+IDEpICB7XG4gICAgY29uc3QgY3VycmVudCA9IHBhdGgucG9wKClcbiAgICBjb25zdCBwcmVQYXJ0ID0gcGF0aC5qb2luKCcgJylcbiAgICBjb25zdCBwb3N0UGFydCA9IHNob3J0ZW5lZC5qb2luKCcgJylcblxuICAgIGNvbnN0IHBhdHRlcm4gPSBgJHtwcmVQYXJ0fSAke3Bvc3RQYXJ0fWBcbiAgICBjb25zdCBtYXRjaGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCAhPT0gZWxlbWVudHMubGVuZ3RoKSB7XG4gICAgICBzaG9ydGVuZWQudW5zaGlmdChvcHRpbWl6ZVBhcnQocHJlUGFydCwgY3VycmVudCwgcG9zdFBhcnQsIGVsZW1lbnRzKSlcbiAgICB9XG4gIH1cbiAgc2hvcnRlbmVkLnVuc2hpZnQocGF0aFswXSlcbiAgcGF0aCA9IHNob3J0ZW5lZFxuXG4gIC8vIG9wdGltaXplIHN0YXJ0ICsgZW5kXG4gIHBhdGhbMF0gPSBvcHRpbWl6ZVBhcnQoJycsIHBhdGhbMF0sIHBhdGguc2xpY2UoMSkuam9pbignICcpLCBlbGVtZW50cylcbiAgcGF0aFtwYXRoLmxlbmd0aC0xXSA9IG9wdGltaXplUGFydChwYXRoLnNsaWNlKDAsIC0xKS5qb2luKCcgJyksIHBhdGhbcGF0aC5sZW5ndGgtMV0sICcnLCBlbGVtZW50cylcblxuICBpZiAoZ2xvYmFsTW9kaWZpZWQpIHtcbiAgICBkZWxldGUgZ2xvYmFsLmRvY3VtZW50XG4gIH1cblxuICByZXR1cm4gcGF0aC5qb2luKCcgJykucmVwbGFjZSgvPi9nLCAnPiAnKS50cmltKClcbn1cblxuLyoqXG4gKiBJbXByb3ZlIGEgY2h1bmsgb2YgdGhlIHNlbGVjdG9yXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgICAgICAgcHJlUGFydCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgICBjdXJyZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgICAgIHBvc3RQYXJ0IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXkuPEhUTUxFbGVtZW50Pn0gZWxlbWVudHMgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gb3B0aW1pemVQYXJ0IChwcmVQYXJ0LCBjdXJyZW50LCBwb3N0UGFydCwgZWxlbWVudHMpIHtcbiAgaWYgKHByZVBhcnQubGVuZ3RoKSBwcmVQYXJ0ID0gYCR7cHJlUGFydH0gYFxuICBpZiAocG9zdFBhcnQubGVuZ3RoKSBwb3N0UGFydCA9IGAgJHtwb3N0UGFydH1gXG5cbiAgLy8gcm9idXN0bmVzczogYXR0cmlidXRlIHdpdGhvdXQgdmFsdWUgKGdlbmVyYWxpemF0aW9uKVxuICBpZiAoL1xcWypcXF0vLnRlc3QoY3VycmVudCkpIHtcbiAgICBjb25zdCBrZXkgPSBjdXJyZW50LnJlcGxhY2UoLz0uKiQvLCAnXScpXG4gICAgdmFyIHBhdHRlcm4gPSBgJHtwcmVQYXJ0fSR7a2V5fSR7cG9zdFBhcnR9YFxuICAgIHZhciBtYXRjaGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgIGlmIChjb21wYXJlUmVzdWx0cyhtYXRjaGVzLCBlbGVtZW50cykpIHtcbiAgICAgIGN1cnJlbnQgPSBrZXlcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gcm9idXN0bmVzczogcmVwbGFjZSBzcGVjaWZpYyBrZXktdmFsdWUgd2l0aCBiYXNlIHRhZyAoaGV1cmlzdGljKVxuICAgICAgY29uc3QgcmVmZXJlbmNlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYCR7cHJlUGFydH0ke2tleX1gKVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSByZWZlcmVuY2VzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBjb25zdCByZWZlcmVuY2UgPSByZWZlcmVuY2VzW2ldXG4gICAgICAgIGlmIChlbGVtZW50cy5zb21lKChlbGVtZW50KSA9PiByZWZlcmVuY2UuY29udGFpbnMoZWxlbWVudCkpKSB7XG4gICAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSByZWZlcmVuY2UudGFnTmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgdmFyIHBhdHRlcm4gPSBgJHtwcmVQYXJ0fSR7ZGVzY3JpcHRpb259JHtwb3N0UGFydH1gXG4gICAgICAgICAgdmFyIG1hdGNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgICAgICAgaWYgKGNvbXBhcmVSZXN1bHRzKG1hdGNoZXMsIGVsZW1lbnRzKSkge1xuICAgICAgICAgICAgY3VycmVudCA9IGRlc2NyaXB0aW9uXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyByb2J1c3RuZXNzOiBkZXNjZW5kYW50IGluc3RlYWQgY2hpbGQgKGhldXJpc3RpYylcbiAgaWYgKC8+Ly50ZXN0KGN1cnJlbnQpKSB7XG4gICAgY29uc3QgZGVzY2VuZGFudCA9IGN1cnJlbnQucmVwbGFjZSgvPi8sICcnKVxuICAgIHZhciBwYXR0ZXJuID0gYCR7cHJlUGFydH0ke2Rlc2NlbmRhbnR9JHtwb3N0UGFydH1gXG4gICAgdmFyIG1hdGNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgaWYgKGNvbXBhcmVSZXN1bHRzKG1hdGNoZXMsIGVsZW1lbnRzKSkge1xuICAgICAgY3VycmVudCA9IGRlc2NlbmRhbnRcbiAgICB9XG4gIH1cblxuICAvLyByb2J1c3RuZXNzOiAnbnRoLW9mLXR5cGUnIGluc3RlYWQgJ250aC1jaGlsZCcgKGhldXJpc3RpYylcbiAgaWYgKC86bnRoLWNoaWxkLy50ZXN0KGN1cnJlbnQpKSB7XG4gICAgLy8gVE9ETzogY29uc2lkZXIgY29tcGxldGUgY292ZXJhZ2Ugb2YgJ250aC1vZi10eXBlJyByZXBsYWNlbWVudFxuICAgIGNvbnN0IHR5cGUgPSBjdXJyZW50LnJlcGxhY2UoL250aC1jaGlsZC9nLCAnbnRoLW9mLXR5cGUnKVxuICAgIHZhciBwYXR0ZXJuID0gYCR7cHJlUGFydH0ke3R5cGV9JHtwb3N0UGFydH1gXG4gICAgdmFyIG1hdGNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgaWYgKGNvbXBhcmVSZXN1bHRzKG1hdGNoZXMsIGVsZW1lbnRzKSkge1xuICAgICAgY3VycmVudCA9IHR5cGVcbiAgICB9XG4gIH1cblxuICAvLyBlZmZpY2llbmN5OiBjb21iaW5hdGlvbnMgb2YgY2xhc3NuYW1lIChwYXJ0aWFsIHBlcm11dGF0aW9ucylcbiAgaWYgKC9cXC5cXFMrXFwuXFxTKy8udGVzdChjdXJyZW50KSkge1xuICAgIHZhciBuYW1lcyA9IGN1cnJlbnQudHJpbSgpLnNwbGl0KCcuJykuc2xpY2UoMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgobmFtZSkgPT4gYC4ke25hbWV9YClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGN1cnIsIG5leHQpID0+IGN1cnIubGVuZ3RoIC0gbmV4dC5sZW5ndGgpXG4gICAgd2hpbGUgKG5hbWVzLmxlbmd0aCkge1xuICAgICAgY29uc3QgcGFydGlhbCA9IGN1cnJlbnQucmVwbGFjZShuYW1lcy5zaGlmdCgpLCAnJykudHJpbSgpXG4gICAgICB2YXIgcGF0dGVybiA9IGAke3ByZVBhcnR9JHtwYXJ0aWFsfSR7cG9zdFBhcnR9YC50cmltKClcbiAgICAgIGlmICghcGF0dGVybi5sZW5ndGggfHwgcGF0dGVybi5jaGFyQXQoMCkgPT09ICc+JyB8fCBwYXR0ZXJuLmNoYXJBdChwYXR0ZXJuLmxlbmd0aC0xKSA9PT0gJz4nKSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICB2YXIgbWF0Y2hlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocGF0dGVybilcbiAgICAgIGlmIChjb21wYXJlUmVzdWx0cyhtYXRjaGVzLCBlbGVtZW50cykpIHtcbiAgICAgICAgY3VycmVudCA9IHBhcnRpYWxcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyByb2J1c3RuZXNzOiBkZWdyYWRlIGNvbXBsZXggY2xhc3NuYW1lIChoZXVyaXN0aWMpXG4gICAgbmFtZXMgPSBjdXJyZW50ICYmIGN1cnJlbnQubWF0Y2goL1xcLi9nKVxuICAgIGlmIChuYW1lcyAmJiBuYW1lcy5sZW5ndGggPiAyKSB7XG4gICAgICBjb25zdCByZWZlcmVuY2VzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgJHtwcmVQYXJ0fSR7Y3VycmVudH1gKVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSByZWZlcmVuY2VzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBjb25zdCByZWZlcmVuY2UgPSByZWZlcmVuY2VzW2ldXG4gICAgICAgIGlmIChlbGVtZW50cy5zb21lKChlbGVtZW50KSA9PiByZWZlcmVuY2UuY29udGFpbnMoZWxlbWVudCkgKSkge1xuICAgICAgICAgIC8vIFRPRE86XG4gICAgICAgICAgLy8gLSBjaGVjayB1c2luZyBhdHRyaWJ1dGVzICsgcmVnYXJkIGV4Y2x1ZGVzXG4gICAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSByZWZlcmVuY2UudGFnTmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgdmFyIHBhdHRlcm4gPSBgJHtwcmVQYXJ0fSR7ZGVzY3JpcHRpb259JHtwb3N0UGFydH1gXG4gICAgICAgICAgdmFyIG1hdGNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgICAgICAgaWYgKGNvbXBhcmVSZXN1bHRzKG1hdGNoZXMsIGVsZW1lbnRzKSkge1xuICAgICAgICAgICAgY3VycmVudCA9IGRlc2NyaXB0aW9uXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gY3VycmVudFxufVxuXG4vKipcbiAqIEV2YWx1YXRlIG1hdGNoZXMgd2l0aCBleHBlY3RlZCBlbGVtZW50c1xuICpcbiAqIEBwYXJhbSAge0FycmF5LjxIVE1MRWxlbWVudD59IG1hdGNoZXMgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7QXJyYXkuPEhUTUxFbGVtZW50Pn0gZWxlbWVudHMgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gY29tcGFyZVJlc3VsdHMgKG1hdGNoZXMsIGVsZW1lbnRzKSB7XG4gIGNvbnN0IHsgbGVuZ3RoIH0gPSBtYXRjaGVzXG4gIHJldHVybiBsZW5ndGggPT09IGVsZW1lbnRzLmxlbmd0aCAmJiBlbGVtZW50cy5ldmVyeSgoZWxlbWVudCkgPT4ge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChtYXRjaGVzW2ldID09PSBlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZVxuICB9KVxufVxuIl0sImZpbGUiOiJvcHRpbWl6ZS5qcyJ9
