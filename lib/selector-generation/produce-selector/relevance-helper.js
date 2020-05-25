"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isSelectorRandomlyGenerated = isSelectorRandomlyGenerated;
exports["default"] = void 0;

/**
* Randomly generated selectors are the ones with at least 2 digits in a sequence
* of 5 characters. But numbers up to 12 are allowed so that bootstrap classes
* like col-md-12 are accepted
* @param {string} selector
* @return {boolean}
*/
function isSelectorRandomlyGenerated(selector) {
  return selector.match(/.*([0-9]{1}.{0,3}[0-9]{1}){1}.*/) && !selector.match(/.*\D+(1[0-2]){1}(\D{1}.*)?$/);
}

var _default = {
  isSelectorRandomlyGenerated: isSelectorRandomlyGenerated
};
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlbGVjdG9yLWdlbmVyYXRpb24vcHJvZHVjZS1zZWxlY3Rvci9yZWxldmFuY2UtaGVscGVyLmpzIl0sIm5hbWVzIjpbImlzU2VsZWN0b3JSYW5kb21seUdlbmVyYXRlZCIsInNlbGVjdG9yIiwibWF0Y2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7Ozs7Ozs7QUFPTyxTQUFTQSwyQkFBVCxDQUFxQ0MsUUFBckMsRUFBK0M7QUFDcEQsU0FDRUEsUUFBUSxDQUFDQyxLQUFULENBQWUsaUNBQWYsS0FDQSxDQUFDRCxRQUFRLENBQUNDLEtBQVQsQ0FBZSw2QkFBZixDQUZIO0FBSUQ7O2VBRWM7QUFDYkYsRUFBQUEsMkJBQTJCLEVBQTNCQTtBQURhLEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogUmFuZG9tbHkgZ2VuZXJhdGVkIHNlbGVjdG9ycyBhcmUgdGhlIG9uZXMgd2l0aCBhdCBsZWFzdCAyIGRpZ2l0cyBpbiBhIHNlcXVlbmNlXG4qIG9mIDUgY2hhcmFjdGVycy4gQnV0IG51bWJlcnMgdXAgdG8gMTIgYXJlIGFsbG93ZWQgc28gdGhhdCBib290c3RyYXAgY2xhc3Nlc1xuKiBsaWtlIGNvbC1tZC0xMiBhcmUgYWNjZXB0ZWRcbiogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yXG4qIEByZXR1cm4ge2Jvb2xlYW59XG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU2VsZWN0b3JSYW5kb21seUdlbmVyYXRlZChzZWxlY3Rvcikge1xuICByZXR1cm4gKFxuICAgIHNlbGVjdG9yLm1hdGNoKC8uKihbMC05XXsxfS57MCwzfVswLTldezF9KXsxfS4qLykgJiZcbiAgICAhc2VsZWN0b3IubWF0Y2goLy4qXFxEKygxWzAtMl0pezF9KFxcRHsxfS4qKT8kLylcbiAgKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBpc1NlbGVjdG9yUmFuZG9tbHlHZW5lcmF0ZWRcbn07XG4iXSwiZmlsZSI6InNlbGVjdG9yLWdlbmVyYXRpb24vcHJvZHVjZS1zZWxlY3Rvci9yZWxldmFuY2UtaGVscGVyLmpzIn0=
