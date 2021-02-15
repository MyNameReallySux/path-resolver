'use strict'
import fs from 'fs'
import path from 'path'

import { print, debug, warn, error } from './lib/ConsoleUtils'
import { toCamelCase, toSnakeCase, toKebabCase } from '@beautiful-code/string-utils'
import { isBoolean, isFunction, isObject, isString } from '@beautiful-code/type-utils'

import { DuplicateKeyError, InvalidArgumentsError } from './errors'

/*
 * TODO: Export these functions to external modules.
 */
const Externals = {
	filterObject: (object) => {
		const result = {}
		Object.keys(object)
			.filter((key) => object[key] !== undefined)
			.forEach((key) => result[key] = object[key])
		return result
	},

	hasDuplicateKeys: (object, other) => {
		let result = false     
		Object.keys(object).map((key) => {
			if(other.hasOwnProperty(key)){
				result = true
				return false
			}
		})
		return result
	},

	hasKeyAvailable: (obj, key, onSuccess, onError) => {
		let contains = obj.hasOwnProperty(key)
		try {
			if(contains){
				throw new DuplicateKeyError(`The given object has duplicate keys '${key}'. Make sure all directories have unique key, or use scopes / aliases'`)
			} else {
				isFunction(onSuccess) ? onSuccess(true) : undefined
				return true
			} 
		} catch (e){
			isFunction(onError) ? onError(false, e) : undefined
			return false
		}
		return false
	},

	isFileURI: (uri) => {
		return uri.split('/').pop().indexOf('.') > -1
	},

	isDirectoryURI: (uri) => {
		return path.split('/').pop().indexOf('.') == -1
	}
}

let { filterObject, hasDuplicateKeys, hasKeyAvailable, isDirectoryURI, isFileURI } = Externals

/** 
 * Class that creates a suite of methods cna collections useful for resolving paths within a project. Includes a directory
 * resolver, which creates relative path resolvers for each directory in a given directory map. Support for resolver 
 * renaming and alias generation, which formats the resolver name to reflect the alias as the root rather than the full path.
 * Aliases are suitable for use in webpack and similar libraries.
 * 
 * @author Chris Coppola <mynamereallysux@gmail.com>
 */
class PathResolver {
	/**
	 * @property {String} aliasRoot Namespace, or property name, that should contain the alias map.
	 * @property {Number} depth How many directory levels should be processed. Set to -1 for inifinite depth.
	 * @property {Boolean} duplicateAliases Should both the alias and non alias resolvers be used when an alias is present.
	 * @property {String} namespace Namespace, or property name, that should contain the directory resolver.
	 * @property {Object} paths Object mapping projects directory structure.
	 * @property {String} resolverPrefix Unvalidated options object.
	 * @property {String} rootPath Root path all resolver keys and aliases will be relative to.
	 * 
	 * @static
	 * @const
	 * @memberof PathResolver
	 */
	static defaultOptions = {
		aliasRoot: 'aliases',
		depth: -1,
		duplicateAliases: false,
		fileRoot: 'files',
		namespace: 'paths',
		paths: {},
		resolverPrefix: 'resolve',
		rootPath: fs.realpathSync(process.cwd()),
	}
	
	/**
	 * Each directory can contain a config option. These options are defined by an '_' property within the directory map.
	 * 
	 * @example
	 * let map = new PathResolver({
	 *     _: { alias: '@root' }            // resolveRoot() -> path/to/project
	 *     src: { _: { name: source } },    // resolveSource() -> path/to/project/src
	 *     dist: {  _: { ignore: true },    // this route is ignored, children still render
	 *         css: {}                      // resolveDistCss() -> path/to/project/src/css
	 *     },
	 *     libs: {  _: { ignoreBranch: true } // *this and child routes ignored
	 *         ...
	 *     }
	 * })
	 * 
	 * @property {String} name Rename current directory's resolver function, affecting children as well.
	 * @property {String} alias Rename current directory's resolver function and set as the root scope, affecting children as well.
	 * @property {Boolean} ignore Does not export the current directory as a resolver or as an alias.
	 * @property {Boolean} duplicateAliases Does not export the current directory or it's children as a resolver or alias.
	 * 
	 * @static
	 * @const
	 * @memberof PathResolver
	 */
	static defaultConfig = {
		name: undefined,
		alias: undefined,
		ignore: false,
		ignoreBranch: false
	}

	// Class Initialization

	/** 
	 * Creates an instance of PathResolver. Passes arguments to {@link PathResolver#initialize} to be processed.
	 * 
	 * @param {!String|!Object} rootPath|paths Projects root path or Object mapping projects directory structure.
	 * @param {?Object} paths|options Object mapping projects directory structure or options object.
	 * @param {?Object} options Options object.
	 * 
	 * @see {@link PathResolver#initialize}
	 */
	constructor(...args){
		this.initialize(...args)
	}

	getDirectoryResolver = () => {
		let { namespace } = this.options
		return this[namespace]
	}

	getAliasMap = () => {
		let { aliasRoot } = this.options
		return this[aliasRoot]
	}

	/** 
	 * Configures an instance of path resolver. Can be used after a {@link PathResolver} instance is
	 * created to defer the configuration. Passes arguments to the {@link PathResolver#initialize} function to be
	 * processed and validated and sets the options instance property. Then passes on the configured
	 * rootPath, paths object, and designated fileRoot
	 * 
	 * @param {!String|!Object} rootPath|paths Projects root path or Object mapping projects directory structure.
	 * @param {?Object} paths|options Object mapping projects directory structure or options object.
	 * @param {?Object} options Options object.
	 * 
	 * @function
	 * @public
	 */
	initialize = (...args) => {
		this.options = this._handleArgs(...args)
		
		let { directoryResolver, aliasMap } = this._getInitialResolvers()

		let fullResolver = this._createResolver(directoryResolver, aliasMap)
	}

	/** 
	 * Creates a resolver function, relative to the given path.
	 * 
	 * @param {!String} rootPath Absolute path which the resolver will be relative to.
	 * @returns {Function} Returns a function that returns a path relative to rootPath.
	 * 
	 * @example
	 * let resolver = makeRelativeResolver('absolute/path')
	 * let path = resolver('index.html')
	 * 
	 * console.log(path) // absolute/path/index.html
	 * @function
	 * @public
	 */
	makeRelativeResolver = (rootPath) => (relativePath = '') => path.resolve(rootPath, relativePath)

	/** 
	 * Gets a string representation of the resolver incuding a list of all resolve functions and their 
	 * resolved paths, as well as a list of aliases and their resolved paths.
	 * 
	 * @returns {Function} Returns a string representation of the resolver..
	 * 
	 * @function
	 * @public
	 */
	toString = () => {
		let directoryResolver = this.getDirectoryResolver()
		let aliasMap = this.getAliasMap()

		const PADDING_SIZE = 24

		return `======================================
:: DIRECTORY RESOLVER ::

${'function'.padEnd(PADDING_SIZE)}\t ${'result'}
${'-----------------'.padEnd(PADDING_SIZE)}\t ------------------
${Object.entries(directoryResolver).reduce((str, [name, resolver], index, collection) => {
	let formatted = name.padEnd(PADDING_SIZE)
	let linebreak = index < collection.length - 1 ? '\n' : ''
	str += `${formatted} \t ${resolver()}${linebreak}`
	return str
}, '')}
======================================

:: ALIAS MAP ::

${'name'.padEnd(PADDING_SIZE)}\t ${'value'}
${'-----------------'.padEnd(PADDING_SIZE)}\t ------------------
${Object.entries(aliasMap).reduce((str, [alias, path], index, collection) => {
	let formatted = alias.padEnd(PADDING_SIZE)
	let linebreak = index < collection.length - 1 ? '\n' : ''
	str += `${formatted} \t ${path}${linebreak}`
	return str
}, '')}`
	}

	 /** 
	 * Prints out a string representation of the resolver, the result of the {@link PathResolver#toString toString} method.
	 * Includes a list of all resolve functions and their resolved paths, as well as a list of aliases and their resolved paths.
	 * 
	 * @returns {Function} Returns a string representation of the resolver..
	 * 
	 * @see {@link PathResolver#toString toString}
	 * @function
	 * @public
	 */
	printDetails = () => print(this.toString())
		
	// Private Methods

	_addAlias = (key, path, resolver) => {
		if(hasKeyAvailable(resolver, key)) resolver[key] = this.makeRelativeResolver(path)()
	}

	/** 
	 * Creates and adds relative resolver function to the passed in resolver object, using the key as the object key.
	 * 
	 * @param {!String} key Name of the resolver function to be generated.
	 * @param {!String} path Absolute path which the resolver will be relative to.
	 * @param {!String} resolver Object that will contain the function.
	 * 
	 * @function
	 * @private
	 * @memberof PathResolver#
	 */
	_addResolver = (key, path, resolver) => {
		if(hasKeyAvailable(resolver, key)) resolver[key] = this.makeRelativeResolver(path)
	}
	
	/** 
	 * Core function that creates both the directory resolver and the alias resolver and returns a combined resolver object.
	 * 
	 * @param {!Object} directoryResolver Object that will contain relative resolver functions.
	 * @param {!Object} aliasMap Object that will contain resolved aliases.
	 * @param {!Object} options The object that will contain the function.
	 * @param {!Number} options.depth How many directory levels should be processed. Set to -1 for inifinite depth.
	 * @param {!String} options.paths Object mapping projects directory structure or options object.
	 * @param {!String} options.rootPath Projects root path or Object mapping projects directory structure.
	 * @returns {Object} Returns an object containing a directory resolver and a list of aliases
	 * 
	 * @function
	 * @private
	 * @memberof PathResolver#
	 */
	_createResolver = (directoryResolver, aliasMap) => {
		let { depth, duplicateAliases, paths, rootPath } = this.options

		const _handleRoot = () => {
			let localRootPath = this._formatPath(rootPath)

			let rootConfig = this._getConfig(paths) || {}
			let { alias, name } = rootConfig

			let localKey = name || ''
			let resolverKey = this._getDirectoryResolverKey(localKey, '')

			let aliasUsed = this._handleAlias(localKey, alias, localRootPath, directoryResolver, aliasMap)
			let aliasIsNotUsed = duplicateAliases || !aliasUsed

			if(aliasIsNotUsed){
				this._addResolver(resolverKey, localRootPath, directoryResolver)
			}
			
		}
		
		const _resolveLevel = ({
			localPaths,
			parentPath, 
			scope, 
			index = 0,
			ignoreDuplicates = false}) => {

			const _handleStringValue = (value) => {
				return this._formatPath(value, parentPath, rootPath)
			}

			const _handleObjectValue = (key, value) => {
				let isConfig = key == '_'
				
				if (!isConfig){
					let localRootPath = this._formatPath(key, parentPath)

					let { alias, name, ignore, ignoreBranch } = this._getConfig(value) || {}

					if(ignoreBranch) return

					let aliasUsed = this._handleAlias(key, alias, localRootPath, directoryResolver, aliasMap)

					let localKey = name ? name : key

					let nextScope = this._formatScope(localKey, scope)
					let resolverKey = this._getDirectoryResolverKey(localKey, scope)

					let isValidDepth = depth == -1 || index <= depth
					let duplicatesAreNotPresent = !directoryResolver.hasOwnProperty(resolverKey)
					let aliasIsNotUsed = duplicateAliases || !aliasUsed

					if(!ignore){
						if(isValidDepth && duplicatesAreNotPresent && aliasIsNotUsed){
							this._addResolver(resolverKey, localRootPath, directoryResolver)
						}
					}

					return _resolveLevel({
						localPaths: value, 
						parentPath: localRootPath, 
						scope: nextScope, 
						index: ++index, 
						ignoreDuplicates: true
					})
				}
			}

			const localResolver = Object.entries(localPaths).reduce((resolver, [key, value]) => {
				if(isString(value) && isFileURI(value) && key != '_'){
					resolver[key] = _handleStringValue(value)
				} else if(isObject(value)){
					resolver[key] = _handleObjectValue(key, value)
				}

				return resolver
			}, {})

			return localResolver
		 }

		 _handleRoot()
		 return _resolveLevel({localPaths: paths})
	}

	/** 
	 * Format path which is a concatenation of name, an optional parent path, and an optional root path.
	 * 
	 * @param {!Object} name Name of the current directory or file.
	 * @param {Object} parentPath Relative path of containing directories.
	 * @param {Object} rootPath Absolute path which the resolved path will be relative to.
	 * @returns {String} Resolved path. 
	 * 
	 * @function
	 * @private
	 * @memberof PathResolver#
	 */
	_formatPath = (name, parentPath, rootPath) => {
		let formatted
		if(parentPath && rootPath){
			formatted = path.resolve(rootPath, parentPath, name) 
		} else {
			if(parentPath || rootPath){
				formatted = path.resolve(parentPath || rootPath , name) 
			} else {
				formatted = name
			}
		}
		return formatted
	}

	/** 
	 * Format resolver key, name of dynamically generated function.
	 * 
	 * @param {!Object} name Name of the current directory or file.
	 * @returns {String} Resolver key, concatenation of 'resolverPrefix' option and passed in name.
	 * 
	 * @function
	 * @private
	 * @memberof PathResolver#
	 */
	_formatResolverKey = (name) => 
		toCamelCase(`${this.options.resolverPrefix}-${toSnakeCase(name.replace(/[\/\\]/, '-'))}`)

	/** 
	 * Format scope which is a concatenation of a key and the previous scope in kebab case.
	 * 
	 * @param {!Object} name Name of the current directory or file.
	 * @param {Object} scope String representation of the nested path in kebab case.
	 * @returns {String} Formatted scope in kebab case.
	 * 
	 * @function
	 * @private
	 * @memberof PathResolver#
	 */
	_formatScope = (name, scope) => scope ? `${scope}-${name}` : name

	/**
	 * Gets a directory's config object.
	 * 
	 * @param {!Object} paths Object mapping projects directory structure.
	 * 
	 * @returns {Object} Configuration object for current directory.
	 * 
	 * @function
	 * @private
	 * @memberof PathResolver#
	 */
	_getConfig = (paths) => paths._

	/**
	 * Creates a directory resolver key, or a dynamic function name, to be applied to the directory resolver.
	 * 
	 * @param {?String} name Name of current directory or file.
	 * @param {?String} scope String representation of the nested path in kebab case.
	 * 
	 * @returns {String} Name for dynamically generated resolver function.
	 * 
	 * @private
	 * @function
	 * @memberof PathResolver#
	 */
	_getDirectoryResolverKey = (name = '', scope) => {        
		let keyToResolve = scope && name ? `${scope}-${name}` : name
		return this._formatResolverKey(keyToResolve)
	}

	/**
	 * Initializes directory resolver, alias map, and file map and determines location. Default location for directory resolver is
	 * the {@link PathResolver} instance. Default location for the alias resolver is the 'aliases' property.
	 * 
	 * @param {?String} key Name of current directory or file.
	 * @param {?String} scope String representation of the nested path in kebab case.
	 * 
	 * @returns {String} Name for dynamically generated resolver function.
	 * 
	 * @private
	 * @function
	 * @memberof PathResolver#
	 */
	_getInitialResolvers = () => {
		let { aliasRoot, fileRoot, namespace } = this.options
		let directoryResolver, aliasMap

		if(namespace){
			this[namespace] = {}
			directoryResolver = this[namespace]
		} else {
			warn(`PathResolver's 'namespace' property was invalid.`)
		}

		if(aliasRoot){
			this[aliasRoot] = {}
			aliasMap = this[aliasRoot]
		} else {
			warn(`PathResolver's 'aliasRoot' property was invalid.`)
		}
				
		return {
			directoryResolver,
			aliasMap,
		} 
	}
	
	_handleAlias = (key, alias, path, directoryResolver, aliasMap) => {
		let aliasUsed = false
		if(alias){
			let aliasKey = alias.replace(/(@|#)/g, '')
			let aliasScope = toKebabCase(aliasKey)
			let aliasMapKey = this._getDirectoryResolverKey(aliasKey)

			if(hasKeyAvailable(aliasMap, aliasMapKey)){
				this._addResolver(aliasMapKey, path, directoryResolver)
				this._addAlias(alias, path, aliasMap)
				aliasUsed = true
			}
		}
		return aliasUsed

	}

	/**
	 * Handles initial arguments and converts them into an objects file. Validates option properties using {@link PathResolver#_validateOptions}.
	 * 
	 * @param {!String|!Object} rootPath|paths Projects root path or Object mapping projects directory structure.
	 * @param {?Object} paths|options Object mapping projects directory structure or options object.
	 * @param {?Object} options Options object.
	 * 
	 * @returns {Object} Formatted and validated options object.
	 * @see {@link PathResolver#_validateOptions}
	 * 
	 * @function
	 * @private
	 * @memberof PathResolver#
	 */
	_handleArgs = (...args) => {
		let options

		switch(args.length){
			case 0: {
				warn(`A 'PathResolver' object was passed no initial arguments. Initialization must be done manually by running the 'initialize' function.`)
				options = {}
			} break
			case 1: {
				if(isObject(args[0])){
					options = {
						paths: args[0]
					}
				}
			} break
			case 2: {
				if(isObject(args[0]) && isObject(args[1])){
					if(args[1].hasOwnProperty('paths')){
						warn(`PathResolver was passed a 'paths' argument and an options object with the 'paths' property. Will use 'paths' argument.`)
					}
					options = {
						...args[1],
						paths: args[0]
					}
				}
				if(isString(args[0]) && isObject(args[1])){
					options = {
						rootPath: args[0],
						paths: args[1]
					}
				}
			} break
			case 3: {
				if(args[2].hasOwnProperty('rootPath')){
					warn(`PathResolver was passed a 'rootPath' argument and an options object with the 'rootPath' property. Will use 'rootPath' argument.`)
				}
				if(args[2].hasOwnProperty('paths')){
					warn(`PathResolver was passed a 'paths' argument and an options object with the 'paths' property. Will use 'paths' argument.`)
				}
				options = {
					...args[2],
					rootPath: args[0],
					paths: args[1]
				}
			} break
			default: {
				throw new InvalidArgumentsError(`PathResolver accepts between 1-3 arguments, '${args.length}' found.`)
			}              
		}

		return this._validateOptions(options)
	}

	/**
	 * @deprecated since 0.1.1
	 * 
	 * Determines if directory object map contains an alias field.
	 * 
	 * @param {!Object} paths Object mapping projects directory structure.
	 * 
	 * @returns {Boolean} True if contains alias.
	 * 
	 * @function
	 * @private
	 * @memberof PathResolver#
	 */
	_hasAlias = (paths) => paths.hasOwnProperty('_') && paths._.alias

	/**
	 * Determines if directory object map contains a config property, indicated by a key of underscore.
	 * 
	 * @param {!Object} paths Object mapping projects directory structure.
	 * 
	 * @returns {Boolean} True if contains config property.
	 * 
	 * @function
	 * @private
	 * @memberof PathResolver#
	 */
	_hasConfig = (paths) => paths.hasOwnProperty('_')
	
	/**
	 * @deprecated since 0.1.0
	 * 
	 * Determines if directory object map contains a local alias field.
	 * 
	 * @param {!Object} paths Object mapping projects directory structure.
	 * 
	 * @returns {Boolean} True if contains local alias.
	 * 
	 * @function
	 * @private
	 * @memberof PathResolver#
	 */
	_hasName = (paths) => paths.hasOwnProperty('_') && paths._.name

	/**
	 * Validates options object and set defaults.
	 * 
	 * @param {!Object} options Unvalidated options object.
	 * 
	 * @returns {Boolean} Validated options object.
	 * 
	 * @function
	 * @private
	 * @memberof PathResolver#
	 */
	_validateOptions = (options) => {
		let { duplicateAliases, namespace, rootPath, resolverPrefix, ...other } = options 
		let validated = Object.assign({}, PathResolver.defaultOptions, filterObject({
			...other,
			duplicateAliases: isBoolean(duplicateAliases) ? duplicateAliases : undefined,
			namespace: isString(namespace) && namespace.trim().length > 0 ? namespace : undefined,
			rootPath: isString(rootPath) && rootPath.trim().length > 0 ? rootPath : undefined,
			resolverPrefix: isString(rootPath) && rootPath.trim().length > 0 ? rootPath : undefined
		}))

		return validated
	}
}

export default PathResolver
export { PathResolver }