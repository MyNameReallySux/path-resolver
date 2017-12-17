'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.makeDescribeFunc = exports.makeDescribeClass = exports.runTest = exports.TestUtils = undefined;

var _safe = require('colors/safe');

var _safe2 = _interopRequireDefault(_safe);

var _typeUtils = require('@beautiful-code/type-utils');

var _ConsoleUtils = require('./ConsoleUtils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

_safe2.default.setTheme({
    className: ['green'],
    functionName: 'cyan',
    description: 'white'
});

var TestUtils = exports.TestUtils = function TestUtils() {
    _classCallCheck(this, TestUtils);
};

TestUtils.runTest = function (testSuite, testFunction) {
    var onResult = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};
    var onError = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function () {};
    var test = testSuite.test,
        expected = testSuite.expected;

    var result = void 0;

    (0, _ConsoleUtils.supressConsole)();
    try {
        result = (0, _typeUtils.isFunction)(testFunction) ? testFunction(test, function (result) {
            onResult(result, expected);
        }, function (result) {
            onError(result, expected);
        }) : undefined;
        if (result) {
            onResult(result, expected);
            return { result: result, expected: expected };
        }
    } catch (e) {
        (0, _ConsoleUtils.restoreConsole)();
        onError({ error: e }, expected);
        throw e;
    } finally {
        (0, _ConsoleUtils.restoreConsole)();
    }
};

TestUtils.describeWithColor = function (describe) {
    var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _safe2.default.description;
    var prefix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

    if (!describe) throw new TypeError('Must pass in mocha\'s \'describe\' function');
    return function (description, callback) {
        describe(color(description), callback);
    };
};

TestUtils.makeDescribeClass = function (describe) {
    var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _safe2.default.className;
    var prefix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

    return TestUtils.describeWithColor(describe, color);
};

TestUtils.makeDescribeFunc = function (describe) {
    var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _safe2.default.functionName;
    var prefix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

    return TestUtils.describeWithColor(describe, color);
};

var runTest = TestUtils.runTest;
var makeDescribeClass = TestUtils.makeDescribeClass;
var makeDescribeFunc = TestUtils.makeDescribeFunc;

exports.runTest = runTest;
exports.makeDescribeClass = makeDescribeClass;
exports.makeDescribeFunc = makeDescribeFunc;