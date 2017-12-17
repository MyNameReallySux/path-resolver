import colors from 'colors/safe'
import { isFunction } from '@beautiful-code/type-utils'

import { supressConsole, restoreConsole } from './ConsoleUtils'

colors.setTheme({
    className: ['green'],
    functionName: 'cyan',
    description: 'white'
})

export class TestUtils {
    static runTest = (testSuite, testFunction, onResult = () => {}, onError = () => {}) => {
        let { test, expected } = testSuite
        let result
    
        supressConsole()       
        try {
            result = isFunction(testFunction) ? testFunction(test, (result) => {
                onResult(result, expected)
            }, (result) => {
                onError(result, expected)
            }) : undefined
            if(result){
                onResult(result, expected)
                return { result, expected }
            }
        } catch(e){
            restoreConsole()
            onError({ error: e }, expected)
            throw e
        } finally {
            restoreConsole()
        }
    }

    static describeWithColor = (describe, color = colors.description, prefix = '') => {
        if(!describe) throw new TypeError(`Must pass in mocha's 'describe' function`)
        return function(description, callback){
            describe(color(description), callback)
        }
    }

    static makeDescribeClass = (describe, color = colors.className, prefix = '') => {
        return TestUtils.describeWithColor(describe, color)
    }

    static makeDescribeFunc = (describe, color = colors.functionName, prefix = '') => {
        return TestUtils.describeWithColor(describe, color)
    }
}

let runTest = TestUtils.runTest
let makeDescribeClass = TestUtils.makeDescribeClass
let makeDescribeFunc = TestUtils.makeDescribeFunc

export { runTest, makeDescribeClass, makeDescribeFunc }