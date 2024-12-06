import { Router } from "express";
import { z } from "zod";
import { verifyJWTorRefreshJWT } from "../middlewares/auth.middleware.js";
import { validateDataMiddleWare } from "../middlewares/zod.validation.middleware.js";
import { createProductVariationController, createProductVariationOptionController, deleteProductVariationController, deleteProductVariationOptionController, updateProductVariationController, updateProductVariationOptionController, updateVariationConfigurationController } from "../controllers/admin/product_variation_controllers.js";

const router = Router();

const productVariationSchema = z.object({
    M08_name: z.string().trim().min(1, "Variation name is required").max(30, 'Too long'),
    M08_M05_product_id: z.string().trim().min(1, "Product ID is required"),
    M08_is_active: z.union([z.number(), z.string()]).refine((val) => [0, 1, '0', '1'].includes(val), { message: "must be 0 or 1" }),
    options: z.array(z.object({
        M09_name: z.string().trim().min(1, "Option name is required").max(30, 'Too long'),
        M09_is_active: z.union([z.number(), z.string()]).refine((val) => [0, 1, '0', '1'].includes(val), { message: "must be 0 or 1" })
    })).min(1, "At least one option is required").refine(arr => arr.every(item => item.M09_name && item.M09_is_active), { message: "Every option must have name and is_active" }),
});

const productVariationUpdateSchema = z.object({
    M08_name: z.string().trim().min(1, "Variation name is required").max(30, 'Too long'),
    M08_M05_product_id: z.string().trim().min(1, "Product ID is required"),
    M08_is_active: z.union([z.number(), z.string()]).refine((val) => [0, 1, '0', '1'].includes(val), { message: "must be 0 or 1" }),
});

router.post('/product-variation',
    verifyJWTorRefreshJWT,
    validateDataMiddleWare(productVariationSchema),
    createProductVariationController
);

router.put('/product-variation/:id',
    verifyJWTorRefreshJWT,
    validateDataMiddleWare(productVariationUpdateSchema),
    updateProductVariationController
);
router.delete('/product-variation/:id',
    verifyJWTorRefreshJWT,
    deleteProductVariationController
);

const productVariationOptionSchema = z.object({
    M09_name: z.string().trim().min(1, "Option name is required").max(30, 'Too long'),
    M09_is_active: z.union([z.number(), z.string()]).refine((val) => [0, 1, '0', '1'].includes(val), { message: "must be 0 or 1" }),
    M09_M08_product_variation_id: z.string().trim().min(1, "Variation ID is required"),
});

//variation option routes
router.post('/product-variation-option',
    verifyJWTorRefreshJWT,
    validateDataMiddleWare(productVariationOptionSchema),
    createProductVariationOptionController
);
router.put('/product-variation-option/:id',
    verifyJWTorRefreshJWT,
    validateDataMiddleWare(productVariationOptionSchema),
    updateProductVariationOptionController
);
router.delete('/product-variation-option/:id',
    verifyJWTorRefreshJWT,
    deleteProductVariationOptionController
);

const configurationSchema = 
z.object({
    configurations: z.array(
        z.object({
            _id: z.string(),
            M10_M06_product_sku_id: z.string(),
            M10_M08_product_variation_id: z.string(),
            M10_M09_variation_option_id: z.string(),
        })
    ).min(1, "Array must contain at least one configuration")
});

router.put('/product-variation-configuration-bysku/:skuId',
    verifyJWTorRefreshJWT,
    validateDataMiddleWare(configurationSchema),
    updateVariationConfigurationController
);

export { router as ProductVariationRouter };
