// Node Packages
let path = global.imports.path

// Imported Packages
let { print, info, debug, warn, error, supressConsole, restoreConsole } = global.imports.ConsoleUtils
let { runTest, makeDescribeClass, makeDescribeFunc } = global.imports.TestUtils

let { isFunction } = global.imports.TypeUtils

let { assert, expect } = global.imports.Chai
let colors = global.imports.colors

import { PathResolver } from '../dist/PathResolver'
import { DuplicateKeyError } from '../dist/errors'

const describeClass = makeDescribeClass(describe)
const describeFunc = makeDescribeFunc(describe)

describeClass('PathResolver', () => {
    describeFunc('#_addPathToResolver(directoryResolver, resolverKey, resolverPath)', () => {
        // #region _addPathToResolver Initialization
        /* ######################
            Initialization
        ##################### */

        let pathResolver
        before(() => {
            supressConsole()
            pathResolver = new PathResolver()
            restoreConsole()
        })
        // #endregion _addPathToResolver Initialization */

        // #region _addPathToResolver Test Data
        /* ######################
            Test Data
        ##################### */

        let DATA = {
            VALID: {
                ALL: {
                    test: {
                        directoryResolver: {},                    
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
                        directoryResolver: {},                    
                        resolverKey: 'resolveSrc',
                        resolverPath: 'src',
                        relativePath: 'index.html'
                    }, 
                    expected: {
                        value: path.resolve(PathResolver.defaultConfig.rootPath, 'src', 'index.html')
                    }
                },
                NO_RELATIVE_PATH: {
                    test: {
                        directoryResolver: {},                    
                        resolverKey: 'resolveSrc',
                        resolverPath: 'src',
                        relativePath: undefined
                    }, 
                    expected: {
                        value: path.resolve(PathResolver.defaultConfig.rootPath, 'src')
                    }
                }
            },
            INVALID: {
                NO_RESOLVER: {
                    test: {
                        directoryResolver: undefined,                    
                        resolverKey: 'resolveSrc',
                        resolverPath: 'src',
                        relativePath: 'index.html'
                    }, 
                    expected: 'should throw error'
                },
                NO_RESOLVER_KEY: {
                    test: {
                        directoryResolver: {},                    
                        resolverKey: undefined,
                        resolverPath: 'src',
                        relativePath: 'index.html'
                    }, 
                    expected: 'should throw error'
                },
                NO_RESOLVER_PATH: {
                    test: {
                        directoryResolver: {},                    
                        resolverKey: 'resolveSrc',
                        resolverPath: undefined,
                        relativePath: 'index.html'
                    }, 
                    expected: 'should throw error'
                },
            }
        }
        // #endregion _addPathToResolver Test Data

        // #region _addPathToResolver Test Functions
        /* ######################
            Test Functions
        ##################### */

        const TESTS = {
            keyCreation: ({ directoryResolver, resolverKey, resolverPath, relativePath }) => {
                pathResolver._addPathToResolver(directoryResolver, resolverKey, resolverPath)
                let hasKey = directoryResolver.hasOwnProperty(resolverKey)
                let isFunc = isFunction(directoryResolver[resolverKey])
                let value = directoryResolver.resolveSrc(relativePath)
                return { hasKey, isFunc, value }
            },
    
            subFunction: ({ directoryResolver, resolverKey, resolverPath, relativePath }) => {
                pathResolver._addPathToResolver(directoryResolver, resolverKey, resolverPath)
                let value = directoryResolver[resolverKey](relativePath)
                return { value }
            }
        }

        const runKeyCreationTest = (testSuite, onResult) => {
            return runTest(testSuite, TESTS.keyCreation, onResult)
        }

        const runSubFunctionTest = (testSuite, onResult) => {
            return runTest(testSuite, TESTS.subFunction, onResult)
        }
        // #endregion _addPathToResolver Test Functions

        // #region _addPathToResolver Execute Tests
        /* ######################
            Execute Tests
        ##################### */

        describe('Correctly creates function and adds to given resolver.', () => {
            let { VALID } = DATA
            let result, expected
            before(() => {
                ({ result, expected } = runKeyCreationTest(VALID.ALL))
            })

            it(`The 'directoryResolver' object should have 'resolverKey' property`, () => {
                expect(result.hasKey).equals(expected.hasKey)
            })

            it(`The 'resolverKey' property should be a function`, () => {
                expect(result.isFunc).equals(expected.isFunc)
            })
        })

        describe('Throws an error if any of the three parameters are undefined', () => {
            let { INVALID } = DATA
            
            it(`The 'directoryResolver' is undefined`, () => {
                expect(() => runKeyCreationTest(INVALID.NO_RESOLVER))
                    .to.throw(TypeError, `Cannot read property 'hasOwnProperty' of undefined`)
            })

            it(`The 'resolverKey' is undefined`, () => {
                expect(() => runKeyCreationTest(INVALID.NO_RESOLVER_KEY))
                    .to.throw(TypeError, `directoryResolver.resolveSrc is not a function`)
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
        // #endregion _addPathToResolver Execute Tests
    })

    describeFunc('#_formatFullPath(filename, parentPath, rootPath)', () => {
        // #region _formatFullPath Initialization
        /* ######################
            Initialization
        ##################### */

        let pathResolver
        before(() => {
            supressConsole()
            pathResolver = new PathResolver()
            restoreConsole()
        })
        // #endregion _formatFullPath Initialization

        // #region _formatFullPath Test Data
         /* ######################
            Test Data
        ##################### */

        const DATA = {
            VALID: {
                ALL: {
                    test: {
                        filename: 'index.js',
                        parentPath: 'src',
                        rootPath: PathResolver.defaultConfig.rootPath
                    },
                    expected: {
                        value: path.resolve(PathResolver.defaultConfig.rootPath, 'src', 'index.js')
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
                        rootPath: PathResolver.defaultConfig.rootPath
                        
                    },
                    expected: {
                        value: path.resolve(PathResolver.defaultConfig.rootPath, 'index.js')
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
                        rootPath: PathResolver.defaultConfig.rootPath
                    },
                    expected: {
                        error: {
                            name: ''
                        }
                    }
                }
            }
        }

        // #endregion _formatFullPath Test Data

        // #region _formatFullPath Test Functions
        /* ######################
            Test Functions
        ##################### */

        const TESTS = {
            format: ({filename, parentPath, rootPath}) => {
                let value = pathResolver._formatFullPath(filename, parentPath, rootPath)
                return { value }
            }
        }

        const runFormatTest = (testSuite) => {
            return runTest(testSuite, TESTS.format)
        }

        // #endregion _formatFullPath Test Functions

        // #region _formatFullPath Execute Tests
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

        // #endregion _formatFullPath Execute Tests
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
                        filename: 'index.js',
                        parentPath: 'src',
                        rootPath: PathResolver.defaultConfig.rootPath
                    },
                    expected: {
                        value: path.resolve(PathResolver.defaultConfig.rootPath, 'src', 'index.js')
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
                        rootPath: PathResolver.defaultConfig.rootPath
                        
                    },
                    expected: {
                        value: path.resolve(PathResolver.defaultConfig.rootPath, 'index.js')
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
                        rootPath: PathResolver.defaultConfig.rootPath
                    },
                    expected: {
                        error: {
                            name: ''
                        }
                    }
                }
            }
        }

        // #endregion _formatResolverKey Test Data

        // #region _formatResolverKey Test Functions
        /* ######################
            Test Functions
        ##################### */

        const TESTS = {
            format: ({filename, parentPath, rootPath}) => {
                let value = pathResolver._formatResolverKey(filename, parentPath, rootPath)
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

        // #endregion _formatResolverKey Execute Tests
    })

    describeFunc('#_resolverHasPropertyEmpty(object, key)', () => {
        // #region _resolverHasPropertyEmpty Initialization
        /* ######################
            Initialization
        ##################### */
        let pathResolver
        
        before(() => {
            supressConsole()
            pathResolver = new PathResolver()
            restoreConsole()
        })
        // #endregion _resolverHasPropertyEmpty Initialization

        // #region _resolverHasPropertyEmpty Test Data
        /* ######################
            Test Data
        ##################### */
        let DATA = {
            DOES_NOT_CONTAIN: {
                test: {
                    object: {
                        name: 'Chris',
                        age: 27
                    },
                    key: 'gender'
                },
                expected: {
                    value: false
                }
            }, 
            CONTAINS: {
                test: {
                    object: {
                        name: 'Chris',
                        age: 27,
                        gender: 'M'
                    },
                    key: 'gender'
                },
                
                expected: {
                    value: true,
                    error: {
                        name: 'DuplicateKeyError'
                    }
                }
            }
        }
        // #endregion _resolverHasPropertyEmpty Test Data

        // #region _resolverHasPropertyEmpty Test Functions
        /* ######################
            Test Functions
        ##################### */
        const TESTS = {
            return: ({ object, key }) => {
                let value = pathResolver._resolverHasPropertyEmpty(object, key)
                return { value }
            },
            callback: ({ object, key, }, onSuccess, onFailure) => {
                let value = pathResolver._resolverHasPropertyEmpty(object, key, 
                    (result) => isFunction(onSuccess) && onSuccess({ value: result }),
                    (result, e) => isFunction(onFailure) && onFailure({ value: result, error: e })
                )
                return { value }
            }
                
        }

        const runReturnTest = (testSuite, onResult) => {
            return runTest(testSuite, TESTS.return, onResult)
        }

        const runCallbackTest = (testSuite, onResult, onFailure) => {
            return runTest(testSuite, TESTS.callback, onResult, onFailure)
        }
        // #endregion _resolverHasPropertyEmpty Test Functions

        // #region _resolverHasPropertyEmpty Execute Tests
        /* ######################
            Execute Tests
        ##################### */
        describe('Returns a valid boolean value', () => {
            it(`Should return 'false' when 'object' does not have given 'key`, () => {
                runReturnTest(DATA.DOES_NOT_CONTAIN)
            })
    
            it(`Should return 'true' when 'object' does have given 'key`, () => {
                runReturnTest(DATA.CONTAINS)
            })
        })

        describe('Executes the correct callback', () => {
            it(`Should return 'false' when 'object' does not have given 'key`, () => {
                let { result, expected } = runCallbackTest(DATA.DOES_NOT_CONTAIN)
                expect(result.value).equals(expected.value)
            })

            it(`Should return 'true' when 'object' does have given 'key`, () => {
                let { result, expected } = runCallbackTest(DATA.CONTAINS)
                expect(result.value).equals(expected.value)
            })
    
            it(`Should execute 'onSuccess' callback when result is 'false'`, () => {
                runCallbackTest(DATA.DOES_NOT_CONTAIN, (result, expected) => {
                    expect(result.value).to.equal(expected.value)
                })
            })

            it(`Should execute 'onFailure' callback when result is 'true'`, () => {
                runCallbackTest(DATA.CONTAINS, undefined, (result, expected) => {
                    expect(result.value).to.equal(expected.value)
                    expect(result.error.name).to.equal(expected.error.name)
                })
            })
        })
        // #endregion _resolverHasPropertyEmpty Execute Tests

    })

})