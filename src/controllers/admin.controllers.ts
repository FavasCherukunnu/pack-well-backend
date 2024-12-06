import { Admin } from "../models/admin.model.js";
import { NextFunction, Request, Response } from "express";
import { TypedRequestBody } from "../types/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
import jwt from 'jsonwebtoken';
import { prisma } from "../app.js";
import { generateAccessToken, genereateRefreshToken } from "../utils/authentication.js";


export const createAdminController = async (req: TypedRequestBody<{ M01_name: string, M01_email: string, M01_phone: string, M01_address: string, M01_role: string, M01_password: string, M01_is_active: 1 | 0 }>, res: Response, next: NextFunction) => {




    try {
        const { M01_name, M01_email, M01_phone, M01_address, M01_role, M01_password, M01_is_active } = req.body;

        const admin = new Admin({
            M01_name,
            M01_email,
            M01_phone,
            M01_address,
            M01_role,
            M01_password,
            M01_is_active
        });

        const newAdmin = await admin.save();


        //remove password
        const createdUser = await Admin.findById(newAdmin._id).select('-M01_password')

        res.status(201).json(
            new ApiResponse(true, 200, "Admin created successfully", createdUser)
        );

    } catch (error) {
        // console.log(error);
        next(error)
        // res.status(500).json(ApiResponse(false, "Internal Server Error"));
    }

}


export const loginAdminController = async (req: TypedRequestBody<{ M01_email: string, M01_password: string }>, res: Response, next: NextFunction) => {
    try {
        const { M01_email, M01_password } = req.body;
        const admin = await prisma.m01_admin.findFirst({ where: { m01_email:M01_email,deleted_at:null } });
        if (!admin) {
            return res.status(404).
                clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                clearCookie("accessToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                json(new ApiError(404, "Admin not found", "Admin not found"));
        }
        if (admin.m01_password !== M01_password) {
            return res.status(401).
                clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                clearCookie("accessToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                json(new ApiError(401, "Invalid credentials", "Invalid credentials"));
        }
        const accessToken = generateAccessToken({
            id: admin.id
        });
        const refreshToken = genereateRefreshToken({
            id: admin.id
        });
        (admin as any).m01_password = undefined;
        res.status(200).
            cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
            cookie("accessToken", accessToken, { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
            json(new ApiResponse(true, 200, "Admin logged in successfully", admin));
    } catch (error) {
        // console.log(error);
        next(error);
        // res.status(500).json(ApiResponse(false, "Internal Server Error"));
    }
}

export const getAdminByAccessToken = async (req: TypedRequestBody<{_id: string}>, res: Response, next: NextFunction) => {
    try {
        
        const admin = await prisma.m01_admin.findUnique({
            where: {
                id: Number(req._id),
                deleted_at: null
            }
        });
        if (!admin) {
            return res.status(404).
                json(new ApiError(404, "Admin not found", "Admin not found"));
        }
        const { m01_password, ...result } = admin;
        res.status(200).json(
            new ApiResponse(true, 200, "Admin found successfully", result)
        )
    } catch (error) {
        // console.log(error);
        next(error);
        // res.status(500).json(ApiResponse(false, "Internal Server Error"));
    }
}

export const logoutAdminController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).
            clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
            clearCookie("accessToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
            json(new ApiResponse(true, 200, "Admin logged out successfully", {}));
    } catch (error) {
        // console.log(error);
        next(error);
        // res.status(500).json(ApiResponse(false, "Internal Server Error"));
    }
}


export const adminTestController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).json(
            new ApiResponse(true, 200, "hello world", {})
        )
    } catch (error) {
        next(error);
    }
}
