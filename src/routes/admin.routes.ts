import { Router } from "express";
import { createAdminController, loginAdminController, adminTestController, getAdminByAccessToken, logoutAdminController } from "../controllers/admin.controllers.js";
import { z } from "zod";
import { validateDataMiddleWare } from "../middlewares/zod.validation.middleware.js";
import { verifyJWTorRefreshJWT } from "../middlewares/auth.middleware.js";

const router = Router();

const userRegistrationSchema = z.object({
    M01_name: z.string(),
    M01_email: z.string().email(),
    M01_phone: z.string().refine((val) => /^\d{10}$/.test(val), {
        message: "Phone number must be 10 digits long",
    }),
    M01_address: z.string().optional(),
    M01_role: z.string().min(3),
    M01_password: z.string().min(6),
    M01_is_active: z.number().min(0).max(1),
});

const userLoginSchema = z.object({
    M01_email: z.string().email(),
    M01_password: z.string().min(6),
});

router.post('/login',validateDataMiddleWare(userLoginSchema),loginAdminController);
router.post('/register',verifyJWTorRefreshJWT,validateDataMiddleWare(userRegistrationSchema),createAdminController);
router.get('/get-admin',verifyJWTorRefreshJWT,getAdminByAccessToken);
router.post('/logout',logoutAdminController);
router.get('/admin-test',verifyJWTorRefreshJWT,adminTestController);

export { router  as AdminRouter}