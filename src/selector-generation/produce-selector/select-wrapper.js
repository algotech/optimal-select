import $ from 'jquery'
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
 * @param {JQuery} $element The element to create a selector for or {Element} if isCalledByRunner
 * @param {Object} [customPageDocument]
 * @param {SelectorConfig} [config]
 * @param {Function} [selectStrategy]
 * @param {Boolean} [isCalledByRunner]
 * @return {Object}
 */
function select(
  $element,
  customPageDocument,
  config,
  selectStrategy,
  isCalledByRunner
) {
  config = config || defaultSelectorConfig;
  selectStrategy = selectStrategy || getSingleSelector;

  let selector = {
    $target: $element,
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
    let untestedSelector = isCalledByRunner ?
      selectStrategy($element, options) :
      selectStrategy($element[0], options);
    // test the selector
    let isValid = isCalledByRunner ?
      options.root.querySelector(untestedSelector) === $element :
      $(options.root).find(untestedSelector).is($element);

    if (isValid) {
      const shorterSelector = shortenSelectorByShifting(
        untestedSelector, options.root, $element, isCalledByRunner
      );

      selector.value = shorterSelector || untestedSelector;
    } else {
      addErrorMessage(selector, ERRORS.VALIDATION_FAILED, {
        invalidatedSelector: untestedSelector,
        configComposition: config.getComposition(),
        expectedElement: $element[0] || $element,
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
