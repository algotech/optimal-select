/**
 * # Match
 *
 * Retrieve selector for a node.
 */

import { escapeValue } from './utilities'

const defaultIgnore = {
  attribute (attributeName) {
    return [
      'style',
      'data-reactid',
      'data-react-checksum'
    ].indexOf(attributeName) > -1
  }
}

/**
 * Get the path of the element
 *
 * @param  {HTMLElement} node    - [description]
 * @param  {Object}      options - [description]
 * @return {string}              - [description]
 */
export default function match (node, options) {

  const {
    root = document,
    skip = null,
    priority = ['id', 'class', 'href', 'src'],
    ignore = {},
    exclude = {},
  } = options

  const path = []
  var element = node
  var length = path.length

  const skipCompare = skip && (Array.isArray(skip) ? skip : [skip]).map((entry) => {
    if (typeof entry !== 'function') {
      return (element) => element === entry
    }
    return entry
  })

  const skipChecks = (element) => {
    return skip && skipCompare.some((compare) => compare(element))
  }

  Object.keys(ignore).forEach((type) => {
    var predicate = ignore[type]
    if (typeof predicate === 'function') return
    if (typeof predicate === 'number') {
      predicate = predicate.toString()
    }
    if (typeof predicate === 'string') {
      predicate = new RegExp(escapeValue(predicate).replace(/\\/g, '\\\\'))
    }
    if (typeof predicate === 'boolean') {
      predicate = predicate ? /(?:)/ : /.^/
    }
    // check class-/attributename for regex
    ignore[type] = (name, value) => predicate.test(value)
  })

  var ignoreAttribute = ignore.attribute;
  ignore.attribute = function (name, value, defaultPredicate) {
    return ignoreAttribute && ignoreAttribute(name, value, defaultPredicate);
  };

  while (element !== root) {
    if (skipChecks(element) !== true) {
      // ~ global
      if (checkAttributes(priority, element, ignore, exclude, path, root)) break
      if (checkTag(element, ignore, path, root)) break

      // ~ local
      checkAttributes(priority, element, ignore, exclude, path)
      if (path.length === length) {
        checkTag(element, ignore, path)
      }

      // define only one part each iteration
      if (path.length === length) {
        checkChilds(priority, element, ignore, exclude, path)
      }
    }

    element = element.parentNode
    length = path.length
  }

  if (element === root) {
    const pattern = findPattern(priority, element, ignore, exclude)
    path.unshift(pattern)
  }

  return path.join(' ')
}

/**
 * Extend path with attribute identifier
 *
 * @param  {Array.<string>} priority - [description]
 * @param  {HTMLElement}    element  - [description]
 * @param  {Object}         ignore   - [description]
 * @param  {Object}         exclude  - Exclude functions for parts of attributes
 * @param  {Array.<string>} path     - [description]
 * @param  {HTMLElement}    parent   - [description]
 * @return {boolean}                 - [description]
 */
function checkAttributes (priority, element, ignore, exclude, path, parent = element.parentNode) {
  const pattern = findAttributesPattern(priority, element, ignore, exclude)
  if (pattern) {
    const matches = parent.querySelectorAll(pattern)
    if (matches.length === 1) {
      path.unshift(pattern)
      return true
    }
  }
  return false
}

/**
 * Lookup attribute identifier
 *
 * @param  {Array.<string>} priority - [description]
 * @param  {HTMLElement}    element  - [description]
 * @param  {Object}         ignore   - [description]
 * @param  {Object}         exclude  - Exclude functions for parts of attributes
 * @return {string?}                 - [description]
 */
function findAttributesPattern (priority, element, ignore, exclude) {
  const attributes = element.attributes
  const sortedKeys = Object.keys(attributes).sort((curr, next) => {
    const currPos = priority.indexOf(attributes[curr].name)
    const nextPos = priority.indexOf(attributes[next].name)

    if (nextPos === -1 && currPos === -1) {
      return 0;
    }

    if (nextPos === -1 && currPos !== -1) {
      return -1;
    }

    if (nextPos !== -1 && currPos === -1) {
      return 1;
    }

    return currPos - nextPos;
  })

  for (var i = 0, l = sortedKeys.length; i < l; i++) {
    const key = sortedKeys[i]
    const attribute = attributes[key]
    const attributeName = attribute.name
    const attributeValue = escapeValue(attribute.value)

    const currentIgnore = ignore[attributeName] || ignore.attribute
    const currentDefaultIgnore = defaultIgnore[attributeName] || defaultIgnore.attribute

    if (checkIgnore(currentIgnore, attributeName, attributeValue, currentDefaultIgnore)) {
      continue
    }

    var pattern = `[${attributeName}="${attributeValue}"]`

    // this if is commented because we have a better validation for this cases.
    // this should solve the optimisation/ignore issues for class names that were left as [class="all classes here"]
    // if ((/\b\d/).test(attributeValue) === false) {
    if (attributeName === 'id') {
      pattern = `#${attributeValue}`
    }

    if (attributeName === 'class') {
      let classNameAfterExclusion = excludeClassNameParts(attributeValue, exclude.className);
      classNameAfterExclusion = classNameAfterExclusion.trim().replace(/\s+/g, '.');
      pattern = classNameAfterExclusion.length ? `.${classNameAfterExclusion}` : null;
    }
    // }

    return pattern
  }

  return null
}
/**
* Takes parts that should be excluded out of the classname based on shouldExclude call result.
* A "part" is a substring of the class attribute value delimited by spaces.
*
* @param  {string}         className      A part of a class attribute value
* @param  {Function}       shouldExclude  Decides if name is accepted or not
* @return {string}                        className with unwanted parts(names) excluded
*/
function excludeClassNameParts(className, shouldExclude) {
  const classNames = className.split(' ');

  return classNames.filter(name => {
    if (!name.length) {
      return true;
    }

    return !shouldExclude(name);
  }).join(' ');
}

/**
 * Extend path with tag identifier
 *
 * @param  {HTMLElement}    element - [description]
 * @param  {Object}         ignore  - [description]
 * @param  {Array.<string>} path    - [description]
 * @param  {HTMLElement}    parent  - [description]
 * @return {boolean}                - [description]
 */
function checkTag (element, ignore, path, parent = element.parentNode) {
  const pattern = findTagPattern(element, ignore)
  if (pattern) {
    const matches = parent.getElementsByTagName(pattern)
    if (matches.length === 1) {
      path.unshift(pattern)
      return true
    }
  }
  return false
}

/**
 * Lookup tag identifier
 *
 * @param  {HTMLElement} element - [description]
 * @param  {Object}      ignore  - [description]
 * @return {boolean}             - [description]
 */
function findTagPattern (element, ignore) {
  const tagName = element.tagName.toLowerCase()
  if (checkIgnore(ignore.tag, null, tagName)) {
    return null
  }
  return tagName
}

/**
 * Extend path with specific child identifier
 *
 * NOTE: 'childTags' is a custom property to use as a view filter for tags using 'adapter.js'
 *
 * @param  {Array.<string>} priority - [description]
 * @param  {HTMLElement}    element  - [description]
 * @param  {Object}         ignore   - [description]
 * @param  {Array.<string>} path     - [description]
 * @return {boolean}                 - [description]
 */
function checkChilds (priority, element, ignore, exclude, path) {
  const parent = element.parentNode
  const children = parent.childTags || parent.children
  for (var i = 0, l = children.length; i < l; i++) {
    const child = children[i]
    if (child === element) {
      const childPattern = findPattern(priority, child, ignore, exclude)
      if (!childPattern) {
        return console.warn(`
          Element couldn\'t be matched through strict ignore pattern!
        `, child, ignore, childPattern)
      }
      const pattern = `> ${childPattern}:nth-child(${i+1})`
      path.unshift(pattern)
      return true
    }
  }
  return false
}

/**
 * Lookup identifier
 *
 * @param  {Array.<string>} priority - [description]
 * @param  {HTMLElement}    element  - [description]
 * @param  {Object}         ignore   - [description]
 * @return {string}                  - [description]
 */
function findPattern (priority, element, ignore, exclude) {
  var pattern = findAttributesPattern(priority, element, ignore, exclude)
  if (!pattern) {
    pattern = findTagPattern(element, ignore)
  }
  return pattern
}

/**
 * Validate with custom and default functions
 *
 * @param  {Function} predicate        - [description]
 * @param  {string?}  name             - [description]
 * @param  {string}   value            - [description]
 * @param  {Function} defaultPredicate - [description]
 * @return {boolean}                   - [description]
 */
function checkIgnore (predicate, name, value, defaultPredicate) {
  if (!value) {
    return true
  }
  const check = predicate || defaultPredicate
  if (!check) {
    return false
  }
  return check(name, value, defaultPredicate)
}
