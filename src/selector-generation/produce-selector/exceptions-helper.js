export const ERRORS = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  GENERATION_FAILED: 'GENERATION_FAILED',
  DEFAULT_GENERATION_FAILED: 'DEFAULT_GENERATION_FAILED',
  VALUE_IS_MISSING: 'VALUE_IS_MISSING'
};

export const WARNINGS = {
  FELL_TO_DEFAULT_CONFIG: 'FELL_TO_DEFAULT_CONFIG',
  FELL_TO_DEFAULT_STRATEGY: 'FELL_TO_DEFAULT_STRATEGY'
};

const errorConfigs = {
  [ERRORS.VALIDATION_FAILED]: {
    type: ERRORS.VALIDATION_FAILED,
    message: `Selector didn't pass the validation test.`
  },
  [ERRORS.GENERATION_FAILED]: {
    type: ERRORS.GENERATION_FAILED,
    message: `Selector couldn't be generated using the specified config.`
  },
  [ERRORS.DEFAULT_GENERATION_FAILED]: {
    type: ERRORS.DEFAULT_GENERATION_FAILED,
    message: `Selector couldn't be generated using the default/safest config.`
  },
  [ERRORS.VALUE_IS_MISSING]: {
    type: ERRORS.VALUE_IS_MISSING,
    message: `Selector value is missing.`
  }
};

const warningConfigs = {
  [WARNINGS.FELL_TO_DEFAULT_CONFIG]: {
    type: WARNINGS.FELL_TO_DEFAULT_CONFIG,
    message: 'Could not generate selector using the specified config. ' +
      'Using the default config instead.'
  },
  [WARNINGS.FELL_TO_DEFAULT_STRATEGY]: {
    type: WARNINGS.FELL_TO_DEFAULT_STRATEGY,
    message: 'Could not generate selector using the specified strategy. ' +
      'Using the default strategy instead.'
  }
}

export const addErrorMessage = function(selectorObj, errorType, context) {
  let errorConfig = errorConfigs[errorType];

  selectorObj.errors.push(
    Object.assign({}, errorConfig, {context})
  );
  selectorObj.hasError = true;
}

export const addWarningMessage = function(selectorObj, warningType, context) {
  let warningConfig = warningConfigs[warningType];

  selectorObj.warnings.push(
    Object.assign({}, warningConfig, context)
  );
  selectorObj.hasWarning = true;
}

export default {
  addErrorMessage
};
