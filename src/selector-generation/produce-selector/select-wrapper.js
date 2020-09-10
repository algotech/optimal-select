import { getSingleSelector } from '../../select';

import SelectorConfiguration from '../selector-configuration';
import { configToOptions } from './options-converter'
import { shortenSelectorByShifting } from './post-generation-optimization';
import { addErrorMessage, ERRORS } from './exceptions-helper'

/*
  This is the fallback configuration of no configuration is supplied to
  produceSelector function.
 */
let defaultSelectorConfig = new SelectorConfiguration(
  'Default Selector Configuration'
);

/**
 * Creates a selector for the provided element with the specifiec config
 * @param {Element} element The element to create a selector for
 * @param {Object} [customPageDocument]
 * @param {SelectorConfig} [config]
 * @param {Function} [selectStrategy]
 * @return {Object}
 */
function select(
  element,
  customPageDocument,
  config,
  selectStrategy
) {
  config = config || defaultSelectorConfig;
  selectStrategy = selectStrategy || getSingleSelector;

  let selector = {
    $target: element,
    success: true,
    hasError: false,
    hasWarning: false,
    value: null,
    errors: [],
    warnings: [],
    config
  };
  let options = configToOptions(config);

  try {
    // use custom document root if specified
    if (customPageDocument) {
      options.root = customPageDocument;
    }

    // produce the selector
    let untestedSelector = selectStrategy(element, options);
    // test the selector
    let isValid = options.root.querySelector(untestedSelector) === element;

    if (isValid) {
      const shorterSelector = shortenSelectorByShifting(
        untestedSelector, options.root, element
      );

      selector.value = shorterSelector || untestedSelector;
    } else {
      addErrorMessage(selector, ERRORS.VALIDATION_FAILED, {
        invalidatedSelector: untestedSelector,
        configComposition: config.getComposition(),
        expectedElement: element,
        strategy: selectStrategy
      });
    }
  } catch (error) {
    addErrorMessage(selector, ERRORS.GENERATION_FAILED, {
      failedConfigComposition: config.getComposition(),
      error,
      strategy: selectStrategy
    });
  }

  if (!selector.value) {
    addErrorMessage(selector, ERRORS.VALUE_IS_MISSING, {
      foundValue: selector.value,
      strategy: selectStrategy
    });
  }

  selector.success = !selector.hasError;

  return selector;
}

export default select;
