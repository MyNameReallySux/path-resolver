'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.PathResolver = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _ConsoleUtils = require('./lib/ConsoleUtils');

var _stringUtils = require('@beautiful-code/string-utils');

var _typeUtils = require('@beautiful-code/type-utils');

var _errors = require('./errors');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PathResolver = exports.PathResolver = function () {

	// Class Initialization

	function PathResolver() {
		_classCallCheck(this, PathResolver);

		_initialiseProps.call(this);

		var _handleArgs = this._handleArgs.apply(this, arguments),
		    rootPath = _handleArgs.rootPath,
		    paths = _handleArgs.paths,
		    options = _handleArgs.options;

		this.options = options;

		this.init({ rootPath: rootPath, paths: paths });
	}

	// Public Methods

	// Private Methods

	_createClass(PathResolver, [{
		key: '_resolverHasPropertyEmpty',
		value: function _resolverHasPropertyEmpty(obj, key, onSuccess, onError) {
			var contains = obj.hasOwnProperty(key);
			try {
				if (contains) {
					throw new _errors.DuplicateKeyError('The given object has duplicate keys \'' + key + '\'. Make sure all directories have unique key, or use scopes / aliases\'');
				} else {
					return (0, _typeUtils.isFunction)(onSuccess) ? onSuccess(false) : undefined;
				}
			} catch (e) {
				(0, _typeUtils.isFunction)(onError) ? onError(true, e) : (0, _ConsoleUtils.error)(e);
				return false;
			}
			return contains;
		}
	}, {
		key: '_validateOptions',
		value: function _validateOptions(options) {
			var namespace = options.namespace,
			    fileroot = options.fileroot;

			namespace = (0, _typeUtils.isString)(namespace) && namespace.trim().length > 0 ? namespace : undefined;
			fileroot = (0, _typeUtils.isString)(fileroot) && fileroot.trim().length > 0 ? fileroot : undefined;

			return _extends({
				namespace: namespace,
				fileroot: fileroot
			}, options);
		}
	}]);

	return PathResolver;
}();

PathResolver.defaultConfig = {
	rootPath: _fs2.default.realpathSync(process.cwd()),
	paths: {},
	options: {
		namespace: 'paths',
		fileroot: 'files',
		rootPath: undefined,
		resolverPrefix: 'resolve'
	} };

var _initialiseProps = function _initialiseProps() {
	var _this = this;

	this.init = function (_ref) {
		var rootPath = _ref.rootPath,
		    paths = _ref.paths;
		var _options = _this.options,
		    namespace = _options.namespace,
		    fileroot = _options.fileroot;

		var directoryResolver = void 0;

		if (namespace) {
			_this[namespace] = {};
			_this[namespace]['aliases'] = {};
			directoryResolver = _this[namespace];
		} else {
			directoryResolver = _this;
		}

		directoryResolver['aliases'] = {};
		var aliasResolver = directoryResolver['aliases'];

		var resolveAliases = function resolveAliases(_ref2) {
			var localPaths = _ref2.localPaths,
			    parentPath = _ref2.parentPath,
			    scope = _ref2.scope,
			    _ref2$index = _ref2.index,
			    index = _ref2$index === undefined ? 0 : _ref2$index;


			var localAliasResolver = Object.entries(localPaths).reduce(function (resolver, _ref3) {
				var _ref4 = _slicedToArray(_ref3, 2),
				    key = _ref4[0],
				    value = _ref4[1];

				if (_this.hasAlias(value)) {
					var aliasScope = _this.getLocalScope(value, scope);
					var aliasResolverKey = _this.getDirectoryResolverKey(aliasScope);
					var resolverPath = _path2.default.resolve(rootPath, key);
					var resolverFunction = _this._addPathToResolver(directoryResolver, aliasResolverKey, resolverPath);
				}

				var nextScope = _this.getNextScope(key, scope);
				var nextParent = _this.getNextParentPath(key, parentPath);

				resolveAliases({
					localPaths: value,
					parentPath: nextParent,
					scope: nextScope,
					index: ++index });
			});
		};

		var resolveLevel = function resolveLevel(_ref5) {
			var localPaths = _ref5.localPaths,
			    parentPath = _ref5.parentPath,
			    scope = _ref5.scope,
			    _ref5$index = _ref5.index,
			    index = _ref5$index === undefined ? 0 : _ref5$index;


			var localResolver = Object.entries(localPaths).reduce(function (resolver, _ref6) {
				var _ref7 = _slicedToArray(_ref6, 2),
				    key = _ref7[0],
				    value = _ref7[1];

				if ((0, _typeUtils.isString)(value) && _this.isFileURI(value)) {
					var fullpath = _this._formatFullPath(value, parentPath, rootPath);
					resolver[key] = fullpath;
				} else if ((0, _typeUtils.isObject)(value)) {
					var localRootPath = parentPath ? parentPath + '/' + key : key;
					var localScope = scope;
					var resolverKey = _this.getDirectoryResolverKey(key, localScope);

					var resolverPath = _path2.default.resolve(rootPath, key);
					var resolverFunction = _this._addPathToResolver(directoryResolver, resolverKey, resolverPath);

					var nextScope = _this.getNextScope(key, scope);
					var nextParent = _this.getNextParentPath(key, parentPath);

					resolver[key] = resolveLevel({
						localPaths: value,
						parentPath: nextParent,
						scope: nextScope,
						index: ++index });
					resolver[key]['_root'] = _path2.default.resolve(rootPath, localRootPath);
				}

				return resolver;
			}, {});

			return localResolver;
		};

		var resolveLevelOld = function resolveLevelOld(localPaths, parentPath, scope) {
			var index = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

			var localResolver = Object.entries(localPaths).reduce(function (resolver, _ref8) {
				var _ref9 = _slicedToArray(_ref8, 2),
				    key = _ref9[0],
				    value = _ref9[1];

				if ((0, _typeUtils.isString)(value)) {
					if (_this.isFileURI(value)) {
						var fullpath = _this._formatFullPath(value, parentPath, rootPath);
						resolver[key] = fullpath;
					}
				} else if ((0, _typeUtils.isObject)(value)) {
					var localRootPath = parentPath ? parentPath + '/' + key : key;
					var resolverKey = void 0,
					    localScope = void 0;

					if (_this.hasAlias(value)) {
						localScope = _this.getLocalScope(value, scope);
						resolverKey = _this.getDirectoryResolverKey(localScope);
					} else if (_this.hasLocalAlias(value)) {
						localScope = _this.getLocalScope(value, scope);
						resolverKey = _this.getDirectoryResolverKey(localScope, scope);
					} else {
						localScope = scope;
						resolverKey = _this.getDirectoryResolverKey(key, localScope);
					}
					var resolverPath = _path2.default.resolve(rootPath, key);
					var resolverFunction = _this._addPathToResolver(directoryResolver, resolverKey, resolverPath);

					var nextScope = _this.getNextScope(value, key, scope);
					var nextParent = _this.getNextParentPath(key, parentPath);

					resolver[key] = resolveLevel(value, nextParent, nextScope, ++index);
					resolver[key]['_root'] = _path2.default.resolve(rootPath, localRootPath);
				}
				return resolver;
			}, {});
			return localResolver;
		};

		var files = resolveLevel({ localPaths: paths });
		resolveAliases({ localPaths: paths });
		_this[fileroot] = files;
		_this[fileroot]['_root'] = rootPath;
	};

	this.getDirectoryResolverKey = function (key, scope) {
		var result = void 0;
		if (scope && key) {
			var keyToResolve = scope + '-' + key;
			result = _this._formatResolverKey(keyToResolve);
		} else if (key) {
			result = _this._formatResolverKey(key);
		}
		return result;
	};

	this.getLocalScope = function (object, scope) {
		if (object.hasOwnProperty('_')) {
			return _this.hasAlias(object) ? object._.slice(1) : object._;
		} else {
			return scope;
		}
	};

	this.getNextParentPath = function (key, parentPath) {
		return parentPath ? parentPath + '/' + key : key;
	};

	this.getNextScope = function (key, scope) {
		return scope ? scope + '-' + key : key;
	};

	this.getNextScopeOld = function (object, key, scope) {
		if (_this.hasAlias(object)) {
			return object._.slice(1);
		} else if (scope && _this.hasLocalAlias(object)) {
			return scope + '-' + object._;
		} else if (scope && !object._) {
			return scope + '-' + key;
		} else if (!scope && object._) {
			return object._;
		} else {
			return key;
		}
	};

	this.hasAlias = function (object) {
		return object.hasOwnProperty('_') && object._.indexOf('@') == 0;
	};

	this.hasLocalAlias = function (object) {
		return object.hasOwnProperty('_');
	};

	this.haveDuplicateKeys = function (object, other) {
		var result = false;
		Object.keys(object).map(function (key) {
			if (other.hasOwnProperty(key)) {
				result = true;
				return false;
			}
		});
		return result;
	};

	this.isFileURI = function (uri) {
		return uri.split('/').pop().indexOf('.') > -1;
	};

	this.isDirectoryURI = function (uri) {
		return _path2.default.split('/').pop().indexOf('.') == -1;
	};

	this.makeRelativeResolver = function (rootPath) {
		return function () {
			var relativePath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
			return _path2.default.resolve(rootPath, relativePath);
		};
	};

	this.resetScope = function (parentPath) {
		return (0, _stringUtils.toSnakeCase)(parentPath.replace(/\\\//));
	};

	this._addPathToResolver = function (resolver, resolverKey, resolverPath) {
		_this._resolverHasPropertyEmpty(resolver, resolverKey, function () {
			resolver[resolverKey] = _this.makeRelativeResolver(resolverPath);
		});
	};

	this._addAliasToResolver = function (key, relativeResolver) {
		return _this._resolverHasPropertyEmpty(aliasResolver, key, function () {
			return aliasResolver[key] = relativeResolver();
		});
	};

	this._formatFullPath = function (filename, parentPath, rootPath) {
		return parentPath && rootPath ? _path2.default.resolve(rootPath, parentPath, filename) : parentPath || rootPath ? _path2.default.resolve(parentPath || rootPath, filename) : filename;
	};

	this._formatResolverKey = function (key) {
		return (0, _stringUtils.toCamelCase)(_this.options.resolverPrefix + '-' + (0, _stringUtils.toSnakeCase)(key));
	};

	this._handleArgs = function () {
		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		var rootPath = void 0,
		    paths = void 0,
		    options = void 0;

		switch (args.length) {
			case 0:
				{
					(0, _ConsoleUtils.warn)('A \'PathResolver\' object was passed no initial arguments. Initialization must be done manually.');
				}break;
			case 1:
				{
					if ((0, _typeUtils.isObject)(args[0])) {
						paths = args[0];

						options = {};
					}
				}break;
			case 2:
				{
					if ((0, _typeUtils.isObject)(args[0]) && (0, _typeUtils.isObject)(args[1])) {
						var _args$ = _slicedToArray(args[0], 2);

						paths = _args$[0];
						options = _args$[1];
					}
					if ((0, _typeUtils.isString)(args[0]) && (0, _typeUtils.isObject)(args[1])) {
						rootPath = args[0];
						paths = args[1];
					}
				}break;
			case 3:
				{
					rootPath = args[0];
					paths = args[1];
					options = args[2];
				}break;
			default:
				{
					throw new _errors.InvalidArgumentsError('PathResolver accepts between 1-3 arguments, \'' + args.length + '\' found.');
				}
		}

		if (!rootPath && options && options.rootPath) {
			rootPath = options.rootPath;
		}

		var config = {
			rootPath: rootPath || PathResolver.defaultConfig.rootPath,
			paths: paths || PathResolver.defaultConfig.paths,
			options: Object.assign({}, PathResolver.defaultConfig.options, options)
		};

		options = _this._validateOptions(config.options);
		return config;
	};
};