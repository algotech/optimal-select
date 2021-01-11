var attachElementDetailsToGlobal = (returnConstructElementDetails = false) => {
  var getAllAttributes = function (element) {
    var attributeDetails = {};

    if (!element.attributes) {
      return {};
    }

    var attributes = Array.prototype.slice.call(element.attributes);
    attributes.forEach(function (attribute) {
      attributeDetails[attribute.nodeName] = attribute.nodeValue;
    });

    return attributeDetails;
  };

  var roundToOneDecimal = function (number) {
    if (typeof number === 'string') {
      return number;
    }

    return Math.round(number * 10) / 10;
  };

  var getVisualDetails = function (element) {
    var scrollTop = window.pageYOffset ||
      (
        document.documentElement ||
        document.body.parentNode ||
        document.body
      ).scrollTop;

    var scrollLeft = window.pageXOffset ||
      (
        document.documentElement ||
        document.body.parentNode ||
        document.body
      ).scrollLeft;

    var visualDetails = element.getBoundingClientRect();
    const x = roundToOneDecimal(scrollLeft + visualDetails.x);
    const y = roundToOneDecimal(scrollTop + visualDetails.y);
    const width = roundToOneDecimal(visualDetails.width);
    const height = roundToOneDecimal(visualDetails.height);

    return {
      x: x, y: y, width: width, height: height,
    };
  };

  var constructParentsArray = function (element) {
    var parentArray = [];
    var index = 0;

    if (!element.parentElement) {
      return parentArray;
    }

    element = element.parentElement;

    while (element !== null && index < 10) {
      index += 1;
      parentArray.push(getDirectDetails(element));

      element = element.parentElement;
    }

    return parentArray;
  };

  var constructDirectChildrenArray = function (element) {
    var childrenArray = [];

    if (!element.children) {
      return null;
    }

    var children = Array.prototype.slice.call(element.children);

    children.forEach(function (child) {
      childrenArray.push({
        details: getDirectDetails(child),
        children: constructDirectChildrenArray(child),
      });
    });

    return childrenArray;
  };

  var constructElementDetails = function (selector, testLineItemId, requestedByExtension = false) {
    var domElement = document.querySelector(selector);

    if (!domElement || (!window.trudonGlobals && !requestedByExtension)) {
      return null;
    }

    var elementDetails = getDirectDetails(domElement);
    if (testLineItemId) {
      elementDetails.testLineItemId = testLineItemId;
    }
    elementDetails.visualDetails = getVisualDetails(domElement),
    elementDetails.selector = selector;
    elementDetails.nextSibling = domElement.nextElementSibling ? getDirectDetails(domElement.nextElementSibling) : null;
    elementDetails.previousSibling = domElement.previousElementSibling ? getDirectDetails(domElement.previousElementSibling) : null;
    elementDetails.parents = constructParentsArray(domElement);
    elementDetails.children = constructDirectChildrenArray(domElement);
    if (window.trudonGlobals) {
      elementDetails.currentElementGrade = window.trudonGlobals.selectorOptionsHelpers.getFinalGradeForElement(domElement, elementDetails);
    }

    return elementDetails;
  };

  var getDirectDetails = function (element, withTextContent = true) {
    return {
      tag: element.tagName,
      textContent: withTextContent && element.textContent ? element.textContent.replace(/[\n\r\s]+/g, '').substring(0, 128) : null, // trim to 128 characters and delete white spaces tabs and new lines
      numberOfPreviousSiblings: getPreviousSiblingsNumber(element),
      numberOfAfterSiblings: getNextSiblingsNumber(element),
      attributes: getAllAttributes(element),
    };
  };

  var getNextSiblingsNumber = function (element) {
    var nextSiblings = 0;

    while (element.nextElementSibling && nextSiblings < 100) {
      if (element.nodeType === 3) {
        continue; // text node not included in nextElementSibling
      }
      element = element.nextElementSibling;

      nextSiblings += 1;
    }

    return nextSiblings;
  };

  var getPreviousSiblingsNumber = function (element) {
    var previousSiblings = 0;

    while (element.previousElementSibling && previousSiblings < 100) {
      if (element.nodeType === 3) {
        continue; // text node not included in previousElementSibling
      }
      element = element.previousElementSibling;

      previousSiblings += 1;
    }

    return previousSiblings;
  };

  var addToGlobalVariable = function (testLineItemDetails) {
    var elementDetails = constructElementDetails(testLineItemDetails.selector, testLineItemDetails.testLineItemId);
    if (window.trudonGlobals) {
      window.trudonGlobals.elementDetails.push(elementDetails);
    }

    return elementDetails;
  };

  // we need constructElementDetails without other code to be exported for the extension part
  // but we need constructElementDetails in the browser execute too, that's why this happens.
  if (returnConstructElementDetails) {
    return constructElementDetails;
  }

  if (window.trudonGlobals) {
    return addToGlobalVariable(window.trudonGlobals.element);
  }
}

export default {
  attachElementDetailsToGlobal,
  constructElementDetails: attachElementDetailsToGlobal(true),
};
