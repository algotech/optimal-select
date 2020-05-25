/**
* Randomly generated selectors are the ones with at least 2 digits in a sequence
* of 5 characters. But numbers up to 12 are allowed so that bootstrap classes
* like col-md-12 are accepted
* @param {string} selector
* @return {boolean}
*/
export function isSelectorRandomlyGenerated(selector) {
  return (
    selector.match(/.*([0-9]{1}.{0,3}[0-9]{1}){1}.*/) &&
    !selector.match(/.*\D+(1[0-2]){1}(\D{1}.*)?$/)
  );
}

export default {
  isSelectorRandomlyGenerated
};
