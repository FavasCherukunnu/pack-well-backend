import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { OrderOtpService } from "../utils/otpServices.js";
import nodemailer from "nodemailer";
import { User } from "../models/user.model.js";
export const requestLoginOtpController = async (req, res, next) => {
    try {
        const user = await User.findOne({ M02_email: req.body.email });
        if (!user) {
            return res.status(404).
                clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/', sameSite: 'none' }).
                clearCookie("accessToken", { httpOnly: true, secure: true, path: '/', sameSite: 'none' }).
                json(new ApiError(404, "User not found", "User not found"));
        }
        const orderOtpService = new OrderOtpService(req.session);
        const OTP = orderOtpService.sendOTP({ email: req.body.email });
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        const mailOptions = {
            from: {
                name: 'Ecommerce',
                address: 'ecommerce@gmail.com'
            },
            to: req.body.email,
            subject: 'OTP for login',
            text: `Your OTP is ${OTP}`,
        };
        await transporter.sendMail(mailOptions);
        return res.json(new ApiResponse(true, 200, "Otp sent successfully", {}));
    }
    catch (error) {
        next(error);
    }
};
export const verifyOTPCustomerController = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ M02_email: email });
        if (!user) {
            return res.status(404).
                clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/', sameSite: 'none' }).
                clearCookie("accessToken", { httpOnly: true, secure: true, path: '/', sameSite: 'none' }).
                json(new ApiError(404, "User not found", "User not found"));
        }
        const orderOtpService = new OrderOtpService(req.session);
        const OTP = orderOtpService.validateOTP(otp, email);
        if (!OTP.success) {
            return res.status(400).
                clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/', sameSite: 'none' }).
                clearCookie("accessToken", { httpOnly: true, secure: true, path: '/', sameSite: 'none' }).
                json(new ApiError(400, OTP.message, OTP.message));
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.genereateRefreshToken();
        res.status(200).
            cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, path: '/', sameSite: 'none' }).
            cookie("accessToken", accessToken, { httpOnly: true, secure: true, path: '/', sameSite: 'none' }).
            json(new ApiResponse(true, 200, "Logged in successfully", user));
    }
    catch (error) {
        // console.log(error);
        next(error);
        // res.status(500).json(ApiResponse(false, "Internal Server Error"));
    }
};
export const getCustomerByAccessToken = async (req, res, next) => {
    try {
        const user = await User.findById(req._id);
        if (!user) {
            return res.status(404).
                json(new ApiError(404, "User not found", "User not found"));
        }
        const { ...result } = user?.toObject();
        res.status(200).json(new ApiResponse(true, 200, "User fetched successfully", result));
    }
    catch (error) {
        // console.log(error);
        next(error);
        // res.status(500).json(ApiResponse(false, "Internal Server Error"));
    }
};
export const logoutCustomerController = async (req, res, next) => {
    try {
        res.status(200).
            clearCookie("refreshToken", { httpOnly: true, secure: true, path: '/', sameSite: 'none' }).
            clearCookie("accessToken", { httpOnly: true, secure: true, path: '/', sameSite: 'none' }).
            json(new ApiResponse(true, 200, "User logged out successfully", {}));
    }
    catch (error) {
        // console.log(error);
        next(error);
        // res.status(500).json(ApiResponse(false, "Internal Server Error"));
    }
};
export const adminTestController = async (req, res, next) => {
    try {
        res.status(200).json(new ApiResponse(true, 200, "hello world", {}));
    }
    catch (error) {
        next(error);
    }
};
