import { Router } from "express";
import { listOrdersAdminController, readOrderAdminController, updateOrderStatusByOrderIdAdminController } from "../controllers/admin/order.controllers.js";
import { verifyJWTorRefreshJWT } from "../middlewares/auth.middleware.js";
import { validateDataMiddleWare, validateParamsMiddleWare } from "../middlewares/zod.validation.middleware.js";
import { z } from "zod";
const router = Router();
router.get('/list-user-orders', verifyJWTorRefreshJWT, validateParamsMiddleWare(z.object({
    page: z.string().refine((val) => /^\d+$/.test(val), {
        message: "Page number must be a number",
    }).optional(),
    limit: z.string().refine((val) => /^\d+$/.test(val), {
        message: "Limit number must be a number",
    }).optional(),
    searchTerm: z.string().optional()
})), listOrdersAdminController);
router.get('/order/:orderId', verifyJWTorRefreshJWT, readOrderAdminController);
router.put('/order-status-by-order-id/:orderId', verifyJWTorRefreshJWT, validateDataMiddleWare(z.object({
    statusId: z.number().min(1, "Status Id is required"),
})), updateOrderStatusByOrderIdAdminController);
export { router as AdminOrderRouterCustomer };
