import { Router } from "express";
import { listFeaturedProductsController } from "../controllers/customer/featuredProduct.controllers.js";

const router = Router();

router.get("/featured-products",
    listFeaturedProductsController);

export { router as customerFeaturedProductRouter };

