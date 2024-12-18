import { Router } from "express";
import { z } from "zod";
import { listProductCategoryControllercustomer } from "../controllers/customer/product_category.controllers.js";
import { validateParamsMiddleWare } from "../middlewares/zod.validation.middleware.js";
const router = Router();
router.get('/product-category', validateParamsMiddleWare(z.object({
    page: z.string().refine((val) => /^\d+$/.test(val), {
        message: "Page number must be a number",
    }).optional(),
    limit: z.string().refine((val) => /^\d+$/.test(val), {
        message: "Limit number must be a number",
    }).optional(),
    m04_m04_parent_category_id: z.union([z.string().refine((val) => val === "null" || /^\d+$/.test(val), {
            message: "m04_m04_parent_category_id must be a number or an empty string",
        }).optional(), z.null().optional()]).optional(),
})), listProductCategoryControllercustomer);
export { router as ProductCategoryRouterCustomer };
