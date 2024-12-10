import { Router } from "express";
import { listFeaturedProductsController } from "../controllers/customer/featuredProduct.controllers.js";
import { validateParamsMiddleWare } from "../middlewares/zod.validation.middleware.js";
import { z } from "zod";
const router = Router();
router.get("/featured-products", validateParamsMiddleWare(z.object({
    limit: z.string().refine((val) => /^\d+$/.test(val), {
        message: "Limit number must be a number",
    }).optional()
})), listFeaturedProductsController);
export { router as customerFeaturedProductRouter };
