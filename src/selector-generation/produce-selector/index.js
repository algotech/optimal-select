import getQuerySelector, { getSingleSelector } from '../../select';

import SelectorConfig from '../selector-configuration';
import select from './select-wrapper';
import { addWarningMessage, WARNINGS } from './exceptions-helper';

const defaultSelectorConfig = new SelectorConfig(
  'Default Selector Configuration'
);

/**
 * Produces the selector and uses fallbacks in case the current config
 * is too restrictive for the current element
 * @param {Element} element
 * @param {Object} customPageDocument
 * @param {SelectorConfig} config
 * @return {Object}
 */
function produceSelectorFn(element, customPageDocument, config) {
  // try with the specified config and default strategy
  let sel1 = select(element, customPageDocument, config, getQuerySelector);

  if (!sel1.hasError) {
    return sel1;
  }

  // try with the fallback config and default strategy
  let sel2 = select(element, customPageDocument, null, getQuerySelector);

  if (!defaultSelectorConfig.isIncludedInConfig(config)) {
    addWarningMessage(sel2, WARNINGS.FELL_TO_DEFAULT_CONFIG);
  }

  if (!sel2.hasError) {
    return sel2;
  }

  // try with the specified config and the fallback strategy
  let sel3 = select(element, customPageDocument, config, getSingleSelector);

  addWarningMessage(sel3, WARNINGS.FELL_TO_DEFAULT_STRATEGY);

  if (!sel3.hasError) {
    return sel3;
  }

  // try with the fallback config and the fallback strategy
  let sel4 = select(element, customPageDocument, null, getSingleSelector);

  if (!defaultSelectorConfig.isIncludedInConfig(config)) {
    addWarningMessage(sel4, WARNINGS.FELL_TO_DEFAULT_CONFIG);
  }
  addWarningMessage(sel4, WARNINGS.FELL_TO_DEFAULT_STRATEGY);

  if (!sel4.hasError) {
    return sel4;
  }

  // try with tags only config and defaultStrategy
  let tagsOnlyComposition = {
    classes: false,
    ids: false,
    tags: true,
    attributes: false,
    exceptions: Object.assign(
      {},
      { forbiddenClassSubstrings: config.getForbiddenClassSubstrings() },
      { forbiddenIdSubstrings: config.getForbiddenIdSubstrings() },
      { forbiddenAttributeSubstrings: config.getForbiddenAttributeSubstrings() }
    )
  };
  let configTagsOnly = new SelectorConfig(config.name, tagsOnlyComposition);
  let sel5 =
    select(element, customPageDocument, configTagsOnly, getQuerySelector);

  if (!configTagsOnly.isIncludedInConfig(config)) {
    addWarningMessage(sel5, WARNINGS.FELL_TO_DEFAULT_CONFIG);
  }

  if (!sel5.hasError) {
    return sel5;
  }

  logAllInvalidSelectorsError(sel1, sel2, sel3, sel4, sel5);

  return null;
}

function logAllInvalidSelectorsError(sel1, sel2, sel3, sel4, sel5) {
  console.error('[optimal-select-log] All produce selector attempts failed. The selectors are:');
  console.error('[optimal-select-log] userConfig + defaultStrategy', sel1);
  console.error('[optimal-select-log] fallbackConfig + defaultStrategy', sel2);
  console.error('[optimal-select-log] userConfig + fallbackStrategy', sel3);
  console.error('[optimal-select-log] fallbackConfig + fallbackStrategy', sel4);
  console.error('[optimal-select-log] tagsOnlyComposition + defaultStrategy', sel5);
}

function produceSelectorFnWrapper(element, customPageDocument, config) {
  let selector = produceSelectorFn(element, customPageDocument, config);

  if (selector == null) {
    return console.error('[optimal-select-log] Selector is null!');
  }
  if (selector.hasError) {
    console.error('[optimal-select-log] Selector with errors: ', selector.errors);
  }
  if (selector.hasWarning) {
    console.warn('[optimal-select-log] Selector with warnings: ', selector.warnings);
  }

  return selector;
}

/**
* Produces a selector without needing jquery element as param or
* an instance of SelectorConfig(useful for algotech-testing-runner)
*
* @param {HTMLElement}      element
* @param {Object}           config
* @return {Object}                  The generated selector string can be found by the .value
*                                   attribute of this result object.
*/
export function getSelector(element, config) {
  const selectorConfig = new SelectorConfig('Global Selector Config', config);

  return produceSelectorFnWrapper(element, window.document, selectorConfig);
}

export const produceSelector = produceSelectorFnWrapper;

export default {
  produceSelector: produceSelectorFnWrapper
};
