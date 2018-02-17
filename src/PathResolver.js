'use strict'
import fs from 'fs'
import path from 'path'

import { print, info, debug, warn, error } from './lib/ConsoleUtils'
import { toCamelCase, toSnakeCase } from '@beautiful-code/string-utils'
import { isFunction, isObject, isString } from '@beautiful-code/type-utils'

import { DuplicateKeyError, InvalidArgumentsError } from './errors'

export class PathResolver {
	static defaultConfig = {
		rootPath: fs.realpathSync(process.cwd()),
		paths: {},
		options: {
			namespace: 'paths',
			fileroot: 'files',
			rootPath: undefined,
			resolverPrefix: 'resolve'
		}
	}

	// Class Initialization
	
	constructor(...args){
		let {rootPath, paths, options} = this._handleArgs(...args)
		this.options = options

		this.init({rootPath, paths})
	}

	init = ({rootPath, paths} ) => {
		let {namespace, fileroot} = this.options  
		let directoryResolver
		
		if(namespace){
			this[namespace] = {}
			this[namespace]['aliases'] = {}
			directoryResolver = this[namespace]
		} else {
			directoryResolver = this
		}

		directoryResolver['aliases'] = {}
		let aliasResolver = directoryResolver['aliases']

		const resolveAliases = ({
			localPaths,
			parentPath, 
			scope, 
			index = 0}) => {
			

			const localAliasResolver = Object.entries(localPaths).reduce((resolver, [key, value]) => {
				if(this.hasAlias(value)){
					let aliasScope = this.getLocalScope(value, scope)
					let aliasResolverKey = this.getDirectoryResolverKey(aliasScope)
					let resolverPath = path.resolve(rootPath, key)
					let resolverFunction = this._addPathToResolver(directoryResolver, aliasResolverKey, resolverPath)
				}


				let nextScope = this.getNextScope(key, scope)
				let nextParent = this.getNextParentPath(key, parentPath)

				resolveAliases({
					localPaths: value, 
					parentPath: nextParent, 
					scope: nextScope, 
					index: ++index})
			})
			
		}

		const resolveLevel = ({
			localPaths,
			parentPath, 
			scope, 
			index = 0}) => {

			const localResolver = Object.entries(localPaths).reduce((resolver, [key, value]) => {
				if(isString(value) && this.isFileURI(value)){
					let fullpath = this._formatFullPath(value, parentPath, rootPath)
					resolver[key] = fullpath
				} else if(isObject(value)){
					let localRootPath = parentPath ? `${parentPath}/${key}` : key
					let localScope = scope
					let resolverKey = this.getDirectoryResolverKey(key, localScope)

					let resolverPath = path.resolve(rootPath, key)
					let resolverFunction = this._addPathToResolver(directoryResolver, resolverKey, resolverPath)

					let nextScope = this.getNextScope(key, scope)
					let nextParent = this.getNextParentPath(key, parentPath)

					resolver[key] = resolveLevel({
						localPaths: value, 
						parentPath: nextParent, 
						scope: nextScope, 
						index: ++index})
					resolver[key]['_root'] = path.resolve(rootPath, localRootPath)
				}

				return resolver
			}, {})

			return localResolver
		}
	
		const resolveLevelOld = (localPaths, parentPath, scope, index = 0) => {
			let localResolver = Object.entries(localPaths).reduce((resolver, [key, value]) => {
				if(isString(value)) {
					if(this.isFileURI(value)){
						let fullpath = this._formatFullPath(value, parentPath, rootPath)
						resolver[key] = fullpath
					}
					
				} else if(isObject(value)) {
					let localRootPath = parentPath ? `${parentPath}/${key}` : key
					let resolverKey, localScope

					if(this.hasAlias(value)){
						localScope = this.getLocalScope(value, scope)
						resolverKey = this.getDirectoryResolverKey(localScope)
					} else if(this.hasLocalAlias(value)){
						localScope = this.getLocalScope(value, scope)
						resolverKey = this.getDirectoryResolverKey(localScope, scope)
					} else {
						localScope = scope
						resolverKey = this.getDirectoryResolverKey(key, localScope)
					}
					let resolverPath = path.resolve(rootPath, key)
					let resolverFunction = this._addPathToResolver(directoryResolver, resolverKey, resolverPath)

					let nextScope = this.getNextScope(value, key, scope)
					let nextParent = this.getNextParentPath(key, parentPath)

					resolver[key] = resolveLevel(value, nextParent, nextScope, ++index)
					resolver[key]['_root'] = path.resolve(rootPath, localRootPath)
				}
				return resolver
			}, {})
			return localResolver
		}

		let files = resolveLevel({localPaths: paths})
		resolveAliases({localPaths: paths})
		this[fileroot] = files
		this[fileroot]['_root'] = rootPath
	}

	// Public Methods

	getDirectoryResolverKey = (key, scope) => {
		let result
		if(scope && key){
			let keyToResolve = `${scope}-${key}`
			result = this._formatResolverKey(keyToResolve)
		} else if(key){
			result = this._formatResolverKey(key)
		}
		return result
	}

	getLocalScope = (object, scope) => {
		if(object.hasOwnProperty('_')){
			return this.hasAlias(object) ? object._.slice(1) : object._
		} else {
			return scope
		}
	}

	getNextParentPath = (key, parentPath) => parentPath ? `${parentPath}/${key}` : key
	getNextScope = (key, scope) => scope ? `${scope}-${key}` : key

	getNextScopeOld = (object, key, scope) => {
		if(this.hasAlias(object)){
			return object._.slice(1)
		} else if(scope && this.hasLocalAlias(object)){
			return `${scope}-${object._}`
		} else if(scope && !object._){
			return `${scope}-${key}`
		} else if(!scope && object._){
			return object._
		} else {
			return key
		}
	}

	hasAlias = (object) => object.hasOwnProperty('_') && object._.indexOf('@') == 0    
	hasLocalAlias = (object) => object.hasOwnProperty('_')

	haveDuplicateKeys = (object, other) => {
		let result = false     
		Object.keys(object).map((key) => {
			if(other.hasOwnProperty(key)){
				result = true
				return false
			}
		})
		return result
	}

	isFileURI = (uri) => {
		return uri.split('/').pop().indexOf('.') > -1
	}

	isDirectoryURI = (uri) => {
		return path.split('/').pop().indexOf('.') == -1
	}

	makeRelativeResolver = (rootPath) => (relativePath = '') => path.resolve(rootPath, relativePath)
	resetScope = (parentPath) => toSnakeCase(parentPath.replace(/\\\//))

	// Private Methods

	_addPathToResolver = (resolver, resolverKey, resolverPath) => {
		this._resolverHasPropertyEmpty(resolver, resolverKey, () => {
			resolver[resolverKey] = this.makeRelativeResolver(resolverPath)
		})
	}

	_addAliasToResolver = (key, relativeResolver) => {
		return this._resolverHasPropertyEmpty(aliasResolver, key, () => {
			return aliasResolver[key] = relativeResolver()
		})
	}

	_formatFullPath = (filename, parentPath, rootPath) => 
		parentPath && rootPath 
			? path.resolve(rootPath, parentPath, filename) 
			: parentPath || rootPath 
				? path.resolve(parentPath || rootPath , filename) 
				: filename

	_formatResolverKey = (key) => toCamelCase(`${this.options.resolverPrefix}-${toSnakeCase(key)}`)

	_handleArgs = (...args) => {
		let rootPath, paths, options

		switch(args.length){
			case 0: {
				warn(`A 'PathResolver' object was passed no initial arguments. Initialization must be done manually.`)
			} break
			case 1: {
				if(isObject(args[0])){
					([paths] = args)
					options = {}
				}
			} break
			case 2: {
				if(isObject(args[0]) && isObject(args[1])){
					([paths, options] = args[0])
				}
				if(isString(args[0]) && isObject(args[1])){
					[rootPath, paths] = args
				}
			} break
			case 3: {
				[rootPath, paths, options] = args
			} break
			default: {
				throw new InvalidArgumentsError(`PathResolver accepts between 1-3 arguments, '${args.length}' found.`)
			}              
		}

		if(!rootPath && options && options.rootPath){
			rootPath = options.rootPath
		}
		
		let config = { 
			rootPath: rootPath || PathResolver.defaultConfig.rootPath,
			paths: paths || PathResolver.defaultConfig.paths,
			options: Object.assign({}, PathResolver.defaultConfig.options, options)
		}

		options = this._validateOptions(config.options)        
		return config
	}

	_resolverHasPropertyEmpty(obj, key, onSuccess, onError){
		let contains = obj.hasOwnProperty(key)
		try {
			if(contains){
				throw new DuplicateKeyError(`The given object has duplicate keys '${key}'. Make sure all directories have unique key, or use scopes / aliases'`)
			} else {
				return isFunction(onSuccess) ? onSuccess(false) : undefined
			} 
		} catch (e){
			isFunction(onError) ? onError(true, e) : error(e)
			return false
		}
		return contains
	}

	_validateOptions(options){
		let { namespace, fileroot } = options
		namespace = isString(namespace) && namespace.trim().length > 0 ? namespace : undefined
		fileroot = isString(fileroot) && fileroot.trim().length > 0 ? fileroot : undefined
		
		return {
			namespace,
			fileroot,
			...options
		}        
	}
}