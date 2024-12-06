import { Router } from "express";
import { z } from "zod";
import { getCustomerByAccessToken, verifyOTPCustomerController, logoutCustomerController, requestLoginOtpController } from "../controllers/customer.controllers.js";
import { verifyJWTorRefreshJWTUser } from "../middlewares/auth.middleware.js";
import { validateDataMiddleWare } from "../middlewares/zod.validation.middleware.js";
const router = Router();
const userRequestOTPSchema = z.object({
    email: z.string().email(),
});
const userLoginSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6, "OTP should be a 6 digit number").regex(/^\d+$/, "OTP should be a 6 digit number"),
});
router.post('/request-otp', validateDataMiddleWare(userRequestOTPSchema), requestLoginOtpController);
router.post('/verify-otp', validateDataMiddleWare(userLoginSchema), verifyOTPCustomerController);
router.get('/get-customer', verifyJWTorRefreshJWTUser, getCustomerByAccessToken);
router.post('/logout', logoutCustomerController);
export { router as CustomerRouter };
