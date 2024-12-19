import { Router } from "express";
import { z } from "zod";
import { createProductSkuImageController, createSKUController, deleteProductSkuImageController, deleteSkuController, listSkuController, readSKUController, reorderProductSkuImagesController, updateSKUController } from "../controllers/admin/product_sku.controllers.js";
import { verifyJWTorRefreshJWT } from "../middlewares/auth.middleware.js";
import { upload, uploadProductImages } from "../middlewares/multer.middleware.js";
import { validateDataMiddleWare, validateParamsMiddleWare } from "../middlewares/zod.validation.middleware.js";
import { getDefaultMobileNumberController, setDefaultMobileNumberController } from "../controllers/admin/configuration.controllers.js";

const router = Router();

const setDefaultMobileNumberSchema = z.object({
    m08_phone_number: z.string().min(4).max(20),
})



router.post('/set-mobile-number',
    verifyJWTorRefreshJWT,
    validateDataMiddleWare(setDefaultMobileNumberSchema),
    setDefaultMobileNumberController
);
router.get('/get-mobile-number',
    getDefaultMobileNumberController
);


export { router as configurationController };

