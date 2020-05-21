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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm9wdGltaXplLmpzIl0sIm5hbWVzIjpbIm9wdGltaXplIiwic2VsZWN0b3IiLCJlbGVtZW50cyIsIm9wdGlvbnMiLCJBcnJheSIsImlzQXJyYXkiLCJsZW5ndGgiLCJzb21lIiwiZWxlbWVudCIsIm5vZGVUeXBlIiwiRXJyb3IiLCJnbG9iYWxNb2RpZmllZCIsInBhdGgiLCJyZXBsYWNlIiwic3BsaXQiLCJvcHRpbWl6ZVBhcnQiLCJzaG9ydGVuZWQiLCJwb3AiLCJjdXJyZW50IiwicHJlUGFydCIsImpvaW4iLCJwb3N0UGFydCIsInBhdHRlcm4iLCJtYXRjaGVzIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yQWxsIiwidW5zaGlmdCIsInNsaWNlIiwiZ2xvYmFsIiwidHJpbSIsInRlc3QiLCJrZXkiLCJjb21wYXJlUmVzdWx0cyIsInJlZmVyZW5jZXMiLCJyZWZlcmVuY2UiLCJpIiwiY29udGFpbnMiLCJkZXNjcmlwdGlvbiIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsImwiLCJkZXNjZW5kYW50IiwidHlwZSIsIm5hbWVzIiwibWFwIiwibmFtZSIsInNvcnQiLCJjdXJyIiwibmV4dCIsInBhcnRpYWwiLCJzaGlmdCIsImNoYXJBdCIsIm1hdGNoIiwiZXZlcnkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFPQTs7QUFDQTs7OztBQVJBOzs7Ozs7O0FBVUE7Ozs7Ozs7O0FBUWUsU0FBU0EsUUFBVCxDQUFtQkMsUUFBbkIsRUFBNkJDLFFBQTdCLEVBQXFEO0FBQUEsTUFBZEMsT0FBYyx1RUFBSixFQUFJOztBQUVsRTtBQUNBLE1BQUksQ0FBQ0MsS0FBSyxDQUFDQyxPQUFOLENBQWNILFFBQWQsQ0FBTCxFQUE4QjtBQUM1QkEsSUFBQUEsUUFBUSxHQUFHLENBQUNBLFFBQVEsQ0FBQ0ksTUFBVixHQUFtQixDQUFDSixRQUFELENBQW5CLEdBQWdDLGdDQUFnQkEsUUFBaEIsQ0FBM0M7QUFDRDs7QUFFRCxNQUFJLENBQUNBLFFBQVEsQ0FBQ0ksTUFBVixJQUFvQkos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QUFwQixJQUE4QkosUUFBUSxDQUFDbUQsS0FBVCxDQUFlLFVBQUM3QyxPQUFELEVBQWE7QUFDL0QsU0FBSyxJQUFJMkIsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRzdCLE1BQXBCLEVBQTRCNkIsQ0FBQyxFQUE3QixFQUFpQztBQUMvQixVQUFJWixPQUFPLENBQUNZLENBQUQsQ0FBUCxLQUFlM0IsT0FBbkIsRUFBNEI7QUFDMUIsZUFBTyxJQUFQO0FBQ0Q7QUFDRjs7QUFDRCxXQUFPLEtBQVA7QUFDRCxHQVBvQyxDQUFyQztBQVFEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAjIE9wdGltaXplXG4gKlxuICogMS4pIEltcHJvdmUgZWZmaWNpZW5jeSB0aHJvdWdoIHNob3J0ZXIgc2VsZWN0b3JzIGJ5IHJlbW92aW5nIHJlZHVuZGFuY3lcbiAqIDIuKSBJbXByb3ZlIHJvYnVzdG5lc3MgdGhyb3VnaCBzZWxlY3RvciB0cmFuc2Zvcm1hdGlvblxuICovXG5cbmltcG9ydCBhZGFwdCBmcm9tICcuL2FkYXB0J1xuaW1wb3J0IHsgY29udmVydE5vZGVMaXN0IH0gZnJvbSAnLi91dGlsaXRpZXMnXG5cbi8qKlxuICogQXBwbHkgZGlmZmVyZW50IG9wdGltaXphdGlvbiB0ZWNobmlxdWVzXG4gKlxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0b3IgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudHxBcnJheS48SFRNTEVsZW1lbnQ+fSBlbGVtZW50ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIG9wdGltaXplIChzZWxlY3RvciwgZWxlbWVudHMsIG9wdGlvbnMgPSB7fSkge1xuXG4gIC8vIGNvbnZlcnQgc2luZ2xlIGVudHJ5IGFuZCBOb2RlTGlzdFxuICBpZiAoIUFycmF5LmlzQXJyYXkoZWxlbWVudHMpKSB7XG4gICAgZWxlbWVudHMgPSAhZWxlbWVudHMubGVuZ3RoID8gW2VsZW1lbnRzXSA6IGNvbnZlcnROb2RlTGlzdChlbGVtZW50cylcbiAgfVxuXG4gIGlmICghZWxlbWVudHMubGVuZ3RoIHx8IGVsZW1lbnRzLnNvbWUoKGVsZW1lbnQpID0+IGVsZW1lbnQubm9kZVR5cGUgIT09IDEpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGlucHV0IC0gdG8gY29tcGFyZSBIVE1MRWxlbWVudHMgaXRzIG5lY2Vzc2FyeSB0byBwcm92aWRlIGEgcmVmZXJlbmNlIG9mIHRoZSBzZWxlY3RlZCBub2RlKHMpISAobWlzc2luZyBcImVsZW1lbnRzXCIpYClcbiAgfVxuXG4gIGNvbnN0IGdsb2JhbE1vZGlmaWVkID0gYWRhcHQoZWxlbWVudHNbMF0sIG9wdGlvbnMpXG5cbiAgLy8gY2h1bmsgcGFydHMgb3V0c2lkZSBvZiBxdW90ZXMgKGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzI1NjYzNzI5KVxuICB2YXIgcGF0aCA9IHNlbGVjdG9yLnJlcGxhY2UoLz4gL2csICc+Jykuc3BsaXQoL1xccysoPz0oPzooPzpbXlwiXSpcIil7Mn0pKlteXCJdKiQpLylcblxuICBpZiAocGF0aC5sZW5ndGggPCAyKSB7XG4gICAgcmV0dXJuIG9wdGltaXplUGFydCgnJywgc2VsZWN0b3IsICcnLCBlbGVtZW50cylcbiAgfVxuXG4gIGNvbnN0IHNob3J0ZW5lZCA9IFtwYXRoLnBvcCgpXVxuICB3aGlsZSAocGF0aC5sZW5ndGggPiAxKSAge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBwYXRoLnBvcCgpXG4gICAgY29uc3QgcHJlUGFydCA9IHBhdGguam9pbignICcpXG4gICAgY29uc3QgcG9zdFBhcnQgPSBzaG9ydGVuZWQuam9pbignICcpXG5cbiAgICBjb25zdCBwYXR0ZXJuID0gYCR7cHJlUGFydH0gJHtwb3N0UGFydH1gXG4gICAgY29uc3QgbWF0Y2hlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocGF0dGVybilcbiAgICBpZiAobWF0Y2hlcy5sZW5ndGggIT09IGVsZW1lbnRzLmxlbmd0aCkge1xuICAgICAgc2hvcnRlbmVkLnVuc2hpZnQob3B0aW1pemVQYXJ0KHByZVBhcnQsIGN1cnJlbnQsIHBvc3RQYXJ0LCBlbGVtZW50cykpXG4gICAgfVxuICB9XG4gIHNob3J0ZW5lZC51bnNoaWZ0KHBhdGhbMF0pXG4gIHBhdGggPSBzaG9ydGVuZWRcblxuICAvLyBvcHRpbWl6ZSBzdGFydCArIGVuZFxuICBwYXRoWzBdID0gb3B0aW1pemVQYXJ0KCcnLCBwYXRoWzBdLCBwYXRoLnNsaWNlKDEpLmpvaW4oJyAnKSwgZWxlbWVudHMpXG4gIHBhdGhbcGF0aC5sZW5ndGgtMV0gPSBvcHRpbWl6ZVBhcnQocGF0aC5zbGljZSgwLCAtMSkuam9pbignICcpLCBwYXRoW3BhdGgubGVuZ3RoLTFdLCAnJywgZWxlbWVudHMpXG5cbiAgaWYgKGdsb2JhbE1vZGlmaWVkKSB7XG4gICAgZGVsZXRlIGdsb2JhbC5kb2N1bWVudFxuICB9XG5cbiAgcmV0dXJuIHBhdGguam9pbignICcpLnJlcGxhY2UoLz4vZywgJz4gJykudHJpbSgpXG59XG5cbi8qKlxuICogSW1wcm92ZSBhIGNodW5rIG9mIHRoZSBzZWxlY3RvclxuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgICAgIHByZVBhcnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgICAgICAgY3VycmVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgICBwb3N0UGFydCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5LjxIVE1MRWxlbWVudD59IGVsZW1lbnRzIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIG9wdGltaXplUGFydCAocHJlUGFydCwgY3VycmVudCwgcG9zdFBhcnQsIGVsZW1lbnRzKSB7XG4gIGlmIChwcmVQYXJ0Lmxlbmd0aCkgcHJlUGFydCA9IGAke3ByZVBhcnR9IGBcbiAgaWYgKHBvc3RQYXJ0Lmxlbmd0aCkgcG9zdFBhcnQgPSBgICR7cG9zdFBhcnR9YFxuXG4gIC8vIHJvYnVzdG5lc3M6IGF0dHJpYnV0ZSB3aXRob3V0IHZhbHVlIChnZW5lcmFsaXphdGlvbilcbiAgaWYgKC9cXFsqXFxdLy50ZXN0KGN1cnJlbnQpKSB7XG4gICAgY29uc3Qga2V5ID0gY3VycmVudC5yZXBsYWNlKC89LiokLywgJ10nKVxuICAgIHZhciBwYXR0ZXJuID0gYCR7cHJlUGFydH0ke2tleX0ke3Bvc3RQYXJ0fWBcbiAgICB2YXIgbWF0Y2hlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocGF0dGVybilcbiAgICBpZiAoY29tcGFyZVJlc3VsdHMobWF0Y2hlcywgZWxlbWVudHMpKSB7XG4gICAgICBjdXJyZW50ID0ga2V5XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHJvYnVzdG5lc3M6IHJlcGxhY2Ugc3BlY2lmaWMga2V5LXZhbHVlIHdpdGggYmFzZSB0YWcgKGhldXJpc3RpYylcbiAgICAgIGNvbnN0IHJlZmVyZW5jZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAke3ByZVBhcnR9JHtrZXl9YClcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcmVmZXJlbmNlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgY29uc3QgcmVmZXJlbmNlID0gcmVmZXJlbmNlc1tpXVxuICAgICAgICBpZiAoZWxlbWVudHMuc29tZSgoZWxlbWVudCkgPT4gcmVmZXJlbmNlLmNvbnRhaW5zKGVsZW1lbnQpKSkge1xuICAgICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gcmVmZXJlbmNlLnRhZ05hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgICAgIHZhciBwYXR0ZXJuID0gYCR7cHJlUGFydH0ke2Rlc2NyaXB0aW9ufSR7cG9zdFBhcnR9YFxuICAgICAgICAgIHZhciBtYXRjaGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgICAgICAgIGlmIChjb21wYXJlUmVzdWx0cyhtYXRjaGVzLCBlbGVtZW50cykpIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBkZXNjcmlwdGlvblxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gcm9idXN0bmVzczogZGVzY2VuZGFudCBpbnN0ZWFkIGNoaWxkIChoZXVyaXN0aWMpXG4gIGlmICgvPi8udGVzdChjdXJyZW50KSkge1xuICAgIGNvbnN0IGRlc2NlbmRhbnQgPSBjdXJyZW50LnJlcGxhY2UoLz4vLCAnJylcbiAgICB2YXIgcGF0dGVybiA9IGAke3ByZVBhcnR9JHtkZXNjZW5kYW50fSR7cG9zdFBhcnR9YFxuICAgIHZhciBtYXRjaGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgIGlmIChjb21wYXJlUmVzdWx0cyhtYXRjaGVzLCBlbGVtZW50cykpIHtcbiAgICAgIGN1cnJlbnQgPSBkZXNjZW5kYW50XG4gICAgfVxuICB9XG5cbiAgLy8gcm9idXN0bmVzczogJ250aC1vZi10eXBlJyBpbnN0ZWFkICdudGgtY2hpbGQnIChoZXVyaXN0aWMpXG4gIGlmICgvOm50aC1jaGlsZC8udGVzdChjdXJyZW50KSkge1xuICAgIC8vIFRPRE86IGNvbnNpZGVyIGNvbXBsZXRlIGNvdmVyYWdlIG9mICdudGgtb2YtdHlwZScgcmVwbGFjZW1lbnRcbiAgICBjb25zdCB0eXBlID0gY3VycmVudC5yZXBsYWNlKC9udGgtY2hpbGQvZywgJ250aC1vZi10eXBlJylcbiAgICB2YXIgcGF0dGVybiA9IGAke3ByZVBhcnR9JHt0eXBlfSR7cG9zdFBhcnR9YFxuICAgIHZhciBtYXRjaGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgIGlmIChjb21wYXJlUmVzdWx0cyhtYXRjaGVzLCBlbGVtZW50cykpIHtcbiAgICAgIGN1cnJlbnQgPSB0eXBlXG4gICAgfVxuICB9XG5cbiAgLy8gZWZmaWNpZW5jeTogY29tYmluYXRpb25zIG9mIGNsYXNzbmFtZSAocGFydGlhbCBwZXJtdXRhdGlvbnMpXG4gIGlmICgvXFwuXFxTK1xcLlxcUysvLnRlc3QoY3VycmVudCkpIHtcbiAgICB2YXIgbmFtZXMgPSBjdXJyZW50LnRyaW0oKS5zcGxpdCgnLicpLnNsaWNlKDEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKG5hbWUpID0+IGAuJHtuYW1lfWApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zb3J0KChjdXJyLCBuZXh0KSA9PiBjdXJyLmxlbmd0aCAtIG5leHQubGVuZ3RoKVxuICAgIHdoaWxlIChuYW1lcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHBhcnRpYWwgPSBjdXJyZW50LnJlcGxhY2UobmFtZXMuc2hpZnQoKSwgJycpLnRyaW0oKVxuICAgICAgdmFyIHBhdHRlcm4gPSBgJHtwcmVQYXJ0fSR7cGFydGlhbH0ke3Bvc3RQYXJ0fWAudHJpbSgpXG4gICAgICBpZiAoIXBhdHRlcm4ubGVuZ3RoIHx8IHBhdHRlcm4uY2hhckF0KDApID09PSAnPicgfHwgcGF0dGVybi5jaGFyQXQocGF0dGVybi5sZW5ndGgtMSkgPT09ICc+Jykge1xuICAgICAgICBicmVha1xuICAgICAgfVxuICAgICAgdmFyIG1hdGNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgICBpZiAoY29tcGFyZVJlc3VsdHMobWF0Y2hlcywgZWxlbWVudHMpKSB7XG4gICAgICAgIGN1cnJlbnQgPSBwYXJ0aWFsXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gcm9idXN0bmVzczogZGVncmFkZSBjb21wbGV4IGNsYXNzbmFtZSAoaGV1cmlzdGljKVxuICAgIG5hbWVzID0gY3VycmVudCAmJiBjdXJyZW50Lm1hdGNoKC9cXC4vZylcbiAgICBpZiAobmFtZXMgJiYgbmFtZXMubGVuZ3RoID4gMikge1xuICAgICAgY29uc3QgcmVmZXJlbmNlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYCR7cHJlUGFydH0ke2N1cnJlbnR9YClcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcmVmZXJlbmNlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgY29uc3QgcmVmZXJlbmNlID0gcmVmZXJlbmNlc1tpXVxuICAgICAgICBpZiAoZWxlbWVudHMuc29tZSgoZWxlbWVudCkgPT4gcmVmZXJlbmNlLmNvbnRhaW5zKGVsZW1lbnQpICkpIHtcbiAgICAgICAgICAvLyBUT0RPOlxuICAgICAgICAgIC8vIC0gY2hlY2sgdXNpbmcgYXR0cmlidXRlcyArIHJlZ2FyZCBleGNsdWRlc1xuICAgICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gcmVmZXJlbmNlLnRhZ05hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgICAgIHZhciBwYXR0ZXJuID0gYCR7cHJlUGFydH0ke2Rlc2NyaXB0aW9ufSR7cG9zdFBhcnR9YFxuICAgICAgICAgIHZhciBtYXRjaGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgICAgICAgIGlmIChjb21wYXJlUmVzdWx0cyhtYXRjaGVzLCBlbGVtZW50cykpIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBkZXNjcmlwdGlvblxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGN1cnJlbnRcbn1cblxuLyoqXG4gKiBFdmFsdWF0ZSBtYXRjaGVzIHdpdGggZXhwZWN0ZWQgZWxlbWVudHNcbiAqXG4gKiBAcGFyYW0gIHtBcnJheS48SFRNTEVsZW1lbnQ+fSBtYXRjaGVzICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge0FycmF5LjxIVE1MRWxlbWVudD59IGVsZW1lbnRzIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmVSZXN1bHRzIChtYXRjaGVzLCBlbGVtZW50cykge1xuICBjb25zdCB7IGxlbmd0aCB9ID0gbWF0Y2hlc1xuICByZXR1cm4gbGVuZ3RoID09PSBlbGVtZW50cy5sZW5ndGggJiYgZWxlbWVudHMuZXZlcnkoKGVsZW1lbnQpID0+IHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobWF0Y2hlc1tpXSA9PT0gZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2VcbiAgfSlcbn1cbiJdLCJmaWxlIjoib3B0aW1pemUuanMifQ==
