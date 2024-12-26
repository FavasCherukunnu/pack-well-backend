import { Router } from "express";
import { z } from "zod";
import { ContactusMarkAsReadController, ListContactUsController, ReadContactusController } from "../../controllers/admin/contactus.admin.controller.js";
import { validateParamsMiddleWare } from "../../middlewares/zod.validation.middleware.js";
import { AdminVerifyTokenMiddleware } from "../../utils/authentication.js";
const router = Router();
const ListContactus = z.object({
    page: z.string().refine((val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
    }).default('1'),
    limit: z.string().refine((val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
    }).default('10'),
    sort: z.enum([
        'created_at',
        'updated_at',
        'name',
        'email',
        'message'
    ]).default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
});
router.get('/contact-us-list', validateParamsMiddleWare(ListContactus), AdminVerifyTokenMiddleware, ListContactUsController);
router.get('/contact-us/:id', AdminVerifyTokenMiddleware, ReadContactusController);
router.post('/contact-us-mark-as-read/:id', AdminVerifyTokenMiddleware, ContactusMarkAsReadController);
export { router as AdminContactUsRouter };
