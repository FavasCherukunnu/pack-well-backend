import { ApiError } from '../utils/ApiError.js';
export const errorHandlingMiddleware = (err, req, res, next) => {
    let errors = err.errors ? err.errors : {};
    let validationErrors = [];
    // mongoo validation error
    if (typeof err.stack === 'string' && err.stack.includes('ValidationError:')) {
        validationErrors = Object.entries(err.errors).map(([key, { message }]) => ({ key, message }));
        // return res.json(new ApiError(err.statusCode||500, err.message||'Internal Server Error', errors, err.stack||''));
    }
    res.status(err.statusCode || 500).json(new ApiError(err.statusCode || 500, err.message || 'Internal Server Error', errors || 'Internal Server Error', err.stack || '', validationErrors));
};
