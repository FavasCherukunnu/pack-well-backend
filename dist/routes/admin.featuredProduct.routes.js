import { Router } from "express";
import { addFeaturedProductController, deleteFeaturedProductController, listFeaturedProductsController, reorderFeaturedProductsController } from "../controllers/admin/featuredProduct.controllers.js";
import { verifyJWTorRefreshJWT } from "../middlewares/auth.middleware.js";
import { validateDataMiddleWare } from "../middlewares/zod.validation.middleware.js";
import { z } from "zod";
const router = Router();
router.get("/featured-products", verifyJWTorRefreshJWT, listFeaturedProductsController);
router.post("/featured-product", verifyJWTorRefreshJWT, validateDataMiddleWare(z.object({
    p01_product_id: z.string().trim().min(1, "Product ID is required"),
    p01_is_active: z.union([z.number(), z.string()]).refine((val) => [0, 1, '0', '1'].includes(val), { message: "must be 0 or 1" }).optional(),
})), addFeaturedProductController);
router.delete("/featured-product/:id", verifyJWTorRefreshJWT, deleteFeaturedProductController);
router.put('/featured-product-reorder', verifyJWTorRefreshJWT, validateDataMiddleWare(z.object({
    featuredProducts: z.array(z.object({
        id: z.string(),
    })).min(1, "At least one featured product is required"),
})), reorderFeaturedProductsController);
export { router as AdminFeaturedProductRouter };
