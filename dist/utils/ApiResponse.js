export class ApiResponse {
    success;
    msg;
    data;
    statusCode;
    constructor(success, statusCode, message, data) {
        this.success = success;
        this.msg = message;
        this.data = data;
        this.statusCode = statusCode;
    }
}
