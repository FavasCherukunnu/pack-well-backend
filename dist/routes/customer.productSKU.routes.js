import { Router } from "express";
import { z } from "zod";
import { validateParamsMiddleWare } from "../middlewares/zod.validation.middleware.js";
import { listSkuController, listSkuSingleByProductController, readSKUController } from "../controllers/customer/product_sku.controllers.js";
const router = Router();
router.get('/product-sku/:id', readSKUController);
router.get('/product-sku', validateParamsMiddleWare(z.object({
    page: z.string().refine((val) => /^\d+$/.test(val), {
        message: "Page number must be a number",
    }).optional(),
    limit: z.string().refine((val) => /^\d+$/.test(val), {
        message: "Limit number must be a number",
    }).optional(),
    sortOrder: z.string().refine((val) => ["asc", "desc"].includes(val), {
        message: "Sort order must be one of asc or desc",
    }).optional(),
    minPrice: z.union([z.string().refine((val) => !isNaN(+val), {
            message: "minPrice must be a number",
        }).optional(), z.number().optional()]).optional(),
    maxPrice: z.union([z.string().refine((val) => !isNaN(+val), {
            message: "maxPrice must be a number",
        }).optional(), z.number().optional()]).optional(),
    categoryId: z.string().optional(),
})), listSkuController);
router.get('/product-sku-single-by-product', validateParamsMiddleWare(z.object({
    page: z.string().refine((val) => /^\d+$/.test(val), {
        message: "Page number must be a number",
    }).optional(),
    limit: z.string().refine((val) => /^\d+$/.test(val), {
        message: "Limit number must be a number",
    }).optional(),
    sortOrder: z.string().refine((val) => ["asc", "desc"].includes(val), {
        message: "Sort order must be one of asc or desc",
    }).optional(),
    minPrice: z.union([z.string().refine((val) => !isNaN(+val), {
            message: "minPrice must be a number",
        }).optional(), z.number().optional()]).optional(),
    maxPrice: z.union([z.string().refine((val) => !isNaN(+val), {
            message: "maxPrice must be a number",
        }).optional(), z.number().optional()]).optional(),
    categoryId: z.string().optional(),
})), listSkuSingleByProductController);
export { router as ProductSKURouterCustomer };
