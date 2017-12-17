'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DuplicateKeyError = exports.DuplicateKeyError = function (_Error) {
    _inherits(DuplicateKeyError, _Error);

    function DuplicateKeyError() {
        var _ref;

        _classCallCheck(this, DuplicateKeyError);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_ref = DuplicateKeyError.__proto__ || Object.getPrototypeOf(DuplicateKeyError)).call.apply(_ref, [this].concat(args)));

        _this.name = 'DuplicateKeyError';
        Error.captureStackTrace(_this, DuplicateKeyError);
        return _this;
    }

    return DuplicateKeyError;
}(Error);