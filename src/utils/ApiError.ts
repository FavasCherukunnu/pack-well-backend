export class ApiError extends Error {
    success:boolean
    msg: string;
    errors: any;
    validationErrors?:{key:string,message:string}[]
    stack?: string;
    statusCode: number;
    constructor(statusCode: number, message: string,errors: any,stack?: string,validationErrors?:{key:string,message:string}[]) {
        super(message);
        this.msg = message||'Internal Server Error';
        this.errors = errors;
        this.statusCode = statusCode||500;
        this.success = false
        this.validationErrors = validationErrors
        if(stack){
            if(process.env.NODE_ENV !== 'production')
                this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}