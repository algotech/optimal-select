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
  var randomNumeral = !!(selector.match(/.*([0-9]{1}.{0,3}[0-9]{1}){1}.*/) && !selector.match(/.*\D+(1[0-2]){1}(\D{1}.*)?$/)); // check this options
  // - minimul 5 consonants in 6 consecutive characters (2c-1v-3c or 3c-1v-2c)
  // - minimum 4 consecutive consonants
  // due to some issues with select2 library the selector .select2-search--dropdown .select2-search__field
  // is marked as random.

  var noVowel = '[^aeiouy_-]';
  var vowel = '[aeiouy]';
  var cccVcc = new RegExp(".*".concat(noVowel).concat(noVowel).concat(noVowel).concat(vowel).concat(noVowel).concat(noVowel, ".*"), 'i');
  var ccVccc = new RegExp(".*".concat(noVowel).concat(noVowel).concat(vowel).concat(noVowel).concat(noVowel).concat(noVowel, ".*"), 'i');
  var fourConsecutiveVovels = new RegExp(".*".concat(noVowel).concat(noVowel).concat(noVowel).concat(noVowel, ".*"), 'i');
  var randomLiteral = !!selector.match(cccVcc) || !!selector.match(ccVccc) || !!selector.match(fourConsecutiveVovels);
  return randomNumeral || randomLiteral;
}

var _default = {
  isSelectorRandomlyGenerated: isSelectorRandomlyGenerated
};
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlbGVjdG9yLWdlbmVyYXRpb24vcHJvZHVjZS1zZWxlY3Rvci9yZWxldmFuY2UtaGVscGVyLmpzIl0sIm5hbWVzIjpbImlzU2VsZWN0b3JSYW5kb21seUdlbmVyYXRlZCIsInNlbGVjdG9yIiwicmFuZG9tTnVtZXJhbCIsIm1hdGNoIiwibm9Wb3dlbCIsInZvd2VsIiwiY2NjVmNjIiwiUmVnRXhwIiwiY2NWY2NjIiwiZm91ckNvbnNlY3V0aXZlVm92ZWxzIiwicmFuZG9tTGl0ZXJhbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPLFNBQVNBLDJCQUFULENBQXFDQyxRQUFyQyxFQUErQztBQUNwRCxNQUFJQyxhQUFhLEdBQUcsQ0FBQyxFQUFFRCxRQUFRLENBQUNFLEtBQVQsQ0FBZSxpQ0FBZixLQUNyQixDQUFDRixRQUFRLENBQUNFLEtBQVQsQ0FBZSw2QkFBZixDQURrQixDQUFyQixDQURvRCxDQUlwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLE1BQUlDLE9BQU8sR0FBRyxhQUFkO0FBQ0EsTUFBSUMsS0FBSyxHQUFHLFVBQVo7QUFDQSxNQUFJQyxNQUFNLEdBQUcsSUFBSUMsTUFBSixhQUFnQkgsT0FBaEIsU0FBMEJBLE9BQTFCLFNBQW9DQSxPQUFwQyxTQUE4Q0MsS0FBOUMsU0FBc0RELE9BQXRELFNBQWdFQSxPQUFoRSxTQUE2RSxHQUE3RSxDQUFiO0FBQ0EsTUFBSUksTUFBTSxHQUFHLElBQUlELE1BQUosYUFBZ0JILE9BQWhCLFNBQTBCQSxPQUExQixTQUFvQ0MsS0FBcEMsU0FBNENELE9BQTVDLFNBQXNEQSxPQUF0RCxTQUFnRUEsT0FBaEUsU0FBNkUsR0FBN0UsQ0FBYjtBQUNBLE1BQUlLLHFCQUFxQixHQUFHLElBQUlGLE1BQUosYUFBZ0JILE9BQWhCLFNBQTBCQSxPQUExQixTQUFvQ0EsT0FBcEMsU0FBOENBLE9BQTlDLFNBQTJELEdBQTNELENBQTVCO0FBRUEsTUFBSU0sYUFBYSxHQUFHLENBQUMsQ0FBQ1QsUUFBUSxDQUFDRSxLQUFULENBQWVHLE1BQWYsQ0FBRixJQUE0QixDQUFDLENBQUNMLFFBQVEsQ0FBQ0UsS0FBVCxDQUFlSyxNQUFmLENBQTlCLElBQXdELENBQUMsQ0FBQ1AsUUFBUSxDQUFDRSxLQUFULENBQWVNLHFCQUFmLENBQTlFO0FBRUEsU0FBT1AsYUFBYSxJQUFJUSxhQUF4QjtBQUNEOztlQUVjO0FBQ2JWLEVBQUFBLDJCQUEyQixFQUEzQkE7QUFEYSxDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIFJhbmRvbWx5IGdlbmVyYXRlZCBzZWxlY3RvcnMgYXJlIHRoZSBvbmVzIHdpdGggYXQgbGVhc3QgMiBkaWdpdHMgaW4gYSBzZXF1ZW5jZVxuKiBvZiA1IGNoYXJhY3RlcnMuIEJ1dCBudW1iZXJzIHVwIHRvIDEyIGFyZSBhbGxvd2VkIHNvIHRoYXQgYm9vdHN0cmFwIGNsYXNzZXNcbiogbGlrZSBjb2wtbWQtMTIgYXJlIGFjY2VwdGVkXG4qIEBwYXJhbSB7c3RyaW5nfSBzZWxlY3RvclxuKiBAcmV0dXJuIHtib29sZWFufVxuKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1NlbGVjdG9yUmFuZG9tbHlHZW5lcmF0ZWQoc2VsZWN0b3IpIHtcbiAgdmFyIHJhbmRvbU51bWVyYWwgPSAhIShzZWxlY3Rvci5tYXRjaCgvLiooWzAtOV17MX0uezAsM31bMC05XXsxfSl7MX0uKi8pICYmXG4gICAgIXNlbGVjdG9yLm1hdGNoKC8uKlxcRCsoMVswLTJdKXsxfShcXER7MX0uKik/JC8pKTtcblxuICAvLyBjaGVjayB0aGlzIG9wdGlvbnNcbiAgLy8gLSBtaW5pbXVsIDUgY29uc29uYW50cyBpbiA2IGNvbnNlY3V0aXZlIGNoYXJhY3RlcnMgKDJjLTF2LTNjIG9yIDNjLTF2LTJjKVxuICAvLyAtIG1pbmltdW0gNCBjb25zZWN1dGl2ZSBjb25zb25hbnRzXG4gIC8vIGR1ZSB0byBzb21lIGlzc3VlcyB3aXRoIHNlbGVjdDIgbGlicmFyeSB0aGUgc2VsZWN0b3IgLnNlbGVjdDItc2VhcmNoLS1kcm9wZG93biAuc2VsZWN0Mi1zZWFyY2hfX2ZpZWxkXG4gIC8vIGlzIG1hcmtlZCBhcyByYW5kb20uXG4gIHZhciBub1Zvd2VsID0gJ1teYWVpb3V5Xy1dJztcbiAgdmFyIHZvd2VsID0gJ1thZWlvdXldJztcbiAgdmFyIGNjY1ZjYyA9IG5ldyBSZWdFeHAoYC4qJHtub1Zvd2VsfSR7bm9Wb3dlbH0ke25vVm93ZWx9JHt2b3dlbH0ke25vVm93ZWx9JHtub1Zvd2VsfS4qYCwgJ2knKTtcbiAgdmFyIGNjVmNjYyA9IG5ldyBSZWdFeHAoYC4qJHtub1Zvd2VsfSR7bm9Wb3dlbH0ke3Zvd2VsfSR7bm9Wb3dlbH0ke25vVm93ZWx9JHtub1Zvd2VsfS4qYCwgJ2knKTtcbiAgdmFyIGZvdXJDb25zZWN1dGl2ZVZvdmVscyA9IG5ldyBSZWdFeHAoYC4qJHtub1Zvd2VsfSR7bm9Wb3dlbH0ke25vVm93ZWx9JHtub1Zvd2VsfS4qYCwgJ2knKTtcblxuICB2YXIgcmFuZG9tTGl0ZXJhbCA9ICEhc2VsZWN0b3IubWF0Y2goY2NjVmNjKSB8fCAhIXNlbGVjdG9yLm1hdGNoKGNjVmNjYykgfHwgISFzZWxlY3Rvci5tYXRjaChmb3VyQ29uc2VjdXRpdmVWb3ZlbHMpO1xuXG4gIHJldHVybiByYW5kb21OdW1lcmFsIHx8IHJhbmRvbUxpdGVyYWw7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgaXNTZWxlY3RvclJhbmRvbWx5R2VuZXJhdGVkXG59O1xuIl0sImZpbGUiOiJzZWxlY3Rvci1nZW5lcmF0aW9uL3Byb2R1Y2Utc2VsZWN0b3IvcmVsZXZhbmNlLWhlbHBlci5qcyJ9
