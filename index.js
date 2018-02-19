'use strict'

let fs = require('fs')
let path = require('path')

let { isObject } = require('@beautiful-code/type-utils')

let { print, debug, error } = require('./dist/lib/ConsoleUtils')

let { PathResolver } = require('./dist/index')

// let directoryMap = {
//     src: {
//         main: 'main.js',
//         css: {
//             app:  'app.css'
//         },
//         js: {
//             nav: 'navigation.js'
//         },
//     },
//     dist: {
//         _: 'dist',
//         css: {
//             _: '@style',
//             app:  'app.css',
//             components: {
//                 nav: 'sub.css'
//             }
//         },
//         js: {
//             _: 'scripts',
//             nav: 'navigation.js',
//             libs: {
//                 module: 'module.css'
//             }
//         },
//         main: 'main.js'
//     },
//     entry: 'index.js'
// }

// const pathManager = new PathManager()
// const resolver = pathManager.getResolver({
//     paths
// })

// const { resolveSrc } = resolver

// debug(resolver)
// debug(resolver.entry)
// debug(resolveSrc('index.js'))

const directoryMap = {
	// src: {
	// 	_: 'source',
	// 	navigation: {
	// 		index: 'index.js',
	// 		menu: 'menu.js'
	// 	},
	// 	index: 'index.js'
	// },
	// dist: {
	// 	app: 'app.bundle.js'
	// },
	// scss: {
	// 	_: '@style',
	// 	manifest: '_manifest.scss',
	// 	app: 'app.scss',
	// 	nav: {
	// 		manifest: '_manifest.scss',
	// 		test: {
	// 			_: '@test',
	// 			more: 'more.html'
				
	// 		}
	// 	}
	// }

	src: {
		_: '@source',
		nav: {
			test: 'test.html',
			style: 'style.css',
			next: {
				_: '@next',
				more: {
					_: 'testeroni',
					even_more: {
						index: 'index.html'
					}
				}
			}
		}
	}
}

const appPaths = new PathResolver(directoryMap)

function isCyclic (obj) {
	var seenObjects = [];

	function detect (obj) {
		if (obj && typeof obj === 'object') {
			if (seenObjects.indexOf(obj) !== -1) {
			return true;
			}
			seenObjects.push(obj);
			for (var key in obj) {
			if (obj.hasOwnProperty(key) && detect(obj[key])) {
				console.log(obj, 'cycle at ' + key);
				return true;
			}
			}
		}
		return false;
	}

	return detect(obj);
}
let { files, paths } = appPaths

console.log(paths)
