import { ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/ApiError.js';
export function validateDataMiddleWare(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map((issue) => ({
                    key: issue.path?.join('.'),
                    message: `${issue.message}`,
                }));
                res.status(StatusCodes.BAD_REQUEST).json(new ApiError(500, 'Invalid data', error.errors, error.stack, errorMessages));
            }
            else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
            }
        }
    };
}
export function validateParamsMiddleWare(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map((issue) => ({
                    key: issue.path?.[0],
                    message: `${issue.path.join('.')} is ${issue.message}`,
                }));
                res.status(StatusCodes.BAD_REQUEST).json(new ApiError(500, 'Invalid data', error.errors, error.stack, errorMessages));
            }
            else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
            }
        }
    };
}
