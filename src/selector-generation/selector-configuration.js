import cloneDeep from 'lodash/cloneDeep'; //TODO maybe don't use

class SelectorConfig {
  constructor(name, config) {
    this.name = name || 'Unnamed Selector Configuration';
    this.defaultComposition = {
      classes: true,
      ids: true,
      tags: true,
      attributes: false,
      excludeRandomSelectors: true,
      exceptions: {}
    };

    if (!config) {
      this.useDefaultComposition();
    } else {
      this.composition = {
        classes: config.classes,
        ids: config.ids,
        tags: config.tags,
        attributes: config.attributes,
        excludeRandomSelectors: config.excludeRandomSelectors,
        exceptions: config.exceptions,
      };
    }
    this.validCompositionProperties = [
      'classes', 'attributes', 'ids', 'tags', 'excludeRandomSelectors', 'exceptions'
    ];
  }

  modifyComposition(compositionProperty, value) {
    if (!this.validCompositionProperties.includes(compositionProperty)) {
      return console.error('Invalid composition property:', compositionProperty);
    }
    // save current composition
    this.saveComposition();
    // change composition
    this.composition[compositionProperty] = value;
  }

  saveComposition() {
    this.savedComposition = cloneDeep(this.composition);
  }

  getComposition() {
    return this.composition;
  }

  getForbiddenClassSubstrings() {
    return this.composition.exceptions &&
      this.composition.exceptions.forbiddenClassSubstrings || [];
  }

  getForbiddenIdSubstrings() {
    return this.composition.exceptions &&
      this.composition.exceptions.forbiddenIdSubstrings || [];
  }

  getForbiddenAttributeSubstrings() {
    return this.composition.exceptions &&
      this.composition.exceptions.forbiddenAttributeSubstrings || [];
  }

  deleteForbiddenClassSubstring(substring) {
    let forbiddenClassSubstrings = this.getForbiddenClassSubstrings();
    let index = forbiddenClassSubstrings.indexOf(substring);

    if (index >= 0) {
      this.composition.exceptions.forbiddenClassSubstrings.splice(index, 1);
    }
  }

  deleteForbiddenIdSubstring(substring) {
    let forbiddenIdSubstrings = this.getForbiddenIdSubstrings();
    let index = forbiddenIdSubstrings.indexOf(substring);

    if (index >= 0) {
      this.composition.exceptions.forbiddenIdSubstrings.splice(index, 1);
    }
  }

  deleteForbiddenAttributeSubstring(substring) {
    let forbiddenAttributeSubstrings = this.getForbiddenAttributeSubstrings();
    let index = forbiddenAttributeSubstrings.indexOf(substring);

    if (index >= 0) {
      this.composition.exceptions.forbiddenAttributeSubstrings.splice(index, 1);
    }
  }

  insertForbiddenClassSubstring(substring) {
    let forbiddenClassSubstrings = this.getForbiddenClassSubstrings();

    forbiddenClassSubstrings.push(substring);
    this.composition.exceptions.forbiddenClassSubstrings =
      forbiddenClassSubstrings;
  }

  insertForbiddenIdSubstring(substring) {
    let forbiddenIdSubstrings = this.getForbiddenIdSubstrings();

    forbiddenIdSubstrings.push(substring);
    this.composition.exceptions.forbiddenIdSubstrings =
      forbiddenIdSubstrings;
  }

  insertForbiddenAttributeSubstring(substring) {
    let forbiddenAttributeSubstrings = this.getForbiddenAttributeSubstrings();

    forbiddenAttributeSubstrings.push(substring);
    this.composition.exceptions.forbiddenAttributeSubstrings =
      forbiddenAttributeSubstrings;
  }

  restoreSavedComposition() {
    this.composition = cloneDeep(this.savedComposition);
  }

  useDefaultComposition() {
    this.composition = cloneDeep(this.defaultComposition);
  }

  isAllowIds() {
    return this.composition.ids;
  }

  isAllowClasses() {
    return this.composition.classes;
  }

  isAllowAttributes() {
    return this.composition.attributes;
  }

  isAllowTags() {
    return this.composition.tags;
  }

  isExcludingRandomSelectors() {
    return this.composition.excludeRandomSelectors;
  }

  isCompositionValid() {
    let {ids, classes, tags, attributes} = this.composition;

    return ids || classes || tags || attributes;
  }

  clone() {
    return new SelectorConfig(this.name, cloneDeep(this.composition));
  }

  isIncludedInConfig(otherConfig) {
    const otherComposition = otherConfig.getComposition();

    return Object.keys(this.composition).every(property =>
      this.composition[property] ? otherComposition[property] : true
    );
  }
}

export default SelectorConfig;
