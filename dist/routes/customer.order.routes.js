import { Router } from "express";
import { z } from "zod";
import { validateDataMiddleWare } from "../middlewares/zod.validation.middleware.js";
import { listOrdersController, readOrderController, requestOrderOtpController, verifyAndConfirmOrderController } from "../controllers/customer/order.controllers.js";
import { verifyJWTorRefreshJWTUser } from "../middlewares/auth.middleware.js";
const router = Router();
const requestOtpSchema = z.object({
    M11_name: z.string().max(50).min(1, "Name is required"),
    M11_postal_code: z.string().max(50).min(1, "Postal code is required"),
    M11_phone_no: z.string().max(50).min(1, "Phone number is required"),
    M11_address: z.string().max(50).min(1, "Address is required"),
    M11_email: z.string().email().max(50).min(1, "Email is required"),
});
const verifyAndConfirmOrderSchema = z.object({
    M11_name: z.string().max(50).min(1, "Name is required"),
    M11_postal_code: z.string().max(50).min(1, "Postal code is required"),
    M11_phone_no: z.string().max(50).min(1, "Phone number is required"),
    M11_address: z.string().max(50).min(1, "Address is required"),
    M11_email: z.string().email().max(50).min(1, "Email is required"),
    otp: z.string().length(6, "OTP should be a 6 digit number").regex(/^\d+$/, "OTP should be a 6 digit number"),
    skus: z.array(z.object({
        _id: z.string().min(1, "Product id is required"),
        quantity: z.number().min(1, "Quantity should be a number and greater than 0"),
        price: z.number().min(1, "Price should be a number and greater than 0"),
        MRP: z.number().min(1, "MRP should be a number and greater than 0"),
    })).min(1, "At least one product is required"),
});
router.post('/order/request-order-otp', validateDataMiddleWare(requestOtpSchema), requestOrderOtpController);
router.post('/order/verify-and-confirm-order', validateDataMiddleWare(verifyAndConfirmOrderSchema), verifyAndConfirmOrderController);
router.get('/get-user-orders', verifyJWTorRefreshJWTUser, listOrdersController);
router.get('/order/:orderId', verifyJWTorRefreshJWTUser, readOrderController);
export { router as CustomerOrderRouterCustomer };
