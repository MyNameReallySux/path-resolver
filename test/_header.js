import "babel-polyfill"

import path from 'path'

import * as TypeUtils from '@beautiful-code/type-utils'
import * as Chai from 'chai'

import * as ConsoleUtils from '../dist/lib/ConsoleUtils'
import * as TestUtils from '../dist/lib/TestUtils'

global.imports = {
    path,    
    Chai,
    TypeUtils,
    
    ConsoleUtils,
    TestUtils
}