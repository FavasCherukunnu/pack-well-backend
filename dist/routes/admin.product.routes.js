import { Router } from "express";
import { z } from "zod";
import { createProductController, deleteProductController, getProductController, listProductController, updateProductController } from "../controllers/admin/product.controllers.js";
import { verifyJWTorRefreshJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validateDataMiddleWare, validateParamsMiddleWare } from "../middlewares/zod.validation.middleware.js";
const router = Router();
const productSchema = z.object({
    M05_product_name: z.string().trim().min(2, "Product name is required").max(100, 'Product name must be less than 40 characters'), // Required string field
    M05_M04_product_category: z.string().trim().min(1, "Product category is required"), // Required string field
    M05_is_active: z.string().refine((val) => ['0', '1'].includes(val), { message: "must be 0 or 1" }), // Required boolean field
    variations: z.array(z.object({
        M08_name: z.string().trim().min(1, "Variation name is required").max(30, 'Too long'), // Required string field
        M08_is_active: z.string().refine((val) => ['0', '1'].includes(val), { message: "must be 0 or 1" }), // Required boolean field
        Option: z.array(z.object({
            M09_name: z.string().trim().min(1, "Option name is required").max(30, 'Too long'), // Required string field
            M09_is_active: z.string().refine((val) => ['0', '1'].includes(val), { message: "must be 0 or 1" }), // Required boolean field
        })).min(1, "At least one option is required")
    })).optional()
});
router.post('/product', verifyJWTorRefreshJWT, upload.fields([{ name: "M05_image", maxCount: 1 }]), validateDataMiddleWare(productSchema), createProductController);
router.get('/product/:id', verifyJWTorRefreshJWT, getProductController);
router.get('/product', verifyJWTorRefreshJWT, validateParamsMiddleWare(z.object({
    page: z.string().refine((val) => /^\d+$/.test(val), {
        message: "Page number must be a number",
    }).optional(),
    limit: z.string().refine((val) => /^\d+$/.test(val), {
        message: "Limit number must be a number",
    }).optional()
})), listProductController);
router.delete('/product/:id', verifyJWTorRefreshJWT, deleteProductController);
router.put('/product/:id', verifyJWTorRefreshJWT, upload.fields([{ name: "M05_image", maxCount: 1 }]), validateDataMiddleWare(productSchema), updateProductController);
export { router as ProductRouter };
