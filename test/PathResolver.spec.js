// Node Packages
let path = global.imports.path

// Imported Packages
let { print, info, debug, warn, error, supressConsole, restoreConsole } = global.imports.ConsoleUtils
let { runTest, makeDescribeClass, makeDescribeFunc } = global.imports.TestUtils

let { isFunction } = global.imports.TypeUtils

let { assert, expect } = global.imports.Chai
let colors = global.imports.colors

import { PathResolver } from '../src/PathResolver'
import { DuplicateKeyError } from '../src/errors'

const describeClass = makeDescribeClass(describe)
const describeFunc = makeDescribeFunc(describe)

// supressConsole = () => {}
// restoreConsole = () => {}

describeClass('PathResolver', () => {
    describeFunc('#_addToResolver(directoryResolver, resolverKey, resolverPath)', () => {
        // #region _addToResolver Initialization
        /* ######################
            Initialization
        ##################### */

        let pathResolver
        before(() => {
            supressConsole()
            pathResolver = new PathResolver()
            restoreConsole()
        })
        // #endregion _addToResolver Initialization */

        // #region _addToResolver Test Data
        /* ######################
            Test Data
        ##################### */

        let DATA = {
            VALID: {
                ALL: {
                    test: {
                        resolver: {},
                        resolverKey: 'resolveSrc',
                        resolverPath: 'src',
                        relativePath: 'index.html'
                    },
                    expected: {
                        hasKey: true,
                        isFunc: true,
                    }
                },
                RELATIVE_PATH: {
                    test: {
                        resolver: {},
                        resolverKey: 'resolveSrc',
                        resolverPath: 'src',
                        relativePath: 'index.html'
                    }, 
                    expected: {
                        value: path.resolve(PathResolver.defaultOptions.rootPath, 'src', 'index.html')
                    }
                },
                NO_RELATIVE_PATH: {
                    test: {
                        resolver: {},
                        resolverKey: 'resolveSrc',
                        resolverPath: 'src',
                        relativePath: undefined
                    }, 
                    expected: {
                        value: path.resolve(PathResolver.defaultOptions.rootPath, 'src')
                    }
                }
            },
            INVALID: {
                NO_RESOLVER: {
                    test: {
                        resolver: undefined,
                        resolverKey: 'resolveSrc',
                        resolverPath: 'src',
                        relativePath: 'index.html'
                    }, 
                    expected: 'should throw error'
                },
                NO_RESOLVER_KEY: {
                    test: {
                        resolver: {},
                        resolverKey: undefined,
                        resolverPath: 'src',
                        relativePath: 'index.html'
                    }, 
                    expected: 'should throw error'
                },
                NO_RESOLVER_PATH: {
                    test: {
                        resolver: {},
                        resolverKey: 'resolveSrc',
                        resolverPath: undefined,
                        relativePath: 'index.html'
                    }, 
                    expected: 'should throw error'
                },
            }
        }
        // #endregion _addToResolver Test Data

        // #region _addToResolver Test Functions
        /* ######################
            Test Functions
        ##################### */

        const TESTS = {
            keyCreation: ({ resolverKey, resolverPath, resolver, relativePath }) => {
                pathResolver._addToResolver(resolverKey, resolverPath, resolver)
                return {
                    value: resolver.resolveSrc(relativePath),
                    hasKey: resolver.hasOwnProperty(resolverKey),
                    isFunc: isFunction(resolver[resolverKey])
                }
            },
    
            subFunction: ({ resolverKey, resolverPath, resolver, relativePath }) => {
                pathResolver._addToResolver(resolverKey, resolverPath, resolver)
                return { 
                    value: resolver[resolverKey](relativePath)
                 }
            }
        }

        const runKeyCreationTest = (testSuite, onResult) => {
            return runTest(testSuite, TESTS.keyCreation, onResult)
        }

        const runSubFunctionTest = (testSuite, onResult) => {
            return runTest(testSuite, TESTS.subFunction, onResult)
        }
        // #endregion _addToResolver Test Functions

        // #region _addToResolver Execute Tests
        /* ######################
            Execute Tests
        ##################### */

        describe('Correctly creates function and adds to given resolver.', () => {
            let { VALID } = DATA
            let result, expected
            before(() => {
                ({ result, expected } = runKeyCreationTest(VALID.ALL))
            })

            it(`The 'resolver' object should have 'resolverKey' property`, () => {
                expect(result.hasKey).equals(expected.hasKey)
            })

            it(`The 'resolverKey' property should be a function`, () => {
                expect(result.isFunc).equals(expected.isFunc)
            })
        })

        describe('Throws an error if any of the three parameters are undefined', () => {
            let { INVALID } = DATA

            it(`The 'resolver' is undefined`, () => {
                expect(() => runKeyCreationTest(INVALID.NO_RESOLVER))
                    .to.throw(Error, `Cannot read property 'hasOwnProperty' of undefined`)
            })

            it(`The 'resolverKey' is undefined`, () => {
                expect(() => runKeyCreationTest(INVALID.NO_RESOLVER_KEY))
                    .to.throw(TypeError, `resolver.resolveSrc is not a function`)
            })

            it(`The 'resolverPath' is undefined`, () => {
                expect(() => runKeyCreationTest(INVALID.NO_RESOLVER_PATH))
                    .to.throw(TypeError, `Path must be a string. Received undefined`)
            })
        })

        describe('Generated function returns a valid absolute path.', () => {
            let { VALID } = DATA

            it(`The 'relativePath' is a valid path`, () => {
                let { result, expected } = runSubFunctionTest(VALID.RELATIVE_PATH)
                expect(result.value).equals(expected.value)
            })

            it(`The 'relativePath' is undefined`, () => {
                let { result, expected } = runSubFunctionTest(VALID.NO_RELATIVE_PATH)
                expect(result.value).equals(expected.value)
            })
        })
        // #endregion _addToResolver Execute Tests
    })

    describeFunc('#_formatPath(filename, parentPath, rootPath)', () => {
        // #region _formatPath Initialization
        /* ######################
            Initialization
        ##################### */

        let pathResolver
        before(() => {
            supressConsole()
            pathResolver = new PathResolver()
            restoreConsole()
        })
        // #endregion _formatPath Initialization

        // #region _formatPath Test Data
         /* ######################
            Test Data
        ##################### */

        const DATA = {
            VALID: {
                ALL: {
                    test: {
                        filename: 'index.js',
                        parentPath: 'src',
                        rootPath: PathResolver.defaultOptions.rootPath
                    },
                    expected: {
                        value: path.resolve(PathResolver.defaultOptions.rootPath, 'src', 'index.js')
                    }
                },
                NO_ROOT_PATH :{
                    test: {
                        filename: 'index.js',
                        parentPath: 'src',
                    },
                    expected: {
                        value: path.resolve('src', 'index.js')
                    }
                },
                NO_PARENT_PATH :{
                    test: {
                        filename: 'index.js',
                        rootPath: PathResolver.defaultOptions.rootPath
                        
                    },
                    expected: {
                        value: path.resolve(PathResolver.defaultOptions.rootPath, 'index.js')
                    }
                },
                FILENAME_ONLY: {
                    test: {
                        filename: 'index.js'
                    },
                    expected: {
                        value: 'index.js'
                    }
                }
            }, 
            INVALID: {
                NO_FILENAME: {
                    test: {
                        parentPath: 'src',
                        rootPath: PathResolver.defaultOptions.rootPath
                    },
                    expected: 'should throw error'
                }
            }
        }

        // #endregion _formatPath Test Data

        // #region _formatPath Test Functions
        /* ######################
            Test Functions
        ##################### */

        const TESTS = {
            format: ({filename, parentPath, rootPath}) => {
                let value = pathResolver._formatPath(filename, parentPath, rootPath)
                return { value }
            }
        }

        const runFormatTest = (testSuite) => {
            return runTest(testSuite, TESTS.format)
        }

        // #endregion _formatPath Test Functions

        // #region _formatPath Execute Tests
        /* ######################
            Execute Tests
        ##################### */

        describe('Returns an absolute directory path if', () => {
            let { VALID } = DATA

            it(`is passed 3 valid params`, () => {
                let { result, expected } = runFormatTest(VALID.ALL)
                expect(result.value).equals(expected.value)
            })

            it(`is not passed a valid 'rootPath'`, () => {
                let { result, expected } = runFormatTest(VALID.NO_ROOT_PATH)
                expect(result.value).equals(expected.value)
            })

            it(`is not passed a valid 'parentPath'`, () => {
                let { result, expected } = runFormatTest(VALID.NO_PARENT_PATH)
                expect(result.value).equals(expected.value)
            })
        })

        describe('Throws an error if', () => {
            let { INVALID } = DATA

            it(`is passed no filename`, () => {
                expect(() => runFormatTest(INVALID.NO_FILENAME)).to.throw(TypeError, `Path must be a string. Received undefined`)
            })
        })

        // #endregion _formatPath Execute Tests
    })

    describeFunc('#_formatResolverKey(key)', () => {
        // #region _formatResolverKey Initialization
        /* ######################
            Initialization
        ##################### */

        let pathResolver
        before(() => {
            supressConsole()
            pathResolver = new PathResolver()
            restoreConsole()
        })
        // #endregion _formatResolverKey Initialization

        // #region _formatResolverKey Test Data
         /* ######################
            Test Data
        ##################### */

        const DATA = {
            VALID: {
                ALL: {
                    test: {
                        key: 'index',
                        scope: 'src',
                    },
                    expected: {
                        value: 'resolveIndex'
                    }
                },
                NO_SCOPE: {
                    test: {
                        key: 'index',
                        scope: undefined,
                    },
                    expected: {
                        value: 'resolveIndex'
                    }
                },
            }, 
            INVALID: {
                NO_KEY: {
                    test: {
                        key: undefined,
                        scope: 'src'
                    },
                    expected: 'should throw error'
                }
            }
        }

        // #endregion _formatResolverKey Test Data

        // #region _formatResolverKey Test Functions
        /* ######################
            Test Functions
        ##################### */

        const TESTS = {
            format: ({key, scope}) => {
                let value = pathResolver._formatResolverKey(key, scope)
                return { value }
            }
        }

        const runFormatTest = (testSuite) => {
            return runTest(testSuite, TESTS.format)
        }

        // #endregion _formatResolverKey Test Functions

        // #region _formatResolverKey Execute Tests
        /* ######################
            Execute Tests
        ##################### */

        describe('Returns a valid resolver key if', () => {
            let { VALID } = DATA

            it(`is passed 2 valid params`, () => {
                let { result, expected } = runFormatTest(VALID.ALL)
                expect(result.value).equals(expected.value)
            })

            it(`is not passed a valid 'scope'`, () => {
                let { result, expected } = runFormatTest(VALID.NO_SCOPE)
                expect(result.value).equals(expected.value)
            })
        })

        describe('Throws an error if', () => {
            let { INVALID } = DATA

            it(`is passed no filename`, () => {
                expect(() => runFormatTest(INVALID.NO_FILENAME)).to.throw(TypeError, `Cannot read property 'test' of undefined`)
            })
        })

        // #endregion _formatResolverKey Execute Tests
    })
})

