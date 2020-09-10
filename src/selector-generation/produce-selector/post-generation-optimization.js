/**
* Tries to shorten the selector if possible, starting from left
* @param {String} initialSelector The generated selector to be improved
* @param {Object} root            Document root where to search for element
* @param {Element} element        The element to find a shorter selector for
*/
export function shortenSelectorByShifting(initialSelector, root, element) {
  let shorterSelector = initialSelector.split(' ');
  let lastShifted = '';

  while (
    isSelectorValid(shorterSelector.join(' ')) &&
    isSelectorUnique(root, shorterSelector, element)
  ) {
    lastShifted = shorterSelector.shift();
    if (['>', '+', '~'].includes(shorterSelector[0])) {
      lastShifted += ' ' + shorterSelector.shift();
    }
  }
  const improvedSelector = `${lastShifted} ${shorterSelector.join(' ')}`;

  return improvedSelector.length < initialSelector.length ?
    improvedSelector :
    null;
}
/**
 * Checks if the provided selector matches only the desired element
 * @param {Object}  root         Document root where to search for element
 * @param {String}  selector     The generated selector to be improved
 * @param {Element}  element     The element to check with the selector
 */
const isSelectorUnique = (root, selector, element) => (
  root.querySelector(selector.join(' ')) === element &&
  root.querySelectorAll(selector.join(' ')).length === 1
);

/**
* Checks if the selector is syntactically valid
* @param selector The selector to be checked
*/
function isSelectorValid(selector) {
  try {
    document.createDocumentFragment().querySelector(selector);
  } catch (e) {
    return false;
  }

  return true;
}
