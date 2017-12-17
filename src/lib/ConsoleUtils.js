import colors from 'colors/safe'
import { isObject } from '@beautiful-code/type-utils'

const LEVEL_MASKS = {
    info: 0x1,
    debug: 0x2,
    warn: 0x4,
    error: 0x8 
}

colors.setTheme({
    info: 'cyan',
    debug: 'green',
    error: 'red',
    warn: 'yellow'
})

export class ConsoleUtils {
    static CONSOLE_LOG = console.log
    static CONSOLE_WARN = console.warn
    static CONSOLE_ERROR = console.error

    static LEVELS = {
        none: 0,
        minimal: LEVEL_MASKS.info,
        verbose: LEVEL_MASKS.info && LEVEL_MASKS.warn && LEVEL_MASKS.error,
        all: LEVEL_MASKS.info && LEVEL_MASKS.debug && LEVEL_MASKS.warn && LEVEL_MASKS.error,        

        debug: LEVEL_MASKS.info && LEVEL_MASKS.debug,
        debug_only: LEVEL_MASKS.debug,
        debug_warn: LEVEL_MASKS.debug && LEVEL_MASKS.warn,
        debug_error: LEVEL_MASKS.debug && LEVEL_MASKS.warn && LEVEL_MASKS.error,
        
        warn_only: LEVEL_MASKS.warn,
        error_only: LEVEL_MASKS.error,
        all_errors: LEVEL_MASKS.warn && LEVEL_MASKS.error,

    }

    static level = ConsoleUtils.LEVELS.all

    static print = console.log
    static info = (...args) => {
        console.info(colors.info(...args))
    }
    static warn = (...args) => {
        console.warn(colors.warn(...args))
    }
    static error = (...args) => {
        console.error(colors.error(...args))
    }
    static debug = (...args) => {
        if(ConsoleUtils.level && LEVEL_MASKS.debug === LEVEL_MASKS.debug){
            args.map((arg, i) => {
                let result = isObject(arg) 
                    ? `\n${JSON.stringify(arg, null, 4)}`
                    : arg
        
                args[i] = result
            })
            return console.log(...args)
        } else {
            return () => {}
        } 
    }

    static supressConsole = () => {
        console.log = () => {}
        console.warn = () => {}
        console.error = () => {}
    }
    static restoreConsole = () => {
        console.log = ConsoleUtils.CONSOLE_LOG
        console.warn = ConsoleUtils.CONSOLE_WARN
        console.error = ConsoleUtils.CONSOLE_ERROR
    }
}

let print = ConsoleUtils.print
let info = ConsoleUtils.info
let debug = ConsoleUtils.debug
let warn = ConsoleUtils.warn
let error = ConsoleUtils.error

let supressConsole = ConsoleUtils.supressConsole
let restoreConsole = ConsoleUtils.restoreConsole

export {
    print, info, debug, warn, error,
    supressConsole, restoreConsole
}


