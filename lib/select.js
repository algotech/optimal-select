"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSingleSelector = getSingleSelector;
exports.getMultiSelector = getMultiSelector;
exports["default"] = getQuerySelector;

var _adapt = _interopRequireDefault(require("./adapt"));

var _match = _interopRequireDefault(require("./match"));

var _optimize = _interopRequireDefault(require("./optimize"));

var _utilities = require("./utilities");

var _common = require("./common");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Get a selector for the provided element
 *
 * @param  {HTMLElement} element - [description]
 * @param  {Object}      options - [description]
 * @return {string}              - [description]
 */
function getSingleSelector(element) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  // 3 refers to - Node.TEXT_NODE type
  if (element.nodeType === 3) {
    element = element.parentNode;
  } // 1 refers to - Node.ELEMENT_NODE type


  if (element.nodeType !== 1) {
    throw new Error("Invalid input - only HTMLElements or representations of them are supported! (not \"".concat(_typeof(element), "\")"));
  }

  var globalModified = (0, _adapt["default"])(element, options);
  var selector = (0, _match["default"])(element, options);
  var optimized = (0, _optimize["default"])(selector, element, options); // debug
  // console.log(`
  //   selector:  ${selector}
  //   optimized: ${optimized}
  // `)

  var selectorTarget;
  var optimizedSelectorTarget;

  if (global.document === true) {
    selectorTarget = document.querySelector(selector);
    optimizedSelectorTarget = document.querySelector(optimized);
  } else {
    selectorTarget = global.document.querySelector(selector);
    optimizedSelectorTarget = global.document.querySelector(optimized);
  }

  if (globalModified) {
    delete global.document;
  }

  if (selectorTarget != optimizedSelectorTarget) {
    console.log('Error at selector optimization. Returning the raw selector.');
    return selector;
  }

  return optimized;
}
/**
 * Get a selector to match multiple descendants from an ancestor
 *
 * @param  {Array.<HTMLElement>|NodeList} elements - [description]
 * @param  {Object}                       options  - [description]
 * @return {string}                                - [description]
 */


function getMultiSelector(elements) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (!Array.isArray(elements)) {
    elements = (0, _utilities.convertNodeList)(elements);
  }

  if (elements.some(function (element) {
    return element.nodeType !== 1;
  })) {
    throw new Error("Invalid input - only an Array of HTMLElements or representations of them is supported!");
  }

  var globalModified = (0, _adapt["default"])(elements[0], options);
  var ancestor = (0, _common.getCommonAncestor)(elements, options);
  var ancestorSelector = getSingleSelector(ancestor, options); // TODO: consider usage of multiple selectors + parent-child relation + check for part redundancy

  var commonSelectors = getCommonSelectors(elements);
  var descendantSelector = commonSelectors[0];
  var selector = (0, _optimize["default"])("".concat(ancestorSelector, " ").concat(descendantSelector), elements, options);
  var selectorMatches = (0, _utilities.convertNodeList)(document.querySelectorAll(selector));

  if (!elements.every(function (element) {
    return selectorMatches.some(function (entry) {
      return entry === element;
    });
  })) {
    // TODO: cluster matches to split into similar groups for sub selections
    return console.warn("\n      The selected elements can't be efficiently mapped.\n      Its probably best to use multiple single selectors instead!\n    ", elements);
  }

  if (globalModified) {
    delete global.document;
  }

  return selector;
}
/**
 * Get selectors to describe a set of elements
 *
 * @param  {Array.<HTMLElements>} elements - [description]
 * @return {string}                        - [description]
 */


function getCommonSelectors(elements) {
  var _getCommonProperties = (0, _common.getCommonProperties)(elements),
      classes = _getCommonProperties.classes,
      attributes = _getCommonProperties.attributes,
      tag = _getCommonProperties.tag;

  var selectorPath = [];

  if (tag) {
    selectorPath.push(tag);
  }

  if (classes) {
    var classSelector = classes.map(function (name) {
      return ".".concat(name);
    }).join('');
    selectorPath.push(classSelector);
  }

  if (attributes) {
    var attributeSelector = Object.keys(attributes).reduce(function (parts, name) {
      parts.push("[".concat(name, "=\"").concat(attributes[name], "\"]"));
      return parts;
    }, []).join('');
    selectorPath.push(attributeSelector);
  }

  if (selectorPath.length) {// TODO: check for parent-child relation
  }

  return [selectorPath.join('')];
}
/**
 * Choose action depending on the input (multiple/single)
 *
 * NOTE: extended detection is used for special cases like the <select> element with <options>
 *
 * @param  {HTMLElement|NodeList|Array.<HTMLElement>} input   - [description]
 * @param  {Object}                                   options - [description]
 * @return {string}                                           - [description]
 */


function getQuerySelector(input) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (input.length && !input.name) {
    return getMultiSelector(input, options);
  }

  return getSingleSelector(input, options);
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlbGVjdC5qcyJdLCJuYW1lcyI6WyJnZXRTaW5nbGVTZWxlY3RvciIsImVsZW1lbnQiLCJvcHRpb25zIiwibm9kZVR5cGUiLCJwYXJlbnROb2RlIiwiRXJyb3IiLCJnbG9iYWxNb2RpZmllZCIsInNlbGVjdG9yIiwib3B0aW1pemVkIiwic2VsZWN0b3JUYXJnZXQiLCJvcHRpbWl6ZWRTZWxlY3RvclRhcmdldCIsImdsb2JhbCIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsImNvbnNvbGUiLCJsb2ciLCJnZXRNdWx0aVNlbGVjdG9yIiwiZWxlbWVudHMiLCJBcnJheSIsImlzQXJyYXkiLCJzb21lIiwiYW5jZXN0b3IiLCJhbmNlc3RvclNlbGVjdG9yIiwiY29tbW9uU2VsZWN0b3JzIiwiZ2V0Q29tbW9uU2VsZWN0b3JzIiwiZGVzY2VuZGFudFNlbGVjdG9yIiwic2VsZWN0b3JNYXRjaGVzIiwicXVlcnlTZWxlY3RvckFsbCIsImV2ZXJ5IiwiZW50cnkiLCJ3YXJuIiwiY2xhc3NlcyIsImF0dHJpYnV0ZXMiLCJ0YWciLCJzZWxlY3RvclBhdGgiLCJwdXNoIiwiY2xhc3NTZWxlY3RvciIsIm1hcCIsIm5hbWUiLCJqb2luIiwiYXR0cmlidXRlU2VsZWN0b3IiLCJPYmplY3QiLCJrZXlzIiwicmVkdWNlIiwicGFydHMiLCJsZW5ndGgiLCJnZXRRdWVyeVNlbGVjdG9yIiwiaW5wdXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQU9BOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPLFNBQVNBLGlCQUFULENBQTRCQyxPQUE1QixFQUFtRDtBQUFBLE1BQWRDLE9BQWMsdUVBQUosRUFBSTs7QUFDeEQ7QUFDQSxNQUFJRCxPQUFPLENBQUNFLFFBQVIsS0FBcUIsQ0FBekIsRUFBNEI7QUFDMUJGLElBQUFBLE9BQU8sR0FBR0EsT0FBTyxDQUFDRyxVQUFsQjtBQUNELEdBSnVELENBTXhEOzs7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WSxDQUFDVyxNQUFqQixFQUF5QixDQUN2QjtBQUNEOztBQUVELFNBQU8sQ0FDTFgsWUFBWSxDQUFDSyxJQUFiLENBQWtCLEVBQWxCLENBREssQ0FBUDtBQUdEO0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFDZSxTQUFTTyxnQkFBVCxDQUEyQkMsS0FBM0IsRUFBZ0Q7QUFBQSxNQUFkN0MsT0FBYyx1RUFBSixFQUFJOztBQUM3RCxNQUFJNkMsS0FBSyxDQUFDRixNQUFOLElBQWdCLENBQUNFLEtBQUssQ0FBQ1QsSUFBM0IsRUFBaUM7QUFDL0IsV0FBT3RCLGdCQUFnQixDQUFDK0IsS0FBRCxFQUFRN0MsT0FBUixDQUF2QjtBQUNEOztBQUNELFNBQU9GLGlCQUFpQixDQUFDK0MsS0FBRCxFQUFRN0MsT0FBUixDQUF4QjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAjIFNlbGVjdFxuICpcbiAqIENvbnN0cnVjdCBhIHVuaXF1ZSBDU1MgcXVlcnkgc2VsZWN0b3IgdG8gYWNjZXNzIHRoZSBzZWxlY3RlZCBET00gZWxlbWVudChzKS5cbiAqIEZvciBsb25nZXZpdHkgaXQgYXBwbGllcyBkaWZmZXJlbnQgbWF0Y2hpbmcgYW5kIG9wdGltaXphdGlvbiBzdHJhdGVnaWVzLlxuICovXG5cbmltcG9ydCBhZGFwdCBmcm9tICcuL2FkYXB0J1xuaW1wb3J0IG1hdGNoIGZyb20gJy4vbWF0Y2gnXG5pbXBvcnQgb3B0aW1pemUgZnJvbSAnLi9vcHRpbWl6ZSdcbmltcG9ydCB7IGNvbnZlcnROb2RlTGlzdCB9IGZyb20gJy4vdXRpbGl0aWVzJ1xuaW1wb3J0IHsgZ2V0Q29tbW9uQW5jZXN0b3IsIGdldENvbW1vblByb3BlcnRpZXMgfSBmcm9tICcuL2NvbW1vbidcblxuLyoqXG4gKiBHZXQgYSBzZWxlY3RvciBmb3IgdGhlIHByb3ZpZGVkIGVsZW1lbnRcbiAqXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICBvcHRpb25zIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTaW5nbGVTZWxlY3RvciAoZWxlbWVudCwgb3B0aW9ucyA9IHt9KSB7XG4gIC8vIDMgcmVmZXJzIHRvIC0gTm9kZS5URVhUX05PREUgdHlwZVxuICBpZiAoZWxlbWVudC5ub2RlVHlwZSA9PT0gMykge1xuICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGVcbiAgfVxuXG4gIC8vIDEgcmVmZXJzIHRvIC0gTm9kZS5FTEVNRU5UX05PREUgdHlwZVxuICBpZiAoZWxlbWVudC5ub2RlVHlwZSAhPT0gMSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBpbnB1dCAtIG9ubHkgSFRNTEVsZW1lbnRzIG9yIHJlcHJlc2VudGF0aW9ucyBvZiB0aGVtIGFyZSBzdXBwb3J0ZWQhIChub3QgXCIke3R5cGVvZiBlbGVtZW50fVwiKWApXG4gIH1cblxuICBjb25zdCBnbG9iYWxNb2RpZmllZCA9IGFkYXB0KGVsZW1lbnQsIG9wdGlvbnMpXG5cbiAgY29uc3Qgc2VsZWN0b3IgPSBtYXRjaChlbGVtZW50LCBvcHRpb25zKVxuICBjb25zdCBvcHRpbWl6ZWQgPSBvcHRpbWl6ZShzZWxlY3RvciwgZWxlbWVudCwgb3B0aW9ucylcblxuICAvLyBkZWJ1Z1xuICAvLyBjb25zb2xlLmxvZyhgXG4gIC8vICAgc2VsZWN0b3I6ICAke3NlbGVjdG9yfVxuICAvLyAgIG9wdGltaXplZDogJHtvcHRpbWl6ZWR9XG4gIC8vIGApXG4gIGxldCBzZWxlY3RvclRhcmdldDtcbiAgbGV0IG9wdGltaXplZFNlbGVjdG9yVGFyZ2V0O1xuXG4gIGlmIChnbG9iYWwuZG9jdW1lbnQgPT09IHRydWUpIHtcbiAgICBzZWxlY3RvclRhcmdldCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgIG9wdGltaXplZFNlbGVjdG9yVGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvcHRpbWl6ZWQpO1xuICB9IGVsc2Uge1xuICAgIHNlbGVjdG9yVGFyZ2V0ID0gZ2xvYmFsLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgIG9wdGltaXplZFNlbGVjdG9yVGFyZ2V0ID0gZ2xvYmFsLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iob3B0aW1pemVkKTtcbiAgfVxuXG4gIGlmIChnbG9iYWxNb2RpZmllZCkge1xuICAgIGRlbGV0ZSBnbG9iYWwuZG9jdW1lbnRcbiAgfVxuXG4gIGlmIChzZWxlY3RvclRhcmdldCAhPSBvcHRpbWl6ZWRTZWxlY3RvclRhcmdldCkge1xuICAgIGNvbnNvbGUubG9nKCdFcnJvciBhdCBzZWxlY3RvciBvcHRpbWl6YXRpb24uIFJldHVybmluZyB0aGUgcmF3IHNlbGVjdG9yLicpO1xuXG4gICAgcmV0dXJuIHNlbGVjdG9yO1xuICB9XG5cbiAgcmV0dXJuIG9wdGltaXplZDtcbn1cblxuLyoqXG4gKiBHZXQgYSBzZWxlY3RvciB0byBtYXRjaCBtdWx0aXBsZSBkZXNjZW5kYW50cyBmcm9tIGFuIGFuY2VzdG9yXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPEhUTUxFbGVtZW50PnxOb2RlTGlzdH0gZWxlbWVudHMgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TXVsdGlTZWxlY3RvciAoZWxlbWVudHMsIG9wdGlvbnMgPSB7fSkge1xuXG4gIGlmICghQXJyYXkuaXNBcnJheShlbGVtZW50cykpIHtcbiAgICBlbGVtZW50cyA9IGNvbnZlcnROb2RlTGlzdChlbGVtZW50cylcbiAgfVxuXG4gIGlmIChlbGVtZW50cy5zb21lKChlbGVtZW50KSA9PiBlbGVtZW50Lm5vZGVUeXBlICE9PSAxKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBpbnB1dCAtIG9ubHkgYW4gQXJyYXkgb2YgSFRNTEVsZW1lbnRzIG9yIHJlcHJlc2VudGF0aW9ucyBvZiB0aGVtIGlzIHN1cHBvcnRlZCFgKVxuICB9XG5cbiAgY29uc3QgZ2xvYmFsTW9kaWZpZWQgPSBhZGFwdChlbGVtZW50c1swXSwgb3B0aW9ucylcblxuICBjb25zdCBhbmNlc3RvciA9IGdldENvbW1vbkFuY2VzdG9yKGVsZW1lbnRzLCBvcHRpb25zKVxuICBjb25zdCBhbmNlc3RvclNlbGVjdG9yID0gZ2V0U2luZ2xlU2VsZWN0b3IoYW5jZXN0b3IsIG9wdGlvbnMpXG5cbiAgLy8gVE9ETzogY29uc2lkZXIgdXNhZ2Ugb2YgbXVsdGlwbGUgc2VsZWN0b3JzICsgcGFyZW50LWNoaWxkIHJlbGF0aW9uICsgY2hlY2sgZm9yIHBhcnQgcmVkdW5kYW5jeVxuICBjb25zdCBjb21tb25TZWxlY3RvcnMgPSBnZXRDb21tb25TZWxlY3RvcnMoZWxlbWVudHMpXG4gIGNvbnN0IGRlc2NlbmRhbnRTZWxlY3RvciA9IGNvbW1vblNlbGVjdG9yc1swXVxuXG4gIGNvbnN0IHNlbGVjdG9yID0gb3B0aW1pemUoYCR7YW5jZXN0b3JTZWxlY3Rvcn0gJHtkZXNjZW5kYW50U2VsZWN0b3J9YCwgZWxlbWVudHMsIG9wdGlvbnMpXG4gIGNvbnN0IHNlbGVjdG9yTWF0Y2hlcyA9IGNvbnZlcnROb2RlTGlzdChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSlcblxuICBpZiAoIWVsZW1lbnRzLmV2ZXJ5KChlbGVtZW50KSA9PiBzZWxlY3Rvck1hdGNoZXMuc29tZSgoZW50cnkpID0+IGVudHJ5ID09PSBlbGVtZW50KSApKSB7XG4gICAgLy8gVE9ETzogY2x1c3RlciBtYXRjaGVzIHRvIHNwbGl0IGludG8gc2ltaWxhciBncm91cHMgZm9yIHN1YiBzZWxlY3Rpb25zXG4gICAgcmV0dXJuIGNvbnNvbGUud2FybihgXG4gICAgICBUaGUgc2VsZWN0ZWQgZWxlbWVudHMgY2FuXFwndCBiZSBlZmZpY2llbnRseSBtYXBwZWQuXG4gICAgICBJdHMgcHJvYmFibHkgYmVzdCB0byB1c2UgbXVsdGlwbGUgc2luZ2xlIHNlbGVjdG9ycyBpbnN0ZWFkIVxuICAgIGAsIGVsZW1lbnRzKVxuICB9XG5cbiAgaWYgKGdsb2JhbE1vZGlmaWVkKSB7XG4gICAgZGVsZXRlIGdsb2JhbC5kb2N1bWVudFxuICB9XG5cbiAgcmV0dXJuIHNlbGVjdG9yXG59XG5cbi8qKlxuICogR2V0IHNlbGVjdG9ycyB0byBkZXNjcmliZSBhIHNldCBvZiBlbGVtZW50c1xuICpcbiAqIEBwYXJhbSAge0FycmF5LjxIVE1MRWxlbWVudHM+fSBlbGVtZW50cyAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gZ2V0Q29tbW9uU2VsZWN0b3JzIChlbGVtZW50cykge1xuXG4gIGNvbnN0IHsgY2xhc3NlcywgYXR0cmlidXRlcywgdGFnIH0gPSBnZXRDb21tb25Qcm9wZXJ0aWVzKGVsZW1lbnRzKVxuXG4gIGNvbnN0IHNlbGVjdG9yUGF0aCA9IFtdXG5cbiAgaWYgKHRhZykge1xuICAgIHNlbGVjdG9yUGF0aC5wdXNoKHRhZylcbiAgfVxuXG4gIGlmIChjbGFzc2VzKSB7XG4gICAgY29uc3QgY2xhc3NTZWxlY3RvciA9IGNsYXNzZXMubWFwKChuYW1lKSA9PiBgLiR7bmFtZX1gKS5qb2luKCcnKVxuICAgIHNlbGVjdG9yUGF0aC5wdXNoKGNsYXNzU2VsZWN0b3IpXG4gIH1cblxuICBpZiAoYXR0cmlidXRlcykge1xuICAgIGNvbnN0IGF0dHJpYnV0ZVNlbGVjdG9yID0gT2JqZWN0LmtleXMoYXR0cmlidXRlcykucmVkdWNlKChwYXJ0cywgbmFtZSkgPT4ge1xuICAgICAgcGFydHMucHVzaChgWyR7bmFtZX09XCIke2F0dHJpYnV0ZXNbbmFtZV19XCJdYClcbiAgICAgIHJldHVybiBwYXJ0c1xuICAgIH0sIFtdKS5qb2luKCcnKVxuICAgIHNlbGVjdG9yUGF0aC5wdXNoKGF0dHJpYnV0ZVNlbGVjdG9yKVxuICB9XG5cbiAgaWYgKHNlbGVjdG9yUGF0aC5sZW5ndGgpIHtcbiAgICAvLyBUT0RPOiBjaGVjayBmb3IgcGFyZW50LWNoaWxkIHJlbGF0aW9uXG4gIH1cblxuICByZXR1cm4gW1xuICAgIHNlbGVjdG9yUGF0aC5qb2luKCcnKVxuICBdXG59XG5cbi8qKlxuICogQ2hvb3NlIGFjdGlvbiBkZXBlbmRpbmcgb24gdGhlIGlucHV0IChtdWx0aXBsZS9zaW5nbGUpXG4gKlxuICogTk9URTogZXh0ZW5kZWQgZGV0ZWN0aW9uIGlzIHVzZWQgZm9yIHNwZWNpYWwgY2FzZXMgbGlrZSB0aGUgPHNlbGVjdD4gZWxlbWVudCB3aXRoIDxvcHRpb25zPlxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fE5vZGVMaXN0fEFycmF5LjxIVE1MRWxlbWVudD59IGlucHV0ICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZ2V0UXVlcnlTZWxlY3RvciAoaW5wdXQsIG9wdGlvbnMgPSB7fSkge1xuICBpZiAoaW5wdXQubGVuZ3RoICYmICFpbnB1dC5uYW1lKSB7XG4gICAgcmV0dXJuIGdldE11bHRpU2VsZWN0b3IoaW5wdXQsIG9wdGlvbnMpXG4gIH1cbiAgcmV0dXJuIGdldFNpbmdsZVNlbGVjdG9yKGlucHV0LCBvcHRpb25zKVxufVxuIl0sImZpbGUiOiJzZWxlY3QuanMifQ==
