import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse.js";


export const testController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).json(
            new ApiResponse(true, 200, "hello world", {})
        );
    } catch (error) {
        console.log(error);
        next(error);
    }
}
