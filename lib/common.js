"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCommonAncestor = getCommonAncestor;
exports.getCommonProperties = getCommonProperties;

/**
 * # Common
 *
 * Process collections for similarities.
 */

/**
 * Find the last common ancestor of elements
 *
 * @param  {Array.<HTMLElements>} elements - [description]
 * @return {HTMLElement}                   - [description]
 */
function getCommonAncestor(elements) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _options$root = options.root,
      root = _options$root === void 0 ? document : _options$root;
  var ancestors = [];
  elements.forEach(function (element, index) {
    var parents = [];

    while (element !== root) {
      element = element.parentNode;
      parents.unshift(element);
    }

    ancestors[index] = parents;
  });
  ancestors.sort(function (curr, next) {
    return curr.length - next.length;
  });
  var shallowAncestor = ancestors.shift();
  var ancestor = null;

  var _loop = function _loop() {
    var parent = shallowAncestor[i];
    var missing = ancestors.some(function (otherParents) {
      return !otherParents.some(function (otherParent) {
        return otherParent === parent;
      });
    });

    if (missing) {
      // TODO: find similar sub-parents, not the top root, e.g. sharing a class selector
      return "break";
    }

    ancestor = parent;
  };

  for (var i = 0, l = shallowAncestor.length; i < l; i++) {
    var _ret = _loop();

    if (_ret === "break") break;
  }

  return ancestor;
}
/**
 * Get a set of common properties of elements
 *
 * @param  {Array.<HTMLElement>} elements - [description]
 * @return {Object}                       - [description]
 */


function getCommonProperties(elements) {
  var commonProperties = {
    classes: [],
    attributes: {},
    tag: null
  };
  elements.forEach(function (element) {
    var commonClasses = commonProperties.classes,
        commonAttributes = commonProperties.attributes,
        commonTag = commonProperties.tag; // ~ classes

    if (commonClasses !== undefined) {
      var classes = element.getAttribute('class');

      if (classes) {
        classes = classes.trim().split(' ');

        if (!commonClasses.length) {
          commonProperties.classes = classes;
        } else {
          commonClasses = commonClasses.filter(function (entry) {
            return classes.some(function (name) {
              return name === entry;
            });
          });

          if (commonClasses.length) {
            commonProperties.classes = commonClasses;
          } else {
            delete commonProperties.classes;
          }
        }
      } else {
        // TODO: restructure removal as 2x set / 2x delete, instead of modify always replacing with new collection
        delete commonProperties.classes;
      }
    } // ~ attributes


    if (commonAttributes !== undefined) {
      var elementAttributes = element.attributes;
      var attributes = Object.keys(elementAttributes).reduce(function (attributes, key) {
        var attribute = elementAttributes[key];
        var attributeName = attribute.name; // NOTE: workaround detection for non-standard phantomjs NamedNodeMap behaviour
        // (issue: https://github.com/ariya/phantomjs/issues/14634)

        if (attribute && attributeName !== 'class') {
          attributes[attributeName] = attribute.value;
        }

        return attributes;
      }, {});
      var attributesNames = Object.keys(attributes);
      var commonAttributesNames = Object.keys(commonAttributes);

      if (attributesNames.length) {
        if (!commonAttributesNames.length) {
          commonProperties.attributes = attributes;
        } else {
          commonAttributes = commonAttributesNames.reduce(function (nextCommonAttributes, name) {
            var value = commonAttributes[name];

            if (value === attributes[name]) {
              nextCommonAttributes[name] = value;
            }

            return nextCommonAttributes;
          }, {});

          if (Object.keys(commonAttributes).length) {
            commonProperties.attributes = commonAttributes;
          } else {
            delete commonProperties.attributes;
          }
        }
      } else {
        delete commonProperties.attributes;
      }
    } // ~ tag


    if (commonTag !== undefined) {
      var tag = element.tagName.toLowerCase();

      if (!commonTag) {
        commonProperties.tag = tag;
      } else if (tag !== commonTag) {
        delete commonProperties.tag;
      }
    }
  });
  return commonProperties;
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi5qcyJdLCJuYW1lcyI6WyJnZXRDb21tb25BbmNlc3RvciIsImVsZW1lbnRzIiwib3B0aW9ucyIsInJvb3QiLCJkb2N1bWVudCIsImFuY2VzdG9ycyIsImZvckVhY2giLCJlbGVtZW50IiwiaW5kZXgiLCJwYXJlbnRzIiwicGFyZW50Tm9kZSIsInVuc2hpZnQiLCJzb3J0IiwiY3VyciIsIm5leHQiLCJsZW5ndGgiLCJzaGFsbG93QW5jZXN0b3IiLCJzaGlmdCIsImFuY2VzdG9yIiwicGFyZW50IiwiaSIsIm1pc3NpbmciLCJzb21lIiwib3RoZXJQYXJlbnRzIiwib3RoZXJQYXJlbnQiLCJsIiwiZ2V0Q29tbW9uUHJvcGVydGllcyIsImNvbW1vblByb3BlcnRpZXMiLCJjbGFzc2VzIiwiYXR0cmlidXRlcyIsInRhZyIsImNvbW1vbkNsYXNzZXMiLCJjb21tb25BdHRyaWJ1dGVzIiwiY29tbW9uVGFnIiwidW5kZWZpbmVkIiwiZ2V0QXR0cmlidXRlIiwidHJpbSIsInNwbGl0IiwiZmlsdGVyIiwiZW50cnkiLCJuYW1lIiwiZWxlbWVudEF0dHJpYnV0ZXMiLCJPYmplY3QiLCJrZXlzIiwicmVkdWNlIiwia2V5IiwiYXR0cmlidXRlIiwiYXR0cmlidXRlTmFtZSIsInZhbHVlIiwiYXR0cmlidXRlc05hbWVzIiwiY29tbW9uQXR0cmlidXRlc05hbWVzIiwibmV4dENvbW1vbkF0dHJpYnV0ZXMiLCJ0YWdOYW1lIiwidG9Mb3dlckNhc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTyxTQUFTQSxpQkFBVCxDQUE0QkMsUUFBNUIsRUFBb0Q7QUFBQSxNQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQSxzQkFJckRBLE9BSnFELENBR3ZEQyxJQUh1RDtBQUFBLE1BR3ZEQSxJQUh1RCw4QkFHaERDLFFBSGdEO0FBTXpELE1BQU1DLFNBQVMsR0FBRyxFQUFsQjtB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LG9CQUFELEVBQXVCWCxJQUF2QixFQUFnQztBQUM5RSxnQkFBTVEsS0FBSyxHQUFHaEIsZ0JBQWdCLENBQUNRLElBQUQsQ0FBOUI7O0FBQ0EsZ0JBQUlRLEtBQUssS0FBS25CLFVBQVUsQ0FBQ1csSUFBRCxDQUF4QixFQUFnQztBQUM5QlcsY0FBQUEsb0JBQW9CLENBQUNYLElBQUQsQ0FBcEIsR0FBNkJRLEtBQTdCO0FBQ0Q7O0FBQ0QsbUJBQU9HLG9CQUFQO0FBQ0QsV0FOa0IsRUFNaEIsRUFOZ0IsQ0FBbkI7O0FBT0EsY0FBSVQsTUFBTSxDQUFDQyxJQUFQLENBQVlYLGdCQUFaLEVBQThCakIsTUFBbEMsRUFBMEM7QUFDeENZLFlBQUFBLGdCQUFnQixDQUFDRSxVQUFqQixHQUE4QkcsZ0JBQTlCO0FBQ0QsV0FGRCxNQUVPO0FBQ0wsbUJBQU9MLGdCQUFnQixDQUFDRSxVQUF4QjtBQUNEO0FBQ0Y7QUFDRixPQWpCRCxNQWlCTztBQUNMLGVBQU9GLGdCQUFnQixDQUFDRSxVQUF4QjtBQUNEO0FBQ0YsS0FsRTJCLENBb0U1Qjs7O0FBQ0EsUUFBSUksU0FBUyxLQUFLQyxTQUFsQixFQUE2QjtBQUMzQixVQUFNSixHQUFHLEdBQUd2QixPQUFPLENBQUM2QyxPQUFSLENBQWdCQyxXQUFoQixFQUFaOztBQUNBLFVBQUksQ0FBQ3BCLFNBQUwsRUFBZ0I7QUFDZE4sUUFBQUEsZ0JBQWdCLENBQUNHLEdBQWpCLEdBQXVCQSxHQUF2QjtBQUNELE9BRkQsTUFFTyxJQUFJQSxHQUFHLEtBQUtHLFNBQVosRUFBdUI7QUFDNUIsZUFBT04sZ0JBQWdCLENBQUNHLEdBQXhCO0FBQ0Q7QUFDRjtBQUNGLEdBN0VEO0FBK0VBLFNBQU9ILGdCQUFQO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqICMgQ29tbW9uXG4gKlxuICogUHJvY2VzcyBjb2xsZWN0aW9ucyBmb3Igc2ltaWxhcml0aWVzLlxuICovXG5cbi8qKlxuICogRmluZCB0aGUgbGFzdCBjb21tb24gYW5jZXN0b3Igb2YgZWxlbWVudHNcbiAqXG4gKiBAcGFyYW0gIHtBcnJheS48SFRNTEVsZW1lbnRzPn0gZWxlbWVudHMgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtIVE1MRWxlbWVudH0gICAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21tb25BbmNlc3RvciAoZWxlbWVudHMsIG9wdGlvbnMgPSB7fSkge1xuXG4gIGNvbnN0IHtcbiAgICByb290ID0gZG9jdW1lbnRcbiAgfSA9IG9wdGlvbnNcblxuICBjb25zdCBhbmNlc3RvcnMgPSBbXVxuXG4gIGVsZW1lbnRzLmZvckVhY2goKGVsZW1lbnQsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgcGFyZW50cyA9IFtdXG4gICAgd2hpbGUgKGVsZW1lbnQgIT09IHJvb3QpIHtcbiAgICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGVcbiAgICAgIHBhcmVudHMudW5zaGlmdChlbGVtZW50KVxuICAgIH1cbiAgICBhbmNlc3RvcnNbaW5kZXhdID0gcGFyZW50c1xuICB9KVxuXG4gIGFuY2VzdG9ycy5zb3J0KChjdXJyLCBuZXh0KSA9PiBjdXJyLmxlbmd0aCAtIG5leHQubGVuZ3RoKVxuXG4gIGNvbnN0IHNoYWxsb3dBbmNlc3RvciA9IGFuY2VzdG9ycy5zaGlmdCgpXG5cbiAgdmFyIGFuY2VzdG9yID0gbnVsbFxuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gc2hhbGxvd0FuY2VzdG9yLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IHBhcmVudCA9IHNoYWxsb3dBbmNlc3RvcltpXVxuICAgIGNvbnN0IG1pc3NpbmcgPSBhbmNlc3RvcnMuc29tZSgob3RoZXJQYXJlbnRzKSA9PiB7XG4gICAgICByZXR1cm4gIW90aGVyUGFyZW50cy5zb21lKChvdGhlclBhcmVudCkgPT4gb3RoZXJQYXJlbnQgPT09IHBhcmVudClcbiAgICB9KVxuXG4gICAgaWYgKG1pc3NpbmcpIHtcbiAgICAgIC8vIFRPRE86IGZpbmQgc2ltaWxhciBzdWItcGFyZW50cywgbm90IHRoZSB0b3Agcm9vdCwgZS5nLiBzaGFyaW5nIGEgY2xhc3Mgc2VsZWN0b3JcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgYW5jZXN0b3IgPSBwYXJlbnRcbiAgfVxuXG4gIHJldHVybiBhbmNlc3RvclxufVxuXG4vKipcbiAqIEdldCBhIHNldCBvZiBjb21tb24gcHJvcGVydGllcyBvZiBlbGVtZW50c1xuICpcbiAqIEBwYXJhbSAge0FycmF5LjxIVE1MRWxlbWVudD59IGVsZW1lbnRzIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb21tb25Qcm9wZXJ0aWVzIChlbGVtZW50cykge1xuXG4gIGNvbnN0IGNvbW1vblByb3BlcnRpZXMgPSB7XG4gICAgY2xhc3NlczogW10sXG4gICAgYXR0cmlidXRlczoge30sXG4gICAgdGFnOiBudWxsXG4gIH1cblxuICBlbGVtZW50cy5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG5cbiAgICB2YXIge1xuICAgICAgY2xhc3NlczogY29tbW9uQ2xhc3NlcyxcbiAgICAgIGF0dHJpYnV0ZXM6IGNvbW1vbkF0dHJpYnV0ZXMsXG4gICAgICB0YWc6IGNvbW1vblRhZ1xuICAgIH0gPSBjb21tb25Qcm9wZXJ0aWVzXG5cbiAgICAvLyB+IGNsYXNzZXNcbiAgICBpZiAoY29tbW9uQ2xhc3NlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB2YXIgY2xhc3NlcyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjbGFzcycpXG4gICAgICBpZiAoY2xhc3Nlcykge1xuICAgICAgICBjbGFzc2VzID0gY2xhc3Nlcy50cmltKCkuc3BsaXQoJyAnKVxuICAgICAgICBpZiAoIWNvbW1vbkNsYXNzZXMubGVuZ3RoKSB7XG4gICAgICAgICAgY29tbW9uUHJvcGVydGllcy5jbGFzc2VzID0gY2xhc3Nlc1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbW1vbkNsYXNzZXMgPSBjb21tb25DbGFzc2VzLmZpbHRlcigoZW50cnkpID0+IGNsYXNzZXMuc29tZSgobmFtZSkgPT4gbmFtZSA9PT0gZW50cnkpKVxuICAgICAgICAgIGlmIChjb21tb25DbGFzc2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29tbW9uUHJvcGVydGllcy5jbGFzc2VzID0gY29tbW9uQ2xhc3Nlc1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWxldGUgY29tbW9uUHJvcGVydGllcy5jbGFzc2VzXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUT0RPOiByZXN0cnVjdHVyZSByZW1vdmFsIGFzIDJ4IHNldCAvIDJ4IGRlbGV0ZSwgaW5zdGVhZCBvZiBtb2RpZnkgYWx3YXlzIHJlcGxhY2luZyB3aXRoIG5ldyBjb2xsZWN0aW9uXG4gICAgICAgIGRlbGV0ZSBjb21tb25Qcm9wZXJ0aWVzLmNsYXNzZXNcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB+IGF0dHJpYnV0ZXNcbiAgICBpZiAoY29tbW9uQXR0cmlidXRlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBlbGVtZW50QXR0cmlidXRlcyA9IGVsZW1lbnQuYXR0cmlidXRlc1xuICAgICAgY29uc3QgYXR0cmlidXRlcyA9IE9iamVjdC5rZXlzKGVsZW1lbnRBdHRyaWJ1dGVzKS5yZWR1Y2UoKGF0dHJpYnV0ZXMsIGtleSkgPT4ge1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSBlbGVtZW50QXR0cmlidXRlc1trZXldXG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZU5hbWUgPSBhdHRyaWJ1dGUubmFtZVxuICAgICAgICAvLyBOT1RFOiB3b3JrYXJvdW5kIGRldGVjdGlvbiBmb3Igbm9uLXN0YW5kYXJkIHBoYW50b21qcyBOYW1lZE5vZGVNYXAgYmVoYXZpb3VyXG4gICAgICAgIC8vIChpc3N1ZTogaHR0cHM6Ly9naXRodWIuY29tL2FyaXlhL3BoYW50b21qcy9pc3N1ZXMvMTQ2MzQpXG4gICAgICAgIGlmIChhdHRyaWJ1dGUgJiYgYXR0cmlidXRlTmFtZSAhPT0gJ2NsYXNzJykge1xuICAgICAgICAgIGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSBhdHRyaWJ1dGUudmFsdWVcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXR0cmlidXRlc1xuICAgICAgfSwge30pXG5cbiAgICAgIGNvbnN0IGF0dHJpYnV0ZXNOYW1lcyA9IE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpXG4gICAgICBjb25zdCBjb21tb25BdHRyaWJ1dGVzTmFtZXMgPSBPYmplY3Qua2V5cyhjb21tb25BdHRyaWJ1dGVzKVxuXG4gICAgICBpZiAoYXR0cmlidXRlc05hbWVzLmxlbmd0aCkge1xuICAgICAgICBpZiAoIWNvbW1vbkF0dHJpYnV0ZXNOYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICBjb21tb25Qcm9wZXJ0aWVzLmF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29tbW9uQXR0cmlidXRlcyA9IGNvbW1vbkF0dHJpYnV0ZXNOYW1lcy5yZWR1Y2UoKG5leHRDb21tb25BdHRyaWJ1dGVzLCBuYW1lKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGNvbW1vbkF0dHJpYnV0ZXNbbmFtZV1cbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gYXR0cmlidXRlc1tuYW1lXSkge1xuICAgICAgICAgICAgICBuZXh0Q29tbW9uQXR0cmlidXRlc1tuYW1lXSA9IHZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV4dENvbW1vbkF0dHJpYnV0ZXNcbiAgICAgICAgICB9LCB7fSlcbiAgICAgICAgICBpZiAoT2JqZWN0LmtleXMoY29tbW9uQXR0cmlidXRlcykubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb21tb25Qcm9wZXJ0aWVzLmF0dHJpYnV0ZXMgPSBjb21tb25BdHRyaWJ1dGVzXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlbGV0ZSBjb21tb25Qcm9wZXJ0aWVzLmF0dHJpYnV0ZXNcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbGV0ZSBjb21tb25Qcm9wZXJ0aWVzLmF0dHJpYnV0ZXNcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB+IHRhZ1xuICAgIGlmIChjb21tb25UYWcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgdGFnID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgIGlmICghY29tbW9uVGFnKSB7XG4gICAgICAgIGNvbW1vblByb3BlcnRpZXMudGFnID0gdGFnXG4gICAgICB9IGVsc2UgaWYgKHRhZyAhPT0gY29tbW9uVGFnKSB7XG4gICAgICAgIGRlbGV0ZSBjb21tb25Qcm9wZXJ0aWVzLnRhZ1xuICAgICAgfVxuICAgIH1cbiAgfSlcblxuICByZXR1cm4gY29tbW9uUHJvcGVydGllc1xufVxuIl0sImZpbGUiOiJjb21tb24uanMifQ==
