export class ApiError extends Error {
    success;
    msg;
    errors;
    validationErrors;
    stack;
    statusCode;
    constructor(statusCode, message, errors, stack, validationErrors) {
        super(message);
        this.msg = message || 'Internal Server Error';
        this.errors = errors;
        this.statusCode = statusCode || 500;
        this.success = false;
        this.validationErrors = validationErrors;
        if (stack) {
            if (process.env.NODE_ENV !== 'production')
                this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
