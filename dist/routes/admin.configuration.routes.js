import { Router } from "express";
import { z } from "zod";
import { verifyJWTorRefreshJWT } from "../middlewares/auth.middleware.js";
import { validateDataMiddleWare } from "../middlewares/zod.validation.middleware.js";
import { getDefaultMobileNumberController, setDefaultMobileNumberController } from "../controllers/admin/configuration.controllers.js";
const router = Router();
const setDefaultMobileNumberSchema = z.object({
    m08_phone_number: z.string().min(4).max(20),
});
router.post('/set-mobile-number', verifyJWTorRefreshJWT, validateDataMiddleWare(setDefaultMobileNumberSchema), setDefaultMobileNumberController);
router.get('/get-mobile-number', getDefaultMobileNumberController);
export { router as configurationController };
