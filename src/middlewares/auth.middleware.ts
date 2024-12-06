import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { Admin } from '../models/admin.model.js';
import { TypedRequestBody } from '../types/index.js';
import { User } from '../models/user.model.js';
import { prisma } from '../app.js';
import { generateAccessToken } from '../utils/authentication.js';

export const verifyJWTorRefreshJWT = async (req: TypedRequestBody<{}>, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    try {
        const accessToken = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;
        // Verify access token
        try {
            const decodedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!);
            const admin = await prisma.m01_admin.findUnique({
                where: {
                    id: (decodedAccessToken as any)._id,
                    deleted_at: null
                }
            });
            if (!admin) {
                return res.status(401).
                    clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                    clearCookie("accessToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                    json(new ApiError(401, "Unauthorized", "Admin not found"));
            }
            req._id = (decodedAccessToken as any)._id;
            next();
            return
        } catch (error) {
            if (!refreshToken) {
                return res.status(401).
                    clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                    clearCookie("accessToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                    json(new ApiError(401, "Unauthorized", "No tokens provided"));
            }
            // Verify refresh token
            try {

                const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!);
                const admin = await prisma.m01_admin.findUnique({
                    where: {
                        id: (decodedRefreshToken as any)._id,
                        deleted_at: null
                    }
                });
                req._id = (decodedRefreshToken as any)._id;
                if (!admin) {
                    return res.status(401).
                        clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                        clearCookie("accessToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                        json(new ApiError(401, "Unauthorized", "Admin not found"));
                }
                // Generate new access token
                const newAccessToken = generateAccessToken({id: admin.id});
                res.cookie("accessToken", newAccessToken, { httpOnly: true, secure: true, path: '/',sameSite:'none' });
            } catch (error) {
                return res.status(401).
                    clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                    clearCookie("accessToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                    json(new ApiError(401, "Unauthorized", "Invalid refresh token"));
            }

            return next();
        }



    } catch (error) {
        console.log('verified or not')

        return res.status(401).
            clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
            clearCookie("accessToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
            json(new ApiError(401, "Unauthorized", "Invalid token"));
    }
};


export const verifyJWTorRefreshJWTUser = async (req: TypedRequestBody<{}>, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');

    try {
        const accessToken = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;
        // Verify access token
        try {
            const decodedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!);
            const user = await User.findById((decodedAccessToken as any)._id);
            if (!user) {
                return res.status(401).
                    clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                    clearCookie("accessToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                    json(new ApiError(401, "Unauthorized", "user not found"));
            }
            req._id = (decodedAccessToken as any)._id;
            next();
            return
        } catch (error) {
            if (!refreshToken) {
                return res.status(401).
                    clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                    clearCookie("accessToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                    json(new ApiError(401, "Unauthorized", "No tokens provided"));
            }
            // Verify refresh token
            try {

                const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!);
                const user = await User.findById((decodedRefreshToken as any)._id);
                req._id = (decodedRefreshToken as any)._id;
                if (!user) {
                    return res.status(401).
                        clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                        clearCookie("accessToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                        json(new ApiError(401, "Unauthorized", "User not found"));
                }
                // Generate new access token
                const newAccessToken = user.generateAccessToken();
                res.cookie("accessToken", newAccessToken, { httpOnly: true, secure: true, path: '/',sameSite:'none' });
            } catch (error) {
                return res.status(401).
                    clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                    clearCookie("accessToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
                    json(new ApiError(401, "Unauthorized", "Invalid refresh token"));
            }

            return next();
        }



    } catch (error) {
        console.log('verified or not')

        return res.status(401).
            clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
            clearCookie("accessToken", { httpOnly: true, secure: true, path: '/',sameSite:'none' }).
            json(new ApiError(401, "Unauthorized", "Invalid token"));
    }
};
