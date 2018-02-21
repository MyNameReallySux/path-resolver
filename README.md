# Path Resolver

Path resolver was inspired by inspecting create-react-app. In the webpack configuration, it is always necessary to resolve paths and make them manageable. Auto-generating functions based on path name make it easy to mock things up, and aliases are useful to reduce code for deeply nested directories. Aliases can also be extracted and used as-is in webpack config.

## Prerequisites

[npm](https://www.npmjs.com/) - Installation  
[babel-cli](https://github.com/babel/babel/tree/master/packages/babel-cli) - Build  
[Mocha](https://github.com/mochajs/mocha) - Testing  
[jsdoc](https://github.com/jsdoc3/jsdoc) - Generate Docs

```bash
$ npm install -g babel-cli jsdoc mocha
```

## Installation

Start by installing Path Resolver through npm.
```bash
$ npm install --save @beautiful-code/path-resolver
```

Then in any of your js files, import the PathResolver object.
```js
// ES5 Syntax
let PathResolver = require('@beautiful-code/path-resolver').PathResolver

// ES6 Syntax
import { PathResolver } from '@beautiful-code/path-resolver'

let resolver = new PathResolver({ ...options })
let paths = resolver.getDirectoryResolver()

// By default, you will automatically get a 'resolve' function from your path resolver.
// This resolves paths relative to the current working directory.

paths.resolve('index.html')
// C:/current/working/directory/index.html
```

## How To Use

### Basic Usage

Path Resolver works by accepting a path map, and using that to determine all of the 'resolvers'. A resolver is a function that takes a relative path and resolves it to a specific, preset directory.

```js
// This is an example resolver function.
let resolveSrc = (relativePath) => path.resolve(process.cwd() + '/src', relativePath)

resolveSrc('js/index.js')
// C:/current/working/directory/src/js/index.js
```

You can select these preset directories by passing in a paths map to the PathResolver constructor.

```js 
let resolver = new PathResolver({
    src: {
        js: {}
        css: {}
    },
    public: {
        js: {},
        css: {}
    }
})

let paths = resolver.getDirectoryResolver()
// With this configuration, you will get the following functions.
// Each function will resolve to the specified directory within the current working directory. The 'resolve' function will resolve to the current working directory.

let {
    resolve
    resolveSrc, resolveSrcJs, resolveSrcCss,
    resolvePublic, resolvePublicJs, resolvePublicCss
} = paths

resolve()                  // C:/current/working/directory
resolveSrc()               // C:/current/working/directory/src
resolveSrc('index.html')   // C:/current/working/directory/src/index.html
resolveSrcCss()            // C:/current/working/directory/src/css
resolveSrcJs('index.html') // C:/current/working/directory/src/js
```

### Directory Options

You can also configure individual directories. You can use this to rename the resolver function names, and also to generate a list of aliases to use with Webpack, Babel, or similar frameworks. The configuration is designated by using a '_' as a child property. Here are the available options.

| Options | Type       | Description                                                                     |
| ------- | ---------- | ------------------------------------------------------------------------------- |
| name    | String     | Rename the current directory, without changing the path.                        |
| alias   | String     | Create an alias, rescoping the function to the alias, without changing the path |

*NOTE: Child routes will respect the renaming as well. By default, a rename will replace the function for the respective path, while an alias will duplicate it.

```js
let resolver = new PathResolver({
    src: {
        _: { name: 'source' },
        js: {}
    },
    public: {
        components: { 
            _: { alias: '@components' }
        }
    }
})

let paths = resolver.getDirectoryResolver()
let { resolveSource, resolveComponents } = paths

resolveSource()     // C:/current/working/directory/source
resolveComponents() // C:/current/working/directory/public/components

// Do paths still work?

let { resolveSrc, resolvePublicComponents } = paths

resolveSrc() // This is undefined, throws an error
resolvePublicComponents() // resolves correctly

```

## Documentation

You can read the full documentation [here!](https://mynamereallysux.github.io/path-resolver/)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags).

## Authors

* **Chris Coppola** - *Project Creator*

See also the list of [contributors](https://github.com/MyNameReallySux/path-resolver/graphs/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details