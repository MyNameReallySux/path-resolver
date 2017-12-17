'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.restoreConsole = exports.supressConsole = exports.error = exports.warn = exports.debug = exports.info = exports.print = exports.ConsoleUtils = undefined;

var _safe = require('colors/safe');

var _safe2 = _interopRequireDefault(_safe);

var _typeUtils = require('@beautiful-code/type-utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LEVEL_MASKS = {
    info: 0x1,
    debug: 0x2,
    warn: 0x4,
    error: 0x8
};

_safe2.default.setTheme({
    info: 'cyan',
    debug: 'green',
    error: 'red',
    warn: 'yellow'
});

var ConsoleUtils = exports.ConsoleUtils = function ConsoleUtils() {
    _classCallCheck(this, ConsoleUtils);
};

ConsoleUtils.CONSOLE_LOG = console.log;
ConsoleUtils.CONSOLE_WARN = console.warn;
ConsoleUtils.CONSOLE_ERROR = console.error;
ConsoleUtils.LEVELS = {
    none: 0,
    minimal: LEVEL_MASKS.info,
    verbose: LEVEL_MASKS.info && LEVEL_MASKS.warn && LEVEL_MASKS.error,
    all: LEVEL_MASKS.info && LEVEL_MASKS.debug && LEVEL_MASKS.warn && LEVEL_MASKS.error,

    debug: LEVEL_MASKS.info && LEVEL_MASKS.debug,
    debug_only: LEVEL_MASKS.debug,
    debug_warn: LEVEL_MASKS.debug && LEVEL_MASKS.warn,
    debug_error: LEVEL_MASKS.debug && LEVEL_MASKS.warn && LEVEL_MASKS.error,

    warn_only: LEVEL_MASKS.warn,
    error_only: LEVEL_MASKS.error,
    all_errors: LEVEL_MASKS.warn && LEVEL_MASKS.error

};
ConsoleUtils.level = ConsoleUtils.LEVELS.all;
ConsoleUtils.print = console.log;

ConsoleUtils.info = function () {
    console.info(_safe2.default.info.apply(_safe2.default, arguments));
};

ConsoleUtils.warn = function () {
    console.warn(_safe2.default.warn.apply(_safe2.default, arguments));
};

ConsoleUtils.error = function () {
    console.error(_safe2.default.error.apply(_safe2.default, arguments));
};

ConsoleUtils.debug = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
    }

    if (ConsoleUtils.level && LEVEL_MASKS.debug === LEVEL_MASKS.debug) {
        var _console;

        args.map(function (arg, i) {
            var result = (0, _typeUtils.isObject)(arg) ? '\n' + JSON.stringify(arg, null, 4) : arg;

            args[i] = result;
        });
        return (_console = console).log.apply(_console, args);
    } else {
        return function () {};
    }
};

ConsoleUtils.supressConsole = function () {
    console.log = function () {};
    console.warn = function () {};
    console.error = function () {};
};

ConsoleUtils.restoreConsole = function () {
    console.log = ConsoleUtils.CONSOLE_LOG;
    console.warn = ConsoleUtils.CONSOLE_WARN;
    console.error = ConsoleUtils.CONSOLE_ERROR;
};

var print = ConsoleUtils.print;
var info = ConsoleUtils.info;
var debug = ConsoleUtils.debug;
var warn = ConsoleUtils.warn;
var error = ConsoleUtils.error;

var supressConsole = ConsoleUtils.supressConsole;
var restoreConsole = ConsoleUtils.restoreConsole;

exports.print = print;
exports.info = info;
exports.debug = debug;
exports.warn = warn;
exports.error = error;
exports.supressConsole = supressConsole;
exports.restoreConsole = restoreConsole;