export class DuplicateKeyError extends Error {
    constructor(...args){
        super(...args)
        this.name = 'DuplicateKeyError'
        Error.captureStackTrace(this, DuplicateKeyError)
    }
}
