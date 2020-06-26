import { isSelectorRandomlyGenerated } from './relevance-helper';

/**
 * Transforms aSelectorConfig into optimal-select options
 * @param {SelectorConfig} selectorConfig
 * @return {Object}
 */
export const configToOptions = selectorConfig => ({
  root: document,
  // define order of attribute processing
  priority: ['id', 'class'],
  // specify which attributes to ignore
  ignore: {
    id: ignoreIdFn.bind(this, selectorConfig),
    class: ignoreClassFn.bind(this, selectorConfig),
    tag: ignoreTagFn.bind(this, selectorConfig),
    attribute: ignoreAttributeFn.bind(this, selectorConfig),
  },
  exclude: {
    className: excludeClassFn.bind(this, selectorConfig),
  }
});

/**
 * Decides if ids should be used in selector generation
 * @param {SelectorConfig} selectorConfig
 * @param {string} attributeName this is not used by us in this case is always equal with 'id' string from "[id='idName']"
 * @param {string} attributeValue this is the idName
 * @return {boolean}
 */
function ignoreIdFn(selectorConfig, attributeName, attributeValue) {
  if (selectorConfig.isAllowIds()) {
    if (isSelectorRandomlyGenerated(attributeValue) && selectorConfig.isExcludingRandomSelectors()) {
      return true;
    }
    const forbiddenSubstrings = selectorConfig.getForbiddenIdSubstrings();

    for (let i = 0; i < forbiddenSubstrings.length; i++) {
      if (attributeValue.includes(forbiddenSubstrings[i])) {
        return true; // ignore id name with forbidden substring
      }
    }

    return false; // allow all ids that reached this point
  }

  return true; // ignore all ids
}

/**
 * Decides if classes should be used in selector generation
 * @param {SelectorConfig} selectorConfig
 * @param {string} attributeName this is not used by us in this case is always equal with 'class' string from "[class='className']"
 * @param {string} attributeValue this is the className
 * @return {boolean}
 */
function ignoreClassFn(selectorConfig, attributeName, attributeValue) {
  if (attributeValue && selectorConfig.isAllowClasses()) {
    return false; // allow all classes
  }

  return true; // ignore all classes
}

/**
 * Decides if tags should be used in selector generation
 * @param {SelectorConfig} selectorConfig
 * @param {string} nullParameter this is not used by us and it's null all the time here
 * @param {string} tagName
 * @return {boolean}
 */
function ignoreTagFn(selectorConfig, nullParameter, tagName) {
  if (selectorConfig.isAllowTags()) {
    return false; // allow all tags
  }

  return true; // ignore all tags
}

/**
 * Decides if attributes should be used in selector generation
 * @param {SelectorConfig} selectorConfig
 * @param {string} attributeName
 * @param {string} attributeValue
 * @param {Function} defaultPredicate
 * @return {boolean}
 */
function ignoreAttributeFn(
  selectorConfig,
  attributeName,
  attributeValue,
  defaultPredicate
) {
  if (selectorConfig.isAllowAttributes()) {
    if ((
        isSelectorRandomlyGenerated(attributeName) ||
        isSelectorRandomlyGenerated(attributeValue)
      ) &&
      selectorConfig.isExcludingRandomSelectors()
    ) {
      return true;
    }
    const forbiddenSubstrings = selectorConfig.getForbiddenAttributeSubstrings();

    for (let i = 0; i < forbiddenSubstrings.length; i++) {
      if (attributeName.includes(forbiddenSubstrings[i])) {
        return true;
      }
    }

    // allow default attributes
    return defaultPredicate(attributeName, attributeValue);
  }

  return true; // ignore all attributes
}

/**
 * Decides if a className should be excluded
 * @param {SelectorConfig} selectorConfig
 * @param {string} className
 *
 * @return {boolean}
 */
function excludeClassFn(selectorConfig, className) {
  if (className && className.length > 30) {
    return true; // ignore long classes
  }

  if (isSelectorRandomlyGenerated(className) && selectorConfig.isExcludingRandomSelectors()) {
    return true;
  }

  const forbiddenSubstrings = selectorConfig.getForbiddenClassSubstrings();

  for (let i = 0; i < forbiddenSubstrings.length; i++) {
    if (className.includes(forbiddenSubstrings[i])) {
      return true; // ignore class name with forbidden substring
    }
  }

  return false; // don't exclude classes who reached until here
}

export default {
  configToOptions
};
