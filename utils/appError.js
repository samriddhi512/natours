class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        // will be using to only log error messages to client for operational errors
        // not for other errors like programmer errors.
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;