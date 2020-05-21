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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlbGVjdC5qcyJdLCJuYW1lcyI6WyJnZXRTaW5nbGVTZWxlY3RvciIsImVsZW1lbnQiLCJvcHRpb25zIiwibm9kZVR5cGUiLCJwYXJlbnROb2RlIiwiRXJyb3IiLCJnbG9iYWxNb2RpZmllZCIsInNlbGVjdG9yIiwib3B0aW1pemVkIiwic2VsZWN0b3JUYXJnZXQiLCJvcHRpbWl6ZWRTZWxlY3RvclRhcmdldCIsImdsb2JhbCIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsImNvbnNvbGUiLCJsb2ciLCJnZXRNdWx0aVNlbGVjdG9yIiwiZWxlbWVudHMiLCJBcnJheSIsImlzQXJyYXkiLCJzb21lIiwiYW5jZXN0b3IiLCJhbmNlc3RvclNlbGVjdG9yIiwiY29tbW9uU2VsZWN0b3JzIiwiZ2V0Q29tbW9uU2VsZWN0b3JzIiwiZGVzY2VuZGFudFNlbGVjdG9yIiwic2VsZWN0b3JNYXRjaGVzIiwicXVlcnlTZWxlY3RvckFsbCIsImV2ZXJ5IiwiZW50cnkiLCJ3YXJuIiwiY2xhc3NlcyIsImF0dHJpYnV0ZXMiLCJ0YWciLCJzZWxlY3RvclBhdGgiLCJwdXNoIiwiY2xhc3NTZWxlY3RvciIsIm1hcCIsIm5hbWUiLCJqb2luIiwiYXR0cmlidXRlU2VsZWN0b3IiLCJPYmplY3QiLCJrZXlzIiwicmVkdWNlIiwicGFydHMiLCJsZW5ndGgiLCJnZXRRdWVyeVNlbGVjdG9yIiwiaW5wdXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQU9BOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QUFFQTs7Ozs7OztBQU9PLFNBQVNBLGlCQUFULENBQTRCQyxPQUE1QixFQUFtRDtBQUFBLE1BQWRDLE9BQWMsdUVBQUosRUFBSTs7QUFDeEQ7QUFDQSxNQUFJRCxPQUFPLENBQUNFLFFBQVIsS0FBcUIsQ0FBekIsRUFBNEI7QUFDMUJGLElBQUFBLE9BQU8sR0FBR0EsT0FBTyxDQUFDRyxVQUFsQjtBQUNELEdBSnVELENBTXhEOzs7QUFDQSxNQUFJSCxPQUFPLENBQUNFLFFB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QixFQUFsQixDQURLLENBQVA7QUFHRDtBQUVEOzs7Ozs7Ozs7OztBQVNlLFNBQVNPLGdCQUFULENBQTJCQyxLQUEzQixFQUFnRDtBQUFBLE1BQWQ3QyxPQUFjLHVFQUFKLEVBQUk7O0FBQzdELE1BQUk2QyxLQUFLLENBQUNGLE1BQU4sSUFBZ0IsQ0FBQ0UsS0FBSyxDQUFDVCxJQUEzQixFQUFpQztBQUMvQixXQUFPdEIsZ0JBQWdCLENBQUMrQixLQUFELEVBQVE3QyxPQUFSLENBQXZCO0FBQ0Q7O0FBQ0QsU0FBT0YsaUJBQWlCLENBQUMrQyxLQUFELEVBQVE3QyxPQUFSLENBQXhCO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqICMgU2VsZWN0XG4gKlxuICogQ29uc3RydWN0IGEgdW5pcXVlIENTUyBxdWVyeSBzZWxlY3RvciB0byBhY2Nlc3MgdGhlIHNlbGVjdGVkIERPTSBlbGVtZW50KHMpLlxuICogRm9yIGxvbmdldml0eSBpdCBhcHBsaWVzIGRpZmZlcmVudCBtYXRjaGluZyBhbmQgb3B0aW1pemF0aW9uIHN0cmF0ZWdpZXMuXG4gKi9cblxuaW1wb3J0IGFkYXB0IGZyb20gJy4vYWRhcHQnXG5pbXBvcnQgbWF0Y2ggZnJvbSAnLi9tYXRjaCdcbmltcG9ydCBvcHRpbWl6ZSBmcm9tICcuL29wdGltaXplJ1xuaW1wb3J0IHsgY29udmVydE5vZGVMaXN0IH0gZnJvbSAnLi91dGlsaXRpZXMnXG5pbXBvcnQgeyBnZXRDb21tb25BbmNlc3RvciwgZ2V0Q29tbW9uUHJvcGVydGllcyB9IGZyb20gJy4vY29tbW9uJ1xuXG4vKipcbiAqIEdldCBhIHNlbGVjdG9yIGZvciB0aGUgcHJvdmlkZWQgZWxlbWVudFxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIG9wdGlvbnMgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNpbmdsZVNlbGVjdG9yIChlbGVtZW50LCBvcHRpb25zID0ge30pIHtcbiAgLy8gMyByZWZlcnMgdG8gLSBOb2RlLlRFWFRfTk9ERSB0eXBlXG4gIGlmIChlbGVtZW50Lm5vZGVUeXBlID09PSAzKSB7XG4gICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZVxuICB9XG5cbiAgLy8gMSByZWZlcnMgdG8gLSBOb2RlLkVMRU1FTlRfTk9ERSB0eXBlXG4gIGlmIChlbGVtZW50Lm5vZGVUeXBlICE9PSAxKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGlucHV0IC0gb25seSBIVE1MRWxlbWVudHMgb3IgcmVwcmVzZW50YXRpb25zIG9mIHRoZW0gYXJlIHN1cHBvcnRlZCEgKG5vdCBcIiR7dHlwZW9mIGVsZW1lbnR9XCIpYClcbiAgfVxuXG4gIGNvbnN0IGdsb2JhbE1vZGlmaWVkID0gYWRhcHQoZWxlbWVudCwgb3B0aW9ucylcblxuICBjb25zdCBzZWxlY3RvciA9IG1hdGNoKGVsZW1lbnQsIG9wdGlvbnMpXG4gIGNvbnN0IG9wdGltaXplZCA9IG9wdGltaXplKHNlbGVjdG9yLCBlbGVtZW50LCBvcHRpb25zKVxuXG4gIC8vIGRlYnVnXG4gIC8vIGNvbnNvbGUubG9nKGBcbiAgLy8gICBzZWxlY3RvcjogICR7c2VsZWN0b3J9XG4gIC8vICAgb3B0aW1pemVkOiAke29wdGltaXplZH1cbiAgLy8gYClcbiAgbGV0IHNlbGVjdG9yVGFyZ2V0O1xuICBsZXQgb3B0aW1pemVkU2VsZWN0b3JUYXJnZXQ7XG5cbiAgaWYgKGdsb2JhbC5kb2N1bWVudCA9PT0gdHJ1ZSkge1xuICAgIHNlbGVjdG9yVGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgb3B0aW1pemVkU2VsZWN0b3JUYXJnZXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG9wdGltaXplZCk7XG4gIH0gZWxzZSB7XG4gICAgc2VsZWN0b3JUYXJnZXQgPSBnbG9iYWwuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgb3B0aW1pemVkU2VsZWN0b3JUYXJnZXQgPSBnbG9iYWwuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihvcHRpbWl6ZWQpO1xuICB9XG5cbiAgaWYgKGdsb2JhbE1vZGlmaWVkKSB7XG4gICAgZGVsZXRlIGdsb2JhbC5kb2N1bWVudFxuICB9XG5cbiAgaWYgKHNlbGVjdG9yVGFyZ2V0ICE9IG9wdGltaXplZFNlbGVjdG9yVGFyZ2V0KSB7XG4gICAgY29uc29sZS5sb2coJ0Vycm9yIGF0IHNlbGVjdG9yIG9wdGltaXphdGlvbi4gUmV0dXJuaW5nIHRoZSByYXcgc2VsZWN0b3IuJyk7XG5cbiAgICByZXR1cm4gc2VsZWN0b3I7XG4gIH1cblxuICByZXR1cm4gb3B0aW1pemVkO1xufVxuXG4vKipcbiAqIEdldCBhIHNlbGVjdG9yIHRvIG1hdGNoIG11bHRpcGxlIGRlc2NlbmRhbnRzIGZyb20gYW4gYW5jZXN0b3JcbiAqXG4gKiBAcGFyYW0gIHtBcnJheS48SFRNTEVsZW1lbnQ+fE5vZGVMaXN0fSBlbGVtZW50cyAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRNdWx0aVNlbGVjdG9yIChlbGVtZW50cywgb3B0aW9ucyA9IHt9KSB7XG5cbiAgaWYgKCFBcnJheS5pc0FycmF5KGVsZW1lbnRzKSkge1xuICAgIGVsZW1lbnRzID0gY29udmVydE5vZGVMaXN0KGVsZW1lbnRzKVxuICB9XG5cbiAgaWYgKGVsZW1lbnRzLnNvbWUoKGVsZW1lbnQpID0+IGVsZW1lbnQubm9kZVR5cGUgIT09IDEpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGlucHV0IC0gb25seSBhbiBBcnJheSBvZiBIVE1MRWxlbWVudHMgb3IgcmVwcmVzZW50YXRpb25zIG9mIHRoZW0gaXMgc3VwcG9ydGVkIWApXG4gIH1cblxuICBjb25zdCBnbG9iYWxNb2RpZmllZCA9IGFkYXB0KGVsZW1lbnRzWzBdLCBvcHRpb25zKVxuXG4gIGNvbnN0IGFuY2VzdG9yID0gZ2V0Q29tbW9uQW5jZXN0b3IoZWxlbWVudHMsIG9wdGlvbnMpXG4gIGNvbnN0IGFuY2VzdG9yU2VsZWN0b3IgPSBnZXRTaW5nbGVTZWxlY3RvcihhbmNlc3Rvciwgb3B0aW9ucylcblxuICAvLyBUT0RPOiBjb25zaWRlciB1c2FnZSBvZiBtdWx0aXBsZSBzZWxlY3RvcnMgKyBwYXJlbnQtY2hpbGQgcmVsYXRpb24gKyBjaGVjayBmb3IgcGFydCByZWR1bmRhbmN5XG4gIGNvbnN0IGNvbW1vblNlbGVjdG9ycyA9IGdldENvbW1vblNlbGVjdG9ycyhlbGVtZW50cylcbiAgY29uc3QgZGVzY2VuZGFudFNlbGVjdG9yID0gY29tbW9uU2VsZWN0b3JzWzBdXG5cbiAgY29uc3Qgc2VsZWN0b3IgPSBvcHRpbWl6ZShgJHthbmNlc3RvclNlbGVjdG9yfSAke2Rlc2NlbmRhbnRTZWxlY3Rvcn1gLCBlbGVtZW50cywgb3B0aW9ucylcbiAgY29uc3Qgc2VsZWN0b3JNYXRjaGVzID0gY29udmVydE5vZGVMaXN0KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKVxuXG4gIGlmICghZWxlbWVudHMuZXZlcnkoKGVsZW1lbnQpID0+IHNlbGVjdG9yTWF0Y2hlcy5zb21lKChlbnRyeSkgPT4gZW50cnkgPT09IGVsZW1lbnQpICkpIHtcbiAgICAvLyBUT0RPOiBjbHVzdGVyIG1hdGNoZXMgdG8gc3BsaXQgaW50byBzaW1pbGFyIGdyb3VwcyBmb3Igc3ViIHNlbGVjdGlvbnNcbiAgICByZXR1cm4gY29uc29sZS53YXJuKGBcbiAgICAgIFRoZSBzZWxlY3RlZCBlbGVtZW50cyBjYW5cXCd0IGJlIGVmZmljaWVudGx5IG1hcHBlZC5cbiAgICAgIEl0cyBwcm9iYWJseSBiZXN0IHRvIHVzZSBtdWx0aXBsZSBzaW5nbGUgc2VsZWN0b3JzIGluc3RlYWQhXG4gICAgYCwgZWxlbWVudHMpXG4gIH1cblxuICBpZiAoZ2xvYmFsTW9kaWZpZWQpIHtcbiAgICBkZWxldGUgZ2xvYmFsLmRvY3VtZW50XG4gIH1cblxuICByZXR1cm4gc2VsZWN0b3Jcbn1cblxuLyoqXG4gKiBHZXQgc2VsZWN0b3JzIHRvIGRlc2NyaWJlIGEgc2V0IG9mIGVsZW1lbnRzXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPEhUTUxFbGVtZW50cz59IGVsZW1lbnRzIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBnZXRDb21tb25TZWxlY3RvcnMgKGVsZW1lbnRzKSB7XG5cbiAgY29uc3QgeyBjbGFzc2VzLCBhdHRyaWJ1dGVzLCB0YWcgfSA9IGdldENvbW1vblByb3BlcnRpZXMoZWxlbWVudHMpXG5cbiAgY29uc3Qgc2VsZWN0b3JQYXRoID0gW11cblxuICBpZiAodGFnKSB7XG4gICAgc2VsZWN0b3JQYXRoLnB1c2godGFnKVxuICB9XG5cbiAgaWYgKGNsYXNzZXMpIHtcbiAgICBjb25zdCBjbGFzc1NlbGVjdG9yID0gY2xhc3Nlcy5tYXAoKG5hbWUpID0+IGAuJHtuYW1lfWApLmpvaW4oJycpXG4gICAgc2VsZWN0b3JQYXRoLnB1c2goY2xhc3NTZWxlY3RvcilcbiAgfVxuXG4gIGlmIChhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3QgYXR0cmlidXRlU2VsZWN0b3IgPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5yZWR1Y2UoKHBhcnRzLCBuYW1lKSA9PiB7XG4gICAgICBwYXJ0cy5wdXNoKGBbJHtuYW1lfT1cIiR7YXR0cmlidXRlc1tuYW1lXX1cIl1gKVxuICAgICAgcmV0dXJuIHBhcnRzXG4gICAgfSwgW10pLmpvaW4oJycpXG4gICAgc2VsZWN0b3JQYXRoLnB1c2goYXR0cmlidXRlU2VsZWN0b3IpXG4gIH1cblxuICBpZiAoc2VsZWN0b3JQYXRoLmxlbmd0aCkge1xuICAgIC8vIFRPRE86IGNoZWNrIGZvciBwYXJlbnQtY2hpbGQgcmVsYXRpb25cbiAgfVxuXG4gIHJldHVybiBbXG4gICAgc2VsZWN0b3JQYXRoLmpvaW4oJycpXG4gIF1cbn1cblxuLyoqXG4gKiBDaG9vc2UgYWN0aW9uIGRlcGVuZGluZyBvbiB0aGUgaW5wdXQgKG11bHRpcGxlL3NpbmdsZSlcbiAqXG4gKiBOT1RFOiBleHRlbmRlZCBkZXRlY3Rpb24gaXMgdXNlZCBmb3Igc3BlY2lhbCBjYXNlcyBsaWtlIHRoZSA8c2VsZWN0PiBlbGVtZW50IHdpdGggPG9wdGlvbnM+XG4gKlxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR8Tm9kZUxpc3R8QXJyYXkuPEhUTUxFbGVtZW50Pn0gaW5wdXQgICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBnZXRRdWVyeVNlbGVjdG9yIChpbnB1dCwgb3B0aW9ucyA9IHt9KSB7XG4gIGlmIChpbnB1dC5sZW5ndGggJiYgIWlucHV0Lm5hbWUpIHtcbiAgICByZXR1cm4gZ2V0TXVsdGlTZWxlY3RvcihpbnB1dCwgb3B0aW9ucylcbiAgfVxuICByZXR1cm4gZ2V0U2luZ2xlU2VsZWN0b3IoaW5wdXQsIG9wdGlvbnMpXG59XG4iXSwiZmlsZSI6InNlbGVjdC5qcyJ9
