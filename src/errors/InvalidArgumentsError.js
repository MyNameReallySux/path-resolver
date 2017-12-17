export class InvalidArgumentsError extends Error {
    constructor(...args){
        super(...args)
        this.name = 'InvalidArgumentsError'
        Error.captureStackTrace(this, InvalidArgumentsError)
    }
}