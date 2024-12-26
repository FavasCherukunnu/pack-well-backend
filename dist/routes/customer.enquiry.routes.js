import { Router } from "express";
import { z } from "zod";
import { validateDataMiddleWare } from "../middlewares/zod.validation.middleware.js";
import { createEnquiryController } from "../controllers/customer/enquiry.controllers.js";
const router = Router();
router.post('/create-enquiry', validateDataMiddleWare(z.object({
    m09_name: z.string().max(255, "m09_name should not exceed 255 characters").min(1, "m09_name is required"),
    m09_company_name: z.string().max(255, "m09_company_name should not exceed 255 characters").nullable(),
    m09_phone: z.string().max(20, "m09_phone should not exceed 20 characters").nullable(),
    m09_enquiry: z.string().min(3),
    m09_email: z.string().max(255, "m09_email should not exceed 255 characters").min(1, "m09_email is required"),
})), createEnquiryController);
export { router as EnquiryRouterCustomer };
