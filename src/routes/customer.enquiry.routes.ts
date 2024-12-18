import { Router } from "express";
import { z } from "zod";
import { listProductCategoryControllercustomer } from "../controllers/customer/product_category.controllers.js";
import { validateDataMiddleWare, validateParamsMiddleWare } from "../middlewares/zod.validation.middleware.js";
import { createEnquiryController } from "../controllers/customer/enquiry.controllers.js";

const router = Router();

router.post('/create-enquiry',
    validateDataMiddleWare(z.object({
        m08_name: z.string().max(50, "m08_name should not exceed 50 characters").min(1, "m08_name is required"),
        m08_address: z.string().max(400, "m08_address should not exceed 400 characters").min(1, "m08_address is required"),
    })),
    createEnquiryController
);


export { router as EnquiryRouterCustomer };
