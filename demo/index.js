'use strict'

let fs = require('fs')
let path = require('path')

let { isObject } = require('@beautiful-code/type-utils')

let { print, debug, error } = require('../dist/lib/ConsoleUtils')

let { PathResolver } = require('../dist/index')

const directoryMap = {
	_: {
		alias: '@app'
	},
	src: {
		_: {
			name: 'source'
		},
		navigation: {
			index: 'index.js',
			menu: 'menu.js'
		},
		index: 'index.js'
	},
	dist: {
		app: 'app.bundle.js'
	},
	public: {
		_: { ignore: true },
		test: { _: { alias: '#public' }}
	},
	scss: {
		_: {
			name: 'style',
			ignoreBranch: true
		},
		manifest: '_manifest.scss',
		app: 'app.scss',
		nav: {
			manifest: '_manifest.scss',
			test: {
				_: { alias: '@nav/test', name: 'mocha' },
				more: 'more.html'
				
			}
		}
	}
}

const resolver = new PathResolver(directoryMap)

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

resolver.printDetails()


