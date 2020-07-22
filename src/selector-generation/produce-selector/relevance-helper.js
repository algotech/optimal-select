/**
* Randomly generated selectors are the ones with at least 2 digits in a sequence
* of 5 characters. But numbers up to 12 are allowed so that bootstrap classes
* like col-md-12 are accepted
* @param {string} selector
* @return {boolean}
*/
export function isSelectorRandomlyGenerated(selector) {
  var randomNumeral = !!(selector.match(/.*([0-9]{1}.{0,3}[0-9]{1}){1}.*/) &&
    !selector.match(/.*\D+(1[0-2]){1}(\D{1}.*)?$/));

  // check this options
  // - minimul 5 consonants in 6 consecutive characters (2c-1v-3c or 3c-1v-2c)
  // - minimum 4 consecutive consonants
  var noVowel = '[^aeiouy]';
  var vowel = '[aeiouy]';
  var cccVcc = new RegExp(`.*${noVowel}${noVowel}${noVowel}${vowel}${noVowel}${noVowel}.*`, 'i');
  var ccVccc = new RegExp(`.*${noVowel}${noVowel}${vowel}${noVowel}${noVowel}${noVowel}.*`, 'i');
  var fourConsecutiveVovels = new RegExp(`.*${vowel}${vowel}${vowel}${vowel}.*`, 'i');

  var randomLiteral = !!selector.match(cccVcc) || !!selector.match(ccVccc) || !!selector.match(fourConsecutiveVovels);

  return randomNumeral || randomLiteral;
}

export default {
  isSelectorRandomlyGenerated
};
