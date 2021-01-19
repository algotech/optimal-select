const attachComputeOverlayStylesToGlobal = (returnOnlyComputeOverlayStyles = false) => {
  function computeOverlayStyles(target, borderWidth, returnOnlyCoords = false) {
    function elementExistsInDOM(element) {
      return document.body.contains(element);
    }

    function hasParentWithPositionFixed(element) {
      // eslint-disable-next-line no-cond-assign
      do {
        if (getComputedStyle(element).position === 'fixed') {
          return true;
        }
      } while (element = element.offsetParent);

      return false;
    }

    /**
    * Checks if the given pseudo element is bigger than the target element
    * @param {Element} element The element to compare the pseudo element with
    * @param {String} pseudoElement One of ':before' or ':after'
    * @return {Object}         Object containing top, left, width, height in px
    *                          ;null if not bigger
    */
    function isPseudoElementBigger(element, pseudoElement) {
      const {
        left, top, marginLeft, marginTop, width, height
      } = getComputedStyle(element, pseudoElement);
      const {
        width: elementWidth,
        height: elementHeight
      } = element.getBoundingClientRect();
      const [
        elementLeft,
        elementTop
      ] = [
        element.offsetLeft,
        element.offsetTop,
      ];

      if (
        (Number.isNaN(parseInt(width, 10)) || parseInt(width, 10) <= elementWidth
      ) && (
        Number.isNaN(parseInt(height, 10)) || parseInt(height, 10) <= elementHeight
      )) {
        return null;
      }
      const differenceTop = (parseInt(top, 10) || 0) +
        (parseInt(marginTop, 10) || 0);
      const differenceLeft = (parseInt(left, 10) || 0) +
        (parseInt(marginLeft, 10) || 0);

      return {
        left: elementLeft + differenceLeft,
        top: elementTop + differenceTop,
        width: Math.max(parseInt(width, 10), elementWidth) || elementWidth,
        height: Math.max(parseInt(height, 10), elementHeight) || elementHeight,
      };
    }

    function isAnyPseudoElementBiggerThanElement(target) {
      const beforeBigger = isPseudoElementBigger(target, ':before');
      const afterBigger = isPseudoElementBigger(target, ':after');

      if (beforeBigger && afterBigger) {
        if (beforeBigger.width * beforeBigger.height >
          afterBigger.width * afterBigger.height
        ) {
          return beforeBigger;
        }

        return afterBigger;
      }

      return beforeBigger || afterBigger;
    }
    if (!elementExistsInDOM(target)) {
      return null;
    }

    const parentWithPositionFixed = hasParentWithPositionFixed(target);
    const boundingClientRect = target.getBoundingClientRect();
    const biggerPseudo = isAnyPseudoElementBiggerThanElement(target);
    const computedStyle = window.getComputedStyle(target);

    const outerWidth = computedStyle.overflow === 'visible' ?
      target.scrollWidth || boundingClientRect.width :
      target.offsetWidth || boundingClientRect.width;
    const outerHeight = computedStyle.overflow === 'visible' ?
      target.scrollHeight || boundingClientRect.height :
      target.offsetHeight || boundingClientRect.height;

    const htmlMarginLeft = parseInt(
      window.getComputedStyle(document.querySelector('html')).marginLeft.replace('px', ''),
      10
    ) || 0;

    const htmlMarginTop = parseInt(
      window.getComputedStyle(document.querySelector('html')).marginTop.replace('px', ''),
      10
    ) || 0;

    const scrollTop = typeof window.scrollY === 'undefined' ?
      window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0 :
      window.scrollY;

    const scrollLeft = typeof window.scrollX === 'undefined' ?
      window.pageXOffset || document.documentElement.scrollTop || document.body.scrollTop || 0 :
      window.scrollX;

    const coordinates = {
      position: parentWithPositionFixed ? 'fixed' : 'absolute',
      width: (biggerPseudo && biggerPseudo.width || outerWidth) + borderWidth,
      height: (biggerPseudo && biggerPseudo.height || outerHeight) + borderWidth,
      left: (boundingClientRect.left + (parentWithPositionFixed ? 0 : scrollLeft)) - borderWidth - htmlMarginLeft,
      top: (boundingClientRect.top + (parentWithPositionFixed ? 0 : scrollTop)) - borderWidth - htmlMarginTop,
    };

    const styling = {
      border: `${borderWidth.toString()}px solid red`,
      backgroundColor: 'orange',
      'mix-blend-mode': 'difference',
      opacity: 0.2,
      zIndex: 2147483645,
      'min-width': '10px',
      'min-height': '10px',
    }

    return returnOnlyCoords ? coordinates : Object.assign(
      {},
      coordinates,
      styling,
    );
  }

  // we need computeOverlayStyles without other code to be exported for the extension part
  // but we need computeOverlayStyles in the browser execute too, that's why this happens.
  var addToGlobalVariable = function (computeOverlayStylesFunc) {
    window.trudonGlobals.computeOverlayStyles = computeOverlayStylesFunc;

    return computeOverlayStylesFunc;
  };

  if (returnOnlyComputeOverlayStyles) {
    return computeOverlayStyles;
  }

  if (window.trudonGlobals) {
    return addToGlobalVariable(computeOverlayStyles);
  }
}


export default {
  attachComputeOverlayStylesToGlobal,
  computeOverlayStyles: attachComputeOverlayStylesToGlobal(true),
};
