import { Router } from "express";
import { z } from "zod";
import { validateDataMiddleWare, validateParamsMiddleWare } from "../middlewares/zod.validation.middleware.js";
import { verifyJWTorRefreshJWT } from "../middlewares/auth.middleware.js";
import { createProductCategoryController, deleteProductCategoryController, listProductCategoryController, readProductCategoryController, updateProductCategoryController } from "../controllers/admin/product_category.controllers.js";
import { upload, uploadProductCategory } from "../middlewares/multer.middleware.js";

const router = Router();

const productCategorySchema = z.object({
    m04_category_name: z.string(),
    m04_image: z.union([z.string(), z.null(), z.undefined()]).optional(),
    m04_m04_parent_category_id: z.union([z.string(), z.null(), z.undefined()]).optional(),
    m04_is_active: z.union([z.string(), z.number()]),
    isImageDeleted: z.string().refine((val) => ['0', '1'].includes(val), { message: "isImageDeleted must be 0 or 1" }).optional(),
});

router.post('/product-category',
    verifyJWTorRefreshJWT,
    uploadProductCategory.fields([{ name: "m04_image", maxCount: 1 }]),
    validateDataMiddleWare(productCategorySchema),
    createProductCategoryController
);
router.delete('/product-category/:id',
    verifyJWTorRefreshJWT,
    deleteProductCategoryController
);
router.put('/product-category/:id',
    verifyJWTorRefreshJWT,
    uploadProductCategory.fields([{ name: "m04_image", maxCount: 1 }]),
    validateDataMiddleWare(productCategorySchema),
    updateProductCategoryController
);
router.get('/product-category',
    verifyJWTorRefreshJWT,
    validateParamsMiddleWare(z.object({
        page:z.string().refine((val) => /^\d+$/.test(val), {
            message: "Page number must be a number",
        }).optional(),
        limit:z.string().refine((val) => /^\d+$/.test(val), {
            message: "Limit number must be a number",
        }).optional()
    })),
    listProductCategoryController
);
router.get('/product-category/:id',
    verifyJWTorRefreshJWT,
    readProductCategoryController
);


export { router as ProductCategoryRouter }