'use strict'
import fs from 'fs'
import path from 'path'

import { warn, error } from './lib/ConsoleUtils'
import { toCamelCase, toSnakeCase } from '@beautiful-code/string-utils'
import { isFunction, isObject, isString } from '@beautiful-code/type-utils'

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
                isFunction(onSuccess) ? onSuccess(false) : undefined
                return false
			} 
		} catch (e){
			isFunction(onError) ? onError(true, e) : error(e)
			return true
        }
		return contains
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
 * Class that creates a suite of methods useful for resolving paths within a project. Includes a directory resolver, 
 * which creates relative path resolvers for each directory in a given directory map. Support for resolver renaming and
 * alias generation, which formats the resolver name to reflect the alias as the root rather than the full path.
 * 
 * @author Chris Coppola <mynamereallysux@gmail.com>
 */
class PathResolver {
    /**
     * @property {Number} depth How many directory levels should be processed. Set to -1 for inifinite depth.
     * @property {String} fileroot Namespace, or property name, that should contain a raw directory map object.
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
        depth: -1,
        fileroot: 'files',
		namespace: 'paths',
        paths: {},
        resolverPrefix: 'resolve',
        rootPath: fs.realpathSync(process.cwd()),
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

    /** 
     * Configures an instance of path resolver. Can be used after a {@link PathResolver} instance is
     * created to defer the configuration. Passes arguments to the {@link PathResolver#initialize} function to be
     * processed and validated and sets the options instance property. Then passes on the configured
     * rootPath, paths object, and designated fileroot
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
        
        let { directoryResolver, aliasResolver } = this._getInitialResolvers()

        let fullResolver = this._createResolver(directoryResolver, aliasResolver, this.options)
        this._setFileMap(fullResolver)
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

    // Private Methods

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
	_addToResolver = (key, path, resolver) => {
		hasKeyAvailable(resolver, key, () => {
			resolver[key] = this.makeRelativeResolver(path)
		})
	}
    
    /** 
     * Core function that creates both the directory resolver and the alias resolver and returns a combined resolver object.
     * 
     * @param {!Object} directoryResolver Object that will contain relative resolver functions.
     * @param {!Object} aliasResolver Object that will contain resolved aliases.
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
    _createResolver = (directoryResolver, aliasResolver) => {
        let { depth, paths, rootPath } = this.options
        
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
                let localRootPath = this._formatPath(key, parentPath)

                let nextScope = this._formatScope(key, scope)    
                let resolverKey = this._getDirectoryResolverKey(key, scope)

                if(this._hasAlias(value)){
                    _handleObjectAlias(key, value, localRootPath)
                }

                if(this._hasLocalAlias(value)){
                    let localAlias = value._
                    nextScope = this._formatScope(localAlias, scope)
                    resolverKey = this._getDirectoryResolverKey(localAlias, scope)
                }

                let isValidDepth = depth == -1 || index <= depth
                let duplicatesAreNotPresent = !directoryResolver.hasOwnProperty(resolverKey)
                
                if(isValidDepth && duplicatesAreNotPresent){
                    this._addToResolver(resolverKey, localRootPath, directoryResolver)
                }

                return _resolveLevel({
                    localPaths: value, 
                    parentPath: localRootPath, 
                    scope: nextScope, 
                    index: ++index, 
                    ignoreDuplicates: true
                })
            }

            const _handleObjectAlias = (key, value, localRootPath) => {
                let aliasKey = value._.replace('@', '')
                let aliasScope = this._getLocalScope(value, scope)
                let aliasResolverKey = this._getDirectoryResolverKey(aliasScope)
                let aliasPath = this._formatPath(key, parentPath, rootPath)

                if(!aliasResolver.hasOwnProperty(key)){
                    this._addToResolver(aliasResolverKey, aliasPath, directoryResolver)
                    this._addToResolver(aliasKey, aliasPath, aliasResolver)
                }
                
                _resolveLevel({
                    localPaths: value, 
                    parentPath: localRootPath, 
                    scope: aliasScope, 
                    index: 0
                })
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
	_formatResolverKey = (name) => toCamelCase(`${this.options.resolverPrefix}-${toSnakeCase(name)}`)

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
    _getDirectoryResolverKey = (name, scope) => {
		let result
		if(scope && name){
			let keyToResolve = `${scope}-${name}`
			result = this._formatResolverKey(keyToResolve)
		} else if(name){
			result = this._formatResolverKey(name)
		}
		return result
	}

    /**
     * Initializes directory resolver and alias resolver and determines location. Default location for directory resolver is
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
        let { namespace } = this.options
        let directoryResolver, aliasResolver

        if(namespace){
			this[namespace] = {}
			this[namespace]['aliases'] = {}
			directoryResolver = this[namespace]
		} else {
			directoryResolver = this
        }
        
        aliasResolver = directoryResolver['aliases'] = {}
        
        return {
            directoryResolver,
            aliasResolver
        } 
    }

    /**
     * Gets the current scope. Checks if current item has an alias scope and returns it, otherwise returns scope.
     * 
     * @param {!String} localPaths Object containing current directory level mapping.
     * @param {!String} scope A string representation of the nested path in kebab case 'this-is-kebab-case'
     * @throws {TypeError} _getLocalScope was passed no valid parameters, would have returned undefined
     * @returns {String} Scope relative to alias or same scope.
     * 
     * @function
     * @private
     * @memberof PathResolver#
     */
	_getLocalScope = (localPaths, scope) => {
		if(localPaths && this._hasAlias(localPaths) || this._hasLocalAlias(localPaths)){
            let localScope = localPaths._.replace('@', '')
			return localScope
		} else if(scope) {
			return scope
		} else {
            throw new TypeError(`_getLocalScope was passed no valid parameters, would have returned undefined`)
        }
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
    _hasAlias = (paths) => paths.hasOwnProperty('_') && paths._.indexOf('@') == 0
    
    /**
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
	_hasLocalAlias = (paths) => paths.hasOwnProperty('_') && paths._.indexOf('@') == -1
    
     /**
     * Determines if directory object map contains a local alias field.
     * 
     * @param {!Object} fullResolver Combined resolver returned from {@link PathResolver#_createResolver}.
     * 
     * @returns {Boolean} True if contains local alias.
     * @see {@link PathResolver#_createResolver}
     * 
     * @function
     * @private
     * @memberof PathResolver#
     */
    _setFileMap = (fullResolver) => {
        let { fileroot, rootPath } = this.options
        this[fileroot] =  fullResolver
        this[fileroot]['_root'] = rootPath
    }

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
        let { namespace, fileroot, rootPath, resolverPrefix, ...other } = options 
        let validated = Object.assign({}, PathResolver.defaultOptions, filterObject({
            ...other,
            namespace: isString(namespace) && namespace.trim().length > 0 ? namespace : undefined,
            fileroot: isString(fileroot) && fileroot.trim().length > 0 ? fileroot : undefined,
            rootPath: isString(rootPath) && rootPath.trim().length > 0 ? rootPath : undefined,
            resolverPrefix: isString(rootPath) && rootPath.trim().length > 0 ? rootPath : undefined
        }))

        return validated
    }
}

export default PathResolver
export { PathResolver }