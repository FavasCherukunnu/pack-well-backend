import { Router } from "express";
import { z } from "zod";
import { createProductSkuImageController, createSKUController, deleteProductSkuImageController, deleteSkuController, listSkuController, readSKUController, reorderProductSkuImagesController, updateSKUController } from "../controllers/admin/product_sku.controllers.js";
import { verifyJWTorRefreshJWT } from "../middlewares/auth.middleware.js";
import { upload, uploadProductImages } from "../middlewares/multer.middleware.js";
import { validateDataMiddleWare, validateParamsMiddleWare } from "../middlewares/zod.validation.middleware.js";
const router = Router();
const productSKUcreateSchema = z.object({
    Sku: z.object({
        m06_sku: z.string().trim().min(1, "SKU is required"),
        m06_product_sku_name: z.string().trim().min(1, "Product SKU name is required").max(100, "SKU name must be less than 100 characters"),
        m06_description: z.string().trim().min(1, "Product SKU description is required"),
        m06_mrp: z.union([z.number(), z.string()]).refine((val) => !isNaN(Number(val)) && Number(val) >= 1, { message: "must be a number greater than or equal to 1" }),
        m06_price: z.union([z.number(), z.string()]).refine((val) => !isNaN(Number(val)) && Number(val) >= 1, { message: "must be a number greater than or equal to 1" }),
        m06_m04_product_category_id: z.union([z.number(), z.string()]).refine((val) => !isNaN(Number(val)) && Number(val) >= 1, { message: "must be a number greater than or equal to 1" }),
        m06_quantity: z.union([z.number(), z.string()]).refine((val) => !isNaN(Number(val)) && Number(val) >= 1, { message: "must be a number greater than or equal to 1" }),
        m06_is_new: z.union([z.number(), z.string()]).refine((val) => [0, 1, '0', '1'].includes(val), { message: "must be 0 or 1" }),
        m06_single_order_limit: z.union([z.number(), z.string()]).optional().refine((val) => {
            console.log(val);
            if (val) {
                return !isNaN(Number(val)) && Number(val) >= 1;
            }
            return true;
        }, { message: "must be a number" }),
        m06_is_active: z.union([z.number(), z.string()]).refine((val) => [0, 1, '0', '1'].includes(val), { message: "must be 0 or 1" }),
    })
});
router.post('/product-sku', verifyJWTorRefreshJWT, uploadProductImages.any(), validateDataMiddleWare(productSKUcreateSchema), createSKUController);
const productSKUUpdateSchema = z.object({
    M06_sku: z.string().trim().min(1, "SKU is required"),
    M06_product_sku_name: z.string().trim().min(1, "Product SKU name is required").max(100, "SKU name must be less than 100 characters"),
    M06_description: z.string().trim().min(1, "Product SKU description is required"),
    m06_mrp: z.union([z.number(), z.string()]).refine((val) => !isNaN(Number(val)) && Number(val) >= 1, { message: "must be a number greater than or equal to 1" }),
    M06_price: z.union([z.number(), z.string()]).refine((val) => !isNaN(Number(val)) && Number(val) >= 1, { message: "must be a number greater than or equal to 1" }),
    M06_quantity: z.union([z.number(), z.string()]).refine((val) => !isNaN(Number(val)) && Number(val) >= 1, { message: "must be a number greater than or equal to 1" }),
    M06_is_new: z.union([z.number(), z.string()]).refine((val) => [0, 1, '0', '1'].includes(val), { message: "must be 0 or 1" }),
    M06_single_order_limit: z.union([z.number(), z.string()]).optional().refine((val) => {
        console.log(val);
        if (val) {
            return !isNaN(Number(val)) && Number(val) >= 1;
        }
        return true;
    }, { message: "must be a number" }),
    M06_is_active: z.union([z.number(), z.string()]).refine((val) => [0, 1, '0', '1'].includes(val), { message: "must be 0 or 1" }),
    is_thumnail_new: z.union([z.number(), z.string()]).refine((val) => [0, 1, '0', '1'].includes(val), { message: "must be 0 or 1" }).optional(),
});
router.put('/product-sku/:id', verifyJWTorRefreshJWT, upload.fields([{ name: 'M06_thumbnail_image', maxCount: 1 }]), validateDataMiddleWare(productSKUUpdateSchema), updateSKUController);
router.get('/product-sku/:id', verifyJWTorRefreshJWT, readSKUController);
router.get('/product-sku', verifyJWTorRefreshJWT, validateParamsMiddleWare(z.object({
    page: z.string().refine((val) => /^\d+$/.test(val), {
        message: "Page number must be a number",
    }).optional(),
    limit: z.string().refine((val) => /^\d+$/.test(val), {
        message: "Limit number must be a number",
    }).optional()
})), listSkuController);
router.delete('/product-sku/:id', verifyJWTorRefreshJWT, deleteSkuController);
const productSKUReorderImageSchema = z.object({
    images: z.array(z.object({
        _id: z.string().trim().min(1, "Image ID is required"),
        M07_M06_product_sku_id: z.string().trim().min(1, "M07_M06_product_sku_id is required"),
        M07_order: z.union([z.number(), z.string()]).refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: "must be a number greater than or equal to 0" }),
    })).min(1, "At least one image is required"),
});
router.put('/product-sku-image-reorder/:skuId', verifyJWTorRefreshJWT, validateDataMiddleWare(productSKUReorderImageSchema), reorderProductSkuImagesController);
router.delete('/product-sku-image/:id', verifyJWTorRefreshJWT, deleteProductSkuImageController);
const productSKUCreateImageSchema = z.object({
    skuId: z.string().trim().min(1, "Product SKU ID is required"),
    images: z.array(z.object({
        M07_order: z.union([z.number(), z.string()]).refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: "must be a number greater than or equal to 0" }),
        M07_is_active: z.union([z.number(), z.string()]).refine((val) => [0, 1, '0', '1'].includes(val), { message: "must be 0 or 1" }),
    })).min(1, "At least one image is required"),
});
router.post('/product-sku-image', verifyJWTorRefreshJWT, upload.any(), validateDataMiddleWare(productSKUCreateImageSchema), createProductSkuImageController);
export { router as ProductSKURouter };
