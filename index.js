'use strict'

var loaderUtils = require('loader-utils')

var NAME = 'Regex Replace Loader'

/**
 * @typedef {Object} LoaderOptions
 * @property {string|RegExp} regex
 * @property {string} [flags]
 * @property {string|((match: RegExpExecArray) => string)} value
 * @property {LoaderOptions[]} [stages]
 */

/**
 * The Regex Replace Loader.
 *
 * Replace values from the source via a regular expression.
 *
 * @param {string} source
 * @returns {string}
 */
function regexReplaceLoader(source) {
    var options = getOptions(this)

    var stages = Array.isArray(options.stages) ?
        options.stages : [options]

    stages.forEach(function (stage) {
        if (stage.enable) {
            var regex = getRegex(stage.regex, stage.flags)
            source = replace(regex, source, stage)
        }
    })

    return source
}

/**
 * Return the options object.
 *
 * @param {LoaderContext} context
 * @returns {LoaderOptions}
 */
function getOptions(context) {
    return loaderUtils.getOptions(context)
}

/**
 * Return the type of an object as a string.
 *
 * @param {any} object
 * @returns {string}
 */
function typeOf(object) {
    return Object.prototype.toString.call(object).slice(8, -1)
}

/**
 * Transform regex into a RegExp if it isn't one already.
 *
 * @param {any} regex
 * @param {string} flags
 * @returns {RegExp}
 */
function getRegex(regex, flags) {
    if (typeOf(regex) === 'String') {
        return regex
    } else if (typeOf(regex) === 'RegExp') {
        return new RegExp(regex, flags)
    } else {
        throw new Error(
            NAME + ': option "regex" must be a string or a RegExp object')
    }
}

/**
 * If 'value' is a function, return a match function;
 * otherwise return the original value.
 *
 * @param {any} value
 * @returns {any}
 */
function getValueOrMatchFn(value) {
    if (typeof value === 'function') {
        return getMatchFn(value)
    } else if (typeof value === 'string') {
        return value
    } else {
        throw new Error(
            NAME + ': option "value" must be a string or a function')
    }
}

/**
 * Return a function for use with string.replace that converts that
 * function's arguments into a RegExpMatchArray and calls the
 * value function.
 *
 * @param {(match: RegExpMatchArray) => string} valueFn
 * @returns {(m: string, ...args: string[], i: number, s: string) => string}
 */
function getMatchFn(valueFn) {
    return function () {
        var len = arguments.length
        // Create a RegExp match object.
        var match = Array.prototype.slice.call(arguments, 0, -2)
            .reduce(function (map, g, i) {
                map[i] = g
                return map
            }, {
                index: arguments[len - 2],
                input: arguments[len - 1]
            })
        // Call the original function.
        return valueFn(match)
    }
}

/**
 * Execute a replace operation and return the modified source.
 *
 * @param {RegExp} regex
 * @param {string} source
 * @param {LoaderOptions} options
 * @returns {string}
 */
function replace(regex, source, options) {
    var valueOrFn = getValueOrMatchFn(options.value)
    return source.replace(regex, valueOrFn)
}

module.exports = regexReplaceLoader