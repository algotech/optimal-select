"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertNodeList = convertNodeList;
exports.escapeValue = escapeValue;

/**
 * # Utilities
 *
 * Convenience helpers.
 */

/**
 * Create an array with the DOM nodes of the list
 *
 * @param  {NodeList}             nodes - [description]
 * @return {Array.<HTMLElement>}        - [description]
 */
function convertNodeList(nodes) {
  var length = nodes.length;
  var arr = new Array(length);

  for (var i = 0; i < length; i++) {
    arr[i] = nodes[i];
  }

  return arr;
}
/**
 * Escape special characters and line breaks as a simplified version of 'CSS.escape()'
 *
 * Description of valid characters: https://mathiasbynens.be/notes/css-escapes
 *
 * @param  {String?} value - [description]
 * @return {String}        - [description]
 */


function escapeValue(value) {
  return value && value.replace(/['"`\\/:\?&!#$%^()[\]{|}*+;,.<=>@~]/g, '\\$&').replace(/\n/g, '\A');
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInV0aWxpdGllcy5qcyJdLCJuYW1lcyI6WyJjb252ZXJ0Tm9kZUxpc3QiLCJub2RlcyIsImxlbmd0aCIsImFyciIsIkFycmF5IiwiaSIsImVzY2FwZVZhbHVlIiwidmFsdWUiLCJyZXBsYWNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOzs7Ozs7QUFNQTs7Ozs7O0FBTU8sU0FBU0EsZUFBVCxDQUEwQkMsS0FBMUIsRUFBaUM7QUFBQSxNQUM5QkMsTUFEOEIsR0FDbkJELEtBRG1CLENBQzlCQyxNQUQ4QjtBQUV0QyxNQUFNQyxHQUFHLEdBQUcsSUFBSUMsS0FBSixDQUFVRixNQUFWLENBQVo7O0FBQ0EsT0FBSyxJQUFJRyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHSCxNQUFwQixFQUE0QkcsQ0FBQyxFQUE3QixFQUFpQztBQUMvQkYsSUFBQUEsR0FBRyxDQUFDRSxDQUFELENBQUgsR0FBU0osS0FBSyxDQUFDSSxDQUFELENBQWQ7QUFDRDs7QUFDRCxTQUFPRixHQUFQO0FBQ0Q7QUFFRDs7Ozs7Ozs7OztBQVFPLFNBQVNHLFdBQVQsQ0FBc0JDLEtBQXRCLEVBQTZCO0FBQ2xDLFNBQU9BLEtBQUssSUFBSUEsS0FBSyxDQUFDQyxPQUFOLENBQWMsc0NBQWQsRUFBc0QsTUFBdEQsRUFDTUEsT0FETixDQUNjLEtBRGQsRUFDcUIsSUFEckIsQ0FBaEI7QUFFRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogIyBVdGlsaXRpZXNcbiAqXG4gKiBDb252ZW5pZW5jZSBoZWxwZXJzLlxuICovXG5cbi8qKlxuICogQ3JlYXRlIGFuIGFycmF5IHdpdGggdGhlIERPTSBub2RlcyBvZiB0aGUgbGlzdFxuICpcbiAqIEBwYXJhbSAge05vZGVMaXN0fSAgICAgICAgICAgICBub2RlcyAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0FycmF5LjxIVE1MRWxlbWVudD59ICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnROb2RlTGlzdCAobm9kZXMpIHtcbiAgY29uc3QgeyBsZW5ndGggfSA9IG5vZGVzXG4gIGNvbnN0IGFyciA9IG5ldyBBcnJheShsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBhcnJbaV0gPSBub2Rlc1tpXVxuICB9XG4gIHJldHVybiBhcnJcbn1cblxuLyoqXG4gKiBFc2NhcGUgc3BlY2lhbCBjaGFyYWN0ZXJzIGFuZCBsaW5lIGJyZWFrcyBhcyBhIHNpbXBsaWZpZWQgdmVyc2lvbiBvZiAnQ1NTLmVzY2FwZSgpJ1xuICpcbiAqIERlc2NyaXB0aW9uIG9mIHZhbGlkIGNoYXJhY3RlcnM6IGh0dHBzOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9jc3MtZXNjYXBlc1xuICpcbiAqIEBwYXJhbSAge1N0cmluZz99IHZhbHVlIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7U3RyaW5nfSAgICAgICAgLSBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVWYWx1ZSAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICYmIHZhbHVlLnJlcGxhY2UoL1snXCJgXFxcXC86XFw/JiEjJCVeKClbXFxde3x9Kis7LC48PT5Afl0vZywgJ1xcXFwkJicpXG4gICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXG4vZywgJ1xcQScpXG59XG4iXSwiZmlsZSI6InV0aWxpdGllcy5qcyJ9
