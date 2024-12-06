import { Router } from "express";
import { getProductSKUsWithVariationsController, getVariationByProductIdCustomerController } from "../controllers/customer/variation.controllers.js";
const router = Router();
router.get('/variation-by-product-id/:productId', getVariationByProductIdCustomerController);
router.get('/skus-variation-by-product-id/:productId', getProductSKUsWithVariationsController);
export { router as VariationRouterCustomer };
