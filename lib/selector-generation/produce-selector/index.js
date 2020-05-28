"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSelector = getSelector;
exports["default"] = exports.produceSelector = void 0;

var _jquery = _interopRequireDefault(require("jquery"));

var _select = _interopRequireWildcard(require("../../select"));

var _selectorConfiguration = _interopRequireDefault(require("../selector-configuration"));

var _selectWrapper = _interopRequireDefault(require("./select-wrapper"));

var _exceptionsHelper = require("./exceptions-helper");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var defaultSelectorConfig = new _selectorConfiguration["default"]('Default Selector Configuration');
/**
 * Produces the selector and uses fallbacks in case the current config
 * is too restrictive for the current element
 * @param {JQuery} $element
 * @param {Object} $customPageDocument
 * @param {SelectorConfig} config
 * @return {Object}
 */

function produceSelectorFn($element, $customPageDocument, config) {
  // try with the specified config and default strategy
  var sel1 = (0, _selectWrapper["default"])($element, $customPageDocument, config, _select["default"]);

  if (!sel1.hasError) {
    return sel1;
  } // try with the fallback config and default strategy


  var sel2 = (0, _selectWrapper["default"])($element, $customPageDocument, null, _select["default"]);

  if (!defaultSelectorConfig.isIncludedInConfig(config)) {
    (0, _exceptionsHelper.addWarningMessage)(sel2, _exceptionsHelper.WARNINGS.FELL_TO_DEFAULT_CONFIG);
  }

  if (!sel2.hasError) {
    return sel2;
  } // try with the specified config and the fallback strategy


  var sel3 = (0, _selectWrapper["default"])($element, $customPageDocument, config, _select.getSingleSelector);
  (0, _exceptionsHelper.addWarningMessage)(sel3, _exceptionsHelper.WARNINGS.FELL_TO_DEFAULT_STRATEGY);

  if (!sel3.hasError) {
    return sel3;
  } // try with the fallback config and the fallback strategy


  var sel4 = (0, _selectWrapper["default"])($element, $customPageDocument, null, _select.getSingleSelector);

  if (!defaultSelectorConfig.isIncludedInConfig(config)) {
    (0, _exceptionsHelper.addWarningMessage)(sel4, _exceptionsHelper.WARNINGS.FELL_TO_DEFAULT_CONFIG);
  }

  (0, _exceptionsHelper.addWarningMessage)(sel4, _exceptionsHelper.WARNINGS.FELL_TO_DEFAULT_STRATEGY);

  if (!sel4.hasError) {
    return sel4;
  } // try with tags only config and defaultStrategy


  var tagsOnlyComposition = {
    classes: false,
    ids: false,
    tags: true,
    attributes: false,
    exceptions: Object.assign({}, {
      forbiddenClassSubstrings: config.getForbiddenClassSubstrings()
    }, {
      forbiddenIdSubstrings: config.getForbiddenIdSubstrings()
    }, {
      forbiddenAttributeSubstrings: config.getForbiddenAttributeSubstrings()
    })
  };
  var configTagsOnly = new _selectorConfiguration["default"](config.name, tagsOnlyComposition);
  var sel5 = (0, _selectWrapper["default"])($element, $customPageDocument, configTagsOnly, _select["default"]);

  if (!configTagsOnly.isIncludedInConfig(config)) {
    (0, _exceptionsHelper.addWarningMessage)(sel5, _exceptionsHelper.WARNINGS.FELL_TO_DEFAULT_CONFIG);
  }

  if (!sel5.hasError) {
    return sel5;
  }

  logAllInvalidSelectorsError(sel1, sel2, sel3, sel4, sel5);
  return null;
}

function logAllInvalidSelectorsError(sel1, sel2, sel3, sel4, sel5) {
  console.error('All produce selector attempts failed. The selectors are:');
  console.error('userConfig + defaultStrategy', sel1);
  console.error('fallbackConfig + defaultStrategy', sel2);
  console.error('userConfig + fallbackStrategy', sel3);
  console.error('fallbackConfig + fallbackStrategy', sel4);
  console.error('tagsOnlyComposition + defaultStrategy', sel5);
}

function produceSelectorFnWrapper($element, $customPageDocument, config) {
  var selector = produceSelectorFn($element, $customPageDocument, config);

  if (selector == null) {
    return console.error('Selector is null!');
  }

  if (selector.hasError) {
    console.error('Selector with errors: ', selector.errors);
  }

  if (selector.hasWarning) {
    console.warn('Selector with warnings: ', selector.warnings);
  }

  return selector;
}
/**
* Produces a selector without needing jquery element as param or
* an instance of SelectorConfig(useful for algotech-testing-runner)
*
* @param {HTMLElement}      element
* @param {Object}           config
* @return {Object}                  The generated selector string can be found by the .value
*                                   attribute of this result object.
*/


function getSelector(element, config) {
  var selectorConfig = new _selectorConfiguration["default"]('Global Selector Config', config);
  return produceSelectorFnWrapper((0, _jquery["default"])(element), null, selectorConfig);
}

var produceSelector = produceSelectorFnWrapper;
exports.produceSelector = produceSelector;
var _default = {
  produceSelector: produceSelectorFnWrapper
};
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlbGVjdG9yLWdlbmVyYXRpb24vcHJvZHVjZS1zZWxlY3Rvci9pbmRleC5qcyJdLCJuYW1lcyI6WyJkZWZhdWx0U2VsZWN0b3JDb25maWciLCJTZWxlY3RvckNvbmZpZyIsInByb2R1Y2VTZWxlY3RvckZuIiwiJGVsZW1lbnQiLCIkY3VzdG9tUGFnZURvY3VtZW50IiwiY29uZmlnIiwic2VsMSIsImdldFF1ZXJ5U2VsZWN0b3IiLCJoYXNFcnJvciIsInNlbDIiLCJpc0luY2x1ZGVkSW5Db25maWciLCJXQVJOSU5HUyIsIkZFTExfVE9fREVGQVVMVF9DT05GSUciLCJzZWwzIiwiZ2V0U2luZ2xlU2VsZWN0b3IiLCJGRUxMX1RPX0RFRkFVTFRfU1RSQVRFR1kiLCJzZWw0IiwidGFnc09ubHlDb21wb3NpdGlvbiIsImNsYXNzZXMiLCJpZHMiLCJ0YWdzIiwiYXR0cmlidXRlcyIsImV4Y2VwdGlvbnMiLCJPYmplY3QiLCJhc3NpZ24iLCJmb3JiaWRkZW5DbGFzc1N1YnN0cmluZ3MiLCJnZXRGb3JiaWRkZW5DbGFzc1N1YnN0cmluZ3MiLCJmb3JiaWRkZW5JZFN1YnN0cmluZ3MiLCJnZXRGb3JiaWRkZW5JZFN1YnN0cmluZ3MiLCJmb3JiaWRkZW5BdHRyaWJ1dGVTdWJzdHJpbmdzIiwiZ2V0Rm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5ncyIsImNvbmZpZ1RhZ3NPbmx5IiwibmFtZSIsInNlbDUiLCJsb2dBbGxJbnZhbGlkU2VsZWN0b3JzRXJyb3IiLCJjb25zb2xlIiwiZXJyb3IiLCJwcm9kdWNlU2VsZWN0b3JGbldyYXBwZXIiLCJzZWxlY3RvciIsImVycm9ycyIsImhhc1dhcm5pbmciLCJ3YXJuIiwid2FybmluZ3MiLCJnZXRTZWxlY3RvciIsImVsZW1lbnQiLCJzZWxlY3RvckNvbmZpZyIsInByb2R1Y2VTZWxlY3RvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOzs7Ozs7OztBQUVBLElBQU1BLHFCQUFx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LFFBQVA7QUFDRDtBQUVEOzs7Ozs7Ozs7OztBQVNPLFNBQVNLLFdBQVQsQ0FBcUJDLE9BQXJCLEVBQThCdkMsTUFBOUIsRUFBc0M7QUFDM0MsTUFBTXdDLGNBQWMsR0FBRyxJQUFJNUMsaUNBQUosQ0FBbUIsd0JBQW5CLEVBQTZDSSxNQUE3QyxDQUF2QjtBQUVBLFNBQU9nQyx3QkFBd0IsQ0FBQyx3QkFBRU8sT0FBRixDQUFELEVBQWEsSUFBYixFQUFtQkMsY0FBbkIsQ0FBL0I7QUFDRDs7QUFFTSxJQUFNQyxlQUFlLEdBQUdULHdCQUF4Qjs7ZUFFUTtBQUNiUyxFQUFBQSxlQUFlLEVBQUVUO0FBREosQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAkIGZyb20gJ2pxdWVyeSc7XG5pbXBvcnQgZ2V0UXVlcnlTZWxlY3RvciwgeyBnZXRTaW5nbGVTZWxlY3RvciB9IGZyb20gJy4uLy4uL3NlbGVjdCc7XG5cbmltcG9ydCBTZWxlY3RvckNvbmZpZyBmcm9tICcuLi9zZWxlY3Rvci1jb25maWd1cmF0aW9uJztcbmltcG9ydCBzZWxlY3QgZnJvbSAnLi9zZWxlY3Qtd3JhcHBlcic7XG5pbXBvcnQgeyBhZGRXYXJuaW5nTWVzc2FnZSwgV0FSTklOR1MgfSBmcm9tICcuL2V4Y2VwdGlvbnMtaGVscGVyJztcblxuY29uc3QgZGVmYXVsdFNlbGVjdG9yQ29uZmlnID0gbmV3IFNlbGVjdG9yQ29uZmlnKFxuICAnRGVmYXVsdCBTZWxlY3RvciBDb25maWd1cmF0aW9uJ1xuKTtcblxuLyoqXG4gKiBQcm9kdWNlcyB0aGUgc2VsZWN0b3IgYW5kIHVzZXMgZmFsbGJhY2tzIGluIGNhc2UgdGhlIGN1cnJlbnQgY29uZmlnXG4gKiBpcyB0b28gcmVzdHJpY3RpdmUgZm9yIHRoZSBjdXJyZW50IGVsZW1lbnRcbiAqIEBwYXJhbSB7SlF1ZXJ5fSAkZWxlbWVudFxuICogQHBhcmFtIHtPYmplY3R9ICRjdXN0b21QYWdlRG9jdW1lbnRcbiAqIEBwYXJhbSB7U2VsZWN0b3JDb25maWd9IGNvbmZpZ1xuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5mdW5jdGlvbiBwcm9kdWNlU2VsZWN0b3JGbigkZWxlbWVudCwgJGN1c3RvbVBhZ2VEb2N1bWVudCwgY29uZmlnKSB7XG4gIC8vIHRyeSB3aXRoIHRoZSBzcGVjaWZpZWQgY29uZmlnIGFuZCBkZWZhdWx0IHN0cmF0ZWd5XG4gIGxldCBzZWwxID0gc2VsZWN0KCRlbGVtZW50LCAkY3VzdG9tUGFnZURvY3VtZW50LCBjb25maWcsIGdldFF1ZXJ5U2VsZWN0b3IpO1xuXG4gIGlmICghc2VsMS5oYXNFcnJvcikge1xuICAgIHJldHVybiBzZWwxO1xuICB9XG5cbiAgLy8gdHJ5IHdpdGggdGhlIGZhbGxiYWNrIGNvbmZpZyBhbmQgZGVmYXVsdCBzdHJhdGVneVxuICBsZXQgc2VsMiA9IHNlbGVjdCgkZWxlbWVudCwgJGN1c3RvbVBhZ2VEb2N1bWVudCwgbnVsbCwgZ2V0UXVlcnlTZWxlY3Rvcik7XG5cbiAgaWYgKCFkZWZhdWx0U2VsZWN0b3JDb25maWcuaXNJbmNsdWRlZEluQ29uZmlnKGNvbmZpZykpIHtcbiAgICBhZGRXYXJuaW5nTWVzc2FnZShzZWwyLCBXQVJOSU5HUy5GRUxMX1RPX0RFRkFVTFRfQ09ORklHKTtcbiAgfVxuXG4gIGlmICghc2VsMi5oYXNFcnJvcikge1xuICAgIHJldHVybiBzZWwyO1xuICB9XG5cbiAgLy8gdHJ5IHdpdGggdGhlIHNwZWNpZmllZCBjb25maWcgYW5kIHRoZSBmYWxsYmFjayBzdHJhdGVneVxuICBsZXQgc2VsMyA9IHNlbGVjdCgkZWxlbWVudCwgJGN1c3RvbVBhZ2VEb2N1bWVudCwgY29uZmlnLCBnZXRTaW5nbGVTZWxlY3Rvcik7XG5cbiAgYWRkV2FybmluZ01lc3NhZ2Uoc2VsMywgV0FSTklOR1MuRkVMTF9UT19ERUZBVUxUX1NUUkFURUdZKTtcblxuICBpZiAoIXNlbDMuaGFzRXJyb3IpIHtcbiAgICByZXR1cm4gc2VsMztcbiAgfVxuXG4gIC8vIHRyeSB3aXRoIHRoZSBmYWxsYmFjayBjb25maWcgYW5kIHRoZSBmYWxsYmFjayBzdHJhdGVneVxuICBsZXQgc2VsNCA9IHNlbGVjdCgkZWxlbWVudCwgJGN1c3RvbVBhZ2VEb2N1bWVudCwgbnVsbCwgZ2V0U2luZ2xlU2VsZWN0b3IpO1xuXG4gIGlmICghZGVmYXVsdFNlbGVjdG9yQ29uZmlnLmlzSW5jbHVkZWRJbkNvbmZpZyhjb25maWcpKSB7XG4gICAgYWRkV2FybmluZ01lc3NhZ2Uoc2VsNCwgV0FSTklOR1MuRkVMTF9UT19ERUZBVUxUX0NPTkZJRyk7XG4gIH1cbiAgYWRkV2FybmluZ01lc3NhZ2Uoc2VsNCwgV0FSTklOR1MuRkVMTF9UT19ERUZBVUxUX1NUUkFURUdZKTtcblxuICBpZiAoIXNlbDQuaGFzRXJyb3IpIHtcbiAgICByZXR1cm4gc2VsNDtcbiAgfVxuXG4gIC8vIHRyeSB3aXRoIHRhZ3Mgb25seSBjb25maWcgYW5kIGRlZmF1bHRTdHJhdGVneVxuICBsZXQgdGFnc09ubHlDb21wb3NpdGlvbiA9IHtcbiAgICBjbGFzc2VzOiBmYWxzZSxcbiAgICBpZHM6IGZhbHNlLFxuICAgIHRhZ3M6IHRydWUsXG4gICAgYXR0cmlidXRlczogZmFsc2UsXG4gICAgZXhjZXB0aW9uczogT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgeyBmb3JiaWRkZW5DbGFzc1N1YnN0cmluZ3M6IGNvbmZpZy5nZXRGb3JiaWRkZW5DbGFzc1N1YnN0cmluZ3MoKSB9LFxuICAgICAgeyBmb3JiaWRkZW5JZFN1YnN0cmluZ3M6IGNvbmZpZy5nZXRGb3JiaWRkZW5JZFN1YnN0cmluZ3MoKSB9LFxuICAgICAgeyBmb3JiaWRkZW5BdHRyaWJ1dGVTdWJzdHJpbmdzOiBjb25maWcuZ2V0Rm9yYmlkZGVuQXR0cmlidXRlU3Vic3RyaW5ncygpIH1cbiAgICApXG4gIH07XG4gIGxldCBjb25maWdUYWdzT25seSA9IG5ldyBTZWxlY3RvckNvbmZpZyhjb25maWcubmFtZSwgdGFnc09ubHlDb21wb3NpdGlvbik7XG4gIGxldCBzZWw1ID1cbiAgICBzZWxlY3QoJGVsZW1lbnQsICRjdXN0b21QYWdlRG9jdW1lbnQsIGNvbmZpZ1RhZ3NPbmx5LCBnZXRRdWVyeVNlbGVjdG9yKTtcblxuICBpZiAoIWNvbmZpZ1RhZ3NPbmx5LmlzSW5jbHVkZWRJbkNvbmZpZyhjb25maWcpKSB7XG4gICAgYWRkV2FybmluZ01lc3NhZ2Uoc2VsNSwgV0FSTklOR1MuRkVMTF9UT19ERUZBVUxUX0NPTkZJRyk7XG4gIH1cblxuICBpZiAoIXNlbDUuaGFzRXJyb3IpIHtcbiAgICByZXR1cm4gc2VsNTtcbiAgfVxuXG4gIGxvZ0FsbEludmFsaWRTZWxlY3RvcnNFcnJvcihzZWwxLCBzZWwyLCBzZWwzLCBzZWw0LCBzZWw1KTtcblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gbG9nQWxsSW52YWxpZFNlbGVjdG9yc0Vycm9yKHNlbDEsIHNlbDIsIHNlbDMsIHNlbDQsIHNlbDUpIHtcbiAgY29uc29sZS5lcnJvcignQWxsIHByb2R1Y2Ugc2VsZWN0b3IgYXR0ZW1wdHMgZmFpbGVkLiBUaGUgc2VsZWN0b3JzIGFyZTonKTtcbiAgY29uc29sZS5lcnJvcigndXNlckNvbmZpZyArIGRlZmF1bHRTdHJhdGVneScsIHNlbDEpO1xuICBjb25zb2xlLmVycm9yKCdmYWxsYmFja0NvbmZpZyArIGRlZmF1bHRTdHJhdGVneScsIHNlbDIpO1xuICBjb25zb2xlLmVycm9yKCd1c2VyQ29uZmlnICsgZmFsbGJhY2tTdHJhdGVneScsIHNlbDMpO1xuICBjb25zb2xlLmVycm9yKCdmYWxsYmFja0NvbmZpZyArIGZhbGxiYWNrU3RyYXRlZ3knLCBzZWw0KTtcbiAgY29uc29sZS5lcnJvcigndGFnc09ubHlDb21wb3NpdGlvbiArIGRlZmF1bHRTdHJhdGVneScsIHNlbDUpO1xufVxuXG5mdW5jdGlvbiBwcm9kdWNlU2VsZWN0b3JGbldyYXBwZXIoJGVsZW1lbnQsICRjdXN0b21QYWdlRG9jdW1lbnQsIGNvbmZpZykge1xuICBsZXQgc2VsZWN0b3IgPSBwcm9kdWNlU2VsZWN0b3JGbigkZWxlbWVudCwgJGN1c3RvbVBhZ2VEb2N1bWVudCwgY29uZmlnKTtcblxuICBpZiAoc2VsZWN0b3IgPT0gbnVsbCkge1xuICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdTZWxlY3RvciBpcyBudWxsIScpO1xuICB9XG4gIGlmIChzZWxlY3Rvci5oYXNFcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1NlbGVjdG9yIHdpdGggZXJyb3JzOiAnLCBzZWxlY3Rvci5lcnJvcnMpO1xuICB9XG4gIGlmIChzZWxlY3Rvci5oYXNXYXJuaW5nKSB7XG4gICAgY29uc29sZS53YXJuKCdTZWxlY3RvciB3aXRoIHdhcm5pbmdzOiAnLCBzZWxlY3Rvci53YXJuaW5ncyk7XG4gIH1cblxuICByZXR1cm4gc2VsZWN0b3I7XG59XG5cbi8qKlxuKiBQcm9kdWNlcyBhIHNlbGVjdG9yIHdpdGhvdXQgbmVlZGluZyBqcXVlcnkgZWxlbWVudCBhcyBwYXJhbSBvclxuKiBhbiBpbnN0YW5jZSBvZiBTZWxlY3RvckNvbmZpZyh1c2VmdWwgZm9yIGFsZ290ZWNoLXRlc3RpbmctcnVubmVyKVxuKlxuKiBAcGFyYW0ge0hUTUxFbGVtZW50fSAgICAgIGVsZW1lbnRcbiogQHBhcmFtIHtPYmplY3R9ICAgICAgICAgICBjb25maWdcbiogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICAgICAgICAgIFRoZSBnZW5lcmF0ZWQgc2VsZWN0b3Igc3RyaW5nIGNhbiBiZSBmb3VuZCBieSB0aGUgLnZhbHVlXG4qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGUgb2YgdGhpcyByZXN1bHQgb2JqZWN0LlxuKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZWxlY3RvcihlbGVtZW50LCBjb25maWcpIHtcbiAgY29uc3Qgc2VsZWN0b3JDb25maWcgPSBuZXcgU2VsZWN0b3JDb25maWcoJ0dsb2JhbCBTZWxlY3RvciBDb25maWcnLCBjb25maWcpO1xuXG4gIHJldHVybiBwcm9kdWNlU2VsZWN0b3JGbldyYXBwZXIoJChlbGVtZW50KSwgbnVsbCwgc2VsZWN0b3JDb25maWcpO1xufVxuXG5leHBvcnQgY29uc3QgcHJvZHVjZVNlbGVjdG9yID0gcHJvZHVjZVNlbGVjdG9yRm5XcmFwcGVyO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHByb2R1Y2VTZWxlY3RvcjogcHJvZHVjZVNlbGVjdG9yRm5XcmFwcGVyXG59O1xuIl0sImZpbGUiOiJzZWxlY3Rvci1nZW5lcmF0aW9uL3Byb2R1Y2Utc2VsZWN0b3IvaW5kZXguanMifQ==
