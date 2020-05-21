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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi5qcyJdLCJuYW1lcyI6WyJnZXRDb21tb25BbmNlc3RvciIsImVsZW1lbnRzIiwib3B0aW9ucyIsInJvb3QiLCJkb2N1bWVudCIsImFuY2VzdG9ycyIsImZvckVhY2giLCJlbGVtZW50IiwiaW5kZXgiLCJwYXJlbnRzIiwicGFyZW50Tm9kZSIsInVuc2hpZnQiLCJzb3J0IiwiY3VyciIsIm5leHQiLCJsZW5ndGgiLCJzaGFsbG93QW5jZXN0b3IiLCJzaGlmdCIsImFuY2VzdG9yIiwicGFyZW50IiwiaSIsIm1pc3NpbmciLCJzb21lIiwib3RoZXJQYXJlbnRzIiwib3RoZXJQYXJlbnQiLCJsIiwiZ2V0Q29tbW9uUHJvcGVydGllcyIsImNvbW1vblByb3BlcnRpZXMiLCJjbGFzc2VzIiwiYXR0cmlidXRlcyIsInRhZyIsImNvbW1vbkNsYXNzZXMiLCJjb21tb25BdHRyaWJ1dGVzIiwiY29tbW9uVGFnIiwidW5kZWZpbmVkIiwiZ2V0QXR0cmlidXRlIiwidHJpbSIsInNwbGl0IiwiZmlsdGVyIiwiZW50cnkiLCJuYW1lIiwiZWxlbWVudEF0dHJpYnV0ZXMiLCJPYmplY3QiLCJrZXlzIiwicmVkdWNlIiwia2V5IiwiYXR0cmlidXRlIiwiYXR0cmlidXRlTmFtZSIsInZhbHVlIiwiYXR0cmlidXRlc05hbWVzIiwiY29tbW9uQXR0cmlidXRlc05hbWVzIiwibmV4dENvbW1vbkF0dHJpYnV0ZXMiLCJ0YWdOYW1lIiwidG9Mb3dlckNhc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7Ozs7OztBQU1BOzs7Ozs7QUFNTyxTQUFTQSxpQkFBVCxDQUE0QkMsUUFBNUIsRUFBb0Q7QUFBQSxNQUFkQyxPQUFjLHVFQUFKLEVBQUk7QUFBQSxzQkFJckRBLE9BSnFELENBR3ZEQyxJQUh1RDtBQUFBLE1BR3ZEQSxJQUh1RCw4QkFHaERDLFFBSGdEO0FBTXpELE1BQU1DLFNBQVMsR0FBRyxFQUFsQjtBQUVBSixFQUFBQSxRQUFRLENBQUNLLE9BQVQsQ0FBaUIsVUFB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QixDQUFDUSxJQUFELENBQTlCOztBQUNBLGdCQUFJUSxLQUFLLEtBQUtuQixVQUFVLENBQUNXLElBQUQsQ0FBeEIsRUFBZ0M7QUFDOUJXLGNBQUFBLG9CQUFvQixDQUFDWCxJQUFELENBQXBCLEdBQTZCUSxLQUE3QjtBQUNEOztBQUNELG1CQUFPRyxvQkFBUDtBQUNELFdBTmtCLEVBTWhCLEVBTmdCLENBQW5COztBQU9BLGNBQUlULE1BQU0sQ0FBQ0MsSUFBUCxDQUFZWCxnQkFBWixFQUE4QmpCLE1BQWxDLEVBQTBDO0FBQ3hDWSxZQUFBQSxnQkFBZ0IsQ0FBQ0UsVUFBakIsR0FBOEJHLGdCQUE5QjtBQUNELFdBRkQsTUFFTztBQUNMLG1CQUFPTCxnQkFBZ0IsQ0FBQ0UsVUFBeEI7QUFDRDtBQUNGO0FBQ0YsT0FqQkQsTUFpQk87QUFDTCxlQUFPRixnQkFBZ0IsQ0FBQ0UsVUFBeEI7QUFDRDtBQUNGLEtBbEUyQixDQW9FNUI7OztBQUNBLFFBQUlJLFNBQVMsS0FBS0MsU0FBbEIsRUFBNkI7QUFDM0IsVUFBTUosR0FBRyxHQUFHdkIsT0FBTyxDQUFDNkMsT0FBUixDQUFnQkMsV0FBaEIsRUFBWjs7QUFDQSxVQUFJLENBQUNwQixTQUFMLEVBQWdCO0FBQ2ROLFFBQUFBLGdCQUFnQixDQUFDRyxHQUFqQixHQUF1QkEsR0FBdkI7QUFDRCxPQUZELE1BRU8sSUFBSUEsR0FBRyxLQUFLRyxTQUFaLEVBQXVCO0FBQzVCLGVBQU9OLGdCQUFnQixDQUFDRyxHQUF4QjtBQUNEO0FBQ0Y7QUFDRixHQTdFRDtBQStFQSxTQUFPSCxnQkFBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAjIENvbW1vblxuICpcbiAqIFByb2Nlc3MgY29sbGVjdGlvbnMgZm9yIHNpbWlsYXJpdGllcy5cbiAqL1xuXG4vKipcbiAqIEZpbmQgdGhlIGxhc3QgY29tbW9uIGFuY2VzdG9yIG9mIGVsZW1lbnRzXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPEhUTUxFbGVtZW50cz59IGVsZW1lbnRzIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7SFRNTEVsZW1lbnR9ICAgICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tbW9uQW5jZXN0b3IgKGVsZW1lbnRzLCBvcHRpb25zID0ge30pIHtcblxuICBjb25zdCB7XG4gICAgcm9vdCA9IGRvY3VtZW50XG4gIH0gPSBvcHRpb25zXG5cbiAgY29uc3QgYW5jZXN0b3JzID0gW11cblxuICBlbGVtZW50cy5mb3JFYWNoKChlbGVtZW50LCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IHBhcmVudHMgPSBbXVxuICAgIHdoaWxlIChlbGVtZW50ICE9PSByb290KSB7XG4gICAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlXG4gICAgICBwYXJlbnRzLnVuc2hpZnQoZWxlbWVudClcbiAgICB9XG4gICAgYW5jZXN0b3JzW2luZGV4XSA9IHBhcmVudHNcbiAgfSlcblxuICBhbmNlc3RvcnMuc29ydCgoY3VyciwgbmV4dCkgPT4gY3Vyci5sZW5ndGggLSBuZXh0Lmxlbmd0aClcblxuICBjb25zdCBzaGFsbG93QW5jZXN0b3IgPSBhbmNlc3RvcnMuc2hpZnQoKVxuXG4gIHZhciBhbmNlc3RvciA9IG51bGxcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IHNoYWxsb3dBbmNlc3Rvci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb25zdCBwYXJlbnQgPSBzaGFsbG93QW5jZXN0b3JbaV1cbiAgICBjb25zdCBtaXNzaW5nID0gYW5jZXN0b3JzLnNvbWUoKG90aGVyUGFyZW50cykgPT4ge1xuICAgICAgcmV0dXJuICFvdGhlclBhcmVudHMuc29tZSgob3RoZXJQYXJlbnQpID0+IG90aGVyUGFyZW50ID09PSBwYXJlbnQpXG4gICAgfSlcblxuICAgIGlmIChtaXNzaW5nKSB7XG4gICAgICAvLyBUT0RPOiBmaW5kIHNpbWlsYXIgc3ViLXBhcmVudHMsIG5vdCB0aGUgdG9wIHJvb3QsIGUuZy4gc2hhcmluZyBhIGNsYXNzIHNlbGVjdG9yXG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGFuY2VzdG9yID0gcGFyZW50XG4gIH1cblxuICByZXR1cm4gYW5jZXN0b3Jcbn1cblxuLyoqXG4gKiBHZXQgYSBzZXQgb2YgY29tbW9uIHByb3BlcnRpZXMgb2YgZWxlbWVudHNcbiAqXG4gKiBAcGFyYW0gIHtBcnJheS48SFRNTEVsZW1lbnQ+fSBlbGVtZW50cyAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29tbW9uUHJvcGVydGllcyAoZWxlbWVudHMpIHtcblxuICBjb25zdCBjb21tb25Qcm9wZXJ0aWVzID0ge1xuICAgIGNsYXNzZXM6IFtdLFxuICAgIGF0dHJpYnV0ZXM6IHt9LFxuICAgIHRhZzogbnVsbFxuICB9XG5cbiAgZWxlbWVudHMuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuXG4gICAgdmFyIHtcbiAgICAgIGNsYXNzZXM6IGNvbW1vbkNsYXNzZXMsXG4gICAgICBhdHRyaWJ1dGVzOiBjb21tb25BdHRyaWJ1dGVzLFxuICAgICAgdGFnOiBjb21tb25UYWdcbiAgICB9ID0gY29tbW9uUHJvcGVydGllc1xuXG4gICAgLy8gfiBjbGFzc2VzXG4gICAgaWYgKGNvbW1vbkNsYXNzZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdmFyIGNsYXNzZXMgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnY2xhc3MnKVxuICAgICAgaWYgKGNsYXNzZXMpIHtcbiAgICAgICAgY2xhc3NlcyA9IGNsYXNzZXMudHJpbSgpLnNwbGl0KCcgJylcbiAgICAgICAgaWYgKCFjb21tb25DbGFzc2VzLmxlbmd0aCkge1xuICAgICAgICAgIGNvbW1vblByb3BlcnRpZXMuY2xhc3NlcyA9IGNsYXNzZXNcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb21tb25DbGFzc2VzID0gY29tbW9uQ2xhc3Nlcy5maWx0ZXIoKGVudHJ5KSA9PiBjbGFzc2VzLnNvbWUoKG5hbWUpID0+IG5hbWUgPT09IGVudHJ5KSlcbiAgICAgICAgICBpZiAoY29tbW9uQ2xhc3Nlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbW1vblByb3BlcnRpZXMuY2xhc3NlcyA9IGNvbW1vbkNsYXNzZXNcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVsZXRlIGNvbW1vblByb3BlcnRpZXMuY2xhc3Nlc1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVE9ETzogcmVzdHJ1Y3R1cmUgcmVtb3ZhbCBhcyAyeCBzZXQgLyAyeCBkZWxldGUsIGluc3RlYWQgb2YgbW9kaWZ5IGFsd2F5cyByZXBsYWNpbmcgd2l0aCBuZXcgY29sbGVjdGlvblxuICAgICAgICBkZWxldGUgY29tbW9uUHJvcGVydGllcy5jbGFzc2VzXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gfiBhdHRyaWJ1dGVzXG4gICAgaWYgKGNvbW1vbkF0dHJpYnV0ZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgZWxlbWVudEF0dHJpYnV0ZXMgPSBlbGVtZW50LmF0dHJpYnV0ZXNcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBPYmplY3Qua2V5cyhlbGVtZW50QXR0cmlidXRlcykucmVkdWNlKChhdHRyaWJ1dGVzLCBrZXkpID0+IHtcbiAgICAgICAgY29uc3QgYXR0cmlidXRlID0gZWxlbWVudEF0dHJpYnV0ZXNba2V5XVxuICAgICAgICBjb25zdCBhdHRyaWJ1dGVOYW1lID0gYXR0cmlidXRlLm5hbWVcbiAgICAgICAgLy8gTk9URTogd29ya2Fyb3VuZCBkZXRlY3Rpb24gZm9yIG5vbi1zdGFuZGFyZCBwaGFudG9tanMgTmFtZWROb2RlTWFwIGJlaGF2aW91clxuICAgICAgICAvLyAoaXNzdWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9hcml5YS9waGFudG9tanMvaXNzdWVzLzE0NjM0KVxuICAgICAgICBpZiAoYXR0cmlidXRlICYmIGF0dHJpYnV0ZU5hbWUgIT09ICdjbGFzcycpIHtcbiAgICAgICAgICBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdID0gYXR0cmlidXRlLnZhbHVlXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGF0dHJpYnV0ZXNcbiAgICAgIH0sIHt9KVxuXG4gICAgICBjb25zdCBhdHRyaWJ1dGVzTmFtZXMgPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKVxuICAgICAgY29uc3QgY29tbW9uQXR0cmlidXRlc05hbWVzID0gT2JqZWN0LmtleXMoY29tbW9uQXR0cmlidXRlcylcblxuICAgICAgaWYgKGF0dHJpYnV0ZXNOYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKCFjb21tb25BdHRyaWJ1dGVzTmFtZXMubGVuZ3RoKSB7XG4gICAgICAgICAgY29tbW9uUHJvcGVydGllcy5hdHRyaWJ1dGVzID0gYXR0cmlidXRlc1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbW1vbkF0dHJpYnV0ZXMgPSBjb21tb25BdHRyaWJ1dGVzTmFtZXMucmVkdWNlKChuZXh0Q29tbW9uQXR0cmlidXRlcywgbmFtZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBjb21tb25BdHRyaWJ1dGVzW25hbWVdXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IGF0dHJpYnV0ZXNbbmFtZV0pIHtcbiAgICAgICAgICAgICAgbmV4dENvbW1vbkF0dHJpYnV0ZXNbbmFtZV0gPSB2YWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5leHRDb21tb25BdHRyaWJ1dGVzXG4gICAgICAgICAgfSwge30pXG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKGNvbW1vbkF0dHJpYnV0ZXMpLmxlbmd0aCkge1xuICAgICAgICAgICAgY29tbW9uUHJvcGVydGllcy5hdHRyaWJ1dGVzID0gY29tbW9uQXR0cmlidXRlc1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWxldGUgY29tbW9uUHJvcGVydGllcy5hdHRyaWJ1dGVzXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWxldGUgY29tbW9uUHJvcGVydGllcy5hdHRyaWJ1dGVzXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gfiB0YWdcbiAgICBpZiAoY29tbW9uVGFnICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHRhZyA9IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpXG4gICAgICBpZiAoIWNvbW1vblRhZykge1xuICAgICAgICBjb21tb25Qcm9wZXJ0aWVzLnRhZyA9IHRhZ1xuICAgICAgfSBlbHNlIGlmICh0YWcgIT09IGNvbW1vblRhZykge1xuICAgICAgICBkZWxldGUgY29tbW9uUHJvcGVydGllcy50YWdcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgcmV0dXJuIGNvbW1vblByb3BlcnRpZXNcbn1cbiJdLCJmaWxlIjoiY29tbW9uLmpzIn0=
