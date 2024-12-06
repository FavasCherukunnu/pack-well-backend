export class ApiResponse {
    success: boolean;
    msg: string;
    data: unknown;
    statusCode:number;
    constructor(success: boolean,statusCode:number, message: string, data: unknown) {
        this.success = success;
        this.msg = message;
        this.data = data;
        this.statusCode = statusCode
    }
}
