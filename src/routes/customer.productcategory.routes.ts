import { Router } from "express";
import { z } from "zod";
import { listProductCategoryControllercustomer } from "../controllers/customer/product_category.controllers.js";
import { validateParamsMiddleWare } from "../middlewares/zod.validation.middleware.js";

const router = Router();

router.get('/product-category',
    validateParamsMiddleWare(z.object({
        page:z.string().refine((val) => /^\d+$/.test(val), {
            message: "Page number must be a number",
        }).optional(),
        limit:z.string().refine((val) => /^\d+$/.test(val), {
            message: "Limit number must be a number",
        }).optional()
    })),
    listProductCategoryControllercustomer
);


export { router as ProductCategoryRouterCustomer };
