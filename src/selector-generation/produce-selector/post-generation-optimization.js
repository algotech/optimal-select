/**
* Tries to shorten the selector if possible, starting from left
* @param {String} initialSelector The generated selector to be improved
* @param {Object} root            Document root where to search for element
* @param {JQuery} $element        The element to find a shorter selector for
*/
export function shortenSelectorByShifting(initialSelector, root, $element) {
  let shorterSelector = initialSelector.split(' ');
  let lastShifted = '';

  while (
    isSelectorValid(shorterSelector.join(' ')) &&
    $(root).find(shorterSelector.join(' ')).is($element) &&
    $(root).find(shorterSelector.join(' ')).length == 1
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
